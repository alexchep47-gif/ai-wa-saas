import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const org = user.memberships[0]?.organization;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r shrink-0 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="font-bold text-brand-700">
            AI WA SaaS
          </Link>
          {org && (
            <p className="text-xs text-slate-500 mt-1 truncate">{org.name}</p>
          )}
        </div>
        <nav className="p-3 space-y-1 flex-1">
          <NavLink href="/dashboard">Vue d'ensemble</NavLink>
          <NavLink href="/dashboard/agents">Agents</NavLink>
          <NavLink href="/dashboard/logs">Journaux</NavLink>
          <NavLink href="/dashboard/settings">Paramètres</NavLink>
          <NavLink href="/dashboard/billing">Abonnement</NavLink>
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}
