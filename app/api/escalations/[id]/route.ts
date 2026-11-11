import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicErrorMessage } from "@/lib/security";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const membership = user.memberships[0];
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Droits administrateur requis" },
        { status: 403 },
      );
    }
    const orgId = membership.organizationId;
    if (!orgId) {
      return NextResponse.json(
        { error: "Pas d'organisation" },
        { status: 400 },
      );
    }

    const { id } = await params;
    const body = await req.json();
    const status = body.status;
    if (!["approved", "rejected", "closed"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const esc = await prisma.escalation.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!esc) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    await prisma.escalation.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: user.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: orgId,
        agentId: esc.agentId,
        level: "info",
        message: `Escalade ${esc.phone} → ${status}`,
        meta: JSON.stringify({ escalationId: id }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: publicErrorMessage(e) }, { status: 500 });
  }
}
