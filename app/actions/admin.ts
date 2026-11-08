"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, hashPassword } from "@/lib/auth";
import {
  audit, createUser, deleteNeedDoc, findUserByEmail, getNeed, getSettings, getStructure, getUser, listNeeds, listStructures,
  listUsers, newId, newRef, nowIso, saveNeed, saveSettings, saveStructure, saveUser,
} from "@/lib/db";
import { store } from "@/lib/store";
import { classifyNeed, llmEnabled } from "@/lib/ai";
import { ADMIN_TYPES, CATEGORIES, PRIORITIES, PROVINCES, ROLES } from "@/lib/referentials";
import { computeTotal, normalizePhone, passwordIssues, RX, toUsd } from "@/lib/rules";
import { bool, num, str, type ActionState } from "@/lib/form";
import type { Need, NeedStatus, Role, Structure, StructureStatus, User } from "@/lib/types";
import { randomBytes } from "crypto";

/* ---------- Validation (EF-ADM-02/03) ---------- */
export async function reviewStructureAction(fd: FormData) {
  const u = await requireRole("analyste", "admin");
  const s = await getStructure(str(fd, "id", 40));
  if (!s) return;
  const decision = str(fd, "decision", 20) as StructureStatus;
  if (!["validee", "rejetee", "a_completer", "archivee"].includes(decision)) return;
  const comment = str(fd, "comment", 1000);
  if (decision !== "validee" && !comment) redirect(`/admin/validation?err=motif`);
  const next = { ...s, status: decision, reviewComment: comment, isNewRequest: decision === "validee" ? false : s.isNewRequest, updatedAt: nowIso() };
  await saveStructure(next);
  await audit({ userId: u.id, email: u.email, action: `structure.${decision}`, object: s.id, before: { status: s.status }, after: { status: decision, comment } });
  revalidatePath("/admin/validation");
}

export async function reviewNeedAction(fd: FormData) {
  const u = await requireRole("analyste", "admin");
  const n = await getNeed(str(fd, "id", 40));
  if (!n) return;
  const decision = str(fd, "decision", 20) as NeedStatus;
  if (!["valide", "rejete", "a_completer", "en_revue"].includes(decision)) return;
  const comment = str(fd, "comment", 1000);
  if ((decision === "rejete" || decision === "a_completer") && !comment) redirect(`/admin/validation?err=motif`);
  const categoryCode = str(fd, "categoryCode", 5);
  const internalNote = str(fd, "internalNote", 2000);
  const next: Need = {
    ...n, status: decision, reviewComment: comment || n.reviewComment, internalNote: internalNote || n.internalNote, updatedAt: nowIso(),
  };
  if (categoryCode && categoryCode !== n.categoryCode && CATEGORIES.some((c) => c.code === categoryCode)) {
    next.categoryCode = categoryCode;
    if (next.ai) next.ai = { ...next.ai, decision: next.ai.category === categoryCode ? "accepted" : "corrected", decidedBy: u.id };
  }
  await saveNeed(next);
  await audit({ userId: u.id, email: u.email, action: `besoin.${decision}`, object: n.id, before: { status: n.status, categoryCode: n.categoryCode }, after: { status: decision, categoryCode: next.categoryCode, comment } });
  revalidatePath("/admin/validation");
}

/** EF-ADM-04 : validation par lot. */
export async function bulkValidateAction(fd: FormData) {
  const u = await requireRole("analyste", "admin");
  const ids = fd.getAll("ids").map(String).slice(0, 500);
  for (const id of ids) {
    const n = await getNeed(id);
    if (n && ["soumis", "en_revue"].includes(n.status)) {
      await saveNeed({ ...n, status: "valide", updatedAt: nowIso() });
      await audit({ userId: u.id, email: u.email, action: "besoin.valide.lot", object: id });
    }
  }
  revalidatePath("/admin/validation");
}

/* ---------- IA (EF-IA-01, EF-IA-11, RG8) ---------- */
export async function runAiAction(fd: FormData) {
  const u = await requireRole("analyste", "admin");
  const onlyMissing = bool(fd, "onlyMissing");
  const needs = (await listNeeds()).filter((n) => ["soumis", "en_revue", "valide"].includes(n.status));
  const todo = needs.filter((n) => !onlyMissing || !n.ai || n.ai.engine !== (llmEnabled() ? "llm" : "local")).slice(0, 60);
  const CONC = 6;
  for (let i = 0; i < todo.length; i += CONC) {
    await Promise.all(
      todo.slice(i, i + CONC).map(async (n) => {
        const p = await classifyNeed(n.title, n.description);
        await saveNeed({ ...n, ai: { ...p, at: nowIso(), decision: null } });
      }),
    );
  }
  await audit({ userId: u.id, email: u.email, action: "ia.analyse", after: { count: todo.length, engine: llmEnabled() ? "llm" : "local" } });
  revalidatePath("/admin/ia");
  redirect(`/admin/ia?done=${todo.length}`);
}

