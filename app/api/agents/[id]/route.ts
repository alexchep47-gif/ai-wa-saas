import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const orgId = user.memberships[0]?.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Pas d'organisation" }, { status: 400 });
    }

    const agent = await prisma.agent.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data: {
      name?: string;
      systemPrompt?: string;
      status?: string;
      quickReplies?: string;
    } = {};

    if (typeof body.name === "string") data.name = body.name.slice(0, 120);
    if (typeof body.systemPrompt === "string")
      data.systemPrompt = body.systemPrompt.slice(0, 8000);
    if (["draft", "active", "paused"].includes(body.status))
      data.status = body.status;
    if (body.quickReplies && typeof body.quickReplies === "object") {
      data.quickReplies = JSON.stringify(body.quickReplies);
    }

    await prisma.agent.update({ where: { id }, data });

    await prisma.activityLog.create({
      data: {
        organizationId: orgId,
        agentId: id,
        level: "info",
        message: "Configuration de l'agent mise à jour",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
