/**
 * WhatsApp Cloud API helpers (official path).
 * Never store the permanent token in the client.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Important Meta rules for AI assistants:
 * - Distinguish general-purpose AI assistants from business-integrated AI.
 * - Free-form messages outside the 24h customer service window are restricted.
 * - Messaging has category-based pricing (utility, authentication, marketing, service).
 */

export type SendTextParams = {
  phoneNumberId: string;
  accessToken: string;
  to: string; // E.164 without +
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
      text: { preview_url: false, body: params.body },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error?.message || `Cloud API error ${res.status}`
    );
  }
  return data;
}

/**
 * Verify webhook challenge from Meta.
 */
export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedToken: string
) {
  if (mode === "subscribe" && token === expectedToken) {
    return challenge;
  }
  return null;
}
