import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSettings, getStructure, listSubmissions, needsOfStructure } from "@/lib/db";
import { completeness, needUsd, PROFILE_RECOMMENDED, PROFILE_REQUIRED, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED } from "@/lib/rules";
import { fmtDate, fmtUsd, Kpi, Notice, PageTitle, Progress, StatusBadge } from "@/components/ui";

export const metadata = { title: "Mon espace" };

export default async function Espace() {
  const u = await requireRole("responsable", "delegue", "admin");
  const [s, settings] = await Promise.all([u.structureId ? getStructure(u.structureId) : null, getSettings()]);
  const needs = s ? await needsOfStructure(s.id) : [];
  const subs = s ? (await listSubmissions()).filter((x) => x.structureId === s.id).sort((a, b) => b.at.localeCompare(a.at)) : [];
  const sc = s ? completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED) : { pct: 0, complete: false };
  const pc = completeness(u, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  const total = needs.filter((n) => n.status !== "rejete").reduce((a, n) => a + needUsd(n, settings.rateCdfPerUsd), 0);
  const drafts = needs.filter((n) => ["brouillon", "a_completer"].includes(n.status));
  const steps = [
    { done: sc.complete, label: "Fiche de la structure", href: "/espace/structure", pct: sc.pct },
    { done: pc.complete, label: "Ma fiche de responsable", href: "/espace/profil", pct: pc.pct },
    { done: needs.length > 0, label: "Saisie des besoins", href: "/espace/besoins", pct: needs.length ? 100 : 0 },
    { done: needs.length > 0 && drafts.length === 0, label: "Soumission", href: "/espace/soumission", pct: needs.length && !drafts.length ? 100 : 0 },
  ];
  return (
    <div>
      <PageTitle title={`Bonjour ${u.firstName}`} subtitle={s ? `${s.name}${s.acronym ? ` (${s.acronym})` : ""}` : "Commencez par décrire votre structure."}
        actions={<Link href="/espace/besoins/nouveau" className="btn-primary">+ Nouveau besoin</Link>} />
      {s?.status === "a_completer" && <div className="mb-4"><Notice tone="warn">La cellule d&apos;analyse demande des compléments sur votre fiche structure : {s.reviewComment}</Notice></div>}
      {needs.some((n) => n.status === "a_completer") && <div className="mb-4"><Notice tone="warn">Certains besoins ont été renvoyés pour complément. Corrigez-les puis soumettez à nouveau.</Notice></div>}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Statut de la fiche" value={s ? <StatusBadge status={s.status} /> : "—"} />
        <Kpi label="Besoins déposés" value={needs.length} hint={`${drafts.length} à soumettre`} />
        <Kpi label="Total estimé" value={fmtUsd(total)} hint="Converti en USD" />
        <Kpi label="Dernière soumission" value={<span className="text-base">{subs[0] ? fmtDate(subs[0].at) : "—"}</span>} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Votre progression</h2>
      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((st, i) => (
          <li key={st.label}>
            <Link href={st.href} className="card block hover:border-brand-500">
              <div className="flex items-center justify-between text-sm"><span className="font-semibold">{i + 1}. {st.label}</span><span>{st.done ? "✓" : `${st.pct} %`}</span></div>
              <div className="mt-3"><Progress pct={st.pct} /></div>
            </Link>
          </li>
        ))}
      </ol>
      {subs.length > 0 && (
        <div className="card mt-8">
          <h2 className="mb-3 font-semibold">Accusés de réception</h2>
          <ul className="space-y-2 text-sm">
            {subs.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2">
                <span><strong>{x.ref}</strong> — {fmtDate(x.at)} — {x.needIds.length} besoin(s) — {fmtUsd(x.totalUsd)}</span>
                <a className="link" href={`/api/receipt/${x.id}`}>Télécharger le PDF</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
