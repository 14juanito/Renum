"use client";
import { ActionForm, Submit } from "./forms";
import { assistedAccountAction } from "@/app/actions/admin";
import { ROLES } from "@/lib/referentials";

export function AssistedForm({ admin }: { admin: boolean }) {
  return (
    <ActionForm action={assistedAccountAction} className="card space-y-3">
      <h2 className="font-semibold">Saisie assistée : créer un compte pour un participant</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="lastName" required className="input" placeholder="Nom" aria-label="Nom" />
        <input name="firstName" required className="input" placeholder="Prénom" aria-label="Prénom" />
        <input name="email" type="email" required className="input" placeholder="E-mail" aria-label="E-mail" />
        <input name="title" className="input" placeholder="Fonction" aria-label="Fonction" />
        <input name="phone" className="input" placeholder="+243…" aria-label="Téléphone" />
        {admin ? <select name="role" defaultValue="responsable" className="select" aria-label="Rôle">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : <input type="hidden" name="role" value="responsable" />}
      </div>
      <Submit>Créer le compte</Submit>
    </ActionForm>
  );
}
