import { requireRole } from "@/lib/auth";
import { getSettings, listNeeds, listStructures } from "@/lib/db";
import { llmEnabled } from "@/lib/ai";
import { CATEGORIES, label } from "@/lib/referentials";
import { aiDecisionAction, runAiAction } from "@/app/actions/admin";
import { AdminTabs } from "@/components/AdminTabs";
import { Submit } from "@/components/forms";
import { Badge, Kpi, Notice, PageTitle } from "@/components/ui";

export const metadata = { title: "Module IA" };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function Page({ searchParams }: { searchParams: Promise<{ done?: string; f?: string }> }) {
  const u = await requireRole("analyste", "admin");
  const sp = await searchParams;
  const [needs, structures, settings] = await Promise.all([listNeeds(), listStructures(), getSettings()]);
  const byId = new Map(structures.map((s) => [s.id, s]));
  const analysed = needs.filter((n) => n.ai && n.status !== "brouillon");
  const decided = analysed.filter((n) => n.ai!.decision === "accepted" || n.ai!.decision === "corrected");
  const accuracy = decided.length ? decided.filter((n) => n.ai!.decision === "accepted").length / decided.length : null;
  const pending = analysed.filter((n) => !n.ai!.decision && n.ai!.category !== n.categoryCode || (!n.ai!.decision && n.ai!.confidence < settings.aiConfidenceThreshold));
  const list = sp.f === "all" ? analysed : pending;
  // Regroupement simple par catégorie et mutualisation (aperçu P3)
  const mutual = CATEGORIES.map((c) => {
    const items = needs.filter((n) => n.categoryCode === c.code && n.mutualisable && ["soumis", "en_revue", "valide"].includes(n.status));
    return { c, n: items.length, structs: new Set(items.map((i) => i.structureId)).size };
  }).filter((x) => x.structs >= 2).sort((a, b) => b.structs - a.structs);
  return (
    <div>
      <PageTitle title="Module d'intelligence artificielle" subtitle="L'IA propose, l'analyste décide (RG8) : les propositions sont stockées à part et n'affectent la catégorie officielle qu'après validation." />
      <AdminTabs current="/admin/ia" admin={u.role === "admin"} />
      {sp.done && <div className="mb-4"><Notice tone="ok">Analyse terminée : {sp.done} besoin(s) traités.</Notice></div>}
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Moteur" value={<span className="text-base">{llmEnabled() ? "Modèle de langage" : "Classifieur local"}</span>} hint={llmEnabled() ? process.env.AI_MODEL || "claude-opus-5-5" : "Sans envoi de données"} />
        <Kpi label="Besoins analysés" value={analysed.length} />
        <Kpi label="Propositions à revoir" value={pending.length} hint={`Seuil de confiance ${settings.aiConfidenceThreshold}`} />
        <Kpi label="Précision observée" value={accuracy == null ? "—" : `${Math.round(accuracy * 100)} %`} hint={`Sur ${decided.length} décisions d'analystes (cible ≥ 85 %)`} />
      </div>
      <form action={runAiAction} className="card mt-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="onlyMissing" defaultChecked /> Uniquement les besoins non analysés par le moteur actuel</label>
        <Submit>Lancer l&apos;analyse (60 besoins max. par lot)</Submit>
        <p className="help w-full">Seuls l&apos;intitulé et la description sont transmis, après retrait des e-mails, téléphones et liens. Chaque résultat conserve le modèle, la date et le score.</p>
      </form>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Propositions {sp.f === "all" ? "(toutes)" : "à revoir"}</h2>
        <a className="link text-sm" href={sp.f === "all" ? "/admin/ia" : "/admin/ia?f=all"}>{sp.f === "all" ? "Voir seulement à revoir" : "Voir toutes"}</a>
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Besoin</th><th>Catégorie actuelle</th><th>Proposition IA</th><th>Confiance</th><th>Décision</th></tr></thead>
          <tbody>
            {list.slice(0, 100).map((n) => (
              <tr key={n.id}>
                <td><div className="font-medium">{n.title}</div><div className="text-xs text-slate-500">{byId.get(n.structureId)?.acronym || byId.get(n.structureId)?.name}</div>{n.ai!.rationale && <div className="text-xs text-violet-700">{n.ai!.rationale}</div>}</td>
                <td className="text-xs">{label(CATEGORIES, n.categoryCode)}</td>
                <td className="text-xs">{label(CATEGORIES, n.ai!.category)}<div className="text-slate-500">{n.ai!.engine} · {n.ai!.model}</div></td>
                <td><Badge tone={n.ai!.confidence >= settings.aiConfidenceThreshold ? "valide" : "a_completer"}>{Math.round(n.ai!.confidence * 100)} %</Badge></td>
                <td>
                  {n.ai!.decision ? <Badge>{({ accepted: "Acceptée", corrected: "Corrigée", rejected: "Rejetée" } as Record<string, string>)[n.ai!.decision]}</Badge> : (
                    <form action={aiDecisionAction} className="flex flex-wrap gap-1">
                      <input type="hidden" name="id" value={n.id} />
                      <button name="decision" value="accept" className="btn-primary btn-sm">Accepter</button>
                      <select name="categoryCode" defaultValue={n.categoryCode} className="select !w-40 !py-1 text-xs" aria-label="Correction">{CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
                      <button name="decision" value="correct" className="btn-secondary btn-sm">Corriger</button>
                      <button name="decision" value="reject" className="btn-secondary btn-sm">Rejeter</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Aucune proposition à revoir.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card mt-6">
        <h2 className="font-semibold">Pistes de mutualisation (aperçu)</h2>
        <p className="help mb-3">Catégories où au moins deux structures acceptent un regroupement. Le regroupement sémantique avancé est prévu en phase P3.</p>
        <ul className="space-y-1 text-sm">{mutual.map((m) => <li key={m.c.code} className="flex justify-between"><span>{m.c.label}</span><span>{m.n} besoins · {m.structs} structures</span></li>)}</ul>
        {!mutual.length && <p className="text-sm text-slate-500">Pas encore assez de données.</p>}
      </div>
    </div>
  );
}
