import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { generateSecureToken, hashIp, hashToken } from "./security";

function getAuthSecret() {
  const configured = process.env.AUTH_SECRET;
  if (configured && new TextEncoder().encode(configured).length >= 32) {
    return new TextEncoder().encode(configured);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be configured with at least 32 bytes in production");
  }
  return new TextEncoder().encode("dev-only-secret-do-not-use-in-production");
}

const COOKIE_NAME = "aiwa_session";
const SESSION_DAYS = 14;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const h = await headers();
  const ua = h.get("user-agent")?.slice(0, 200) || null;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;

  await prisma.session.create({
    data: {
      token: tokenHash,
      userId,
      userAgent: ua,
      ipHash: hashIp(ip),
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null },
  });

  const jwt = await new SignJWT({ sub: userId, sid: tokenHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return tokenHash;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(COOKIE_NAME)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, getAuthSecret());
      if (payload.sid) {
        await prisma.session.deleteMany({
          where: { token: String(payload.sid) },
        });
      }
    } catch {
      // ignore invalid token
    }
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(COOKIE_NAME)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, getAuthSecret());
    const sid = String(payload.sid || "");
    const session = await prisma.session.findUnique({
      where: { token: sid },
      include: {
        user: {
          include: {
            memberships: {
              include: { organization: true },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export function getPrimaryOrgId(
  user: Awaited<ReturnType<typeof getCurrentUser>>
): string | null {
  if (!user) return null;
  return user.memberships[0]?.organizationId ?? null;
}
