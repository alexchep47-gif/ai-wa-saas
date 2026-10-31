import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = user.memberships[0]?.organizationId;
  const org = orgId
    ? await prisma.organization.findUnique({ where: { id: orgId } })
    : null;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Abonnement</h1>

      <div className="bg-white border rounded-xl p-6 space-y-3">
        <p>
          Plan actuel : <strong className="capitalize">{org?.plan}</strong>
        </p>
        {org?.trialEndsAt && (
          <p className="text-sm text-slate-600">
            Fin de l'essai : {formatDate(org.trialEndsAt)}
          </p>
        )}
      </div>

      <div className="bg-slate-50 border rounded-xl p-5 text-sm space-y-2">
        <p className="font-medium">Forfaits prévus (pilote)</p>
        <ul className="list-disc list-inside text-slate-600 space-y-1">
          <li>Essai 14 jours — 1 agent, messages limités</li>
          <li>Starter — 1 agent, quota messages mensuel</li>
          <li>Pro — plusieurs agents, stats avancées</li>
        </ul>
        <p className="text-slate-500 pt-2">
          Pas d'« illimité » au départ : hébergement, modèles IA et messages
          WhatsApp génèrent des coûts variables. Le paiement Mobile Money /
          Stripe sera branché après validation de la demande.
        </p>
      </div>
    </div>
  );
}
