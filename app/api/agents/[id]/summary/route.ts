import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAgentSummaryPdf } from "@/lib/documents/pdfme";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = user.memberships[0];
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { error: "Droits administrateur requis" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, organizationId: membership.organizationId },
    include: { organization: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });

  const quickReplies: Record<string, string> = {};
  try {
    const parsed: unknown = JSON.parse(agent.quickReplies || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") quickReplies[key] = value;
      }
    }
  } catch {
    // Keep the export usable even if legacy data contains malformed JSON.
  }

  try {
    const pdf = await generateAgentSummaryPdf({
      organizationName: agent.organization.name,
      agentName: agent.name,
      status: agent.status,
      connectionMode: agent.connectionMode,
      systemPrompt: agent.systemPrompt,
      quickReplies,
      generatedAt: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Africa/Douala",
      }).format(new Date()),
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="agent-${agent.id}-summary.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[agent-summary] PDF generation failed", error);
    return NextResponse.json(
      { error: "Génération PDF impossible" },
      { status: 500 },
    );
  }
}
