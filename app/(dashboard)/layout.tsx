import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble" },
  { href: "/dashboard/agents", label: "Agents" },
  { href: "/dashboard/escalations", label: "Escalades" },
  { href: "/dashboard/logs", label: "Journaux" },
  { href: "/dashboard/settings", label: "Paramètres" },
  { href: "/dashboard/billing", label: "Abonnement" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const org = user.memberships[0]?.organization;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:min-h-screen bg-white/90 backdrop-blur border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white text-xs font-bold">
              N
            </span>
            <span className="font-bold text-slate-900">NCAM AI</span>
          </Link>
          {org && (
            <p className="text-xs text-slate-500 mt-2 truncate pl-10">{org.name}</p>
          )}
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
