import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSettings, needsOfStructure } from "@/lib/db";
import { CATEGORIES, label, PRIORITIES } from "@/lib/referentials";
import { NEED_EDITABLE, needSubmittable, needUsd } from "@/lib/rules";
import { deleteNeedAction, duplicateNeedAction } from "@/app/actions/espace";
import { Badge, fmtMoney, fmtUsd, Notice, PageTitle, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/forms";

export const metadata = { title: "Mes besoins" };

export default async function Page() {
  const u = await requireRole("responsable", "delegue", "admin");
  if (!u.structureId) return <div className="mx-auto max-w-xl"><Notice tone="warn">Renseignez d&apos;abord la <Link className="link" href="/espace/structure">fiche de votre structure</Link>.</Notice></div>;
  const [needs, settings] = await Promise.all([needsOfStructure(u.structureId), getSettings()]);
  needs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pending = needs.filter((n) => NEED_EDITABLE.has(n.status));
  const total = needs.filter((n) => n.status !== "rejete").reduce((a, n) => a + needUsd(n, settings.rateCdfPerUsd), 0);
  return (
    <div>
      <PageTitle title="Besoins numériques de la structure" subtitle={`${needs.length} besoin(s) — total estimé ${fmtUsd(total)}`}
        actions={<>
          <Link href="/espace/besoins/nouveau" className="btn-primary">+ Nouveau besoin</Link>
          {pending.length > 0 && u.role !== "delegue" && <Link href="/espace/soumission" className="btn-secondary">Récapitulatif et soumission ({pending.length})</Link>}
          <a className="btn-secondary" href="/api/export/needs?format=xlsx&scope=mine">Exporter (Excel)</a>
        </>} />
      {settings.campaignLocked && <div className="mb-4"><Notice tone="warn">La campagne est clôturée : la saisie est verrouillée.</Notice></div>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Réf.</th><th>Intitulé</th><th>Catégorie</th><th>Priorité</th><th className="text-right">Coût</th><th>Statut</th><th /></tr></thead>
          <tbody>
            {needs.map((n) => {
              const missing = needSubmittable(n);
              return (
                <tr key={n.id}>
                  <td className="whitespace-nowrap font-mono text-xs">{n.ref}</td>
                  <td>
                    <Link href={`/espace/besoins/${n.id}`} className="font-medium link">{n.title || "(sans titre)"}</Link>
                    {NEED_EDITABLE.has(n.status) && missing.length > 0 && <div className="text-xs text-amber-700">À compléter : {missing.join(", ")}</div>}
                    {n.reviewComment && n.status !== "valide" && <div className="text-xs text-slate-600">Analyste : {n.reviewComment}</div>}
                  </td>
                  <td className="text-xs">{label(CATEGORIES, n.categoryCode)}</td>
                  <td><Badge tone={n.priority}>{label(PRIORITIES, n.priority)}</Badge></td>
                  <td className="whitespace-nowrap text-right">{fmtMoney(n.totalCost, n.currency)}</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td className="whitespace-nowrap">
                    <div className="flex gap-1">
                      <form action={duplicateNeedAction}><input type="hidden" name="id" value={n.id} /><button className="btn-secondary btn-sm">Dupliquer</button></form>
                      {n.status === "brouillon" && <form action={deleteNeedAction}><input type="hidden" name="id" value={n.id} /><ConfirmButton message="Supprimer ce brouillon ?">Supprimer</ConfirmButton></form>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!needs.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">Aucun besoin pour l&apos;instant. <Link className="link" href="/espace/besoins/nouveau">Créer le premier</Link>.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
