/**
 * Security helpers — input hygiene, rate limits, crypto primitives.
 * Never log secrets. Never return stack traces to clients in production.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

const MAX_EMAIL_LEN = 254;
const MAX_NAME_LEN = 120;
const MAX_PROMPT_LEN = 8000;
const MAX_TEXT_LEN = 4000;

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  if (!e || e.length > MAX_EMAIL_LEN) return null;
  // pragmatic RFC-ish check
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(e)) {
    return null;
  }
  return e;
}

export function sanitizePlainText(value: unknown, max = MAX_TEXT_LEN): string {
  if (typeof value !== "string") return "";
  // strip control chars except newline/tab
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function sanitizeName(value: unknown): string {
  return sanitizePlainText(value, MAX_NAME_LEN);
}

export function sanitizePrompt(value: unknown): string {
  return sanitizePlainText(value, MAX_PROMPT_LEN);
}

export function digitsOnlyPhone(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const d = String(value).replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(d)) return null;
  return d;
}

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // salt with app secret so rainbow tables are useless
  const salt = process.env.AUTH_SECRET || "dev";
  return createHash("sha256").update(`${salt}:ip:${ip}`).digest("hex").slice(0, 32);
}

export function secureCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Simple DB-backed rate limit (works on serverless with shared DB).
 * windowMs default 15 min.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { id: key } });

  if (!bucket || now.getTime() - bucket.windowStart.getTime() > windowMs) {
    await prisma.rateLimitBucket.upsert({
      where: { id: key },
      create: { id: key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimitBucket.update({
    where: { id: key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true, remaining: limit - bucket.count - 1 };
}

export function publicErrorMessage(err: unknown): string {
  if (process.env.NODE_ENV === "production") {
    return "Une erreur est survenue. Réessaie plus tard.";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Password policy for pilot — strengthen later with zxcvbn if needed */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Mot de passe trop court (min. 8 caractères).";
  if (password.length > 128) return "Mot de passe trop long.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Utilise au moins une lettre et un chiffre.";
  }
  return null;
}
