import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getSettings, getStructure, needsOfStructure } from "@/lib/db";
import { CATEGORIES, label } from "@/lib/referentials";
import { completeness, NEED_EDITABLE, needSubmittable, PROFILE_RECOMMENDED, PROFILE_REQUIRED, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED, toUsd } from "@/lib/rules";
import { submitAction } from "@/app/actions/espace";
import { ActionForm, Submit } from "@/components/forms";
import { fmtMoney, fmtUsd, Notice, PageTitle } from "@/components/ui";

export const metadata = { title: "Soumission" };

export default async function Page() {
  const u = await requireRole("responsable", "admin");
  if (!u.structureId) redirect("/espace/structure");
  const [s, settings] = await Promise.all([getStructure(u.structureId), getSettings()]);
  if (!s) redirect("/espace/structure");
  const needs = (await needsOfStructure(s.id)).filter((n) => NEED_EDITABLE.has(n.status));
  const sc = completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED);
  const pc = completeness(u, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  const byCat = new Map<string, number>();
  let total = 0;
  for (const n of needs) {
    const usd = toUsd(n.totalCost, n.currency, settings.rateCdfPerUsd);
    total += usd;
    byCat.set(n.categoryCode, (byCat.get(n.categoryCode) ?? 0) + usd);
  }
  const blockers = [
    !sc.complete && <>Fiche structure incomplète — <Link className="link" href="/espace/structure">compléter</Link></>,
    !pc.complete && <>Fiche responsable incomplète (dont consentement) — <Link className="link" href="/espace/profil">compléter</Link></>,
    ...needs.filter((n) => needSubmittable(n).length).map((n) => <>« {n.title || n.ref} » : {needSubmittable(n).join(", ")} — <Link className="link" href={`/espace/besoins/${n.id}`}>corriger</Link></>),
  ].filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Récapitulatif et soumission" subtitle="Section E — vérifiez vos besoins avant la soumission définitive." />
      {!needs.length ? <Notice>Aucun besoin en attente de soumission.</Notice> : (
        <div className="space-y-6">
          <div className="card">
            <table className="table">
              <thead><tr><th>Besoin</th><th>Catégorie</th><th className="text-right">Montant</th></tr></thead>
              <tbody>
                {needs.map((n) => <tr key={n.id}><td>{n.title}</td><td className="text-xs">{label(CATEGORIES, n.categoryCode)}</td><td className="text-right">{fmtMoney(n.totalCost, n.currency)}</td></tr>)}
              </tbody>
            </table>
            <h3 className="mt-6 font-semibold">Total par catégorie (USD)</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => <li key={c} className="flex justify-between"><span>{label(CATEGORIES, c)}</span><span>{fmtUsd(v)}</span></li>)}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-3 text-lg font-bold"><span>Total général</span><span>{fmtUsd(total)}</span></div>
            <p className="help">Taux appliqué : {settings.rateCdfPerUsd} CDF pour 1 USD (figé dans chaque fiche à la soumission).</p>
          </div>
          {blockers.length > 0 ? (
            <Notice tone="warn"><strong>Soumission impossible :</strong><ul className="ml-5 mt-1 list-disc">{blockers.map((b, i) => <li key={i}>{b}</li>)}</ul></Notice>
          ) : (
            <ActionForm action={submitAction} className="card space-y-3">
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="certify" required className="mt-1" /> Je certifie l&apos;exactitude des informations fournies.</label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="consentAnalysis" required className="mt-1" /> J&apos;accepte l&apos;utilisation de ces données pour l&apos;analyse nationale des besoins numériques.</label>
              <Submit>Soumettre définitivement ({needs.length} besoin{needs.length > 1 ? "s" : ""})</Submit>
            </ActionForm>
          )}
        </div>
      )}
    </div>
  );
}
