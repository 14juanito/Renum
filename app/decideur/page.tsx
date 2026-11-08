import { requireRole } from "@/lib/auth";
import { computeStats } from "@/lib/stats";
import { writeSynthesis } from "@/lib/ai";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Donut, HBar } from "@/components/Charts";
import { fmtNum, fmtUsd, Kpi, PageTitle } from "@/components/ui";
import { templateSynthesis } from "@/lib/ai";

export const metadata = { title: "Vue décideur" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ ia?: string }> }) {
  await requireRole("decideur", "analyste", "admin");
  const { ia } = await searchParams;
  const s = await computeStats();
  const syn = ia === "1" ? await writeSynthesis(s) : { text: templateSynthesis(s), engine: "template" as const, model: "gabarit-v1" };
  return (
    <div className="space-y-6">
      <AutoRefresh seconds={60} />
      <PageTitle eyebrow="Synthèse stratégique" title="Vue décideur" subtitle="Synthèse stratégique — lecture seule, projetable en réunion."
        actions={<><a href="/api/note" className="btn-primary">Télécharger la note (PDF)</a><a href="?ia=1" className="btn-secondary">Rédaction assistée (IA)</a></>} />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi tone="blue" label="Structures recensées" value={fmtNum(s.structures)} />
        <Kpi label="Besoins exprimés" value={fmtNum(s.needs)} />
        <Kpi tone="red" label="Coût total estimé" value={fmtUsd(s.totalUsd)} />
        <Kpi tone="dark" label="Besoins critiques" value={`${Math.round(s.criticalShare * 100)} %`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card"><h2 className="mb-3 font-display text-lg font-bold">Où vont les besoins ? (USD)</h2><HBar data={s.byCategory.slice(0, 8)} /></div>
        <div className="card"><h2 className="mb-3 font-display text-lg font-bold">Répartition par province</h2><Donut data={s.byProvince.slice(0, 8)} /></div>
      </div>
      <div className="card">
        <h2 className="mb-1 font-display text-lg font-bold">Note de synthèse</h2>
        <p className="mb-3 text-xs text-slate-500">{syn.engine === "llm" ? `Rédaction assistée par IA (${syn.model}) à partir des seuls chiffres calculés — à relire.` : "Rédaction automatique par gabarit à partir des chiffres calculés."}</p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{syn.text}</div>
      </div>
    </div>
  );
}
