/**
 * Server-only Gemini client with model fallback (mirrors ai-wa-agent).
 * Never import this from client components.
 */

const MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
].filter((n, i, a) => n && a.indexOf(n) === i);

export async function generateReply(params: {
  systemPrompt: string;
  userMessage: string;
  lang: string;
  history?: { role: "user" | "model"; content: string }[];
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return params.lang === "en"
      ? "The assistant is not fully configured yet. Please try again later."
      : "L'assistant n'est pas encore entièrement configuré. Réessaie plus tard.";
  }

  const prefix =
    params.lang === "en"
      ? "Reply in English, short, WhatsApp style.\n\n"
      : "Réponds en français, court, style WhatsApp.\n\n";

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const turn of params.history || []) {
    contents.push({
      role: turn.role === "model" ? "model" : "user",
      parts: [{ text: turn.content }],
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: prefix + params.userMessage }],
  });

  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: params.systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        lastErr = data?.error?.message || res.status;
        continue;
      }
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || "")
          .join("") || "";
      if (text.trim()) return text.trim();
      lastErr = "empty response";
    } catch (e) {
      lastErr = e;
    }
  }

  console.error("[gemini] all models failed", lastErr);
  return params.lang === "en"
    ? "Temporary error. A human will follow up if needed."
    : "Erreur temporaire. Un conseiller prendra le relais si besoin.";
}
