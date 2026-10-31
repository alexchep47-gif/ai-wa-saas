import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AgentConfigForm } from "./agent-form";

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
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <p className="text-sm text-slate-500">
          Statut : {agent.status} · Connexion : {agent.connectionMode}
        </p>
      </div>

      <AgentConfigForm
        agentId={agent.id}
        initial={{
          name: agent.name,
          systemPrompt: agent.systemPrompt,
          status: agent.status,
          quickReplies,
        }}
      />

      <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-600 space-y-2">
        <p className="font-medium text-slate-800">Connexion WhatsApp</p>
        <p>
          Pour un produit commercial, utilisez la <strong>Cloud API</strong>{
          " "}
          Meta (token + Phone Number ID). La connexion Baileys reste réservée au
          prototype privé et n'est pas exposée ici comme option garantie.
        </p>
        <p>
          La publication automatique dans les chaînes WhatsApp n'a pas d'API
          officielle confirmée → proposez un calendrier à copier manuellement.
        </p>
      </div>
    </div>
  );
}
