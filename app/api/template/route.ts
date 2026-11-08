import { ADMIN_TYPES, CATEGORIES, PRIORITIES, PROVINCES } from "@/lib/referentials";

/** Modèle Excel du mode de secours (EF-EVT-10) — saisie hors ligne puis import par un analyste. */
export async function GET() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Saisie");
  ws.columns = [
    "Nom officiel de la structure", "Sigle", "Code type (T01-T10)", "Province", "Ville / commune", "E-mail institutionnel",
    "Intitulé du besoin", "Code catégorie (B01-B12)", "Description", "Quantité", "Coût unitaire", "Devise (USD/CDF)", "Priorité (critique/haute/moyenne/basse)",
  ].map((h) => ({ header: h, width: Math.max(16, h.length + 2) }));
  ws.getRow(1).font = { bold: true };
  ws.addRow(["Direction Générale Exemple", "DGE", "T03", "Kinshasa", "Gombe", "contact@exemple.cd", "Acquisition de postes de travail", "B01", "Achat de 10 ordinateurs pour le service courrier du siège", 10, 800, "USD", "haute"]);
  const ref = wb.addWorksheet("Référentiels");
  ref.addRow(["Types"]); ADMIN_TYPES.forEach((t) => ref.addRow([t.code, t.label]));
  ref.addRow([]); ref.addRow(["Catégories"]); CATEGORIES.forEach((c) => ref.addRow([c.code, c.label]));
  ref.addRow([]); ref.addRow(["Priorités"]); PRIORITIES.forEach((p) => ref.addRow([p.code, p.label]));
  ref.addRow([]); ref.addRow(["Provinces"]); PROVINCES.forEach((p) => ref.addRow([p]));
  const buf = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buf), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="renum-formulaire-secours.xlsx"' },
  });
}
