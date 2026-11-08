"use client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveNeedAction } from "@/app/actions/espace";
import { CATEGORIES, COST_NATURES, HORIZONS, PRIORITIES } from "@/lib/referentials";
import { classifyLocal } from "@/lib/ai-local";
import { computeTotal } from "@/lib/rules";
import type { Need } from "@/lib/types";
import { Submit } from "./forms";

type V = {
  title: string; categoryCode: string; subcategory: string; otherCategory: string; description: string; justification: string;
  quantity: string; unitCost: string; currency: "USD" | "CDF"; useOverride: boolean; totalOverride: string; totalOverrideReason: string;
  costNature: string; priority: string; horizon: string; beneficiaries: string; mutualisable: boolean;
};

const STEPS = ["Nature", "Description", "Coût", "Priorité"];

function initial(n?: Need | null): V {
  const override = n && n.totalCost !== computeTotal(n.quantity, n.unitCost);
  return {
    title: n?.title ?? "", categoryCode: n?.categoryCode ?? "", subcategory: n?.subcategory ?? "", otherCategory: n?.otherCategory ?? "",
    description: n?.description ?? "", justification: n?.justification ?? "", quantity: String(n?.quantity ?? 1),
    unitCost: n?.unitCost ? String(n.unitCost) : "", currency: n?.currency ?? "USD", useOverride: Boolean(override),
    totalOverride: override ? String(n!.totalCost) : "", totalOverrideReason: n?.totalOverrideReason ?? "", costNature: n?.costNature ?? "",
    priority: n?.priority ?? "", horizon: n?.horizon ?? "", beneficiaries: n?.beneficiaries != null ? String(n.beneficiaries) : "",
    mutualisable: n?.mutualisable ?? false,
  };
}

