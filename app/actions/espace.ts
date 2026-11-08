"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  audit, getNeed, getSettings, getStructure, listStructures, needsOfStructure, newId, newRef, nowIso, saveNeed,
  saveStructure, saveSubmission, saveUser, deleteNeedDoc,
} from "@/lib/db";
import { ADMIN_TYPES, CATEGORIES, COST_NATURES, HORIZONS, PRIORITIES, PROVINCES, POST_STATUS } from "@/lib/referentials";
import {
  completeness, computeTotal, NEED_EDITABLE, needSubmittable, normalizePhone, PROFILE_RECOMMENDED, PROFILE_REQUIRED, RX,
  similarity, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED, toUsd,
} from "@/lib/rules";
import { classifyLocal } from "@/lib/ai-local";
import { bool, num, str, type ActionState } from "@/lib/form";
import type { Need, Structure } from "@/lib/types";

const inList = (v: string, list: readonly { code: string }[]) => list.some((x) => x.code === v);

/** EF-STR-* : fiche structure (création ou mise à jour par son responsable). */
export async function saveStructureAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("responsable", "delegue", "admin");
  if (u.role === "delegue") return { error: "Seul le responsable peut modifier la fiche structure." };
  const existing = u.structureId ? await getStructure(u.structureId) : null;
  if (existing && ["validee", "archivee"].includes(existing.status) && u.role !== "admin") {
    return { error: "La fiche est validée : contactez la cellule d'analyse pour toute modification." };
  }
  const s: Structure = {
    id: existing?.id ?? newId(),
    name: str(fd, "name", 200),
    acronym: str(fd, "acronym", 30),
    typeCode: str(fd, "typeCode", 5),
    tutelle: str(fd, "tutelle", 200),
    province: str(fd, "province", 50),
    city: str(fd, "city", 100),
    address: str(fd, "address", 300),
    email: str(fd, "email", 200).toLowerCase(),
    phone: normalizePhone(str(fd, "phone", 30)),
    website: str(fd, "website", 200),
    staff: num(fd, "staff"),
    sites: num(fd, "sites"),
    itUsers: num(fd, "itUsers"),
    status: existing?.status ?? "brouillon",
    ownerId: existing?.ownerId ?? u.id,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    isNewRequest: existing?.isNewRequest,
  };
  if (!s.name || !s.typeCode || !s.province || !s.city || !s.email) return { error: "Champs obligatoires manquants (type, nom, province, ville, e-mail)." };
  if (!inList(s.typeCode, ADMIN_TYPES)) return { error: "Type d'administration invalide." };
  if (!(PROVINCES as readonly string[]).includes(s.province)) return { error: "Province invalide." };
  if (!RX.email.test(s.email)) return { error: "E-mail institutionnel invalide." };
  if (s.phone && !RX.phoneCd.test(s.phone)) return { error: "Téléphone : format attendu +243XXXXXXXXX." };
  if (s.website && !RX.url.test(s.website)) return { error: "Site web : URL invalide (https://…)." };
  for (const k of ["staff", "sites", "itUsers"] as const) if (s[k] != null && (s[k]! < 0 || s[k]! > 10_000_000)) return { error: "Valeur numérique invalide." };

  // RG6 / EF-STR-07 : détection de doublons — la création est marquée « demande » à valider
  if (!existing) {
    const all = await listStructures();
    const dup = all.find(
      (o) => o.status !== "archivee" && (similarity(o.name, s.name) >= 0.8 || (s.acronym && o.acronym?.toLowerCase() === s.acronym.toLowerCase()) || o.email === s.email),
    );
    if (dup && !bool(fd, "confirmDuplicate")) {
      return { error: `Une structure proche existe déjà : « ${dup.name}${dup.acronym ? ` (${dup.acronym})` : ""} ». Si c'est bien une autre structure, cochez la confirmation ; la demande sera vérifiée par un analyste.`, fields: { duplicate: "1" } };
    }
    s.isNewRequest = Boolean(dup);
  }
  if (s.status === "a_completer") s.status = "brouillon";
  await saveStructure(s);
  if (!u.structureId) await saveUser({ ...u, structureId: s.id });
  await audit({ userId: u.id, email: u.email, action: existing ? "structure.modification" : "structure.creation", object: s.id, before: existing ?? undefined, after: s });
  revalidatePath("/espace");
  const c = completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED);
  return { ok: `Fiche structure enregistrée (complétude ${c.pct} %).` };
}

