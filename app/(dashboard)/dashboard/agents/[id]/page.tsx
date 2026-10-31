import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AgentConfigForm } from "./agent-form";
import Link from "next/link";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const orgId = user.memberships[0]?.organizationId;
  const agent = await prisma.agent.findFirst({
    where: { id, organizationId: orgId },
  });

  if (!agent) notFound();

  let quickReplies: Record<string, string> = {};
  try {
    quickReplies = JSON.parse(agent.quickReplies || "{}");
  } catch {
    /* ignore */
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/agents"
          className="text-sm text-brand-600 font-medium hover:underline"
        >
          ← Agents
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">{agent.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Statut : {agent.status} · Connexion : {agent.connectionMode} ·{" "}
          {agent.messagesToday}/{agent.dailyMsgLimit} msg aujourd'hui
        </p>
      </div>

      <AgentConfigForm
        agentId={agent.id}
        initial={{
          name: agent.name,
          systemPrompt: agent.systemPrompt,
          status: agent.status,
          quickReplies,
          cloudPhoneNumberId: agent.cloudPhoneNumberId || "",
          cloudTokenConfigured: Boolean(agent.cloudTokenEnc),
        }}
      />

      <div className="card p-4 text-sm text-slate-600 space-y-2 bg-slate-50 border-slate-200">
        <p className="font-semibold text-slate-800">Connexion WhatsApp</p>
        <p>
          Production : <strong>Cloud API</strong> Meta. Configurez le Phone Number ID et le jeton dans le formulaire ci-dessus.
        </p>
        <p>
          Baileys : prototype privé uniquement — non exposé comme option garantie.
        </p>
        <p>
          Chaînes WhatsApp : pas d'API officielle de publication → calendrier manuel
          recommandé.
        </p>
      </div>
    </div>
  );
}
