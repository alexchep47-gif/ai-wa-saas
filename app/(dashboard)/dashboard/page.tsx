import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return <p>Aucune organisation associée.</p>;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      agents: true,
      logs: { orderBy: { createdAt: "desc" }, take: 6 },
      escalations: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!org) return null;

  const activeAgents = org.agents.filter((a) => a.status === "active").length;
  const msgsToday = org.agents.reduce((s, a) => s + a.messagesToday, 0);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Vue d'ensemble
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {org.name} · Plan <span className="capitalize">{org.plan}</span>
          {org.trialEndsAt && <> · Essai jusqu'au {formatDate(org.trialEndsAt)}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Agents" value={String(org.agents.length)} />
        <Stat label="Actifs" value={String(activeAgents)} />
        <Stat label="Msg aujourd'hui" value={String(msgsToday)} />
        <Stat label="Escalades" value={String(org.escalations.length)} warn={org.escalations.length > 0} />
      </div>

      {org.escalations.length > 0 && (
        <section className="card p-5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-amber-950">Escalades en attente</h2>
            <Link href="/dashboard/escalations" className="text-sm text-brand-700 font-medium">
              Tout voir
            </Link>
          </div>
          <ul className="space-y-2">
            {org.escalations.map((e) => (
              <li key={e.id} className="text-sm flex gap-3 text-amber-950/90">
                <span className="font-mono text-xs">{e.phone}</span>
                <span className="flex-1 truncate">{e.summary}</span>
                <span className="text-xs text-amber-800/70">{formatDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Vos agents</h2>
          <Link href="/dashboard/agents" className="text-sm text-brand-600 font-medium">
            Voir tout
          </Link>
        </div>
        <ul className="space-y-2">
          {org.agents.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/agents/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:border-brand-200 hover:bg-brand-50/40 transition"
              >
                <div>
                  <p className="font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {statusLabel(a.status)} · {a.connectionMode} · {a.messagesToday} msg
                  </p>
                </div>
                <span className="text-sm text-brand-600 font-medium">Configurer</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold mb-3">Derniers événements</h2>
        {org.logs.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun journal pour l'instant.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {org.logs.map((l) => (
              <li key={l.id} className="flex gap-3">
                <Level level={l.level} />
                <span className="flex-1">{l.message}</span>
                <span className="text-slate-400 text-xs whitespace-nowrap">
                  {formatDate(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Produit</strong> — Cloud API pour la prod. Baileys = prototype privé.
        Publication automatique en chaîne non garantie.
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className={`card p-4 ${warn ? "border-amber-200" : ""}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${warn ? "text-amber-800" : ""}`}>{value}</p>
    </div>
  );
}

function Level({ level }: { level: string }) {
  const cls =
    level === "error"
      ? "text-red-600"
      : level === "warn"
        ? "text-amber-600"
        : "text-slate-400";
  return <span className={`w-12 font-medium ${cls}`}>{level}</span>;
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: "Brouillon",
    active: "Actif",
    paused: "En pause",
    error: "Erreur",
  };
  return map[s] || s;
}
