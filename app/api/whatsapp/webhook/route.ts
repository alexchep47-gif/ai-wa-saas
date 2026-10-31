import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseInboundMessages,
  sendTextMessage,
  verifyWebhook,
} from "@/lib/whatsapp/cloud";
import { decryptWhatsAppToken, verifyMetaSignature } from "@/lib/whatsapp/security";
import {
  loadRecentHistory,
  runInboundPipeline,
  saveTurn,
} from "@/lib/pipeline";
import { generateReply } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (!expected) {
    console.error("[webhook] WHATSAPP_VERIFY_TOKEN is not configured");
    return NextResponse.json({ error: "Webhook verification is not configured" }, { status: 503 });
  }

  const result = verifyWebhook(mode, token, challenge, expected);
  if (result !== null) return new NextResponse(result, { status: 200 });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const appSecret = process.env.META_APP_SECRET || "";
  if (!appSecret) {
    console.error("[webhook] META_APP_SECRET is not configured");
    return NextResponse.json({ error: "Webhook signature verification is not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const inbound = parseInboundMessages(body);
  for (const msg of inbound) {
    await handleOne(msg).catch((e) =>
      console.error("[webhook] handle", e instanceof Error ? e.message : e)
    );
  }
  return NextResponse.json({ ok: true });
}

async function handleOne(msg: {
  phoneNumberId: string;
  from: string;
  text: string;
  messageId: string;
}) {
  // Never guess the tenant: every WhatsApp number must be explicitly bound to one agent.
  const agent = msg.phoneNumberId
    ? await prisma.agent.findFirst({
        where: {
          cloudPhoneNumberId: msg.phoneNumberId,
          status: { in: ["active", "paused"] },
        },
      })
    : null;

  if (!agent) {
    console.warn("[webhook] no explicitly configured agent for phone_number_id", msg.phoneNumberId);
    return;
  }

  const result = await runInboundPipeline({
    agentId: agent.id,
    organizationId: agent.organizationId,
    phone: msg.from,
    text: msg.text,
  });

  let token = "";
  try {
    token = agent.cloudTokenEnc ? decryptWhatsAppToken(agent.cloudTokenEnc) : "";
  } catch (e) {
    console.error("[webhook] unable to decrypt agent Cloud API token", e instanceof Error ? e.message : e);
  }

  const phoneNumberId = agent.cloudPhoneNumberId || "";
  if (!token || !phoneNumberId) {
    await prisma.activityLog.create({
      data: {
        organizationId: agent.organizationId,
        agentId: agent.id,
        level: "error",
        message: "Configuration Cloud API incomplète ou jeton chiffré illisible",
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
