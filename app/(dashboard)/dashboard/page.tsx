import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) {
    return <p>Aucune organisation associée.</p>;
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      agents: true,
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!org) return null;

  const activeAgents = org.agents.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-slate-500 text-sm mt-1">
          {org.name} · Plan {org.plan}
          {org.trialEndsAt && (
            <> · Essai jusqu'au {formatDate(org.trialEndsAt)}</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Agents" value={String(org.agents.length)} />
        <StatCard label="Actifs" value={String(activeAgents)} />
        <StatCard
          label="Messages aujourd'hui"
          value={String(
            org.agents.reduce((s, a) => s + a.messagesToday, 0)
          )}
        />
      </div>

      <section className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Vos agents</h2>
          <Link
            href="/dashboard/agents"
            className="text-sm text-brand-600 hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {org.agents.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun agent pour l'instant.</p>
        ) : (
          <ul className="space-y-3">
            {org.agents.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    Statut : {a.status} · Mode : {a.connectionMode}
                  </p>
                </div>
                <Link
                  href={`/dashboard/agents/${a.id}`}
                  className="text-sm text-brand-600 font-medium"
                >
                  Configurer
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">Derniers événements</h2>
        {org.logs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun journal pour l'instant.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {org.logs.map((l) => (
              <li key={l.id} className="flex gap-3">
                <span
                  className={
                    l.level === "error"
                      ? "text-red-600"
                      : l.level === "warn"
                        ? "text-amber-600"
                        : "text-slate-500"
                  }
                >
                  {l.level}
                </span>
                <span className="flex-1">{l.message}</span>
                <span className="text-slate-400 text-xs">
                  {formatDate(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong>Rappel produit</strong> : la connexion WhatsApp commerciale doit
        passer par la Cloud API officielle. Baileys reste réservé au prototype
        privé. La publication automatique dans les chaînes n'est pas encore
        supportée officiellement.
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
