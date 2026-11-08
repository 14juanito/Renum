import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { NeedWizard } from "@/components/NeedWizard";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Nouveau besoin" };

export default async function Page() {
  const u = await requireRole("responsable", "delegue", "admin");
  if (!u.structureId) redirect("/espace/structure");
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Nouveau besoin" subtitle="Section D — un formulaire par besoin. Sauvegarde automatique sur l'appareil." />
      <NeedWizard rate={s.rateCdfPerUsd} />
    </div>
  );
}
