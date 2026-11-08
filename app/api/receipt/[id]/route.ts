import { apiUser, isStaff } from "@/lib/auth";
import { audit, getNeed, getStructure, getSubmission, getUser } from "@/lib/db";
import { CATEGORIES, label } from "@/lib/referentials";
import { receiptPdf } from "@/lib/pdf";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser();
  if (!u) return new Response("Non authentifié", { status: 401 });
  const { id } = await params;
  const sub = await getSubmission(id.slice(0, 40));
  if (!sub || (sub.structureId !== u.structureId && !isStaff(u.role))) return new Response("Introuvable", { status: 404 });
  const [s, author] = await Promise.all([getStructure(sub.structureId), getUser(sub.userId)]);
  const needs = (await Promise.all(sub.needIds.map(getNeed))).filter((n) => n !== null);
  const fmt = (v: number, c: string) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v) + " " + c;
  const pdf = await receiptPdf({
    ref: sub.ref, at: sub.at, structure: s ? `${s.name}${s.acronym ? ` (${s.acronym})` : ""}` : "—", province: s?.province ?? "",
    responsable: author ? `${author.firstName} ${author.lastName}` : "—", email: author?.email ?? "",
    needs: needs.map((n) => ({ ref: n.ref, title: n.title, category: label(CATEGORIES, n.categoryCode), amount: fmt(n.totalCost, n.currency), usd: n.amountUsd ?? 0 })),
    totalUsd: sub.totalUsd, rate: needs[0]?.rateApplied ?? 0,
  });
  await audit({ userId: u.id, email: u.email, action: "export.accuse", object: sub.id });
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="accuse-${sub.ref}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
