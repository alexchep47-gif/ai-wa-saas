import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = user.memberships[0]?.organizationId;
  const org = orgId
    ? await prisma.organization.findUnique({ where: { id: orgId } })
    : null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Organisation</p>
          <p className="font-medium">{org?.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Slug</p>
          <p className="font-mono text-sm">{org?.slug}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Votre email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Rôle</p>
          <p className="font-medium">{user.memberships[0]?.role}</p>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        La gestion multi-administrateurs et la suppression de compte seront
        ajoutées dans une prochaine itération.
      </p>
    </div>
  );
}
