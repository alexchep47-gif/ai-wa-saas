import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/whatsapp/cloud";

/**
 * Webhook Meta WhatsApp Cloud API.
 * Configure in Meta Developer Console:
 *   Callback URL: https://your-domain/api/whatsapp/webhook
 *   Verify token: value of WHATSAPP_VERIFY_TOKEN
 *
 * For multi-tenant, map phone_number_id → agent in the database
 * and route the message to the correct worker / LLM.
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
  try {
    const body = await req.json();

    // TODO multi-tenant:
    // 1. Extract phone_number_id from body.entry[0].changes[0].value.metadata
    // 2. Find Agent by cloudPhoneNumberId
    // 3. If message is text, load systemPrompt + quickReplies
    // 4. Call Gemini / other LLM (keys stay on server)
    // 5. Reply via sendTextMessage
    // 6. Log to ActivityLog

    console.log("[webhook] received", JSON.stringify(body).slice(0, 500));

    // Always 200 quickly for Meta
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true }); // still 200 to avoid retries storm
  }
}
