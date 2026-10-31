import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function LogsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = user.memberships[0]?.organizationId;
  if (!orgId) return null;

  const logs = await prisma.activityLog.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Journaux</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun événement.</p>
        ) : (
          <ul className="divide-y">
            {logs.map((l) => (
              <li key={l.id} className="px-5 py-3 text-sm flex gap-3">
                <span
                  className={
                    l.level === "error"
                      ? "text-red-600 font-medium w-14"
                      : l.level === "warn"
                        ? "text-amber-600 font-medium w-14"
                        : "text-slate-400 w-14"
                  }
                >
                  {l.level}
                </span>
                <span className="flex-1">{l.message}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDate(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
