"use client";
import Link from "next/link";
import { useState } from "react";
import { ActionForm, Submit } from "./forms";
import { forgotAction, loginAction, registerAction, resendCodeAction, resetAction, verifyAction } from "@/app/actions/auth";
import { passwordIssues } from "@/lib/rules";

function PasswordField({ name = "password", label = "Mot de passe" }: { name?: string; label?: string }) {
  const [pw, setPw] = useState("");
  const issues = pw ? passwordIssues(pw) : [];
  return (
    <div>
      <label className="label req" htmlFor={name}>{label}</label>
      <input id={name} name={name} type="password" required autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
      <p className={`help ${pw && !issues.length ? "text-emerald-700" : ""}`}>
        {pw ? (issues.length ? `Manque : ${issues.join(", ")}` : "Mot de passe robuste ✓") : "10 caractères min., majuscule, minuscule, chiffre et caractère spécial."}
      </p>
    </div>
  );
}

export function RegisterForm() {
  return (
    <ActionForm action={registerAction} className="space-y-4">
      <div className="hidden" aria-hidden><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label req" htmlFor="lastName">Nom</label><input id="lastName" name="lastName" required className="input" autoComplete="family-name" /></div>
        <div><label className="label req" htmlFor="firstName">Prénom</label><input id="firstName" name="firstName" required className="input" autoComplete="given-name" /></div>
      </div>
      <div><label className="label req" htmlFor="title">Fonction</label><input id="title" name="title" required className="input" placeholder="Ex. : Directeur des systèmes d'information" /></div>
      <div><label className="label" htmlFor="structureName">Structure</label><input id="structureName" name="structureName" className="input" placeholder="Ex. : Direction Générale des Impôts" /><p className="help">Vous compléterez la fiche détaillée après l&apos;inscription.</p></div>
      <div><label className="label req" htmlFor="email">E-mail professionnel</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /><p className="help">De préférence une adresse institutionnelle.</p></div>
      <PasswordField />
      <div><label className="label req" htmlFor="password2">Confirmer le mot de passe</label><input id="password2" name="password2" type="password" required className="input" autoComplete="new-password" /></div>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consent" required className="mt-1" /> <span>J&apos;accepte les <Link className="link" href="/legal/cgu" target="_blank">conditions d&apos;utilisation</Link> et la <Link className="link" href="/legal/confidentialite" target="_blank">politique de confidentialité</Link>.</span></label>
      <Submit className="btn-primary w-full">Créer mon compte</Submit>
    </ActionForm>
  );
}

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={loginAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" required className="input" autoComplete="username" /></div>
      <div><label className="label" htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
      <Submit className="btn-primary w-full">Me connecter</Submit>
      <div className="flex justify-between text-sm"><Link className="link" href="/mot-de-passe-oublie">Mot de passe oublié ?</Link><Link className="link" href="/inscription">Créer un compte</Link></div>
    </ActionForm>
  );
}

export function VerifyForm({ email, demo }: { email: string; demo?: string }) {
  return (
    <div className="space-y-6">
      {demo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Votre code de vérification : <code className="select-all rounded bg-white px-2 py-0.5 font-mono text-base font-bold">{demo}</code>
        </div>
      )}
      <ActionForm action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div>
          <label className="label" htmlFor="code">Code à 6 chiffres envoyé à {email}</label>
          <input id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" className="input text-center font-mono text-2xl tracking-[0.5em]" />
        </div>
        <Submit className="btn-primary w-full">Vérifier et activer</Submit>
      </ActionForm>
      <ActionForm action={resendCodeAction}>
        <input type="hidden" name="email" value={email} />
        <Submit className="btn-secondary w-full">Renvoyer un code</Submit>
      </ActionForm>
    </div>
  );
}

export function ForgotForm() {
  return (
    <ActionForm action={forgotAction} className="space-y-4">
      {(s) => (
        <>
          {s?.demoCode && <p className="text-sm"><Link className="link font-semibold" href={s.demoCode}>Ouvrir le lien de réinitialisation</Link></p>}
          <div><label className="label" htmlFor="email">E-mail du compte</label><input id="email" name="email" type="email" required className="input" /></div>
          <Submit className="btn-primary w-full">Recevoir un lien</Submit>
        </>
      )}
    </ActionForm>
  );
}

export function ResetForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetAction} className="space-y-4">
      <input type="hidden" name="t" value={token} />
      <PasswordField label="Nouveau mot de passe" />
      <div><label className="label req" htmlFor="password2">Confirmer</label><input id="password2" name="password2" type="password" required className="input" /></div>
      <Submit className="btn-primary w-full">Enregistrer</Submit>
    </ActionForm>
  );
}
