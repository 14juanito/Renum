"use client";
import { ActionForm, Submit } from "./forms";
import { saveSettingsAction } from "@/app/actions/admin";
import type { Settings } from "@/lib/types";

export function SettingsForm({ s }: { s: Settings }) {
  return (
    <ActionForm action={saveSettingsAction} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="campaignName">Intitulé de la campagne</label><input id="campaignName" name="campaignName" defaultValue={s.campaignName} className="input" /></div>
        <div><label className="label" htmlFor="campaignStart">Ouverture</label><input id="campaignStart" name="campaignStart" type="date" defaultValue={s.campaignStart} className="input" /></div>
        <div><label className="label" htmlFor="campaignEnd">Clôture</label><input id="campaignEnd" name="campaignEnd" type="date" defaultValue={s.campaignEnd} className="input" /></div>
        <div><label className="label" htmlFor="rateCdfPerUsd">Taux de change (CDF pour 1 USD)</label><input id="rateCdfPerUsd" name="rateCdfPerUsd" inputMode="decimal" defaultValue={s.rateCdfPerUsd} className="input" /><p className="help">Appliqué et figé à chaque nouvelle soumission (RG5).</p></div>
        <div><label className="label" htmlFor="aiConfidenceThreshold">Seuil de confiance IA (0–1)</label><input id="aiConfidenceThreshold" name="aiConfidenceThreshold" inputMode="decimal" defaultValue={s.aiConfidenceThreshold} className="input" /><p className="help">En dessous, le classement est marqué « à revoir ».</p></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="infoBanner">Bandeau d&apos;information (annonce)</label><input id="infoBanner" name="infoBanner" defaultValue={s.infoBanner} className="input" /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publicCounters" defaultChecked={s.publicCounters} /> Afficher les compteurs publics sur l&apos;accueil</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="campaignLocked" defaultChecked={s.campaignLocked} /> Verrouiller la campagne (plus aucune saisie ni soumission)</label>
      <Submit>Enregistrer</Submit>
    </ActionForm>
  );
}
