import { computeStats } from "@/lib/stats";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Données agrégées de l'écran live (EF-EVT-02). Agrégats uniquement, aucune donnée personnelle. */
export async function GET() {
  const settings = await getSettings();
  const s = await computeStats();
  return Response.json(
    {
      campaign: settings.campaignName,
      structures: s.structures,
      needs: s.needs,
      totalUsd: Math.round(s.totalUsd),
      byCategory: s.byCategory.slice(0, 8).map((c) => ({ label: c.label, count: c.count, amount: Math.round(c.amount) })),
      byProvince: s.byProvince.slice(0, 10).map((c) => ({ label: c.label, count: c.count })),
      latest: s.latest.map((l) => ({ name: l.name, province: l.province, at: l.at })),
      at: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
