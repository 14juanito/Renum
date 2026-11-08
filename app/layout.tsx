import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser, homeFor } from "@/lib/auth";
import { getSettings, storageKind } from "@/lib/db";
import { ROLES } from "@/lib/referentials";
import { logoutAction } from "./actions/auth";
import { emailEnabled } from "@/lib/email";

export const metadata: Metadata = {
  title: { default: "RENUM — Registre national des responsables numériques", template: "%s · RENUM" },
  description: "Plateforme nationale de recensement des responsables numériques et de collecte des besoins numériques des administrations.",
  manifest: "/manifest.webmanifest",
};
export const dynamic = "force-dynamic";
export const viewport: Viewport = { themeColor: "#075bb3", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([currentUser(), getSettings()]);
  const demoMode = !emailEnabled();
  const ephemeral = storageKind() === "file" && process.env.VERCEL;
  const nav: { href: string; label: string }[] = [];
  if (user) {
    if (user.role === "responsable" || user.role === "delegue") nav.push({ href: "/espace", label: "Mon espace" }, { href: "/espace/besoins", label: "Besoins" });
    if (user.role === "analyste" || user.role === "admin") nav.push({ href: "/admin", label: "Back-office" }, { href: "/admin/validation", label: "Validation" }, { href: "/admin/ia", label: "IA" });
    if (user.role !== "responsable" && user.role !== "delegue") nav.push({ href: "/tableau-de-bord", label: "Tableau de bord" });
    if (user.role === "decideur") nav.push({ href: "/decideur", label: "Vue décideur" });
    nav.push({ href: "/annuaire", label: "Annuaire" });
  }
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Aller au contenu</a>
        <div className="h-1 w-full bg-[linear-gradient(90deg,#0a6fd6_0_60%,#f7d618_60%_70%,#ce1021_70%_80%,#0a6fd6_80%)]" aria-hidden />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href={user ? homeFor(user.role) : "/"} className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-black text-white">RN</span>
              <span className="leading-tight">
                <span className="block font-bold text-brand-900">RENUM</span>
                <span className="block text-[11px] text-slate-500">Registre national du numérique public</span>
              </span>
            </Link>
            <nav className="flex flex-1 flex-wrap gap-1 text-sm" aria-label="Navigation principale">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100">{n.label}</Link>
              ))}
            </nav>
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/espace/profil" className="hidden text-right sm:block">
                  <span className="block font-medium">{user.firstName} {user.lastName}</span>
                  <span className="block text-xs text-slate-500">{ROLES[user.role]}</span>
                </Link>
                <form action={logoutAction}><button className="btn-secondary btn-sm">Déconnexion</button></form>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/connexion" className="btn-secondary btn-sm">Me connecter</Link>
                <Link href="/inscription" className="btn-primary btn-sm">Je m&apos;enregistre</Link>
              </div>
            )}
          </div>
        </header>
        {(demoMode || ephemeral || settings.infoBanner) && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
            {settings.infoBanner && <span className="mr-2 font-medium">{settings.infoBanner}</span>}
            {demoMode && <span>Mode démonstration : aucun e-mail n&apos;est envoyé, les codes de vérification s&apos;affichent à l&apos;écran.</span>}
            {ephemeral && <span className="ml-2 font-semibold">Stockage non persistant — configurez une base de données.</span>}
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white text-sm text-slate-600">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-4 py-6">
            <p>© {new Date().getFullYear()} RENUM — {settings.campaignName}</p>
            <nav className="flex flex-wrap gap-4" aria-label="Liens légaux">
              <Link className="link" href="/legal/mentions">Mentions légales</Link>
              <Link className="link" href="/legal/confidentialite">Confidentialité</Link>
              <Link className="link" href="/legal/cgu">Conditions d&apos;utilisation</Link>
              <Link className="link" href="/aide">Aide &amp; FAQ</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
