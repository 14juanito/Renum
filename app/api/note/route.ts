import { apiUser } from "@/lib/auth";
import { audit, getSettings } from "@/lib/db";
import { computeStats, readFilters } from "@/lib/stats";
import { writeSynthesis } from "@/lib/ai";
import { notePdf, money } from "@/lib/pdf";

export const maxDuration = 120;

export async function GET(req: Request) {
  const u = await apiUser("analyste", "admin", "decideur");
  if (!u) return new Response("Accès refusé", { status: 403 });
  const f = readFilters(Object.fromEntries(new URL(req.url).searchParams));
  const [stats, settings] = await Promise.all([computeStats(f), getSettings()]);
  const syn = await writeSynthesis(stats);
  const pdf = await notePdf({
    title: settings.campaignName,
    period: `${new Date(settings.campaignStart).toLocaleDateString("fr-FR")} – ${new Date(settings.campaignEnd).toLocaleDateString("fr-FR")}`,
    generatedBy: `${u.firstName} ${u.lastName}`,
    synthesis: syn.text,
    engine: syn.engine,
    kpis: [
      ["Structures recensées", String(stats.structures)],
      ["Responsables identifiés", String(stats.responsables)],
      ["Besoins exprimés", String(stats.needs)],
      ["Coût total estimé", money(stats.totalUsd)],
      ["Coût moyen par structure", money(stats.avgPerStructure)],
      ["Part des besoins critiques", `${Math.round(stats.criticalShare * 100)} %`],
    ],
    byCategory: stats.byCategory, byProvince: stats.byProvince, byType: stats.byType, top: stats.topCritical.length ? stats.topCritical : stats.topCostly,
  });
  await audit({ userId: u.id, email: u.email, action: "rapport.note_ministre", after: { filters: f, engine: syn.engine, model: syn.model } });
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="note-synthese-renum-${new Date().toISOString().slice(0, 10)}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
