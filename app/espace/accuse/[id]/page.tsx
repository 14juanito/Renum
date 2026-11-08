import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, isStaff } from "@/lib/auth";
import { getSubmission } from "@/lib/db";
import { fmtDate, fmtUsd } from "@/components/ui";

export const metadata = { title: "Accusé de réception" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireRole();
  const { id } = await params;
  const sub = await getSubmission(id.slice(0, 40));
  if (!sub || (sub.structureId !== u.structureId && !isStaff(u.role))) notFound();
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
      <h1 className="mt-4 text-2xl font-bold text-brand-900">Soumission enregistrée</h1>
      <p className="mt-2 text-slate-600">Vos besoins ont été transmis à la cellule d&apos;analyse.</p>
      <div className="card mt-6 text-left text-sm">
        <p><strong>Référence :</strong> <span className="font-mono">{sub.ref}</span></p>
        <p><strong>Date :</strong> {fmtDate(sub.at)}</p>
        <p><strong>Besoins :</strong> {sub.needIds.length}</p>
        <p><strong>Total estimé :</strong> {fmtUsd(sub.totalUsd)}</p>
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <a href={`/api/receipt/${sub.id}`} className="btn-primary">Télécharger l&apos;accusé (PDF)</a>
        <Link href="/espace" className="btn-secondary">Retour à mon espace</Link>
      </div>
    </div>
  );
}
