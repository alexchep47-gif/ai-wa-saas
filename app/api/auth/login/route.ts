import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import {
  consumeRateLimit,
  normalizeEmail,
  publicErrorMessage,
} from "@/lib/security";

const MAX_FAILED = 8;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const rl = await consumeRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans 15 minutes." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // constant-ish response timing not perfect but avoid user enumeration wording
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: "Compte temporairement verrouillé. Réessaie plus tard." },
        { status: 423 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: failed,
          lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MS) : null,
        },
      });
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json(
      { error: publicErrorMessage(e) },
      { status: 500 }
    );
  }
}
