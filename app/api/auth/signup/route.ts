import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = parsed.data;

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Diese E-Mail-Adresse ist bereits registriert." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + workspace + billing in a transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
      });

      // Ensure unique slug
      let slug = slugify(companyName);
      const slugExists = await tx.workspace.findUnique({ where: { slug } });
      if (slugExists) slug = `${slug}-${Date.now()}`;

      const workspace = await tx.workspace.create({
        data: { name: companyName, slug },
      });

      await tx.membership.create({
        data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
      });

      await tx.billing.create({
        data: { workspaceId: workspace.id, creditsBalance: 0 },
      });

      return { user, workspace };
    });

    return NextResponse.json({ userId: result.user.id }, { status: 201 });
  } catch (err) {
    console.error("[SIGNUP]", err);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
