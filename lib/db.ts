import "server-only";
import { randomUUID, randomInt } from "crypto";
import { headers } from "next/headers";
import { store } from "./store";
import type { AuditEntry, Need, Settings, Structure, Submission, User } from "./types";

export const nowIso = () => new Date().toISOString();
export const newId = () => randomUUID().replace(/-/g, "");

export function newRef(prefix: string) {
  const y = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[randomInt(alphabet.length)];
  return `${prefix}-${y}-${s}`;
}

const DEFAULT_SETTINGS: Settings = {
  id: "global",
  rateCdfPerUsd: 2850,
  campaignName: "Journées des responsables numériques des administrations",
  campaignStart: new Date().toISOString().slice(0, 10),
  campaignEnd: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  publicCounters: true,
  campaignLocked: false,
  aiConfidenceThreshold: 0.6,
};

export async function getSettings(): Promise<Settings> {
  const s = await store().get<Settings>("settings", "global");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}
export const saveSettings = (s: Settings) => store().put("settings", s);

/* Utilisateurs */
export const listUsers = () => store().list<User>("users");
export const getUser = (id: string) => store().get<User>("users", id);
export const saveUser = (u: User) => store().put("users", u);
export async function findUserByEmail(email: string) {
  const e = email.trim().toLowerCase();
  // index secondaire email -> id pour éviter un balayage complet
  const idx = await store().get<{ id: string; userId: string }>("emailidx", emailKey(e));
  if (idx) {
    const u = await getUser(idx.userId);
    if (u && u.email === e) return u;
  }
  return (await listUsers()).find((u) => u.email === e) ?? null;
}
export function emailKey(email: string) {
  return Buffer.from(email.trim().toLowerCase()).toString("base64url").slice(0, 80);
}
export async function createUser(u: User) {
  await saveUser(u);
  await store().put("emailidx", { id: emailKey(u.email), userId: u.id });
}

/* Structures */
export const listStructures = () => store().list<Structure>("structures");
export const getStructure = (id: string) => store().get<Structure>("structures", id);
export const saveStructure = (s: Structure) => store().put("structures", s);

/* Besoins */
export const listNeeds = () => store().list<Need>("needs");
export const getNeed = (id: string) => store().get<Need>("needs", id);
export const saveNeed = (n: Need) => store().put("needs", n);
export const deleteNeedDoc = (id: string) => store().del("needs", id);
export async function needsOfStructure(structureId: string) {
  return (await listNeeds()).filter((n) => n.structureId === structureId);
}

/* Accusés */
export const listSubmissions = () => store().list<Submission>("submissions");
export const getSubmission = (id: string) => store().get<Submission>("submissions", id);
export const saveSubmission = (s: Submission) => store().put("submissions", s);

/* Journal d'audit (EF-LOG-01/02) — écriture seule (append-only) */
export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}
export async function audit(e: Omit<AuditEntry, "id" | "at" | "ip">) {
  const entry: AuditEntry = { id: `${Date.now().toString(36)}${newId().slice(0, 8)}`, at: nowIso(), ip: await clientIp(), ...e };
  try {
    await store().put("audit", entry);
  } catch (err) {
    console.error("[audit] échec d'écriture", err);
  }
}
export const listAudit = () => store().list<AuditEntry>("audit");

export const storageKind = () => store().kind;
