import { requireRole } from "@/lib/auth";
import { computeStats } from "@/lib/stats";
import { writeSynthesis } from "@/lib/ai";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Donut, HBar } from "@/components/Charts";
import { fmtNum, fmtUsd, PageTitle } from "@/components/ui";
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
      <PageTitle title="Vue décideur" subtitle="Synthèse stratégique — lecture seule, projetable en réunion."
        actions={<><a href="/api/note" className="btn-primary">Télécharger la note (PDF)</a><a href="?ia=1" className="btn-secondary">Rédaction assistée (IA)</a></>} />
      <div className="grid gap-4 md:grid-cols-4">
        {[["Structures recensées", fmtNum(s.structures)], ["Besoins exprimés", fmtNum(s.needs)], ["Coût total estimé", fmtUsd(s.totalUsd)], ["Besoins critiques", `${Math.round(s.criticalShare * 100)} %`]].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-brand-900 p-6 text-white"><div className="text-sm text-brand-100">{k}</div><div className="mt-2 text-4xl font-extrabold">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card"><h2 className="mb-2 text-lg font-semibold">Où vont les besoins ? (USD)</h2><HBar data={s.byCategory.slice(0, 8)} /></div>
        <div className="card"><h2 className="mb-2 text-lg font-semibold">Répartition par province</h2><Donut data={s.byProvince.slice(0, 8)} /></div>
      </div>
      <div className="card">
        <h2 className="mb-1 text-lg font-semibold">Note de synthèse</h2>
        <p className="mb-3 text-xs text-slate-500">{syn.engine === "llm" ? `Rédaction assistée par IA (${syn.model}) à partir des seuls chiffres calculés — à relire.` : "Rédaction automatique par gabarit à partir des chiffres calculés."}</p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{syn.text}</div>
      </div>
    </div>
  );
}
