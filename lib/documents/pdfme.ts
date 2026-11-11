import { generate } from "@pdfme/generator";
import { BLANK_PDF, type Schema, type Template } from "@pdfme/common";
import { text } from "@pdfme/schemas";

const textSchema = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
): Schema => ({
  name,
  type: "text",
  content: "",
  position: { x, y },
  width,
  height,
  fontSize,
  lineHeight: 1.2,
  alignment: "left",
  verticalAlignment: "top",
  characterSpacing: 0,
  fontColor: "000000",
});

export type AgentSummaryPdfInput = {
  organizationName: string;
  agentName: string;
  status: string;
  connectionMode: string;
  systemPrompt: string;
  quickReplies: Record<string, string>;
  generatedAt: string;
};

export async function generateAgentSummaryPdf(
  input: AgentSummaryPdfInput,
): Promise<Uint8Array> {
  const template: Template = {
    basePdf: BLANK_PDF,
    schemas: [
      [
        textSchema("title", 20, 20, 170, 14, 20),
        textSchema("meta", 20, 38, 170, 20, 10),
        textSchema("promptLabel", 20, 66, 170, 10, 12),
        textSchema("prompt", 20, 78, 170, 80, 10),
        textSchema("repliesLabel", 20, 168, 170, 10, 12),
        textSchema("replies", 20, 180, 170, 80, 10),
        textSchema("footer", 20, 275, 170, 12, 8),
      ],
    ],
  };

  const quickRepliesText =
    Object.entries(input.quickReplies)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n") || "Aucune réponse rapide configurée.";

  const pdf = await generate({
    template,
    inputs: [
      {
        title: `Synthèse de l'agent — ${input.agentName}`,
        meta: `Organisation : ${input.organizationName}\nStatut : ${input.status} · Connexion : ${input.connectionMode}`,
        promptLabel: "Prompt système",
        prompt: input.systemPrompt,
        repliesLabel: "Réponses rapides",
        replies: quickRepliesText,
        footer: `Généré le ${input.generatedAt} · AI WA SaaS`,
      },
    ],
    plugins: { text },
  });

  return pdf;
}
