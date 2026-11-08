import Link from "next/link";
import { NEED_STATUS, STRUCTURE_STATUS } from "@/lib/referentials";

export const fmtUsd = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
export const fmtMoney = (n: number, c: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: c === "CDF" ? 0 : 2 }).format(n || 0);
export const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n || 0);
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kinshasa" }) : "—");

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-slate-400", soumis: "bg-flag-blue", soumise: "bg-flag-blue", en_revue: "bg-brand-500",
  valide: "bg-gov-green", validee: "bg-gov-green", a_completer: "bg-gov-orange", rejete: "bg-flag-red", rejetee: "bg-flag-red",
  regroupe: "bg-purple-500", archivee: "bg-slate-300",
};
const PRIO: Record<string, string> = {
  critique: "bg-flag-red text-white", haute: "bg-gov-orange/15 text-[#a8500f]", moyenne: "bg-flag-yellow/50 text-gov-ink", basse: "bg-panel text-slate-600",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  if (tone && PRIO[tone]) return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIO[tone]}`}>{children}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gov-ink ring-1 ring-slate-200">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[tone ?? ""] ?? "bg-slate-400"}`} aria-hidden />{children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label = (NEED_STATUS as Record<string, string>)[status] ?? (STRUCTURE_STATUS as Record<string, string>)[status] ?? status;
  return <Badge tone={status}>{label}</Badge>;
}

export function PageTitle({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-flag-red">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1a1a1a] md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type KpiTone = "white" | "blue" | "red" | "dark";
export function Kpi({ label, value, hint, icon, tone = "white", trend }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: KpiTone; trend?: { up: boolean; text: string } }) {
  const t = {
    white: { box: "bg-white", lab: "text-slate-500", val: "text-[#1a1a1a]", ico: "bg-panel text-gov-ink", hint: "text-slate-500" },
    blue: { box: "bg-brand-600 text-white", lab: "text-brand-100", val: "text-white", ico: "bg-white/15 text-flag-yellow", hint: "text-brand-100" },
    red: { box: "bg-gradient-to-br from-flag-red to-gov-orange text-white", lab: "text-white/85", val: "text-white", ico: "bg-white/20 text-white", hint: "text-white/80" },
    dark: { box: "bg-brand-900 text-white", lab: "text-slate-300", val: "text-white", ico: "bg-white/10 text-flag-blue", hint: "text-slate-300" },
  }[tone];
  return (
    <div className={`rounded-3xl p-5 ${t.box}`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`text-sm ${t.lab}`}>{label}</div>
        {icon && <span className={`grid h-9 w-9 place-items-center rounded-full ${t.ico}`}>{icon}</span>}
      </div>
      <div className={`mt-3 font-display text-3xl font-bold tracking-tight ${t.val}`}>{value}</div>
      {(hint || trend) && (
        <div className={`mt-2 flex items-center gap-2 text-xs ${t.hint}`}>
          {trend && <span className={`rounded-full px-2 py-0.5 font-medium ${tone === "white" ? (trend.up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700") : "bg-white/20"}`}>{trend.up ? "↑" : "↓"} {trend.text}</span>}
          {hint}
        </div>
      )}
    </div>
  );
}

export function Progress({ pct }: { pct: number }) {
  const color = pct >= 85 ? "bg-gov-green" : pct >= 50 ? "bg-gov-orange" : "bg-flag-red";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel bg-[repeating-linear-gradient(135deg,#eceef1_0_6px,#f6f7f9_6px_12px)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  const c = { info: "bg-brand-50 text-brand-700", warn: "bg-gov-orange/10 text-[#8a420d]", error: "bg-red-50 text-red-900", ok: "bg-green-50 text-green-900" }[tone];
  return <div className={`rounded-2xl px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export function Tabs({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 rounded-full bg-white p-1.5 font-display text-sm" aria-label="Sous-navigation">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`rounded-full px-4 py-2 ${current === i.href ? "bg-[#1a1a1a] font-semibold text-white" : "text-slate-600 hover:bg-panel"}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div><h2 className="font-display text-lg font-bold text-[#1a1a1a]">{title}</h2>{subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}</div>
      {action}
    </div>
  );
}
