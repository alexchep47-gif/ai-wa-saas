import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { EscalationActions } from "./actions";

export default async function EscalationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return null;

  const items = await prisma.escalation.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pending = items.filter((i) => i.status === "pending");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escalades</h1>
        <p className="text-sm text-slate-500 mt-1">
          Déclarations de paiement et demandes humaines · {pending.length} en attente
        </p>
      </div>

      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune escalade pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((e) => (
              <li key={e.id} className="px-5 py-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={e.status} />
                    <span className="text-xs font-mono text-slate-600">{e.phone}</span>
                    <span className="text-xs text-slate-400">{e.type}</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(e.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-800">{e.summary}</p>
                {e.status === "pending" && <EscalationActions id={e.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-amber",
    approved: "badge-green",
    rejected: "badge-red",
    closed: "badge-slate",
  };
  return <span className={map[status] || "badge-slate"}>{status}</span>;
}
