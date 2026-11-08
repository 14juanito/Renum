import { requireRole } from "@/lib/auth";
import { getSettings, listNeeds, listStructures, listUsers } from "@/lib/db";
import { ADMIN_TYPES, CATEGORIES, label, PRIORITIES } from "@/lib/referentials";
import { completeness, costOutliers, needUsd, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED } from "@/lib/rules";
import { bulkValidateAction, reviewNeedAction, reviewStructureAction } from "@/app/actions/admin";
import { AdminTabs } from "@/components/AdminTabs";
import { Badge, fmtDate, fmtMoney, fmtUsd, Notice, PageTitle, StatusBadge } from "@/components/ui";

export const metadata = { title: "Validation" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ err?: string; tab?: string }> }) {
  const u = await requireRole("analyste", "admin");
  const sp = await searchParams;
  const [needs, structures, users, settings] = await Promise.all([listNeeds(), listStructures(), listUsers(), getSettings()]);
  const byId = new Map(structures.map((s) => [s.id, s]));
  const qStruct = structures.filter((s) => s.status === "soumise" || (s.isNewRequest && s.status !== "rejetee")).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const qNeeds = needs.filter((n) => n.status === "soumis" || n.status === "en_revue").sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  const outliers = new Set<string>();
  const byCat = new Map<string, { id: string; v: number }[]>();
  for (const n of needs.filter((x) => x.status !== "brouillon")) byCat.set(n.categoryCode, [...(byCat.get(n.categoryCode) ?? []), { id: n.id, v: needUsd(n, settings.rateCdfPerUsd) }]);
  for (const vals of byCat.values()) for (const id of costOutliers(vals)) outliers.add(id);
  return (
    <div>
      <PageTitle title="File de validation" subtitle={`${qStruct.length} fiche(s) structure et ${qNeeds.length} besoin(s) à traiter.`} />
      <AdminTabs current="/admin/validation" admin={u.role === "admin"} />
      {sp.err === "motif" && <div className="mb-4"><Notice tone="error">Un motif est obligatoire pour rejeter ou renvoyer pour complément.</Notice></div>}

      <h2 className="mb-3 text-lg font-semibold">Fiches structures</h2>
      <div className="space-y-3">
        {qStruct.map((s) => {
          const r = users.find((x) => x.structureId === s.id && x.role === "responsable");
          const c = completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED);
          const dupes = structures.filter((o) => o.id !== s.id && o.status !== "archivee" && (o.acronym && o.acronym === s.acronym || o.email === s.email));
          return (
            <form key={s.id} action={reviewStructureAction} className="card grid gap-3 lg:grid-cols-[2fr_1fr]">
              <input type="hidden" name="id" value={s.id} />
              <div className="text-sm">
                <div className="flex flex-wrap items-center gap-2"><strong>{s.name}</strong>{s.acronym && <span>({s.acronym})</span>}<StatusBadge status={s.status} />{s.isNewRequest && <Badge tone="a_completer">Doublon potentiel</Badge>}</div>
                <p className="text-xs text-slate-600">{label(ADMIN_TYPES, s.typeCode)} · {s.city}, {s.province} · {s.email} · complétude {c.pct} %</p>
                {r && <p className="text-xs">Responsable : {r.firstName} {r.lastName} — {r.title} — {r.email}</p>}
                {dupes.length > 0 && <p className="text-xs text-amber-700">Proche de : {dupes.map((d) => d.name).join(", ")}</p>}
              </div>
              <div className="space-y-2">
                <input name="comment" className="input" placeholder="Motif / commentaire (obligatoire sauf validation)" />
                <div className="flex flex-wrap gap-1">
                  <button name="decision" value="validee" className="btn-primary btn-sm">Valider</button>
                  <button name="decision" value="a_completer" className="btn-secondary btn-sm">À compléter</button>
                  <button name="decision" value="rejetee" className="btn-danger btn-sm">Rejeter</button>
                </div>
              </div>
            </form>
          );
        })}
        {!qStruct.length && <p className="text-sm text-slate-500">Aucune fiche en attente.</p>}
      </div>

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Besoins</h2>
        {qNeeds.length > 0 && (
          <form action={bulkValidateAction} className="flex items-center gap-2">
            {qNeeds.filter((n) => !outliers.has(n.id)).map((n) => <input key={n.id} type="hidden" name="ids" value={n.id} />)}
            <button className="btn-secondary btn-sm">Valider par lot les {qNeeds.filter((n) => !outliers.has(n.id)).length} besoins sans alerte</button>
          </form>
        )}
      </div>
      <div className="space-y-3">
        {qNeeds.map((n) => {
          const s = byId.get(n.structureId);
          const low = n.ai && n.ai.confidence < settings.aiConfidenceThreshold;
          return (
            <form key={n.id} action={reviewNeedAction} className="card grid gap-3 lg:grid-cols-[2fr_1fr]">
              <input type="hidden" name="id" value={n.id} />
              <div className="text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs">{n.ref}</span><strong>{n.title}</strong><StatusBadge status={n.status} /><Badge tone={n.priority}>{label(PRIORITIES, n.priority)}</Badge>
                  {outliers.has(n.id) && <Badge tone="rejete">Montant atypique</Badge>}</div>
                <p className="text-xs text-slate-600">{s?.name} ({s?.province}) · soumis le {fmtDate(n.submittedAt)}</p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap">{n.description}</p>
                <p className="mt-1 text-xs">{n.quantity} × {fmtMoney(n.unitCost, n.currency)} = <strong>{fmtMoney(n.totalCost, n.currency)}</strong> ({fmtUsd(needUsd(n, settings.rateCdfPerUsd))}){n.totalOverrideReason && ` — montant global : ${n.totalOverrideReason}`}</p>
                {n.ai && <p className={`mt-1 text-xs ${low ? "text-amber-700" : "text-violet-700"}`}>IA : {label(CATEGORIES, n.ai.category)} ({Math.round(n.ai.confidence * 100)} %, {n.ai.engine}){low && " — à revoir"}</p>}
              </div>
              <div className="space-y-2">
                <select name="categoryCode" defaultValue={n.categoryCode} className="select" aria-label="Catégorie">{CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
                <input name="comment" className="input" placeholder="Motif visible par le responsable" />
                <input name="internalNote" defaultValue={n.internalNote} className="input" placeholder="Annotation interne (non visible)" />
                <div className="flex flex-wrap gap-1">
                  <button name="decision" value="valide" className="btn-primary btn-sm">Valider</button>
                  <button name="decision" value="en_revue" className="btn-secondary btn-sm">En revue</button>
                  <button name="decision" value="a_completer" className="btn-secondary btn-sm">À compléter</button>
                  <button name="decision" value="rejete" className="btn-danger btn-sm">Rejeter</button>
                </div>
              </div>
            </form>
          );
        })}
        {!qNeeds.length && <p className="text-sm text-slate-500">Aucun besoin en attente.</p>}
      </div>
    </div>
  );
}
