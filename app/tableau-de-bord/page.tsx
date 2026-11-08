import Link from "next/link";
import { Building2, Download, FileSpreadsheet, FileText, Users, Wallet, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { computeStats, readFilters } from "@/lib/stats";
import { CATEGORIES, label, PRIORITIES } from "@/lib/referentials";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Columns, Donut, HBar, Timeline } from "@/components/Charts";
import { FilterBar } from "@/components/Filters";
import { Badge, fmtNum, fmtUsd, Kpi, PageTitle, SectionTitle, StatusBadge } from "@/components/ui";
import { needUsd } from "@/lib/rules";

export const metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await requireRole("analyste", "admin", "decideur");
  const f = readFilters(await searchParams);
  const s = await computeStats(f);
  const qs = new URLSearchParams(Object.entries(f) as [string, string][]).toString();
  const list = [...s.filtered].sort((a, b) => needUsd(b, s.rate) - needUsd(a, s.rate)).slice(0, 25);
  const byCount = [...s.byCategory].sort((a, b) => b.count - a.count);
  return (
    <div className="space-y-6">
      <AutoRefresh seconds={30} />
      <PageTitle eyebrow="Analyse nationale" title={`Bonjour, ${u.firstName}`} subtitle="Suivez les besoins numériques des administrations, en temps réel (actualisation toutes les 30 s)."
        actions={<>
          <a href={`/api/export/needs?format=xlsx&${qs}`} className="btn-secondary"><FileSpreadsheet size={16} />Excel</a>
          <a href={`/api/export/needs?format=csv&${qs}`} className="btn-secondary"><Download size={16} />CSV</a>
          <a href={`/api/note?${qs}`} className="btn-primary"><FileText size={16} />Note au Ministre</a>
        </>} />
      <FilterBar f={f} action="/tableau-de-bord" />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="card">
          <SectionTitle title="Synthèse" subtitle="Besoins par catégorie (nombre)" />
          <div className="panel !bg-white ring-1 ring-slate-100">
            <div className="flex divide-x divide-slate-100">
              <div className="flex-1 pr-4"><div className="text-xs text-slate-500">Coût total estimé</div><div className="font-display text-2xl font-bold">{fmtUsd(s.totalUsd)}</div></div>
              <div className="flex-1 pl-4"><div className="text-xs text-slate-500">Besoins critiques</div><div className="font-display text-2xl font-bold">{Math.round(s.criticalShare * 100)} %</div></div>
            </div>
            <Columns data={byCount} metric="count" highlight={3} height={190} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi tone="red" label="Coût total estimé" value={fmtUsd(s.totalUsd)} icon={<Wallet size={18} />} hint="Montants consolidés en USD" />
          <Kpi label="Structures" value={fmtNum(s.structures)} icon={<Building2 size={18} />} hint={`${fmtNum(s.responsables)} responsables identifiés`} />
          <Kpi label="Besoins exprimés" value={fmtNum(s.needs)} icon={<FileText size={18} />} hint="Soumis et validés" />
          <Kpi label="Coût moyen / structure" value={fmtUsd(s.avgPerStructure)} icon={<Users size={18} />} />
          <Kpi tone="blue" label="Besoins critiques" value={`${Math.round(s.criticalShare * 100)} %`} icon={<AlertTriangle size={18} />} hint={`${s.topCritical.length} dans le top 10`} />
          <Kpi tone="dark" label="Catégorie dominante" value={<span className="text-xl">{s.byCategory[0]?.label ?? "—"}</span>} hint={s.byCategory[0] ? fmtUsd(s.byCategory[0].amount) : undefined} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card"><SectionTitle title="Montant par catégorie" subtitle="USD — la catégorie la plus coûteuse en rouge" /><HBar data={s.byCategory} /></div>
        <div className="card"><SectionTitle title="Évolution des dépôts" subtitle="Cumul des structures et besoins" /><Timeline data={s.timeline} /></div>
        <div className="card"><SectionTitle title="Par province" subtitle="Montant (USD)" /><HBar data={s.byProvince} /></div>
        <div className="card"><SectionTitle title="Par type d'administration" subtitle="Montant (USD)" /><HBar data={s.byType} /></div>
        <div className="card"><SectionTitle title="Par priorité" subtitle="Nombre de besoins" /><Donut data={s.byPriority.filter((b) => b.count)} /></div>
        <div className="card"><SectionTitle title="Investissement / fonctionnement" subtitle="Montant (USD)" /><Donut data={s.byNature} metric="amount" /></div>
      </div>

      <div className="grid gap-6">
        <div className="card bg-brand-600 text-white">
          <h2 className="font-display text-lg font-bold">Besoins critiques</h2>
          <p className="text-xs text-brand-100">Top 10 par montant</p>
          <ol className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {s.topCritical.map((n, i) => (
              <li key={n.id} className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs">{i + 1}</span><span className="flex-1">{n.title}<span className="block text-xs text-brand-100">{n.structure}</span></span><span className="whitespace-nowrap font-display font-semibold">{fmtUsd(n.amountUsd)}</span></li>
            ))}
          </ol>
          {!s.topCritical.length && <p className="mt-4 text-sm text-brand-100">Aucun besoin critique.</p>}
        </div>
        <div className="card overflow-x-auto">
          <SectionTitle title="Liste détaillée" subtitle={`${s.filtered.length} besoins — 25 plus coûteux affichés — export complet en Excel/CSV`} />
          <table className="table">
            <thead><tr><th>Réf.</th><th>Structure</th><th>Besoin</th><th>Catégorie</th><th>Priorité</th><th className="text-right">USD</th><th>Statut</th></tr></thead>
            <tbody>
              {list.map((n) => {
                const st = s.structuresById.get(n.structureId);
                return (
                  <tr key={n.id} className="hover:bg-panel">
                    <td className="font-mono text-xs text-slate-500">{n.ref}</td>
                    <td className="text-xs"><span className="font-medium">{st?.acronym || st?.name}</span><span className="block text-slate-500">{st?.province}</span></td>
                    <td>{n.title}</td>
                    <td className="text-xs"><Link className="link" href={`/tableau-de-bord?category=${n.categoryCode}`}>{label(CATEGORIES, n.categoryCode)}</Link></td>
                    <td><Badge tone={n.priority}>{label(PRIORITIES, n.priority)}</Badge></td>
                    <td className="whitespace-nowrap text-right font-display font-semibold">{fmtUsd(needUsd(n, s.rate))}</td>
                    <td><StatusBadge status={n.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
