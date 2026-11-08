import { apiUser, canSeeDashboard } from "@/lib/auth";
import { audit, getSettings, listNeeds, listStructures, listUsers } from "@/lib/db";
import { ADMIN_TYPES, CATEGORIES, HORIZONS, label, NEED_STATUS, PRIORITIES, ROLES, STRUCTURE_STATUS } from "@/lib/referentials";
import { needUsd, safeCell, toCsv } from "@/lib/rules";
import { applyFilters, readFilters } from "@/lib/stats";

type Col = { key: string; label: string; desc: string };

const NEED_COLS: Col[] = [
  { key: "ref", label: "Référence", desc: "Identifiant unique du besoin" },
  { key: "structure", label: "Structure", desc: "Nom officiel" },
  { key: "acronym", label: "Sigle", desc: "Sigle de la structure" },
  { key: "type", label: "Type d'administration", desc: "Annexe A" },
  { key: "province", label: "Province", desc: "Province de la structure" },
  { key: "title", label: "Intitulé", desc: "Intitulé du besoin" },
  { key: "category", label: "Catégorie", desc: "Annexe B" },
  { key: "subcategory", label: "Sous-catégorie", desc: "Texte libre" },
  { key: "description", label: "Description", desc: "Texte libre" },
  { key: "quantity", label: "Quantité", desc: "Nombre d'unités" },
  { key: "unitCost", label: "Coût unitaire", desc: "Dans la devise saisie" },
  { key: "totalCost", label: "Coût total", desc: "Quantité × coût unitaire (ou montant global justifié)" },
  { key: "currency", label: "Devise", desc: "USD ou CDF" },
  { key: "rate", label: "Taux appliqué (CDF/USD)", desc: "Figé à la soumission" },
  { key: "usd", label: "Montant USD", desc: "Montant consolidé en devise de référence" },
  { key: "nature", label: "Nature du coût", desc: "Investissement / fonctionnement" },
  { key: "priority", label: "Priorité", desc: "Critique, haute, moyenne, basse" },
  { key: "horizon", label: "Échéance", desc: "Horizon souhaité" },
  { key: "mutualisable", label: "Mutualisable", desc: "Accord de regroupement" },
  { key: "status", label: "Statut", desc: "Cycle de vie du besoin" },
  { key: "submittedAt", label: "Date de soumission", desc: "ISO 8601 (UTC)" },
  { key: "aiCategory", label: "Catégorie proposée (IA)", desc: "Proposition automatique non contraignante" },
  { key: "aiConfidence", label: "Confiance IA", desc: "0 à 1" },
];

