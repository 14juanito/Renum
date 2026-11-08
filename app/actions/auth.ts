"use server";
import { redirect } from "next/navigation";
import { audit, clientIp, createUser, findUserByEmail, getUser, newId, nowIso, saveUser } from "@/lib/db";
import { createSession, destroySession, hashPassword, homeFor, otp6, rateLimit, sha256, verifyPassword, currentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { appUrl, emailEnabled, sendEmail } from "@/lib/email";
import { passwordIssues, RX } from "@/lib/rules";
import { bool, str, type ActionState } from "@/lib/form";
import type { Token } from "@/lib/types";
import { ensureSeeded } from "@/lib/seed";

const MAX_FAILS = 5;
const LOCK_MIN = 15;
const OTP_TTL_MIN = 15;
let dummyHash: string | null = null;

async function issueVerifyCode(userId: string, email: string) {
  const code = otp6();
  const t: Token = { id: `v-${userId}`, kind: "verify", userId, codeHash: sha256(`${userId}:${code}`), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(), attempts: 0 };
  await store().put("tokens", t);
  const sent = await sendEmail(email, "RENUM — votre code de vérification", `Votre code de vérification RENUM est : ${code}\nIl expire dans ${OTP_TTL_MIN} minutes.`);
  return sent ? undefined : code; // en mode démo (pas d'e-mail), le code est affiché à l'écran
}

export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await ensureSeeded();
  if (str(fd, "website")) return { error: "Requête refusée." }; // pot de miel anti-robot
  const ip = (await clientIp()) ?? "?";
  if (!rateLimit(`reg:${ip}`, 10, 3600_000)) return { error: "Trop de tentatives. Réessayez plus tard." };
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const lastName = str(fd, "lastName", 100);
  const firstName = str(fd, "firstName", 100);
  const title = str(fd, "title", 150);
  const structureName = str(fd, "structureName", 200);
  if (!RX.email.test(email)) return { error: "Adresse e-mail invalide." };
  if (!lastName || !firstName || !title) return { error: "Nom, prénom et fonction sont obligatoires." };
  const issues = passwordIssues(password);
  if (issues.length) return { error: `Mot de passe trop faible : ${issues.join(", ")}.` };
  if (password !== String(fd.get("password2") ?? "")) return { error: "Les mots de passe ne correspondent pas." };
  if (!bool(fd, "consent")) return { error: "Vous devez accepter la politique de confidentialité." };

  const existing = await findUserByEmail(email);
  if (existing) {
    // Réponse identique pour éviter l'énumération des comptes
    return { ok: "Si cette adresse n'est pas déjà inscrite, un code de vérification vient d'être envoyé." };
  }
  const id = newId();
  await createUser({
    id, email, passwordHash: await hashPassword(password), role: "responsable", status: "pending", emailVerified: false,
    failedLogins: 0, tokenVersion: 1, createdAt: nowIso(), lastName, firstName, title, consentAt: nowIso(),
    department: structureName ? `Structure déclarée : ${structureName}` : undefined,
  });
  await audit({ userId: id, email, action: "compte.creation" });
  const demoCode = await issueVerifyCode(id, email);
  const q = new URLSearchParams({ email });
  if (demoCode) q.set("demo", demoCode);
  redirect(`/verification?${q}`);
}

export async function verifyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email", 200).toLowerCase();
  const code = str(fd, "code", 10);
  const ip = (await clientIp()) ?? "?";
  if (!rateLimit(`ver:${ip}`, 20, 900_000)) return { error: "Trop de tentatives. Réessayez plus tard." };
  const u = await findUserByEmail(email);
  const t = u ? await store().get<Token>("tokens", `v-${u.id}`) : null;
  if (!u || !t || new Date(t.expiresAt) < new Date() || t.attempts >= 5) return { error: "Code invalide ou expiré. Demandez un nouveau code." };
  if (t.codeHash !== sha256(`${u.id}:${code}`)) {
    await store().put("tokens", { ...t, attempts: t.attempts + 1 });
    return { error: "Code incorrect." };
  }
  await store().del("tokens", t.id);
  const updated = { ...u, emailVerified: true, status: "active" as const };
  await saveUser(updated);
  await audit({ userId: u.id, email, action: "compte.verification" });
  await createSession(updated);
  redirect("/espace");
}

