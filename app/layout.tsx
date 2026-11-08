import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Bell, CalendarDays, Search } from "lucide-react";
import "@fontsource/cooper-hewitt/400.css";
import "@fontsource/cooper-hewitt/600.css";
import "@fontsource/cooper-hewitt/700.css";
import "@fontsource/cooper-hewitt/800.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { getSettings, storageKind } from "@/lib/db";
import { ROLES } from "@/lib/referentials";
import { logoutAction } from "./actions/auth";
import { emailEnabled } from "@/lib/email";
import { MobileNav, Sidebar, type NavItem } from "@/components/Sidebar";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { Logo } from "@/components/Logo";
import type { User } from "@/lib/types";

export const metadata: Metadata = {
  title: { default: "RENUM — Registre national des responsables numériques", template: "%s · RENUM" },
  description: "Plateforme nationale de recensement des responsables numériques et de collecte des besoins numériques des administrations.",
  manifest: "/manifest.webmanifest",
};
export const dynamic = "force-dynamic";
export const viewport: Viewport = { themeColor: "#17418a", width: "device-width", initialScale: 1 };

function navFor(u: User): NavItem[] {
  const items: NavItem[] = [];
  if (u.role === "responsable" || u.role === "delegue") {
    items.push(
      { href: "/espace", label: "Vue d'ensemble", icon: "LayoutDashboard", section: "Mon espace" },
      { href: "/espace/besoins", label: "Besoins", icon: "FileText", section: "Mon espace" },
      { href: "/espace/structure", label: "Ma structure", icon: "Building2", section: "Mon espace" },
      { href: "/espace/profil", label: "Ma fiche", icon: "UserRound", section: "Mon espace" },
    );
    if (u.role === "responsable") items.push({ href: "/espace/soumission", label: "Soumission", icon: "Send", section: "Mon espace" });
  }
  if (u.role === "analyste" || u.role === "admin") {
    items.push(
      { href: "/admin", label: "Vue d'ensemble", icon: "LayoutDashboard", section: "Back-office" },
      { href: "/admin/validation", label: "Validation", icon: "ShieldCheck", section: "Back-office" },
      { href: "/admin/ia", label: "Module IA", icon: "Sparkles", section: "Back-office" },
      { href: "/evenement", label: "Événement", icon: "QrCode", section: "Back-office" },
      { href: "/admin/import", label: "Import secours", icon: "Upload", section: "Back-office" },
    );
  }
  if (u.role !== "responsable" && u.role !== "delegue") {
    items.push({ href: "/tableau-de-bord", label: "Tableau de bord", icon: "BarChart3", section: "Analyse" }, { href: "/decideur", label: "Vue décideur", icon: "Presentation", section: "Analyse" });
  }
  items.push({ href: "/annuaire", label: "Annuaire", icon: "BookUser", section: "Annuaire" });
  if (u.role === "admin" || u.role === "analyste") items.push({ href: "/admin/utilisateurs", label: u.role === "admin" ? "Utilisateurs" : "Saisie assistée", icon: "Users", section: "Administration" });
  if (u.role === "admin") items.push({ href: "/admin/parametres", label: "Paramètres", icon: "Settings", section: "Administration" });
  if (u.role === "admin" || u.role === "analyste") items.push({ href: "/admin/audit", label: "Journal d'audit", icon: "ScrollText", section: "Administration" });
  return items;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([currentUser(), getSettings()]);
  const demoMode = !emailEnabled();
  const ephemeral = storageKind() === "file" && process.env.VERCEL;
  const banner = (demoMode || ephemeral || settings.infoBanner) && (
    <div className="no-print rounded-2xl bg-flag-yellow/60 px-4 py-2 text-center text-xs text-gov-ink">
      {settings.infoBanner && <span className="mr-2 font-medium">{settings.infoBanner}</span>}
      {demoMode && <span>Mode démonstration : aucun e-mail n&apos;est envoyé, les codes de vérification s&apos;affichent à l&apos;écran.</span>}
      {ephemeral && <span className="ml-2 font-semibold">Stockage non persistant — configurez une base de données.</span>}
    </div>
  );
  const today = new Date();
  return (
    <html lang="fr">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Aller au contenu</a>
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar items={navFor(user)} logout={logoutAction} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="ligne-etat lg:hidden" aria-hidden />
              <header className="no-print flex flex-wrap items-center gap-3 px-4 py-4 lg:px-8">
                <Link href="/" className="lg:hidden"><Logo size="sm" compact /></Link>
                <form action="/annuaire" className="hidden flex-1 md:block" role="search">
                  <label className="flex max-w-sm items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-slate-400">
                    <Search size={18} /><input name="q" placeholder="Rechercher une structure…" className="w-full bg-transparent text-gov-ink outline-none placeholder:text-slate-400" aria-label="Rechercher dans l'annuaire" />
                  </label>
                </form>
                <div className="ml-auto flex items-center gap-2">
                  <div className="hidden items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 sm:flex">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-panel font-display text-base font-bold">{today.getDate()}</span>
                    <span className="font-display text-xs leading-tight">{today.toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Africa/Kinshasa" })}<br /><span className="text-slate-500">{today.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Africa/Kinshasa" })}</span></span>
                    <CalendarDays size={18} className="text-slate-400" />
                  </div>
                  <span className="relative grid h-11 w-11 place-items-center rounded-full bg-white" aria-hidden><Bell size={18} /><span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-flag-red" /></span>
                  <Link href="/espace/profil" className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-display text-sm font-bold text-white">{(user.firstName[0] ?? "").toUpperCase()}{(user.lastName[0] ?? "").toUpperCase()}</span>
                    <span className="hidden text-left leading-tight sm:block"><span className="block font-display text-sm font-semibold">{user.firstName} {user.lastName}</span><span className="block text-xs text-slate-500">{ROLES[user.role]}</span></span>
                  </Link>
                  <form action={logoutAction} className="lg:hidden"><button className="btn-secondary btn-sm">Sortir</button></form>
                </div>
              </header>
              <MobileNav items={navFor(user)} />
              <main id="main" className="mx-4 mb-6 flex-1 rounded-[2rem] bg-white/0 lg:mx-8">
                {banner && <div className="mb-4">{banner}</div>}
                {children}
              </main>
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen flex-col">
            <PublicHeader />
            {banner && <div className="mx-auto mt-4 w-full max-w-7xl px-4">{banner}</div>}
            <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
            <PublicFooter campaign={settings.campaignName} />
          </div>
        )}
      </body>
    </html>
  );
}
