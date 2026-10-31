import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-xl text-brand-700">AI WA SaaS</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Agents WhatsApp pour les établissements scolaires
          </h1>
          <p className="text-lg text-slate-600">
            Configurez un assistant en français pour vos cours, FAQ, horaires et
            demandes de contact. L’agent tourne 24 h/24 sur un serveur — pas dans
            une application mobile.
          </p>
          <p className="text-sm text-slate-500">
            Premier pilote : <strong>CMR SCHOOL / Mathsfor.all</strong>
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700"
            >
              Démarrer l’essai
            </Link>
            <Link
              href="/login"
              className="border border-slate-300 px-6 py-3 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-slate-500">
        Architecture SaaS · Cloud API privilégiée · Baileys = prototype privé
      </footer>
    </div>
  );
}
