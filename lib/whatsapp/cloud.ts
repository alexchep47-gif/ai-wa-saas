/**
 * WhatsApp Cloud API helpers (official path).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

export type SendTextParams = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
};

export async function sendTextMessage(params: SendTextParams) {
  const url = `https://graph.facebook.com/v21.0/${params.phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: params.to,
      type: "text",
      text: { preview_url: false, body: params.body.slice(0, 4096) },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Cloud API error ${res.status}`);
  }
  return data;
}

export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedToken: string
) {
  if (mode === "subscribe" && token === expectedToken && challenge) {
    return challenge;
  }
  return null;
}

export type InboundText = {
  phoneNumberId: string;
  from: string;
  text: string;
  messageId: string;
};

export function parseInboundMessages(body: unknown): InboundText[] {
  const out: InboundText[] = [];
  try {
    const entries = (body as { entry?: unknown[] })?.entry || [];
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] })?.changes || [];
      for (const change of changes) {
        const value = (change as { value?: Record<string, unknown> })?.value;
        if (!value) continue;
        const metadata = value.metadata as { phone_number_id?: string } | undefined;
        const phoneNumberId = metadata?.phone_number_id || "";
        const messages = (value.messages as unknown[]) || [];
        for (const msg of messages) {
          const m = msg as {
            from?: string;
            id?: string;
            type?: string;
            text?: { body?: string };
          };
          if (m.type === "text" && m.text?.body && m.from) {
            out.push({
              phoneNumberId,
              from: m.from.replace(/\D/g, ""),
              text: m.text.body,
              messageId: m.id || "",
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[webhook] parse error", e);
  }
  return out;
}
