import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getNeed, getSettings } from "@/lib/db";
import { CATEGORIES, HORIZONS, label, PRIORITIES } from "@/lib/referentials";
import { NEED_EDITABLE } from "@/lib/rules";
import { NeedWizard } from "@/components/NeedWizard";
import { fmtDate, fmtMoney, fmtUsd, Notice, PageTitle, StatusBadge } from "@/components/ui";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole("responsable", "delegue", "admin");
  if (!u.structureId) redirect("/espace/structure");
  const { id } = await params;
  const n = await getNeed(id.slice(0, 40));
  if (!n || n.structureId !== u.structureId) notFound();
  const s = await getSettings();
  const editable = NEED_EDITABLE.has(n.status) && !s.campaignLocked;
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={n.title || "Besoin"} subtitle={`Référence ${n.ref}`} actions={<StatusBadge status={n.status} />} />
      {n.reviewComment && <div className="mb-4"><Notice tone={n.status === "a_completer" ? "warn" : "info"}>Commentaire de l&apos;analyste : {n.reviewComment}</Notice></div>}
      {editable ? (
        <NeedWizard need={n} rate={s.rateCdfPerUsd} />
      ) : (
        <div className="card space-y-3 text-sm">
          <p><strong>Catégorie :</strong> {label(CATEGORIES, n.categoryCode)} {n.subcategory && `— ${n.subcategory}`}</p>
          <p className="whitespace-pre-wrap"><strong>Description :</strong> {n.description}</p>
          {n.justification && <p className="whitespace-pre-wrap"><strong>Justification :</strong> {n.justification}</p>}
          <p><strong>Coût :</strong> {n.quantity} × {fmtMoney(n.unitCost, n.currency)} = {fmtMoney(n.totalCost, n.currency)} {n.amountUsd != null && `(${fmtUsd(n.amountUsd)} au taux ${n.rateApplied})`}</p>
          <p><strong>Priorité :</strong> {label(PRIORITIES, n.priority)} — <strong>Échéance :</strong> {label(HORIZONS, n.horizon)}</p>
          <p><strong>Soumis le :</strong> {fmtDate(n.submittedAt)}</p>
          <p className="text-xs text-slate-500">Ce besoin n&apos;est plus modifiable. Pour toute correction, contactez la cellule d&apos;analyse (RG4).</p>
        </div>
      )}
    </div>
  );
}
