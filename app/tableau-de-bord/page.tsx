import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { computeStats, readFilters } from "@/lib/stats";
import { CATEGORIES, label, PRIORITIES } from "@/lib/referentials";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Donut, HBar, Timeline } from "@/components/Charts";
import { FilterBar } from "@/components/Filters";
import { Badge, fmtNum, fmtUsd, Kpi, PageTitle, StatusBadge } from "@/components/ui";
import { needUsd } from "@/lib/rules";

export const metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("analyste", "admin", "decideur");
  const f = readFilters(await searchParams);
  const s = await computeStats(f);
  const qs = new URLSearchParams(Object.entries(f) as [string, string][]).toString();
  const list = [...s.filtered].sort((a, b) => needUsd(b, s.rate) - needUsd(a, s.rate)).slice(0, 50);
  return (
    <div>
      <AutoRefresh seconds={30} />
      <PageTitle title="Tableau de bord analytique" subtitle="Besoins soumis et validés — montants consolidés en USD. Actualisation automatique toutes les 30 s."
        actions={<>
          <a href={`/api/export/needs?format=xlsx&${qs}`} className="btn-secondary">Excel</a>
          <a href={`/api/export/needs?format=csv&${qs}`} className="btn-secondary">CSV</a>
          <a href={`/api/note?${qs}`} className="btn-primary">Note au Ministre (PDF)</a>
        </>} />
      <FilterBar f={f} action="/tableau-de-bord" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Structures" value={fmtNum(s.structures)} />
        <Kpi label="Responsables" value={fmtNum(s.responsables)} />
        <Kpi label="Besoins" value={fmtNum(s.needs)} />
        <Kpi label="Coût total estimé" value={fmtUsd(s.totalUsd)} />
        <Kpi label="Coût moyen / structure" value={fmtUsd(s.avgPerStructure)} hint={`${Math.round(s.criticalShare * 100)} % de besoins critiques`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 font-semibold">Montant par catégorie</h2><HBar data={s.byCategory} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Nombre de besoins par catégorie</h2><Donut data={s.byCategory} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Par type d&apos;administration</h2><HBar data={s.byType} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Par province</h2><HBar data={s.byProvince} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Par priorité</h2><Donut data={s.byPriority.filter((b) => b.count)} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Évolution des dépôts</h2><Timeline data={s.timeline} /></div>
        <div className="card"><h2 className="mb-2 font-semibold">Investissement / fonctionnement</h2><Donut data={s.byNature} metric="amount" /></div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Besoins critiques (top 10)</h2>
          <ol className="space-y-1 text-sm">{s.topCritical.map((n) => <li key={n.id} className="flex justify-between gap-2"><span>{n.title} <span className="text-slate-500">— {n.structure}</span></span><span className="whitespace-nowrap font-medium">{fmtUsd(n.amountUsd)}</span></li>)}</ol>
          {!s.topCritical.length && <p className="text-sm text-slate-500">Aucun besoin critique.</p>}
        </div>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <h2 className="mb-3 font-semibold">Liste détaillée ({s.filtered.length}, 50 plus coûteux affichés)</h2>
        <table className="table">
          <thead><tr><th>Réf.</th><th>Structure</th><th>Besoin</th><th>Catégorie</th><th>Priorité</th><th className="text-right">USD</th><th>Statut</th></tr></thead>
          <tbody>
            {list.map((n) => {
              const st = s.structuresById.get(n.structureId);
              return (
                <tr key={n.id}>
                  <td className="font-mono text-xs">{n.ref}</td>
                  <td className="text-xs">{st?.acronym || st?.name} <span className="text-slate-500">({st?.province})</span></td>
                  <td>{n.title}</td>
                  <td className="text-xs"><Link className="link" href={`/tableau-de-bord?category=${n.categoryCode}`}>{label(CATEGORIES, n.categoryCode)}</Link></td>
                  <td><Badge tone={n.priority}>{label(PRIORITIES, n.priority)}</Badge></td>
                  <td className="text-right">{fmtUsd(needUsd(n, s.rate))}</td>
                  <td><StatusBadge status={n.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