export async function resendCodeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email", 200).toLowerCase();
  if (!rateLimit(`resend:${email}`, 3, 900_000)) return { error: "Veuillez patienter avant de redemander un code." };
  const u = await findUserByEmail(email);
  let demoCode: string | undefined;
  if (u && !u.emailVerified) demoCode = await issueVerifyCode(u.id, email);
  return { ok: "Si un compte en attente existe, un nouveau code a été envoyé.", demoCode };
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await ensureSeeded();
  const email = str(fd, "email", 200).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = (await clientIp()) ?? "?";
  if (!rateLimit(`login:${ip}`, 30, 900_000)) return { error: "Trop de tentatives depuis cette adresse. Réessayez dans 15 minutes." };
  const generic = { error: "Identifiants incorrects." };
  const u = await findUserByEmail(email);
  if (!u) {
    dummyHash ??= await hashPassword("renum-dummy-password");
    await verifyPassword(password, dummyHash); // temps de réponse constant (anti-énumération)
    return generic;
  }
  if (u.lockedUntil && new Date(u.lockedUntil) > new Date()) {
    return { error: "Compte temporairement verrouillé après plusieurs échecs. Réessayez plus tard." };
  }
  if (!(await verifyPassword(password, u.passwordHash))) {
    const fails = u.failedLogins + 1;
    const lock = fails >= MAX_FAILS;
    await saveUser({ ...u, failedLogins: lock ? 0 : fails, lockedUntil: lock ? new Date(Date.now() + LOCK_MIN * 60_000).toISOString() : u.lockedUntil });
    await audit({ userId: u.id, email, action: lock ? "connexion.verrouillage" : "connexion.echec" });
    return generic;
  }
  if (!u.emailVerified) {
    const demoCode = await issueVerifyCode(u.id, email);
    const q = new URLSearchParams({ email });
    if (demoCode) q.set("demo", demoCode);
    redirect(`/verification?${q}`);
  }
  if (u.status !== "active") return { error: "Ce compte est suspendu. Contactez l'administrateur." };
  const updated = { ...u, failedLogins: 0, lockedUntil: null, lastLoginAt: nowIso() };
  await saveUser(updated);
  await createSession(updated);
  await audit({ userId: u.id, email, action: "connexion.succes" });
  const next = str(fd, "next", 200);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeFor(u.role));
}

export async function logoutAction() {
  const u = await currentUser();
  if (u) await audit({ userId: u.id, email: u.email, action: "deconnexion" });
  await destroySession();
  redirect("/");
}

export async function forgotAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email", 200).toLowerCase();
  const ip = (await clientIp()) ?? "?";
  if (!rateLimit(`forgot:${ip}`, 5, 900_000)) return { error: "Trop de demandes. Réessayez plus tard." };
  const u = await findUserByEmail(email);
  let demoCode: string | undefined;
  if (u && u.status !== "suspended") {
    const raw = `${newId()}${newId()}`;
    const t: Token = { id: `r-${sha256(raw).slice(0, 60)}`, kind: "reset", userId: u.id, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(), attempts: 0 };
    await store().put("tokens", t);
    const link = `${appUrl()}/reinitialisation?t=${raw}`;
    const sent = await sendEmail(email, "RENUM — réinitialisation du mot de passe", `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 30 minutes) :\n${link}`);
    if (!sent) demoCode = `/reinitialisation?t=${raw}`;
    await audit({ userId: u.id, email, action: "motdepasse.demande" });
  }
  return { ok: "Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.", demoCode: emailEnabled() ? undefined : demoCode };
}

export async function resetAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const raw = str(fd, "t", 200);
  const password = String(fd.get("password") ?? "");
  const issues = passwordIssues(password);
  if (issues.length) return { error: `Mot de passe trop faible : ${issues.join(", ")}.` };
  if (password !== String(fd.get("password2") ?? "")) return { error: "Les mots de passe ne correspondent pas." };
  const id = `r-${sha256(raw).slice(0, 60)}`;
  const t = await store().get<Token>("tokens", id);
  if (!t || new Date(t.expiresAt) < new Date()) return { error: "Lien invalide ou expiré." };
  const u = await getUser(t.userId);
  if (!u) return { error: "Lien invalide ou expiré." };
  await store().del("tokens", id);
  // incrément de tokenVersion : révoque toutes les sessions existantes
  await saveUser({ ...u, passwordHash: await hashPassword(password), tokenVersion: u.tokenVersion + 1, failedLogins: 0, lockedUntil: null, emailVerified: true, status: u.status === "pending" ? "active" : u.status });
  await audit({ userId: u.id, email: u.email, action: "motdepasse.reinitialisation" });
  redirect("/connexion?reset=1");
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const u = await currentUser();
  if (!u) redirect("/connexion");
  if (!(await verifyPassword(String(fd.get("current") ?? ""), u.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  const pw = String(fd.get("password") ?? "");
  const issues = passwordIssues(pw);
  if (issues.length) return { error: `Mot de passe trop faible : ${issues.join(", ")}.` };
  const updated = { ...u, passwordHash: await hashPassword(pw), tokenVersion: u.tokenVersion + 1 };
  await saveUser(updated);
  await createSession(updated);
  await audit({ userId: u.id, email: u.email, action: "motdepasse.changement" });
  return { ok: "Mot de passe modifié. Vos autres sessions ont été déconnectées." };
}
