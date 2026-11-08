import { requireRole } from "@/lib/auth";
import { getSettings, listNeeds } from "@/lib/db";
import { purgeDemoAction } from "@/app/actions/admin";
import { AdminTabs } from "@/components/AdminTabs";
import { SettingsForm } from "@/components/SettingsForm";
import { ConfirmButton } from "@/components/forms";
import { Notice, PageTitle } from "@/components/ui";
import { ADMIN_TYPES, CATEGORIES, PROVINCES } from "@/lib/referentials";

export const metadata = { title: "Paramètres" };

export default async function Page({ searchParams }: { searchParams: Promise<{ purged?: string }> }) {
  await requireRole("admin");
  const sp = await searchParams;
  const [s, needs] = await Promise.all([getSettings(), listNeeds()]);
  const demo = needs.filter((n) => n.demo).length;
  return (
    <div className="space-y-6">
      <div><PageTitle title="Paramètres et référentiels" /><AdminTabs current="/admin/parametres" admin /></div>
      {sp.purged && <Notice tone="ok">{sp.purged} enregistrement(s) de démonstration supprimés.</Notice>}
      <SettingsForm s={s} />
      <div className="card">
        <h2 className="font-semibold">Données de démonstration</h2>
        <p className="help mb-3">{demo} besoin(s) de démonstration présents. Purgez-les avant l&apos;ouverture officielle.</p>
        <form action={purgeDemoAction}><ConfirmButton className="btn-danger" message="Supprimer définitivement toutes les données de démonstration ?">Purger les données de démonstration</ConfirmButton></form>
      </div>
      <div className="card">
        <h2 className="font-semibold">Référentiels chargés</h2>
        <p className="help">Types d&apos;administration : {ADMIN_TYPES.length} · Catégories : {CATEGORIES.length} · Provinces : {PROVINCES.length}. Édition en ligne prévue en P2 (versionnement EF-REF-06) ; modification actuelle via <code>lib/referentials.ts</code>.</p>
      </div>
    </div>
  );
}
