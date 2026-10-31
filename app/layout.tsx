import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI WA SaaS — Agents WhatsApp éducatifs",
  description:
    "Configurez et surveillez vos agents WhatsApp pour établissements scolaires au Cameroun.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
