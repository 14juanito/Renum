"use client";
import { PasswordInput } from "./PasswordInput";
import { ActionForm, Submit } from "./forms";
import { saveProfileAction } from "@/app/actions/espace";
import { changePasswordAction } from "@/app/actions/auth";
import { CIVILITIES, POST_STATUS } from "@/lib/referentials";
import type { User } from "@/lib/types";

type P = Omit<User, "passwordHash">;

export function ProfileForm({ u }: { u: P }) {
  return (
    <div className="space-y-6">
      <ActionForm action={saveProfileAction} className="space-y-6">
        <section className="card space-y-4">
          <h2 className="font-semibold">Identité</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div><label className="label" htmlFor="civility">Civilité</label><select id="civility" name="civility" defaultValue={u.civility ?? ""} className="select"><option value="">—</option>{CIVILITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label req" htmlFor="lastName">Nom</label><input id="lastName" name="lastName" required defaultValue={u.lastName} className="input" /></div>
            <div><label className="label" htmlFor="postName">Postnom</label><input id="postName" name="postName" defaultValue={u.postName} className="input" /></div>
            <div><label className="label req" htmlFor="firstName">Prénom</label><input id="firstName" name="firstName" required defaultValue={u.firstName} className="input" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label req" htmlFor="title">Fonction exacte</label><input id="title" name="title" required defaultValue={u.title} className="input" /></div>
            <div><label className="label" htmlFor="department">Direction / service de rattachement</label><input id="department" name="department" defaultValue={u.department} className="input" /></div>
            <div><label className="label req" htmlFor="postStatus">Statut du poste</label><select id="postStatus" name="postStatus" required defaultValue={u.postStatus ?? ""} className="select"><option value="" disabled>Choisir…</option>{POST_STATUS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}</select></div>
            <div><label className="label" htmlFor="startDate">Date de prise de fonction</label><input id="startDate" name="startDate" type="date" defaultValue={u.startDate} className="input" /></div>
          </div>
        </section>
        <section className="card space-y-4">
          <h2 className="font-semibold">Coordonnées</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">E-mail professionnel</label><input value={u.email} disabled className="input" readOnly /><p className="help">Vérifié par code.</p></div>
            <div><label className="label req" htmlFor="phone">Téléphone</label><input id="phone" name="phone" required type="tel" defaultValue={u.phone} placeholder="+243…" className="input" /></div>
            <div><label className="label" htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={u.whatsapp} placeholder="+243…" className="input" /></div>
          </div>
        </section>
        <section className="card space-y-4">
          <h2 className="font-semibold">Équipe et suppléance</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="label" htmlFor="itTeamSize">Taille de l&apos;équipe informatique</label><input id="itTeamSize" name="itTeamSize" type="number" min={0} defaultValue={u.itTeamSize ?? ""} className="input" /></div>
            <div><label className="label" htmlFor="deputyName">Suppléant (nom)</label><input id="deputyName" name="deputyName" defaultValue={u.deputyName} className="input" /></div>
            <div><label className="label" htmlFor="deputyContact">Suppléant (contact)</label><input id="deputyContact" name="deputyContact" defaultValue={u.deputyContact} className="input" /></div>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consentPublish" defaultChecked={u.consentPublish} className="mt-1" /> <span><strong>J&apos;accepte</strong> que mes coordonnées professionnelles figurent dans l&apos;annuaire, consultable uniquement par les agents habilités (obligatoire pour soumettre).</span></label>
        </section>
        <Submit>Enregistrer ma fiche</Submit>
      </ActionForm>
      <ActionForm action={changePasswordAction} className="card space-y-4">
        <h2 className="font-semibold">Changer mon mot de passe</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="current">Mot de passe actuel</label><PasswordInput id="current" name="current" required className="input" autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="password">Nouveau mot de passe</label><PasswordInput id="password" name="password" required className="input" autoComplete="new-password" /></div>
        </div>
        <Submit className="btn-secondary">Modifier le mot de passe</Submit>
      </ActionForm>
    </div>
  );
}