/** EF-RSP-* : fiche du responsable numérique. */
export async function saveProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole();
  const phone = normalizePhone(str(fd, "phone", 30));
  const whatsapp = normalizePhone(str(fd, "whatsapp", 30));
  const postStatus = str(fd, "postStatus", 20);
  const next = {
    ...u,
    civility: str(fd, "civility", 5),
    lastName: str(fd, "lastName", 100),
    postName: str(fd, "postName", 100),
    firstName: str(fd, "firstName", 100),
    title: str(fd, "title", 150),
    department: str(fd, "department", 200),
    startDate: str(fd, "startDate", 10),
    phone,
    whatsapp,
    postStatus,
    itTeamSize: num(fd, "itTeamSize"),
    deputyName: str(fd, "deputyName", 150),
    deputyContact: str(fd, "deputyContact", 150),
    consentPublish: bool(fd, "consentPublish"),
  };
  if (!next.lastName || !next.firstName || !next.title) return { error: "Nom, prénom et fonction sont obligatoires." };
  if (phone && !RX.phoneCd.test(phone)) return { error: "Téléphone : format attendu +243XXXXXXXXX." };
  if (whatsapp && !RX.phoneCd.test(whatsapp) && !/^\+\d{8,15}$/.test(whatsapp)) return { error: "WhatsApp : format international attendu." };
  if (postStatus && !inList(postStatus, POST_STATUS)) return { error: "Statut du poste invalide." };
  if (next.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(next.startDate)) return { error: "Date invalide." };
  if (next.consentPublish && !u.consentPublish) next.consentAt = nowIso();
  await saveUser(next);
  await audit({ userId: u.id, email: u.email, action: "profil.modification" });
  revalidatePath("/espace");
  const c = completeness(next, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  return { ok: `Fiche responsable enregistrée (complétude ${c.pct} %).` };
}

async function ownStructureOrFail(userStructureId?: string | null) {
  if (!userStructureId) return null;
  return getStructure(userStructureId);
}

/** EF-BES-01..16 : création / mise à jour d'un besoin (brouillon). */
export async function saveNeedAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("responsable", "delegue", "admin");
  const s = await ownStructureOrFail(u.structureId);
  if (!s) return { error: "Renseignez d'abord la fiche de votre structure." };
  const settings = await getSettings();
  if (settings.campaignLocked) return { error: "La campagne de collecte est clôturée." };
  const id = str(fd, "id", 40);
  const prev = id ? await getNeed(id) : null;
  if (prev && prev.structureId !== s.id) return { error: "Accès refusé." }; // contrôle d'accès objet (IDOR)
  if (prev && !NEED_EDITABLE.has(prev.status)) return { error: "Ce besoin n'est plus modifiable (déjà soumis ou validé)." };

  const quantity = Math.max(0, Math.floor(num(fd, "quantity") ?? 1));
  const unitCost = Math.max(0, num(fd, "unitCost") ?? 0);
  const override = num(fd, "totalOverride");
  const currency = str(fd, "currency", 3) === "CDF" ? "CDF" : "USD";
  const categoryCode = str(fd, "categoryCode", 5);
  const priority = str(fd, "priority", 10);
  const costNature = str(fd, "costNature", 20);
  const horizon = str(fd, "horizon", 10);
  if (categoryCode && !inList(categoryCode, CATEGORIES)) return { error: "Catégorie invalide." };
  if (priority && !inList(priority, PRIORITIES)) return { error: "Priorité invalide." };
  if (costNature && !inList(costNature, COST_NATURES)) return { error: "Nature du coût invalide." };
  if (horizon && !inList(horizon, HORIZONS)) return { error: "Échéance invalide." };
  if (unitCost > 1e12 || (override ?? 0) > 1e13 || quantity > 1e7) return { error: "Montant ou quantité hors limites." };

  const title = str(fd, "title", 120);
  const description = str(fd, "description", 5000);
  const n: Need = {
    id: prev?.id ?? newId(),
    ref: prev?.ref ?? newRef("BES"),
    structureId: s.id,
    authorId: prev?.authorId ?? u.id,
    title,
    categoryCode: categoryCode || "B12",
    subcategory: str(fd, "subcategory", 120),
    otherCategory: str(fd, "otherCategory", 120),
    description,
    justification: str(fd, "justification", 3000),
    quantity: quantity || 1,
    unitCost,
    totalCost: computeTotal(quantity || 1, unitCost, override),
    totalOverrideReason: override ? str(fd, "totalOverrideReason", 300) : "",
    currency,
    costNature,
    priority: priority || "moyenne",
    horizon,
    beneficiaries: num(fd, "beneficiaries"),
    mutualisable: bool(fd, "mutualisable"),
    status: prev?.status ?? "brouillon",
    reviewComment: prev?.reviewComment,
    internalNote: prev?.internalNote,
    ai: prev?.ai,
    createdAt: prev?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  if (override && !n.totalOverrideReason) return { error: "Justifiez le montant global saisi." };
  if (!title) return { error: "L'intitulé est obligatoire." };
  // Suggestion de catégorie locale à chaque enregistrement (affichée au responsable, EF-IA-02)
  if (title.length + description.length > 15) {
    const p = classifyLocal(`${title}. ${description}`);
    n.ai = { ...p, at: nowIso(), decision: null };
  }
  await saveNeed(n);
  await audit({ userId: u.id, email: u.email, action: prev ? "besoin.modification" : "besoin.creation", object: n.id, before: prev ?? undefined, after: n });
  revalidatePath("/espace/besoins");
  const missing = needSubmittable(n);
  if (bool(fd, "finish")) redirect(`/espace/besoins?saved=${n.id}`);
  return { ok: missing.length ? `Brouillon enregistré. À compléter : ${missing.join(", ")}.` : "Brouillon enregistré — prêt pour la soumission.", fields: { id: n.id } };
}

