import { requireRole } from "@/lib/auth";
import { AdminTabs } from "@/components/AdminTabs";
import { ImportForm } from "@/components/ImportForm";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Import" };

export default async function Page() {
  const u = await requireRole("admin", "analyste");
  return (
    <div className="space-y-6">
      <div><PageTitle title="Import du formulaire de secours" subtitle="EF-EVT-10 / EF-ANN-05 — rapport d'erreurs ligne par ligne." actions={<a href="/api/template" className="btn-secondary">Télécharger le modèle</a>} /><AdminTabs current="/admin/import" admin={u.role === "admin"} /></div>
      <ImportForm />
      <p className="help">Les structures sont rapprochées par nom ou sigle ; les besoins importés sont créés au statut « Soumis » avec le taux de change courant, et tracés dans le journal d&apos;audit.</p>
    </div>
  );
}
