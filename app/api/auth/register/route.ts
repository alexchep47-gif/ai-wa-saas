import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import {
  consumeRateLimit,
  normalizeEmail,
  publicErrorMessage,
  sanitizeName,
  validatePasswordStrength,
} from "@/lib/security";

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
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const name = sanitizeName(body.name);
    const orgName = sanitizeName(body.orgName);

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const rl = await consumeRateLimit(`register:${email}`, 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop d'inscriptions pour cet email. Réessaie plus tard." },
        { status: 429 }
      );
    }

    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return NextResponse.json({ error: pwdErr }, { status: 400 });
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
      data: { email, passwordHash, name: name || null },
    });

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        monthlyMsgLimit: 500,
      },
    });

    await prisma.membership.create({
      data: { userId: user.id, organizationId: org.id, role: "owner" },
    });

    await prisma.agent.create({
      data: {
        name: `Agent ${orgName}`,
        organizationId: org.id,
        status: "draft",
        systemPrompt:
          "Tu es un assistant éducatif camerounais pour un établissement scolaire. Réponds en français, clairement et poliment. Pour les inscriptions et paiements, propose un contact humain.",
        quickReplies: JSON.stringify({
          tarifs: "Consultez nos tarifs sur place ou écrivez !inscription.",
          inscription: "Pour vous inscrire, indiquez nom, niveau et série. Un conseiller vous recontactera.",
          contact: "Un membre de l'équipe vous répondra dans les plus brefs délais.",
        }),
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/register]", e);
    return NextResponse.json(
      { error: publicErrorMessage(e) },
      { status: 500 }
    );
  }
}
