import Link from "next/link";
import { NEED_STATUS, STRUCTURE_STATUS } from "@/lib/referentials";

export const fmtUsd = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
export const fmtMoney = (n: number, c: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: c === "CDF" ? 0 : 2 }).format(n || 0);
export const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n || 0);
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kinshasa" }) : "—");

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-slate-100 text-slate-700", soumis: "bg-blue-100 text-blue-800", soumise: "bg-blue-100 text-blue-800",
  en_revue: "bg-indigo-100 text-indigo-800", valide: "bg-emerald-100 text-emerald-800", validee: "bg-emerald-100 text-emerald-800",
  a_completer: "bg-amber-100 text-amber-800", rejete: "bg-red-100 text-red-800", rejetee: "bg-red-100 text-red-800",
  regroupe: "bg-purple-100 text-purple-800", archivee: "bg-slate-200 text-slate-600",
  critique: "bg-red-100 text-red-800", haute: "bg-orange-100 text-orange-800", moyenne: "bg-yellow-100 text-yellow-800", basse: "bg-slate-100 text-slate-700",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tone ?? ""] ?? "bg-slate-100 text-slate-700"}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const label = (NEED_STATUS as Record<string, string>)[status] ?? (STRUCTURE_STATUS as Record<string, string>)[status] ?? status;
  return <Badge tone={status}>{label}</Badge>;
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-brand-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Progress({ pct }: { pct: number }) {
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-flag-red";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  const c = { info: "border-brand-100 bg-brand-50 text-brand-900", warn: "border-amber-200 bg-amber-50 text-amber-900", error: "border-red-200 bg-red-50 text-red-900", ok: "border-emerald-200 bg-emerald-50 text-emerald-900" }[tone];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export function Tabs({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 text-sm" aria-label="Sous-navigation">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`-mb-px border-b-2 px-3 py-2 ${current === i.href ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
