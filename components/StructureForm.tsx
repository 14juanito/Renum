"use client";
import { ActionForm, Submit } from "./forms";
import { saveStructureAction } from "@/app/actions/espace";
import { ADMIN_TYPES, PROVINCES } from "@/lib/referentials";
import type { Structure } from "@/lib/types";

export function StructureForm({ s, tutelles, readOnly }: { s: Partial<Structure> | null; tutelles: string[]; readOnly?: boolean }) {
  return (
    <ActionForm action={saveStructureAction} className="space-y-6">
      {(state) => (
        <fieldset disabled={readOnly} className="space-y-6">
          <section className="card space-y-4">
            <h2 className="font-semibold">Identité</h2>
            <div>
              <label className="label req" htmlFor="typeCode">Type d&apos;administration</label>
              <select id="typeCode" name="typeCode" required defaultValue={s?.typeCode ?? ""} className="select">
                <option value="" disabled>Choisir…</option>
                {ADMIN_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label} — {t.examples}</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div><label className="label req" htmlFor="name">Nom officiel</label><input id="name" name="name" required defaultValue={s?.name} className="input" list="known-structures" /><p className="help">Saisissez le nom complet, sans abréviation.</p></div>
              <div><label className="label" htmlFor="acronym">Sigle</label><input id="acronym" name="acronym" defaultValue={s?.acronym} className="input" /></div>
            </div>
            <div><label className="label" htmlFor="tutelle">Tutelle / ministère de rattachement</label><input id="tutelle" name="tutelle" defaultValue={s?.tutelle} className="input" list="known-structures" /><p className="help">Obligatoire sauf pour les institutions de la République.</p></div>
            <datalist id="known-structures">{tutelles.map((t) => <option key={t} value={t} />)}</datalist>
          </section>
          <section className="card space-y-4">
            <h2 className="font-semibold">Localisation</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label req" htmlFor="province">Province</label>
                <select id="province" name="province" required defaultValue={s?.province ?? ""} className="select">
                  <option value="" disabled>Choisir…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="label req" htmlFor="city">Ville / territoire / commune</label><input id="city" name="city" required defaultValue={s?.city} className="input" /></div>
            </div>
            <div><label className="label" htmlFor="address">Adresse physique</label><input id="address" name="address" defaultValue={s?.address} className="input" /></div>
          </section>
          <section className="card space-y-4">
            <h2 className="font-semibold">Coordonnées et taille</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label req" htmlFor="email">E-mail institutionnel</label><input id="email" name="email" type="email" required defaultValue={s?.email} className="input" /></div>
              <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" name="phone" type="tel" defaultValue={s?.phone} placeholder="+243…" className="input" /></div>
              <div><label className="label" htmlFor="website">Site web</label><input id="website" name="website" type="url" defaultValue={s?.website} placeholder="https://" className="input" /></div>
              <div><label className="label" htmlFor="staff">Effectif approximatif</label><input id="staff" name="staff" type="number" min={0} defaultValue={s?.staff ?? ""} className="input" /></div>
              <div><label className="label" htmlFor="sites">Nombre de sites</label><input id="sites" name="sites" type="number" min={0} defaultValue={s?.sites ?? ""} className="input" /></div>
              <div><label className="label" htmlFor="itUsers">Agents utilisant l&apos;informatique</label><input id="itUsers" name="itUsers" type="number" min={0} defaultValue={s?.itUsers ?? ""} className="input" /></div>
            </div>
          </section>
          {state?.fields?.duplicate && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"><input type="checkbox" name="confirmDuplicate" className="mt-1" /> Je confirme qu&apos;il s&apos;agit d&apos;une structure différente (demande soumise à validation).</label>
          )}
          {!readOnly && <Submit>Enregistrer la fiche structure</Submit>}
        </fieldset>
      )}
    </ActionForm>
  );
}