export async function deleteNeedAction(fd: FormData) {
  const u = await requireRole("responsable", "delegue", "admin");
  const n = await getNeed(str(fd, "id", 40));
  if (!n || n.structureId !== u.structureId || !NEED_EDITABLE.has(n.status)) redirect("/espace/besoins");
  if (n.status !== "brouillon") redirect("/espace/besoins"); // RG7 : seul un brouillon non soumis est supprimé physiquement
  await deleteNeedDoc(n.id);
  await audit({ userId: u.id, email: u.email, action: "besoin.suppression", object: n.id, before: n });
  revalidatePath("/espace/besoins");
  redirect("/espace/besoins");
}

export async function duplicateNeedAction(fd: FormData) {
  const u = await requireRole("responsable", "delegue", "admin");
  const n = await getNeed(str(fd, "id", 40));
  if (!n || n.structureId !== u.structureId) redirect("/espace/besoins");
  const copy: Need = {
    ...n, id: newId(), ref: newRef("BES"), title: `${n.title} (copie)`.slice(0, 120), status: "brouillon", authorId: u.id,
    submittedAt: null, rateApplied: null, amountUsd: null, reviewComment: "", internalNote: "", createdAt: nowIso(), updatedAt: nowIso(),
  };
  await saveNeed(copy);
  await audit({ userId: u.id, email: u.email, action: "besoin.duplication", object: copy.id });
  redirect(`/espace/besoins/${copy.id}`);
}

/** EF-BES-17..19 : soumission définitive avec déclaration et accusé de réception. */
export async function submitAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await requireRole("responsable", "admin");
  const s = await ownStructureOrFail(u.structureId);
  if (!s) return { error: "Fiche structure manquante." };
  const settings = await getSettings();
  if (settings.campaignLocked) return { error: "La campagne de collecte est clôturée." };
  if (!bool(fd, "certify") || !bool(fd, "consentAnalysis")) return { error: "Cochez la déclaration d'exactitude et le consentement." };
  const sc = completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED);
  if (!sc.complete) return { error: "La fiche structure est incomplète (RG3)." };
  const pc = completeness(u, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  if (!pc.complete) return { error: "Votre fiche responsable est incomplète (dont le consentement de publication)." };
  const needs = (await needsOfStructure(s.id)).filter((n) => NEED_EDITABLE.has(n.status));
  if (!needs.length) return { error: "Aucun besoin à soumettre." };
  const invalid = needs.map((n) => ({ n, e: needSubmittable(n) })).filter((x) => x.e.length);
  if (invalid.length) return { error: `Besoins incomplets : ${invalid.map((x) => `« ${x.n.title || x.n.ref} » (${x.e.join(", ")})`).join(" ; ")}` };

  const at = nowIso();
  let totalUsd = 0;
  for (const n of needs) {
    const amountUsd = toUsd(n.totalCost, n.currency, settings.rateCdfPerUsd);
    totalUsd += amountUsd;
    await saveNeed({ ...n, status: "soumis", submittedAt: at, rateApplied: settings.rateCdfPerUsd, amountUsd, updatedAt: at });
  }
  if (["brouillon", "a_completer"].includes(s.status)) await saveStructure({ ...s, status: "soumise", updatedAt: at });
  const sub = { id: newId(), ref: newRef("RENUM"), structureId: s.id, userId: u.id, needIds: needs.map((n) => n.id), totalUsd: Math.round(totalUsd * 100) / 100, at };
  await saveSubmission(sub);
  await audit({ userId: u.id, email: u.email, action: "soumission", object: sub.id, after: { ref: sub.ref, needs: sub.needIds.length, totalUsd: sub.totalUsd } });
  revalidatePath("/espace");
  redirect(`/espace/accuse/${sub.id}`);
}
