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
              N
            </span>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              NCAM AI
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
            NCAM AI · centre d’agents intelligents
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.15]">
            Pilotez vos agents IA sur le web, mobile et WhatsApp
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NCAM AI transforme les questions en réponses, documents et actions utiles.
            Configurez vos agents, connectez WhatsApp et gardez le contrôle depuis
            une interface installable sur ordinateur comme sur téléphone.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Ouvrir NCAM AI
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              J’ai déjà un compte
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-20 grid sm:grid-cols-3 gap-4">
          {[
            {
              t: "Un cerveau, plusieurs canaux",
              d: "NCAM AI orchestre vos conversations et vos documents ; WhatsApp reste un canal connecté.",
            },
            {
              t: "Web et mobile",
              d: "Installez NCAM AI comme une application sur votre téléphone ou utilisez le tableau de bord web.",
            },
            {
              t: "Documents prêts à partager",
              d: "Générez des synthèses PDFme depuis les fiches agent et les conversations utiles.",
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
        NCAM AI · intelligence utile, connectée à vos canaux
      </footer>
    </div>
  );
}