const DIR_COLS: Col[] = [
  { key: "structure", label: "Structure", desc: "" }, { key: "acronym", label: "Sigle", desc: "" }, { key: "type", label: "Type", desc: "" },
  { key: "province", label: "Province", desc: "" }, { key: "city", label: "Ville", desc: "" }, { key: "status", label: "Statut fiche", desc: "" },
  { key: "structEmail", label: "E-mail structure", desc: "" }, { key: "responsable", label: "Responsable", desc: "" }, { key: "title", label: "Fonction", desc: "" },
  { key: "email", label: "E-mail responsable", desc: "Masqué sans consentement" }, { key: "phone", label: "Téléphone", desc: "Masqué sans consentement" },
];

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const u = await apiUser();
  if (!u) return new Response("Non authentifié", { status: 401 });
  const { kind } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const mine = url.searchParams.get("scope") === "mine";
  // RBAC (EF-RAP-04/05) : responsables limités à leur structure
  if (!canSeeDashboard(u.role) && !(mine && u.structureId)) return new Response("Accès refusé", { status: 403 });

  const [needs, structures, users, settings] = await Promise.all([listNeeds(), listStructures(), listUsers(), getSettings()]);
  const byId = new Map(structures.map((s) => [s.id, s]));
  let rows: Record<string, unknown>[];
  let cols: Col[];
  let name: string;

  if (kind === "needs") {
    let list = mine ? needs.filter((n) => n.structureId === u.structureId) : applyFilters(needs, byId, readFilters(Object.fromEntries(url.searchParams)), settings.rateCdfPerUsd);
    if (u.role === "decideur") list = list.filter((n) => n.status !== "brouillon");
    cols = NEED_COLS;
    name = "besoins";
    rows = list.map((n) => {
      const s = byId.get(n.structureId);
      return {
        ref: n.ref, structure: s?.name, acronym: s?.acronym, type: label(ADMIN_TYPES, s?.typeCode), province: s?.province, title: n.title,
        category: label(CATEGORIES, n.categoryCode), subcategory: n.subcategory, description: n.description, quantity: n.quantity, unitCost: n.unitCost,
        totalCost: n.totalCost, currency: n.currency, rate: n.rateApplied, usd: needUsd(n, settings.rateCdfPerUsd), nature: n.costNature,
        priority: label(PRIORITIES, n.priority), horizon: label(HORIZONS, n.horizon), mutualisable: n.mutualisable ? "Oui" : "Non",
        status: NEED_STATUS[n.status], submittedAt: n.submittedAt, aiCategory: n.ai ? label(CATEGORIES, n.ai.category) : "", aiConfidence: n.ai?.confidence,
      };
    });
  } else if (kind === "annuaire") {
    if (mine) return new Response("Accès refusé", { status: 403 });
    cols = DIR_COLS;
    name = "annuaire";
    rows = structures.filter((s) => s.status !== "archivee").map((s) => {
      const r = users.find((x) => x.structureId === s.id && x.role === "responsable");
      const show = Boolean(r?.consentPublish) || u.role === "admin";
      return {
        structure: s.name, acronym: s.acronym, type: label(ADMIN_TYPES, s.typeCode), province: s.province, city: s.city, status: STRUCTURE_STATUS[s.status],
        structEmail: s.email, responsable: r ? `${r.civility ?? ""} ${r.firstName} ${r.lastName}`.trim() : "", title: r?.title,
        email: show ? r?.email : "(non publié)", phone: show ? r?.phone : "(non publié)",
      };
    });
  } else if (kind === "users" && u.role === "admin") {
    cols = [{ key: "email", label: "E-mail", desc: "" }, { key: "name", label: "Nom", desc: "" }, { key: "role", label: "Rôle", desc: "" }, { key: "status", label: "Statut", desc: "" }, { key: "createdAt", label: "Création", desc: "" }];
    name = "utilisateurs";
    rows = users.map((x) => ({ email: x.email, name: `${x.firstName} ${x.lastName}`, role: ROLES[x.role], status: x.status, createdAt: x.createdAt }));
  } else return new Response("Introuvable", { status: 404 });

  await audit({ userId: u.id, email: u.email, action: `export.${kind}`, after: { format, rows: rows.length, scope: mine ? "structure" : "global" } });
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    return new Response(toCsv(rows, cols), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="renum-${name}-${stamp}.csv"`, "Cache-Control": "private, no-store" } });
  }
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "RENUM";
  const ws = wb.addWorksheet("Données");
  ws.columns = cols.map((c) => ({ header: c.label, key: c.key, width: Math.min(50, Math.max(12, c.label.length + 4)) }));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) ws.addRow(Object.fromEntries(cols.map((c) => [c.key, safeCell(r[c.key])])));
  const dict = wb.addWorksheet("Dictionnaire");
  dict.columns = [{ header: "Colonne", key: "c", width: 30 }, { header: "Description", key: "d", width: 70 }];
  dict.getRow(1).font = { bold: true };
  for (const c of cols) dict.addRow({ c: c.label, d: c.desc });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buf), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="renum-${name}-${stamp}.xlsx"`, "Cache-Control": "private, no-store" },
  });
}
