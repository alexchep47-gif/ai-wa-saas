import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return null;

  const agents = await prisma.agent.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agents</h1>
      </div>

      <ul className="space-y-3">
        {agents.map((a) => (
          <li key={a.id}>
            <Link
              href={`/dashboard/agents/${a.id}`}
              className="block bg-white border rounded-xl px-5 py-4 hover:border-brand-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {a.status} · {a.connectionMode} · {a.messagesToday} msg
                    aujourd'hui
                  </p>
                </div>
                <span className="text-brand-600 text-sm font-medium">
                  Configurer →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {agents.length === 0 && (
        <p className="text-slate-500 text-sm">
          Aucun agent. Créez un compte pour en générer un automatiquement.
        </p>
      )}
    </div>
  );
}
