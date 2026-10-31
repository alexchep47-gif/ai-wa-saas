import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseInboundMessages,
  sendTextMessage,
  verifyWebhook,
} from "@/lib/whatsapp/cloud";
import {
  loadRecentHistory,
  runInboundPipeline,
  saveTurn,
} from "@/lib/pipeline";
import { generateReply } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Meta WhatsApp Cloud API webhook.
 * Callback URL: https://<domain>/api/whatsapp/webhook
 * Verify token: WHATSAPP_VERIFY_TOKEN
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  const result = verifyWebhook(mode, token, challenge, expected);

  if (result !== null) {
    return new NextResponse(result, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  // Always acknowledge Meta quickly; process best-effort
  try {
    const body = await req.json();
    const inbound = parseInboundMessages(body);

    // Fire-and-forget sequential processing (serverless-friendly small batch)
    for (const msg of inbound) {
      await handleOne(msg).catch((e) =>
        console.error("[webhook] handle", e?.message || e)
      );
    }
  } catch (e) {
    console.error("[webhook] body", e);
  }
  return NextResponse.json({ ok: true });
}

async function handleOne(msg: {
  phoneNumberId: string;
  from: string;
  text: string;
  messageId: string;
}) {
  // Resolve agent by Cloud phone number id, fallback to env single-tenant pilot
  let agent = msg.phoneNumberId
    ? await prisma.agent.findFirst({
        where: {
          cloudPhoneNumberId: msg.phoneNumberId,
          status: { in: ["active", "paused"] },
        },
      })
    : null;

  if (!agent && process.env.WHATSAPP_PHONE_NUMBER_ID === msg.phoneNumberId) {
    agent = await prisma.agent.findFirst({
      where: { status: { in: ["active", "paused"] } },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (!agent) {
    console.warn("[webhook] no agent for phone_number_id", msg.phoneNumberId);
    return;
  }

  const result = await runInboundPipeline({
    agentId: agent.id,
    organizationId: agent.organizationId,
    phone: msg.from,
    text: msg.text,
  });

  const token =
    process.env.WHATSAPP_CLOUD_TOKEN ||
    ""; /* per-agent decrypt of cloudTokenEnc later */
  const phoneNumberId =
    agent.cloudPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";

  if (!token || !phoneNumberId) {
    await prisma.activityLog.create({
      data: {
        organizationId: agent.organizationId,
        agentId: agent.id,
        level: "error",
        message: "Cloud API token or phone_number_id manquant",
      },
    });
    return;
  }

  let replyText = "";

  switch (result.kind) {
    case "ignore":
    case "paused":
      return;
    case "quick_reply":
      replyText = result.text;
      break;
    case "quota_exceeded":
      replyText = result.text;
      break;
    case "escalation":
      replyText = result.userText;
      break;
    case "ai": {
      const history = await loadRecentHistory(result.contactId, 6);
      replyText = await generateReply({
        systemPrompt: result.promptContext,
        userMessage: msg.text,
        lang: result.lang,
        history: history.map((t) => ({
          role: t.role as "user" | "model",
          content: t.content,
        })),
      });
      await saveTurn(agent.id, result.contactId, "user", msg.text);
      await saveTurn(agent.id, result.contactId, "model", replyText);
      break;
    }
  }

  if (!replyText) return;

  try {
    await sendTextMessage({
      phoneNumberId,
      accessToken: token,
      to: msg.from,
      body: replyText,
    });
    await prisma.activityLog.create({
      data: {
        organizationId: agent.organizationId,
        agentId: agent.id,
        level: "info",
        message: `Réponse envoyée → ${msg.from}`,
        meta: JSON.stringify({ kind: result.kind, messageId: msg.messageId }),
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await prisma.activityLog.create({
      data: {
        organizationId: agent.organizationId,
        agentId: agent.id,
        level: "error",
        message: `Échec envoi Cloud API: ${err.slice(0, 200)}`,
      },
    });
  }
}