export function NeedWizard({ need, rate }: { need?: Need | null; rate: number }) {
  const [state, action] = useActionState(saveNeedAction, null);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<V>(() => initial(need));
  const [restored, setRestored] = useState(false);
  const id = state?.fields?.id ?? need?.id ?? "";
  const key = `renum-need-draft-${need?.id ?? "new"}`;
  const loaded = useRef(false);

  // EF-BES-15 : restauration du brouillon local après coupure
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { at: string; v: V };
        if (!need || new Date(saved.at) > new Date(need.updatedAt)) {
          setV(saved.v);
          setRestored(true);
        }
      }
    } catch { /* stockage indisponible */ }
    loaded.current = true;
  }, [key, need]);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), v })); } catch { /* ignore */ }
  }, [v, key]);

  useEffect(() => {
    if (state?.ok) try { localStorage.removeItem(key); localStorage.removeItem("renum-need-draft-new"); } catch { /* ignore */ }
  }, [state, key]);

  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const total = computeTotal(Number(v.quantity) || 0, Number(v.unitCost.replace(",", ".")) || 0, v.useOverride ? Number(v.totalOverride) || null : null);
  const usd = v.currency === "CDF" ? total / rate : total;
  const suggestion = useMemo(() => (v.title.length + v.description.length > 15 ? classifyLocal(`${v.title}. ${v.description}`) : null), [v.title, v.description]);
  const cat = CATEGORIES.find((c) => c.code === v.categoryCode);
  const fmt = (n: number, c: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: c, maximumFractionDigits: c === "CDF" ? 0 : 2 }).format(n);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={id} />
      <ol className="flex gap-2" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button type="button" onClick={() => setStep(i)} className={`w-full rounded-lg border px-2 py-2 text-xs font-semibold sm:text-sm ${i === step ? "border-brand-600 bg-brand-50 text-brand-700" : i < step ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      {restored && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">Brouillon local restauré (saisie non enregistrée précédemment).</div>}
      {state?.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{state.error}</div>}
      {state?.ok && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{state.ok}</div>}

      <section className={`card space-y-4 ${step === 0 ? "" : "hidden"}`}>
        <div>
          <label className="label req" htmlFor="title">Intitulé du besoin</label>
          <input id="title" name="title" maxLength={120} required value={v.title} onChange={(e) => set("title", e.target.value)} className="input" placeholder="Ex. : Acquisition de 20 ordinateurs pour le service courrier" />
          <p className="help">{v.title.length}/120 caractères — court et explicite.</p>
        </div>
        <div>
          <label className="label req" htmlFor="categoryCode">Catégorie</label>
          <select id="categoryCode" name="categoryCode" value={v.categoryCode} onChange={(e) => set("categoryCode", e.target.value)} className="select">
            <option value="">Choisir…</option>
            {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          {cat && <p className="help">Exemples : {cat.examples}</p>}
          {suggestion && suggestion.category !== v.categoryCode && suggestion.category !== "B12" && (
            <p className="mt-2 rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-900">
              Suggestion automatique : <strong>{CATEGORIES.find((c) => c.code === suggestion.category)?.label}</strong> (confiance {Math.round(suggestion.confidence * 100)} %)
              <button type="button" className="ml-2 font-semibold underline" onClick={() => set("categoryCode", suggestion.category)}>Appliquer</button>
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="subcategory">Sous-catégorie</label><input id="subcategory" name="subcategory" value={v.subcategory} onChange={(e) => set("subcategory", e.target.value)} className="input" placeholder={cat?.examples.split(",")[0] ?? ""} /></div>
          {v.categoryCode === "B12" && <div><label className="label req" htmlFor="otherCategory">Précisez « Autre »</label><input id="otherCategory" name="otherCategory" value={v.otherCategory} onChange={(e) => set("otherCategory", e.target.value)} className="input" /></div>}
        </div>
        {v.categoryCode !== "B12" && <input type="hidden" name="otherCategory" value="" />}
      </section>

      <section className={`card space-y-4 ${step === 1 ? "" : "hidden"}`}>
        <div>
          <label className="label req" htmlFor="description">Description détaillée</label>
          <textarea id="description" name="description" value={v.description} onChange={(e) => set("description", e.target.value)} className="textarea" maxLength={5000} placeholder="Quoi, pour qui, où ? Ex. : 20 ordinateurs de bureau avec onduleurs pour les agents du service courrier du siège à Kinshasa." />
          <p className={`help ${v.description.length < 30 ? "text-amber-700" : ""}`}>{v.description.length} caractères (minimum 30). Décrivez le matériel ou service, la quantité et le lieu.</p>
        </div>
        <div>
          <label className="label" htmlFor="justification">Problème à résoudre / justification</label>
          <textarea id="justification" name="justification" value={v.justification} onChange={(e) => set("justification", e.target.value)} className="textarea" maxLength={3000} placeholder="Quel problème ce besoin résout-il ? Quel impact attendu pour le service et les usagers ?" />
        </div>
      </section>

      <section className={`card space-y-4 ${step === 2 ? "" : "hidden"}`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label req" htmlFor="quantity">Quantité</label><input id="quantity" name="quantity" type="number" min={1} step={1} value={v.quantity} onChange={(e) => set("quantity", e.target.value)} className="input" /></div>
          <div><label className="label req" htmlFor="unitCost">Coût unitaire estimé</label><input id="unitCost" name="unitCost" inputMode="decimal" value={v.unitCost} onChange={(e) => set("unitCost", e.target.value)} className="input" placeholder="0" /></div>
          <div><label className="label req" htmlFor="currency">Devise</label><select id="currency" name="currency" value={v.currency} onChange={(e) => set("currency", e.target.value as "USD" | "CDF")} className="select"><option value="USD">USD</option><option value="CDF">CDF</option></select></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.useOverride} onChange={(e) => set("useOverride", e.target.checked)} /> Saisir plutôt un montant global (avec justification)</label>
        {v.useOverride && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label req" htmlFor="totalOverride">Montant global</label><input id="totalOverride" name="totalOverride" inputMode="decimal" value={v.totalOverride} onChange={(e) => set("totalOverride", e.target.value)} className="input" /></div>
            <div><label className="label req" htmlFor="totalOverrideReason">Justification du montant</label><input id="totalOverrideReason" name="totalOverrideReason" value={v.totalOverrideReason} onChange={(e) => set("totalOverrideReason", e.target.value)} className="input" placeholder="Ex. : devis forfaitaire" /></div>
          </div>
        )}
        <div className="rounded-lg bg-slate-100 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Coût total (calcul automatique)</div>
          <div className="text-2xl font-bold text-brand-900">{fmt(total, v.currency)}</div>
          {v.currency === "CDF" && <div className="text-xs text-slate-600">≈ {fmt(usd, "USD")} au taux indicatif de {rate} CDF/USD (taux figé à la soumission)</div>}
        </div>
        <div>
          <label className="label" htmlFor="costNature">Nature du coût</label>
          <select id="costNature" name="costNature" value={v.costNature} onChange={(e) => set("costNature", e.target.value)} className="select"><option value="">—</option>{COST_NATURES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
        </div>
      </section>

      <section className={`card space-y-4 ${step === 3 ? "" : "hidden"}`}>
        <fieldset>
          <legend className="label req">Niveau de priorité</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRIORITIES.map((p) => (
              <label key={p.code} className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-sm ${v.priority === p.code ? "border-brand-600 bg-brand-50" : "border-slate-200"}`}>
                <input type="radio" name="priority" value={p.code} checked={v.priority === p.code} onChange={() => set("priority", p.code)} className="mt-1" />
                <span><strong>{p.label}</strong><span className="block text-xs text-slate-600">{p.help}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="horizon">Échéance souhaitée</label><select id="horizon" name="horizon" value={v.horizon} onChange={(e) => set("horizon", e.target.value)} className="select"><option value="">—</option>{HORIZONS.map((h) => <option key={h.code} value={h.code}>{h.label}</option>)}</select></div>
          <div><label className="label" htmlFor="beneficiaries">Bénéficiaires (agents ou usagers)</label><input id="beneficiaries" name="beneficiaries" type="number" min={0} value={v.beneficiaries} onChange={(e) => set("beneficiaries", e.target.value)} className="input" /></div>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="mutualisable" checked={v.mutualisable} onChange={(e) => set("mutualisable", e.target.checked)} className="mt-1" /> Ce besoin peut être regroupé (mutualisé) avec ceux d&apos;autres structures.</label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Précédent</button>
          {step < STEPS.length - 1 && <button type="button" className="btn-secondary" onClick={() => setStep((s) => s + 1)}>Suivant →</button>}
        </div>
        <div className="flex gap-2">
          <Submit className="btn-secondary">Enregistrer le brouillon</Submit>
          <Submit name="finish" value="true">Enregistrer et terminer</Submit>
        </div>
      </div>
    </form>
  );
}
