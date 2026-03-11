import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding Padel Bet database...");

  // Demo users
  const hash = await bcrypt.hash("demo1234", 12);
  const adminHash = await bcrypt.hash("admin123", 12);

  await db.user.upsert({
    where: { email: "admin@padelbet.ch" },
    update: {},
    create: {
      email: "admin@padelbet.ch",
      name: "Admin",
      password: adminHash,
      coins: 9999,
      isAdmin: true,
      coinTransactions: { create: { amount: 9999, type: "SIGNUP_BONUS", description: "Admin Konto" } },
    },
  });

  await db.user.upsert({
    where: { email: "demo@padelbet.ch" },
    update: {},
    create: {
      email: "demo@padelbet.ch",
      name: "Demo User",
      password: hash,
      coins: 150,
      loginStreak: 3,
      coinTransactions: {
        create: [
          { amount: 50, type: "SIGNUP_BONUS", description: "Willkommens-Bonus" },
          { amount: 100, type: "PURCHASE", description: "Starter Pack" },
        ],
      },
    },
  });

  // Matches
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in4days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const matches = [
    {
      homePlayer: "Alejandro Galan",
      awayPlayer: "Juan Lebron",
      tournament: "WPT Finals",
      matchType: "TOP_MATCH" as const,
      scheduledAt: tomorrow,
      coinCost: 25,
      round: "Halbfinale",
      venue: "Madrid",
    },
    {
      homePlayer: "Federico Chingotto",
      awayPlayer: "Martin Di Nenno",
      tournament: "WPT Finals",
      matchType: "TOP_MATCH" as const,
      scheduledAt: tomorrow,
      coinCost: 25,
      round: "Halbfinale",
      venue: "Madrid",
    },
    {
      homePlayer: "Paquito Navarro",
      awayPlayer: "Maxi Sanchez",
      tournament: "WPT Masters",
      matchType: "NORMAL" as const,
      scheduledAt: in2days,
      coinCost: 10,
      round: "Viertelfinale",
      venue: "Barcelona",
    },
    {
      homePlayer: "Miguel Lamperti",
      awayPlayer: "Sanyo Gutierrez",
      tournament: "WPT Masters",
      matchType: "NORMAL" as const,
      scheduledAt: in2days,
      coinCost: 10,
      round: "Viertelfinale",
      venue: "Barcelona",
    },
    {
      homePlayer: "Jorge De Alba",
      awayPlayer: "Agustin Tapia",
      tournament: "Premier Padel",
      matchType: "NORMAL" as const,
      scheduledAt: in3days,
      coinCost: 10,
      round: "Achtelfinale",
      venue: "Zürich",
    },
    {
      homePlayer: "Arturo Coello",
      awayPlayer: "Lucho Capra",
      tournament: "Premier Padel",
      matchType: "COMBO" as const,
      scheduledAt: in4days,
      coinCost: 30,
      round: "Finale",
      venue: "Zürich",
    },
  ];

  for (const match of matches) {
    await db.match.create({ data: match });
  }

  console.log("✅ Seed complete!");
  console.log("  Admin: admin@padelbet.ch / admin123");
  console.log("  Demo:  demo@padelbet.ch  / demo1234");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
