import "server-only";
import { ADMIN_TYPES, CATEGORIES, PRIORITIES } from "./referentials";
import { getSettings, listNeeds, listStructures, listUsers } from "./db";
import { needUsd } from "./rules";
import type { Need, Structure } from "./types";

export interface Filters {
  type?: string;
  province?: string;
  category?: string;
  priority?: string;
  status?: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  q?: string;
}

export interface Bucket { key: string; label: string; count: number; amount: number }
export interface Stats {
  structures: number;
  responsables: number;
  needs: number;
  totalUsd: number;
  avgPerStructure: number;
  criticalShare: number;
  byCategory: Bucket[];
  byType: Bucket[];
  byProvince: Bucket[];
  byPriority: Bucket[];
  byNature: Bucket[];
  timeline: { date: string; structures: number; needs: number }[];
  topCritical: { id: string; ref: string; title: string; structure: string; amountUsd: number; priority: string }[];
  topCostly: { id: string; ref: string; title: string; structure: string; amountUsd: number; priority: string }[];
  latest: { name: string; province: string; at: string }[];
}

/** Besoins pris en compte dans les statistiques : soumis et au-delà (pas les brouillons ni les rejetés). */
const COUNTED = new Set(["soumis", "en_revue", "valide", "a_completer", "regroupe"]);

export async function loadData() {
  const [needs, structures, users, settings] = await Promise.all([listNeeds(), listStructures(), listUsers(), getSettings()]);
  return { needs, structures, users, settings };
}

export function applyFilters(needs: Need[], structures: Map<string, Structure>, f: Filters, rate: number) {
  return needs.filter((n) => {
    const s = structures.get(n.structureId);
    if (!s) return false;
    if (f.status ? n.status !== f.status : !COUNTED.has(n.status)) return false;
    if (f.type && s.typeCode !== f.type) return false;
    if (f.province && s.province !== f.province) return false;
    if (f.category && n.categoryCode !== f.category) return false;
    if (f.priority && n.priority !== f.priority) return false;
    const day = (n.submittedAt ?? n.createdAt).slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    const usd = needUsd(n, rate);
    if (f.min && usd < Number(f.min)) return false;
    if (f.max && usd > Number(f.max)) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!`${n.title} ${n.description} ${s.name} ${s.acronym ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function bucket<T>(items: T[], keyOf: (t: T) => string, amountOf: (t: T) => number, labelOf: (k: string) => string): Bucket[] {
  const m = new Map<string, Bucket>();
  for (const it of items) {
    const k = keyOf(it) || "—";
    const b = m.get(k) ?? { key: k, label: labelOf(k), count: 0, amount: 0 };
    b.count++;
    b.amount += amountOf(it);
    m.set(k, b);
  }
  return [...m.values()].sort((a, b) => b.amount - a.amount || b.count - a.count);
}

export async function computeStats(f: Filters = {}): Promise<Stats & { filtered: Need[]; structuresById: Map<string, Structure>; rate: number }> {
  const { needs, structures, users, settings } = await loadData();
  const rate = settings.rateCdfPerUsd;
  const active = structures.filter((s) => s.status !== "archivee" && s.status !== "rejetee");
  const byId = new Map(active.map((s) => [s.id, s]));
  const filtered = applyFilters(needs, byId, f, rate);
  const amt = (n: Need) => needUsd(n, rate);

  const structIds = new Set(filtered.map((n) => n.structureId));
  const structFilterActive = Boolean(f.type || f.province || f.category || f.priority || f.status || f.from || f.to || f.min || f.max || f.q);
  const structList = structFilterActive
    ? active.filter((s) => structIds.has(s.id))
    : active.filter((s) => (f.type ? s.typeCode === f.type : true));
  const totalUsd = filtered.reduce((a, n) => a + amt(n), 0);
  const label = (list: readonly { code: string; label: string }[]) => (k: string) => list.find((x) => x.code === k)?.label ?? k;

  const days = new Map<string, { structures: number; needs: number }>();
  for (const s of structList) {
    const d = s.createdAt.slice(0, 10);
    days.set(d, { structures: (days.get(d)?.structures ?? 0) + 1, needs: days.get(d)?.needs ?? 0 });
  }
  for (const n of filtered) {
    const d = (n.submittedAt ?? n.createdAt).slice(0, 10);
    days.set(d, { structures: days.get(d)?.structures ?? 0, needs: (days.get(d)?.needs ?? 0) + 1 });
  }
  let cs = 0, cn = 0;
  const timeline = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => {
    cs += v.structures; cn += v.needs;
    return { date, structures: cs, needs: cn };
  });

  const row = (n: Need) => ({
    id: n.id, ref: n.ref, title: n.title, priority: n.priority,
    structure: byId.get(n.structureId)?.acronym || byId.get(n.structureId)?.name || "—", amountUsd: amt(n),
  });
  const responsables = new Set(
    users.filter((u) => (u.role === "responsable" || u.role === "delegue") && u.structureId && byId.has(u.structureId)).map((u) => u.structureId),
  );

  return {
    structures: structList.length,
    responsables: structFilterActive ? [...responsables].filter((id) => structIds.has(id!)).length : responsables.size,
    needs: filtered.length,
    totalUsd,
    avgPerStructure: structIds.size ? totalUsd / structIds.size : 0,
    criticalShare: filtered.length ? filtered.filter((n) => n.priority === "critique").length / filtered.length : 0,
    byCategory: bucket(filtered, (n) => n.categoryCode, amt, label(CATEGORIES)),
    byType: bucket(filtered, (n) => byId.get(n.structureId)!.typeCode, amt, label(ADMIN_TYPES)),
    byProvince: bucket(filtered, (n) => byId.get(n.structureId)!.province, amt, (k) => k),
    byPriority: PRIORITIES.map((p) => {
      const items = filtered.filter((n) => n.priority === p.code);
      return { key: p.code, label: p.label, count: items.length, amount: items.reduce((a, n) => a + amt(n), 0) };
    }),
    byNature: bucket(filtered, (n) => n.costNature ?? "", amt, (k) => ({ investissement: "Investissement", fonctionnement: "Fonctionnement", mixte: "Mixte" })[k] ?? "Non précisé"),
    timeline,
    topCritical: filtered.filter((n) => n.priority === "critique").map(row).sort((a, b) => b.amountUsd - a.amountUsd).slice(0, 10),
    topCostly: filtered.map(row).sort((a, b) => b.amountUsd - a.amountUsd).slice(0, 10),
    latest: [...structList].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((s) => ({ name: s.acronym ? `${s.acronym} — ${s.name}` : s.name, province: s.province, at: s.createdAt })),
    filtered,
    structuresById: byId,
    rate,
  };
}

export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const keys: (keyof Filters)[] = ["type", "province", "category", "priority", "status", "from", "to", "min", "max", "q"];
  const f: Filters = {};
  for (const k of keys) {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s && s.length < 200) f[k] = s;
  }
  return f;
}
