// Règles de gestion pures (testées unitairement) — sans dépendance serveur.
import type { Need, Structure, User } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** RG5 / EF-BES-06 : coût total = quantité × coût unitaire (sauf montant global justifié). */
export function computeTotal(quantity: number, unitCost: number, override?: number | null): number {
  if (override != null && override > 0) return round2(override);
  return round2(Math.max(0, quantity) * Math.max(0, unitCost));
}

/** Conversion vers la devise de référence (USD) avec le taux figé. */
export function toUsd(amount: number, currency: "USD" | "CDF", rateCdfPerUsd: number): number {
  if (currency === "USD") return round2(amount);
  if (!rateCdfPerUsd || rateCdfPerUsd <= 0) throw new Error("Taux de change invalide");
  return round2(amount / rateCdfPerUsd);
}

/** Montant consolidé USD : taux figé si soumis, sinon taux courant. */
export function needUsd(n: Pick<Need, "totalCost" | "currency" | "amountUsd" | "rateApplied">, currentRate: number) {
  if (n.amountUsd != null) return n.amountUsd;
  return toUsd(n.totalCost, n.currency, n.rateApplied ?? currentRate);
}

export const STRUCTURE_REQUIRED: (keyof Structure)[] = ["typeCode", "name", "province", "city", "email"];
export const STRUCTURE_RECOMMENDED: (keyof Structure)[] = ["acronym", "tutelle", "address", "phone", "staff"];
export const PROFILE_REQUIRED: (keyof User)[] = ["lastName", "firstName", "title", "email", "phone", "postStatus", "consentPublish"];
export const PROFILE_RECOMMENDED: (keyof User)[] = ["department", "startDate", "itTeamSize", "postName"];

const filled = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== false;

/** EF-ANN-03 : complétude (%) et champs manquants. */
export function completeness<T extends object>(obj: T, required: (keyof T)[], recommended: (keyof T)[]) {
  const missingRequired = required.filter((k) => !filled(obj[k]));
  const missingRecommended = recommended.filter((k) => !filled(obj[k]));
  const total = required.length + recommended.length;
  const ok = total - missingRequired.length - missingRecommended.length;
  return { pct: Math.round((ok / total) * 100), missingRequired, missingRecommended, complete: missingRequired.length === 0 };
}

/** RG3 : un besoin ne peut être soumis que si ses champs obligatoires sont remplis et la structure complète. */
export function needSubmittable(n: Need): string[] {
  const errs: string[] = [];
  if (!n.title?.trim()) errs.push("Intitulé manquant");
  if (n.title && n.title.length > 120) errs.push("Intitulé > 120 caractères");
  if (!n.categoryCode) errs.push("Catégorie manquante");
  if (n.categoryCode === "B12" && !n.otherCategory?.trim()) errs.push("Précisez la catégorie « Autre »");
  if (!n.description || n.description.trim().length < 30) errs.push("Description < 30 caractères");
  if (!(n.quantity >= 1)) errs.push("Quantité ≥ 1 requise");
  if (!(n.unitCost > 0) && !(n.totalCost > 0)) errs.push("Coût unitaire > 0 requis");
  if (!n.priority) errs.push("Priorité manquante");
  if (!n.currency) errs.push("Devise manquante");
  return errs;
}

/** RG4 : modifiable par le responsable seulement avant validation. */
export const NEED_EDITABLE = new Set(["brouillon", "a_completer"]);

/** EF-ANN-04 : contrôles de format. */
export const RX = {
  email: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/,
  phoneCd: /^\+243\d{9}$/,
  url: /^https?:\/\/[^\s<>"]+\.[^\s<>"]{2,}/i,
};

export function normalizePhone(v?: string | null): string {
  if (!v) return "";
  let s = v.replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0\d{9}$/.test(s)) s = "+243" + s.slice(1);
  if (/^243\d{9}$/.test(s)) s = "+" + s;
  return s;
}

export function institutionalEmailWarning(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const generic = ["gmail.com", "yahoo.com", "yahoo.fr", "hotmail.com", "outlook.com", "live.com", "icloud.com", "proton.me"];
  return generic.includes(domain) ? "Adresse hors domaine institutionnel : privilégiez une adresse officielle." : null;
}

/** Politique de mot de passe (EF-AUT-03). */
export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 10) issues.push("au moins 10 caractères");
  if (!/[a-z]/.test(pw)) issues.push("une minuscule");
  if (!/[A-Z]/.test(pw)) issues.push("une majuscule");
  if (!/\d/.test(pw)) issues.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("un caractère spécial");
  return issues;
}

/** Normalisation pour détection de doublons (EF-STR-02 / RG6). */
export function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(de|du|des|la|le|les|l|d|et)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a: string, b: string): number {
  const A = new Set(normName(a).split(" ").filter(Boolean));
  const B = new Set(normName(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Neutralise l'injection de formules dans les exports tableur (CSV/Excel). */
export function safeCell(v: unknown): string | number | boolean | null {
  if (v == null) return null;
  if (typeof v === "number" || typeof v === "boolean") return v;
  const s = String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function toCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const esc = (v: unknown) => {
    const s = String(safeCell(v) ?? "");
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map((h) => esc(h.label)).join(";")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h.key])).join(";"));
  return "﻿" + lines.join("\r\n");
}

/** Anomalie de coût (EF-IA-06 – version simple) : hors [Q1 - 3·IQR ; Q3 + 3·IQR] de la catégorie. */
export function costOutliers(values: { id: string; v: number }[]): Set<string> {
  if (values.length < 5) return new Set();
  const s = [...values].sort((a, b) => a.v - b.v).map((x) => x.v);
  const q = (p: number) => {
    const idx = (s.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return s[lo] + (s[hi] - s[lo]) * (idx - lo);
  };
  const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
  return new Set(values.filter((x) => x.v > q3 + 3 * iqr || x.v < q1 - 3 * iqr).map((x) => x.id));
}