export async function aiDecisionAction(fd: FormData) {
  const u = await requireRole("analyste", "admin");
  const n = await getNeed(str(fd, "id", 40));
  if (!n?.ai) return;
  const decision = str(fd, "decision", 20);
  const corrected = str(fd, "categoryCode", 5);
  const next = { ...n, ai: { ...n.ai, decidedBy: u.id } };
  if (decision === "accept") {
    next.categoryCode = n.ai.category;
    next.ai.decision = "accepted";
  } else if (decision === "correct" && CATEGORIES.some((c) => c.code === corrected)) {
    next.categoryCode = corrected;
    next.ai.decision = "corrected";
  } else if (decision === "reject") {
    next.ai.decision = "rejected";
  } else return;
  await saveNeed({ ...next, updatedAt: nowIso() });
  await audit({ userId: u.id, email: u.email, action: `ia.${next.ai.decision}`, object: n.id, before: { categoryCode: n.categoryCode }, after: { categoryCode: next.categoryCode, proposal: n.ai.category } });
  revalidatePath("/admin/ia");
}

/* ---------- Utilisateurs (EF-ADM-05, EF-AUT-12) ---------- */
export async function updateUserAction(fd: FormData) {
  const admin = await requireRole("admin");
  const target = await getUser(str(fd, "id", 40));
  if (!target) return;
  const role = str(fd, "role", 20) as Role;
  const status = str(fd, "status", 20) as User["status"];
  const structureId = str(fd, "structureId", 40) || null;
  if (target.id === admin.id && (role !== "admin" || status !== "active")) redirect("/admin/utilisateurs?err=self");
  if (!(role in ROLES) || !["active", "suspended", "pending"].includes(status)) return;
  if (structureId && !(await getStructure(structureId))) return;
  const next: User = {
    ...target, role, status, structureId,
    tokenVersion: role !== target.role || status !== target.status ? target.tokenVersion + 1 : target.tokenVersion, // révocation des sessions
    failedLogins: bool(fd, "unlock") ? 0 : target.failedLogins,
    lockedUntil: bool(fd, "unlock") ? null : target.lockedUntil,
  };
  await saveUser(next);
  await audit({ userId: admin.id, email: admin.email, action: "utilisateur.modification", object: target.id, before: { role: target.role, status: target.status, structureId: target.structureId }, after: { role, status, structureId } });
  revalidatePath("/admin/utilisateurs");
}

/** EF-EVT-09 : saisie assistée — création d'un compte par un agent pour un participant. */
export async function assistedAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireRole("admin", "analyste");
  const email = str(fd, "email", 200).toLowerCase();
  const role = (admin.role === "admin" ? str(fd, "role", 20) : "responsable") as Role;
  if (!RX.email.test(email)) return { error: "E-mail invalide." };
  if (!(role in ROLES)) return { error: "Rôle invalide." };
  if (await findUserByEmail(email)) return { error: "Un compte existe déjà avec cette adresse." };
  const temp = randomBytes(9).toString("base64url") + "!9a";
  const u: User = {
    id: newId(), email, passwordHash: await hashPassword(temp), role, status: "active", emailVerified: true, failedLogins: 0,
    tokenVersion: 1, createdAt: nowIso(), lastName: str(fd, "lastName", 100), firstName: str(fd, "firstName", 100),
    title: str(fd, "title", 150), phone: normalizePhone(str(fd, "phone", 30)),
  };
  if (!u.lastName || !u.firstName) return { error: "Nom et prénom obligatoires." };
  await createUser(u);
  await audit({ userId: admin.id, email: admin.email, action: "utilisateur.creation_assistee", object: u.id, after: { email, role } });
  revalidatePath("/admin/utilisateurs");
  return { ok: `Compte créé pour ${email}. Mot de passe provisoire (à communiquer en main propre, affiché une seule fois) :`, demoCode: temp };
}

/* ---------- Paramètres (EF-ADM-08, EF-PUB-04, EF-BES-25) ---------- */
export async function saveSettingsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireRole("admin");
  const prev = await getSettings();
  const rate = num(fd, "rateCdfPerUsd");
  const threshold = num(fd, "aiConfidenceThreshold");
  if (!rate || rate <= 0 || rate > 1e6) return { error: "Taux de change invalide." };
  if (threshold == null || threshold < 0 || threshold > 1) return { error: "Seuil de confiance entre 0 et 1." };
  const next = {
    ...prev,
    rateCdfPerUsd: rate,
    campaignName: str(fd, "campaignName", 200) || prev.campaignName,
    campaignStart: str(fd, "campaignStart", 10) || prev.campaignStart,
    campaignEnd: str(fd, "campaignEnd", 10) || prev.campaignEnd,
    publicCounters: bool(fd, "publicCounters"),
    campaignLocked: bool(fd, "campaignLocked"),
    aiConfidenceThreshold: threshold,
    infoBanner: str(fd, "infoBanner", 500),
  };
  await saveSettings(next);
  await audit({ userId: admin.id, email: admin.email, action: "parametres.modification", before: prev, after: next });
  revalidatePath("/", "layout");
  return { ok: "Paramètres enregistrés." };
}

