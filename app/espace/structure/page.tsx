import { requireRole } from "@/lib/auth";
import { getStructure, listStructures } from "@/lib/db";
import { completeness, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED } from "@/lib/rules";
import { StructureForm } from "@/components/StructureForm";
import { Notice, PageTitle, Progress, StatusBadge } from "@/components/ui";

export const metadata = { title: "Fiche structure" };
const LABELS: Record<string, string> = { typeCode: "type", name: "nom", province: "province", city: "ville", email: "e-mail", acronym: "sigle", tutelle: "tutelle", address: "adresse", phone: "téléphone", staff: "effectif" };

export default async function Page() {
  const u = await requireRole("responsable", "delegue", "admin");
  const s = u.structureId ? await getStructure(u.structureId) : null;
  const known = (await listStructures()).filter((x) => x.status === "validee").map((x) => x.name).sort().slice(0, 500);
  const c = s ? completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED) : null;
  const readOnly = (s && ["validee", "archivee"].includes(s.status) && u.role !== "admin") || u.role === "delegue";
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Fiche de la structure" subtitle="Section A — identité, localisation et contacts de votre administration." actions={s && <StatusBadge status={s.status} />} />
      {c && (
        <div className="card mb-6">
          <div className="mb-2 flex justify-between text-sm"><span>Complétude</span><strong>{c.pct} %</strong></div>
          <Progress pct={c.pct} />
          {(c.missingRequired.length > 0 || c.missingRecommended.length > 0) && (
            <p className="help mt-2">Manquant : {[...c.missingRequired.map((k) => `${LABELS[k]} (obligatoire)`), ...c.missingRecommended.map((k) => LABELS[k])].join(", ")}</p>
          )}
        </div>
      )}
      {readOnly && <div className="mb-4"><Notice>Fiche en lecture seule {u.role === "delegue" ? "(rôle délégué)" : "(validée par la cellule d'analyse)"}.</Notice></div>}
      <StructureForm s={s} tutelles={known} readOnly={Boolean(readOnly)} />
    </div>
  );
}
