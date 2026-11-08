import { ADMIN_TYPES, CATEGORIES, NEED_STATUS, PRIORITIES, PROVINCES } from "@/lib/referentials";
import type { Filters } from "@/lib/stats";

export function FilterBar({ f, action }: { f: Filters; action: string }) {
  return (
    <form action={action} className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-6" role="search">
      <select name="type" defaultValue={f.type ?? ""} className="select" aria-label="Type"><option value="">Tous types</option>{ADMIN_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
      <select name="province" defaultValue={f.province ?? ""} className="select" aria-label="Province"><option value="">Toutes provinces</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
      <select name="category" defaultValue={f.category ?? ""} className="select" aria-label="Catégorie"><option value="">Toutes catégories</option>{CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
      <select name="priority" defaultValue={f.priority ?? ""} className="select" aria-label="Priorité"><option value="">Toutes priorités</option>{PRIORITIES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}</select>
      <select name="status" defaultValue={f.status ?? ""} className="select" aria-label="Statut"><option value="">Soumis et validés</option>{Object.entries(NEED_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input name="q" defaultValue={f.q} className="input" placeholder="Recherche…" aria-label="Recherche" />
      <label className="text-xs text-slate-600">Du<input type="date" name="from" defaultValue={f.from} className="input" /></label>
      <label className="text-xs text-slate-600">Au<input type="date" name="to" defaultValue={f.to} className="input" /></label>
      <label className="text-xs text-slate-600">Min (USD)<input type="number" min={0} name="min" defaultValue={f.min} className="input" /></label>
      <label className="text-xs text-slate-600">Max (USD)<input type="number" min={0} name="max" defaultValue={f.max} className="input" /></label>
      <div className="flex items-end gap-2 sm:col-span-2"><button className="btn-primary flex-1">Filtrer</button><a href={action} className="btn-secondary">Réinitialiser</a></div>
    </form>
  );
}