export async function purgeDemoAction() {
  const admin = await requireRole("admin");
  const [needs, structures, users] = await Promise.all([listNeeds(), listStructures(), listUsers()]);
  let n = 0;
  for (const x of needs.filter((x) => x.demo)) { await deleteNeedDoc(x.id); n++; }
  for (const x of structures.filter((x) => x.demo)) { await store().del("structures", x.id); n++; }
  for (const x of users.filter((x) => x.demo)) { await store().del("users", x.id); n++; }
  await audit({ userId: admin.id, email: admin.email, action: "demo.purge", after: { count: n } });
  revalidatePath("/", "layout");
  redirect("/admin/parametres?purged=" + n);
}

/* ---------- Import de secours (EF-EVT-10 / EF-ANN-05) ---------- */
export async function importAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireRole("admin", "analyste");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez un fichier .xlsx." };
  if (file.size > 5 * 1024 * 1024) return { error: "Fichier trop volumineux (max 5 Mo)." };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "Format attendu : .xlsx (modèle RENUM)." };
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ArrayBuffer);
  } catch {
    return { error: "Fichier illisible." };
  }
  const ws = wb.getWorksheet("Saisie") ?? wb.worksheets[0];
  if (!ws) return { error: "Feuille « Saisie » introuvable." };
  const settings = await getSettings();
  const structures = await listStructures();
  const errors: string[] = [];
  let created = 0, createdStruct = 0;
  const cell = (r: number, c: number) => {
    const v = ws.getRow(r).getCell(c).value;
    if (v && typeof v === "object" && "text" in v) return String((v as { text: string }).text).trim();
    if (v && typeof v === "object" && "result" in v) return String((v as { result: unknown }).result ?? "").trim();
    return v == null ? "" : String(v).trim();
  };
  for (let r = 2; r <= Math.min(ws.rowCount, 2001); r++) {
    const name = cell(r, 1);
    if (!name) continue;
    const acronym = cell(r, 2), typeCode = cell(r, 3), province = cell(r, 4), city = cell(r, 5), email = cell(r, 6).toLowerCase();
    const title = cell(r, 7), categoryCode = cell(r, 8), description = cell(r, 9);
    const quantity = Number(cell(r, 10) || 1), unitCost = Number(cell(r, 11).replace(",", ".")), currency = cell(r, 12) === "CDF" ? "CDF" : "USD";
    const priority = cell(r, 13) || "moyenne";
    const e: string[] = [];
    if (!ADMIN_TYPES.some((t) => t.code === typeCode)) e.push("type");
    if (!(PROVINCES as readonly string[]).includes(province)) e.push("province");
    if (!city) e.push("ville");
    if (!RX.email.test(email)) e.push("e-mail");
    if (title && !CATEGORIES.some((c) => c.code === categoryCode)) e.push("catégorie");
    if (title && !(unitCost > 0)) e.push("coût");
    if (title && !PRIORITIES.some((p) => p.code === priority)) e.push("priorité");
    if (e.length) { errors.push(`Ligne ${r} : ${e.join(", ")} invalide(s)`); continue; }
    let s = structures.find((x) => x.name.toLowerCase() === name.toLowerCase() || (acronym && x.acronym?.toLowerCase() === acronym.toLowerCase()));
    if (!s) {
      s = { id: newId(), name, acronym, typeCode, province, city, email, status: "soumise", ownerId: null, createdAt: nowIso(), updatedAt: nowIso() } satisfies Structure;
      await saveStructure(s);
      structures.push(s);
      createdStruct++;
    }
    if (title) {
      const totalCost = computeTotal(Math.max(1, quantity || 1), unitCost);
      await saveNeed({
        id: newId(), ref: newRef("BES"), structureId: s.id, authorId: admin.id, title: title.slice(0, 120), categoryCode, description: description.slice(0, 5000),
        quantity: Math.max(1, quantity || 1), unitCost, totalCost, currency, priority, status: "soumis", rateApplied: settings.rateCdfPerUsd,
        amountUsd: toUsd(totalCost, currency, settings.rateCdfPerUsd), submittedAt: nowIso(), createdAt: nowIso(), updatedAt: nowIso(),
        internalNote: "Import du formulaire de secours",
      });
      created++;
    }
  }
  await audit({ userId: admin.id, email: admin.email, action: "import.secours", after: { structures: createdStruct, besoins: created, erreurs: errors.length } });
  revalidatePath("/", "layout");
  return {
    ok: `${createdStruct} structure(s) et ${created} besoin(s) importés.`,
    error: errors.length ? `${errors.length} ligne(s) rejetée(s) : ${errors.slice(0, 20).join(" ; ")}` : undefined,
  };
}

