import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  try {
    const { name, email, password, orgName } = await req.json();

    if (!email || !password || !orgName) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Mot de passe trop court" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    let slug = slugify(orgName) || "org";
    const slugExists = await prisma.organization.findUnique({ where: { slug } });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      },
    });

    await prisma.agent.create({
      data: {
        name: `Agent ${orgName}`,
        organizationId: org.id,
        status: "draft",
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
