import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding SwixAI database...");

  // ── 1. Admin User ──────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@swixai.com" },
    update: {},
    create: {
      email: "admin@swixai.com",
      passwordHash: adminHash,
      name: "SwixAI Admin",
      role: "ADMIN",
    },
  });
  console.log("✓ Admin user:", admin.email);

  // ── 2. Demo Customer ───────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash("demo1234", 12);
  const customer = await db.user.upsert({
    where: { email: "demo@musterfirma.de" },
    update: {},
    create: {
      email: "demo@musterfirma.de",
      passwordHash: customerHash,
      name: "Max Mustermann",
      role: "CUSTOMER",
    },
  });
  console.log("✓ Customer user:", customer.email);

  // ── 3. Demo Workspace ──────────────────────────────────────────────────────
  const workspace = await db.workspace.upsert({
    where: { slug: "musterfirma-gmbh" },
    update: {},
    create: {
      name: "Musterfirma GmbH",
      slug: "musterfirma-gmbh",
      plan: "starter",
      status: "ACTIVE",
    },
  });
  console.log("✓ Workspace:", workspace.name);

  // ── 4. Membership ──────────────────────────────────────────────────────────
  await db.membership.upsert({
    where: { userId_workspaceId: { userId: customer.id, workspaceId: workspace.id } },
    update: {},
    create: { userId: customer.id, workspaceId: workspace.id, role: "OWNER" },
  });

  // ── 5. Billing ─────────────────────────────────────────────────────────────
  await db.billing.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      creditsBalance: 47.50,
      totalSpent: 52.50,
      currency: "EUR",
    },
  });
  console.log("✓ Billing seeded");

  // ── 6. Assistants ──────────────────────────────────────────────────────────
  const assistant1 = await db.assistant.upsert({
    where: { id: "asst_demo_1" },
    update: {},
    create: {
      id: "asst_demo_1",
      workspaceId: workspace.id,
      name: "Empfangs-Bot",
      status: "ACTIVE",
      phoneNumber: "+49 30 12345678",
      voice: "nova",
      language: "de",
      fallbackRule: "voicemail",
      systemPrompt:
        "Du bist ein freundlicher Empfangsassistent der Musterfirma GmbH. " +
        "Du begrüßt Anrufer höflich, nimmst Terminwünsche entgegen und beantwortest " +
        "Fragen zu unseren Öffnungszeiten (Mo–Fr 9–18 Uhr) und Dienstleistungen. " +
        "Bei komplexen Anfragen leitest du den Anruf weiter oder nimmst eine Nachricht auf.",
    },
  });

  const assistant2 = await db.assistant.upsert({
    where: { id: "asst_demo_2" },
    update: {},
    create: {
      id: "asst_demo_2",
      workspaceId: workspace.id,
      name: "Support-Bot",
      status: "PAUSED",
      phoneNumber: "+49 30 87654321",
      voice: "alloy",
      language: "de",
      fallbackRule: "transfer",
      systemPrompt:
        "Du bist ein Technischer Support Agent der Musterfirma GmbH. " +
        "Du hilfst Kunden bei technischen Problemen, nimmst Störungsmeldungen auf " +
        "und stellst Tickets für das Support-Team aus.",
    },
  });
  console.log("✓ Assistants seeded:", assistant1.name, assistant2.name);

  // ── 7. Knowledge Base ──────────────────────────────────────────────────────
  await db.knowledgeSource.createMany({
    skipDuplicates: true,
    data: [
      {
        workspaceId: workspace.id,
        assistantId: assistant1.id,
        type: "FAQ",
        title: "Öffnungszeiten",
        contentText:
          "Wir sind Montag bis Freitag von 9:00 bis 18:00 Uhr erreichbar. " +
          "An Wochenenden und Feiertagen ist unser Büro geschlossen.",
      },
      {
        workspaceId: workspace.id,
        assistantId: assistant1.id,
        type: "FAQ",
        title: "Dienstleistungen",
        contentText:
          "Wir bieten folgende Leistungen an: Webentwicklung, Mobile Apps, " +
          "KI-Integration und IT-Beratung. Für ein Angebot kontaktiere uns bitte per E-Mail.",
      },
      {
        workspaceId: workspace.id,
        type: "TEXT",
        title: "Unternehmensbeschreibung",
        contentText:
          "Die Musterfirma GmbH ist ein innovatives Technologieunternehmen aus Berlin, " +
          "gegründet 2018. Wir entwickeln digitale Lösungen für mittelständische Unternehmen.",
      },
    ],
  });
  console.log("✓ Knowledge base seeded");

  // ── 8. Sample Calls ────────────────────────────────────────────────────────
  const now = new Date();
  const callsData = Array.from({ length: 15 }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 28);
    const startedAt = new Date(now.getTime() - daysAgo * 86400000);
    const durationSec = 60 + Math.floor(Math.random() * 300);
    const costPerMin = 0.025;
    const costTotal = parseFloat(
      ((durationSec / 60) * costPerMin).toFixed(4)
    );
    const outcomes = ["answered", "answered", "answered", "voicemail", "missed"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    const intents = [
      "Termin buchen",
      "Preis anfragen",
      "Öffnungszeiten",
      "Allgemeine Info",
      "Beschwerde",
    ];
    const intent = intents[Math.floor(Math.random() * intents.length)];

    return {
      workspaceId: workspace.id,
      assistantId: i % 3 === 0 ? assistant2.id : assistant1.id,
      startedAt,
      endedAt: new Date(startedAt.getTime() + durationSec * 1000),
      durationSec,
      fromNumber: `+491${Math.floor(Math.random() * 9000000) + 1000000}`,
      toNumber: assistant1.phoneNumber,
      outcome,
      costTotal,
      costBreakdownJson: {
        STT: parseFloat((costTotal * 0.25).toFixed(4)),
        LLM: parseFloat((costTotal * 0.45).toFixed(4)),
        TTS: parseFloat((costTotal * 0.15).toFixed(4)),
        Telephony: parseFloat((costTotal * 0.15).toFixed(4)),
      },
      transcriptText:
        outcome === "answered"
          ? `Agent: Guten Tag, Sie rufen bei der Musterfirma GmbH an. Wie kann ich Ihnen helfen?\n` +
            `Kunde: Ja, ich würde gerne einen Termin vereinbaren.\n` +
            `Agent: Sehr gerne! Wann würde es Ihnen passen?\n` +
            `Kunde: Wie wäre es mit nächstem Dienstag um 10 Uhr?\n` +
            `Agent: Perfekt, ich trage das ein. Darf ich Ihren Namen notieren?`
          : null,
      intent,
      bookingStatus: intent === "Termin buchen" && outcome === "answered" ? "booked" : "not_booked",
      providerCallId: `demo_call_${i}_${Date.now()}`,
    };
  });

  for (const callData of callsData) {
    await db.call.create({ data: callData });
  }
  console.log(`✓ ${callsData.length} sample calls seeded`);

  // ── 9. Second Demo Workspace (for admin view) ──────────────────────────────
  const ws2 = await db.workspace.upsert({
    where: { slug: "techstartup-ag" },
    update: {},
    create: {
      name: "TechStartup AG",
      slug: "techstartup-ag",
      plan: "pro",
      status: "ACTIVE",
    },
  });

  const user2Hash = await bcrypt.hash("startup123", 12);
  const user2 = await db.user.upsert({
    where: { email: "ceo@techstartup.de" },
    update: {},
    create: {
      email: "ceo@techstartup.de",
      passwordHash: user2Hash,
      name: "Sara Schmidt",
      role: "CUSTOMER",
    },
  });

  await db.membership.upsert({
    where: { userId_workspaceId: { userId: user2.id, workspaceId: ws2.id } },
    update: {},
    create: { userId: user2.id, workspaceId: ws2.id, role: "OWNER" },
  });

  await db.billing.upsert({
    where: { workspaceId: ws2.id },
    update: {},
    create: { workspaceId: ws2.id, creditsBalance: 128.00, totalSpent: 342.50, currency: "EUR" },
  });

  await db.assistant.createMany({
    skipDuplicates: true,
    data: [
      {
        workspaceId: ws2.id,
        name: "Sales-Bot",
        status: "ACTIVE",
        phoneNumber: "+49 89 11112222",
        voice: "shimmer",
        language: "de",
        fallbackRule: "transfer",
        systemPrompt: "Du bist ein Sales Assistant für TechStartup AG.",
      },
    ],
  });
  console.log("✓ Second workspace seeded:", ws2.name);

  console.log("\n✅ Seed completed successfully!\n");
  console.log("Login credentials:");
  console.log("  Admin:    admin@swixai.com / admin123");
  console.log("  Customer: demo@musterfirma.de / demo1234");
  console.log("  Customer: ceo@techstartup.de / startup123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
