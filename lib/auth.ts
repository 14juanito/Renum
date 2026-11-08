import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { cache } from "react";
import { getUser } from "./db";
import { ensureSeeded } from "./seed";
import type { Role, User } from "./types";

const COOKIE = "renum_session";
const SESSION_HOURS = 8;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    // Tout déploiement (production ou préversion) partage les données : jamais de secret par défaut.
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET manquant ou trop court (≥ 32 caractères)");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please-0123456789");
  }
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 11);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const otp6 = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export async function createSession(u: User) {
  const token = await new SignJWT({ v: u.tokenVersion, r: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Utilisateur courant (null si non connecté, suspendu ou jeton révoqué). */
export const currentUser = cache(async (): Promise<User | null> => {
  await ensureSeeded();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const u = payload.sub ? await getUser(payload.sub) : null;
    if (!u || u.status !== "active" || u.tokenVersion !== payload.v) return null;
    return u;
  } catch {
    return null;
  }
});

/** RBAC (EF-AUT-11) : à appeler dans chaque page et action protégée. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (roles.length && !roles.includes(u.role)) redirect("/acces-refuse");
  return u;
}

/** Variante pour les routes API : renvoie null au lieu de rediriger. */
export async function apiUser(...roles: Role[]): Promise<User | null> {
  const u = await currentUser();
  if (!u) return null;
  if (roles.length && !roles.includes(u.role)) return null;
  return u;
}

export const isStaff = (r: Role) => r === "analyste" || r === "admin";
export const canSeeDashboard = (r: Role) => r === "analyste" || r === "admin" || r === "decideur";

export function homeFor(r: Role) {
  if (r === "admin" || r === "analyste") return "/admin";
  if (r === "decideur") return "/decideur";
  return "/espace";
}

/* Limitation de débit simple par instance (complément au verrouillage de compte persistant). */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n++;
  return b.n <= max;
}
