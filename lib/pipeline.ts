/**
 * Message pipeline — mirrors ai-wa-agent private-message logic
 * for multi-tenant Cloud API workers.
 */

import { prisma } from "./prisma";
import { digitsOnlyPhone, sanitizePlainText } from "./security";

const DEPOSIT_PATTERNS = [
  /d[eé]pos/i,
  /d[eé]p[oô]t/i,
  /j'?ai pay/i,
  /j'?ai vers/i,
  /j'?ai envoy/i,
  /j'?ai effectu/i,
  /paiement effectu/i,
  /momo/i,
  /orange money/i,
  /i paid/i,
  /payment (done|sent|completed)/i,
];

export function isDepositClaim(text: string): boolean {
  return DEPOSIT_PATTERNS.some((re) => re.test(text || ""));
}

export function detectLang(text: string): "fr" | "en" | null {
  const t = (text || "").toLowerCase();
  if (/\b(the|what|how|payment|deposit|hello)\b/.test(t) && !/\b(le|la|bonjour|paiement)\b/.test(t)) {
    return "en";
  }
  if (/\b(le|la|bonjour|paiement|depot|offre)\b/.test(t)) return "fr";
  return null;
}

export function parseQuickReplyKey(text: string): string | null {
  const m = text.trim().match(/^[!\/]?([\w-]+)\s*$/i);
  if (!m) return null;
  return m[1].toLowerCase();
}

export type PipelineResult =
  | { kind: "ignore"; reason: string }
  | { kind: "quick_reply"; text: string }
  | { kind: "paused" }
  | { kind: "quota_exceeded"; text: string }
  | { kind: "escalation"; escalationId: string; userText: string }
  | { kind: "ai"; promptContext: string; contactId: string; lang: string };

export async function runInboundPipeline(params: {
  agentId: string;
  organizationId: string;
  phone: string;
  text: string;
}): Promise<PipelineResult> {
  const phone = digitsOnlyPhone(params.phone);
  if (!phone) return { kind: "ignore", reason: "invalid_phone" };

  const text = sanitizePlainText(params.text, 4000);
  if (!text) return { kind: "ignore", reason: "empty" };

  const agent = await prisma.agent.findFirst({
    where: { id: params.agentId, organizationId: params.organizationId },
    include: { organization: true },
  });
  if (!agent) return { kind: "ignore", reason: "agent_not_found" };

  if (agent.status === "paused" || agent.status === "draft") {
    return { kind: "paused" };
  }
  if (agent.status === "error") {
    return { kind: "ignore", reason: "agent_error" };
  }

  // daily quota (agent)
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let messagesToday = agent.messagesToday;
  if (agent.dayKey !== dayKey) {
    messagesToday = 0;
    await prisma.agent.update({
      where: { id: agent.id },
      data: { messagesToday: 0, dayKey },
    });
  }
  if (messagesToday >= agent.dailyMsgLimit) {
    return {
      kind: "quota_exceeded",
      text: "Notre assistant a atteint sa limite de messages pour aujourd'hui. Un conseiller vous répondra dès que possible.",
    };
  }

  // monthly org quota
  const monthKey = dayKey.slice(0, 7);
  const org = agent.organization;
  let messagesMonth = org.messagesMonth;
  if (org.monthKey !== monthKey) {
    messagesMonth = 0;
    await prisma.organization.update({
      where: { id: org.id },
      data: { messagesMonth: 0, monthKey },
    });
  }
  if (messagesMonth >= org.monthlyMsgLimit) {
    return {
      kind: "quota_exceeded",
      text: "Le quota mensuel de messages de l'établissement est atteint. Merci de réessayer plus tard.",
    };
  }

  // upsert contact
  const lang = detectLang(text) || "fr";
  const contact = await prisma.contact.upsert({
    where: {
      organizationId_phone: {
        organizationId: params.organizationId,
        phone,
      },
    },
    create: {
      organizationId: params.organizationId,
      phone,
      agentId: agent.id,
      preferredLang: lang,
      lastMessageAt: new Date(),
    },
    update: {
      agentId: agent.id,
      preferredLang: lang,
      lastMessageAt: new Date(),
    },
  });

  // quick replies
  const key = parseQuickReplyKey(text);
  if (key) {
    let replies: Record<string, string> = {};
    try {
      replies = JSON.parse(agent.quickReplies || "{}");
    } catch {
      /* ignore */
    }
    if (replies[key]) {
      await bumpCounters(agent.id, org.id, dayKey, monthKey);
      return { kind: "quick_reply", text: replies[key] };
    }
  }

  // deposit / human escalation
  if (isDepositClaim(text)) {
    const recent = await prisma.escalation.findFirst({
      where: {
        organizationId: params.organizationId,
        phone,
        type: "deposit",
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
    });
    if (!recent) {
      const esc = await prisma.escalation.create({
        data: {
          type: "deposit",
          status: "pending",
          summary: text.slice(0, 500),
          phone,
          organizationId: params.organizationId,
          agentId: agent.id,
          contactId: contact.id,
        },
      });
      await prisma.activityLog.create({
        data: {
          organizationId: params.organizationId,
          agentId: agent.id,
          level: "warn",
          message: `Escalade dépôt — ${phone}`,
          meta: JSON.stringify({ escalationId: esc.id }),
        },
      });
      await bumpCounters(agent.id, org.id, dayKey, monthKey);
      return {
        kind: "escalation",
        escalationId: esc.id,
        userText:
          lang === "en"
            ? "Thank you. Your payment claim was sent to our team for verification."
            : "Merci. Votre déclaration de paiement a été transmise à notre équipe pour vérification.",
      };
    }
  }

  await bumpCounters(agent.id, org.id, dayKey, monthKey);
  return {
    kind: "ai",
    promptContext: agent.systemPrompt,
    contactId: contact.id,
    lang: contact.preferredLang,
  };
}

async function bumpCounters(
  agentId: string,
  orgId: string,
  dayKey: string,
  monthKey: string
) {
  await prisma.agent.update({
    where: { id: agentId },
    data: { messagesToday: { increment: 1 }, dayKey, lastSeenAt: new Date() },
  });
  await prisma.organization.update({
    where: { id: orgId },
    data: { messagesMonth: { increment: 1 }, monthKey },
  });
}

export async function loadRecentHistory(contactId: string, limit = 6) {
  const turns = await prisma.conversationTurn.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    take: limit * 2,
  });
  return turns.reverse();
}

export async function saveTurn(
  agentId: string,
  contactId: string,
  role: "user" | "model",
  content: string
) {
  await prisma.conversationTurn.create({
    data: {
      agentId,
      contactId,
      role,
      content: content.slice(0, 8000),
    },
  });
  // prune old turns beyond 20 per contact
  const old = await prisma.conversationTurn.findMany({
    where: { contactId },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (old.length) {
    await prisma.conversationTurn.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}
