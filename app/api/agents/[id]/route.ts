import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  publicErrorMessage,
  sanitizeName,
  sanitizePlainText,
  sanitizePrompt,
} from "@/lib/security";
import { encryptWhatsAppToken } from "@/lib/whatsapp/security";

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
    const membership = user.memberships[0];
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Droits administrateur requis" }, { status: 403 });
    }
    const orgId = membership.organizationId;
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
      cloudPhoneNumberId?: string | null;
      cloudTokenEnc?: string | null;
      connectionMode?: string;
    } = {};

    if (typeof body.name === "string") data.name = sanitizeName(body.name) || agent.name;
    if (typeof body.systemPrompt === "string")
      data.systemPrompt = sanitizePrompt(body.systemPrompt) || agent.systemPrompt;
    if (["draft", "active", "paused"].includes(body.status)) data.status = body.status;
    if (body.quickReplies && typeof body.quickReplies === "object") {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(body.quickReplies)) {
        if (typeof k === "string" && typeof v === "string") {
          clean[k.slice(0, 40)] = sanitizePlainText(v, 1000);
        }
      }
      data.quickReplies = JSON.stringify(clean);
    }

    if (body.disconnectWhatsApp === true) {
      data.cloudPhoneNumberId = null;
      data.cloudTokenEnc = null;
      data.connectionMode = "none";
      if (data.status === "active" || agent.status === "active") data.status = "draft";
    } else {
      if (typeof body.cloudPhoneNumberId === "string") {
        const phoneNumberId = body.cloudPhoneNumberId.trim();
        if (phoneNumberId && !/^\d{5,30}$/.test(phoneNumberId)) {
          return NextResponse.json({ error: "Phone Number ID invalide" }, { status: 400 });
        }
        data.cloudPhoneNumberId = phoneNumberId || null;
      }

      if (typeof body.cloudAccessToken === "string" && body.cloudAccessToken.trim()) {
        const accessToken = body.cloudAccessToken.trim();
        if (accessToken.length > 4096 || /\s/.test(accessToken)) {
          return NextResponse.json({ error: "Jeton Cloud API invalide" }, { status: 400 });
        }
        data.cloudTokenEnc = encryptWhatsAppToken(accessToken);
      }

      if (data.cloudPhoneNumberId || data.cloudTokenEnc) data.connectionMode = "cloud_api";

      const effectivePhoneNumberId = data.cloudPhoneNumberId !== undefined
        ? data.cloudPhoneNumberId
        : agent.cloudPhoneNumberId;
      const effectiveToken = data.cloudTokenEnc !== undefined
        ? data.cloudTokenEnc
        : agent.cloudTokenEnc;
      const effectiveStatus = data.status ?? agent.status;
      if (effectiveStatus === "active" && (!effectivePhoneNumberId || !effectiveToken)) {
        return NextResponse.json(
          { error: "Configurez le Phone Number ID et le jeton Cloud API avant d’activer l’agent." },
          { status: 400 }
        );
      }
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
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "Ce Phone Number ID est déjà associé à un autre agent." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: publicErrorMessage(e) }, { status: 500 });
  }
}
