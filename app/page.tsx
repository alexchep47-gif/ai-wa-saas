import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/40 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-sm">
              WA
            </span>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              AI WA SaaS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary !py-2">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary !py-2">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-medium text-brand-700 mb-6">
            Pilote établissements scolaires · Cameroun
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.15]">
            Agents WhatsApp pour vos élèves, parents et inscriptions
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Configurez un assistant en français : cours, FAQ, horaires, contact et
            transfert humain. L’agent tourne 24&nbsp;h/24 sur un serveur — pas dans
            une application mobile.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Démarrer l’essai 14 jours
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              J’ai déjà un compte
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-20 grid sm:grid-cols-3 gap-4">
          {[
            {
              t: "Cloud API d’abord",
              d: "Connexion commerciale via l’API officielle Meta. Baileys reste un prototype privé.",
            },
            {
              t: "Multi-établissement",
              d: "Chaque école a ses prompts, réponses rapides, quotas et journaux isolés.",
            },
            {
              t: "Contrôle & sécurité",
              d: "Clés hors client, sessions httpOnly, rate-limit login, pause agent en un clic.",
            },
          ].map((item) => (
            <div key={item.t} className="card p-5 text-left">
              <h3 className="font-semibold text-slate-900">{item.t}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200/80 py-6 text-center text-sm text-slate-500">
        Premier cas pilote · CMR SCHOOL / Mathsfor.all · Chaînes WhatsApp non promises
      </footer>
    </div>
  );
}
