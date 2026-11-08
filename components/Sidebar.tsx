"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Building2, UserRound, Send, BookUser, ShieldCheck, Sparkles, BarChart3, Presentation,
  QrCode, Upload, Users, Settings, ScrollText, LogOut, LifeBuoy,
} from "lucide-react";
import { Logo } from "./Logo";

const ICONS = { LayoutDashboard, FileText, Building2, UserRound, Send, BookUser, ShieldCheck, Sparkles, BarChart3, Presentation, QrCode, Upload, Users, Settings, ScrollText };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; section?: string };

export function Sidebar({ items, logout }: { items: NavItem[]; logout: () => Promise<void> }) {
  const path = usePathname();
  const active = (href: string) => (href === path) || (href !== "/espace" && href !== "/admin" && path.startsWith(href + "/"));
  let lastSection: string | undefined;
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col bg-white lg:flex">
      <div className="ligne-etat" aria-hidden />
      <div className="px-6 pb-2 pt-5"><Link href="/"><Logo size="md" /></Link></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2 text-sm" aria-label="Navigation principale">
        {items.map((it) => {
          const Icon = ICONS[it.icon];
          const header = it.section && it.section !== lastSection ? it.section : null;
          lastSection = it.section ?? lastSection;
          const on = active(it.href);
          return (
            <div key={it.href}>
              {header && <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-display">{header}</div>}
              <Link href={it.href} aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 rounded-full px-4 py-2 font-display transition ${on ? "bg-brand-600 font-semibold text-white" : "text-gov-ink hover:bg-panel"}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span className="flex-1">{it.label}</span>
                {on && <span className="h-2 w-2 rounded-full bg-flag-yellow" aria-hidden />}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="space-y-2 p-4">
        <Link href="/aide" className="flex items-center gap-3 rounded-3xl bg-brand-600 px-4 py-3 text-white">
          <LifeBuoy size={22} className="shrink-0 text-flag-yellow" />
          <span><span className="block font-display text-sm font-bold leading-tight">Besoin d&apos;aide ?</span><span className="block text-[11px] text-brand-100">Guide, FAQ, assistance</span></span>
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-flag-red px-4 py-2.5 font-display text-sm font-semibold text-white hover:bg-gov-red-dark">
            <LogOut size={16} /> Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="no-print flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden" aria-label="Navigation mobile">
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const on = it.href === path;
        return (
          <Link key={it.href} href={it.href} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-display ${on ? "bg-brand-600 text-white" : "bg-white text-gov-ink"}`}>
            <Icon size={14} />{it.label}
          </Link>
        );
      })}
    </nav>
  );
}
