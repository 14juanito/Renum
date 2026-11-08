import Link from "next/link";
import { CheckCircle2, Circle, FileDown, FileText, Plus, Wallet, Building2, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSettings, getStructure, listSubmissions, needsOfStructure } from "@/lib/db";
import { CATEGORIES, label } from "@/lib/referentials";
import { completeness, needUsd, PROFILE_RECOMMENDED, PROFILE_REQUIRED, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED } from "@/lib/rules";
import { Columns } from "@/components/Charts";
import { fmtDate, fmtUsd, Kpi, Notice, PageTitle, Progress, SectionTitle, StatusBadge } from "@/components/ui";

export const metadata = { title: "Mon espace" };

export default async function Espace() {
  const u = await requireRole("responsable", "delegue", "admin");
  const [s, settings] = await Promise.all([u.structureId ? getStructure(u.structureId) : null, getSettings()]);
  const needs = s ? await needsOfStructure(s.id) : [];
  const subs = s ? (await listSubmissions()).filter((x) => x.structureId === s.id).sort((a, b) => b.at.localeCompare(a.at)) : [];
  const sc = s ? completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED) : { pct: 0, complete: false };
  const pc = completeness(u, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  const rate = settings.rateCdfPerUsd;
  const total = needs.filter((n) => n.status !== "rejete").reduce((a, n) => a + needUsd(n, rate), 0);
  const drafts = needs.filter((n) => ["brouillon", "a_completer"].includes(n.status));
  const steps = [
    { done: sc.complete, label: "Fiche de la structure", href: "/espace/structure", pct: sc.pct },
    { done: pc.complete, label: "Ma fiche de responsable", href: "/espace/profil", pct: pc.pct },
    { done: needs.length > 0, label: "Saisie des besoins", href: "/espace/besoins", pct: needs.length ? 100 : 0 },
    { done: needs.length > 0 && drafts.length === 0, label: "Soumission", href: "/espace/soumission", pct: needs.length && !drafts.length ? 100 : 0 },
  ];
  const global = Math.round(steps.reduce((a, x) => a + x.pct, 0) / steps.length);
  const byCat = CATEGORIES.map((c) => {
    const items = needs.filter((n) => n.categoryCode === c.code);
    return { label: c.label, count: items.length, amount: items.reduce((a, n) => a + needUsd(n, rate), 0) };
  }).filter((x) => x.count).sort((a, b) => b.amount - a.amount);
  const recent = [...needs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Mon espace" title={`Bonjour, ${u.firstName}`} subtitle={s ? `${s.name}${s.acronym ? ` (${s.acronym})` : ""} — suivez votre recensement et vos besoins.` : "Commencez par décrire votre structure."}
        actions={<><Link href="/espace/structure" className="btn-secondary"><Building2 size={16} />Ma structure</Link><Link href="/espace/besoins/nouveau" className="btn-primary"><Plus size={16} />Nouveau besoin</Link></>} />
      {s?.status === "a_completer" && <Notice tone="warn">La cellule d&apos;analyse demande des compléments sur votre fiche structure : {s.reviewComment}</Notice>}
      {needs.some((n) => n.status === "a_completer") && <Notice tone="warn">Certains besoins ont été renvoyés pour complément. Corrigez-les puis soumettez à nouveau.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_2fr]">
        <div className="card">
          <SectionTitle title="Ma progression" subtitle={`${global} % du parcours complété`} />
          <div className="mb-5"><Progress pct={global} /></div>
          <ol className="space-y-2">
            {steps.map((st, i) => (
              <li key={st.label}>
                <Link href={st.href} className="flex items-center gap-3 rounded-2xl bg-panel px-4 py-3 hover:bg-brand-50">
                  {st.done ? <CheckCircle2 size={20} className="text-gov-green" /> : <Circle size={20} className="text-slate-300" />}
                  <span className="flex-1 font-display text-sm font-semibold">{i + 1}. {st.label}</span>
                  <span className="text-xs text-slate-500">{st.done ? "Terminé" : `${st.pct} %`}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Kpi tone="red" label="Total estimé" value={fmtUsd(total)} icon={<Wallet size={18} />} hint="Converti en USD" />
          <Kpi label="Besoins déposés" value={needs.length} icon={<FileText size={18} />} hint={`${drafts.length} à soumettre`} />
          <Kpi tone="blue" label="Statut de la fiche" value={<span className="text-xl">{s ? (s.status === "validee" ? "Validée" : s.status === "soumise" ? "Soumise" : s.status === "a_completer" ? "À compléter" : "Brouillon") : "—"}</span>} icon={<Building2 size={18} />} hint={s ? `Complétude ${sc.pct} %` : undefined} />
          <Kpi label="Dernière soumission" value={<span className="text-xl">{subs[0] ? fmtDate(subs[0].at) : "—"}</span>} icon={<Clock size={18} />} hint={subs[0]?.ref} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card overflow-x-auto">
          <SectionTitle title="Activités récentes" subtitle="Vos derniers besoins" action={<Link href="/espace/besoins" className="btn-secondary btn-sm">Tout voir</Link>} />
          <table className="table">
            <thead><tr><th>Réf.</th><th>Besoin</th><th>Catégorie</th><th className="text-right">USD</th><th>Statut</th></tr></thead>
            <tbody>
              {recent.map((n) => (
                <tr key={n.id} className="hover:bg-panel">
                  <td className="font-mono text-xs text-slate-500">{n.ref}</td>
                  <td><Link href={`/espace/besoins/${n.id}`} className="font-medium hover:underline">{n.title || "(sans titre)"}</Link></td>
                  <td className="text-xs">{label(CATEGORIES, n.categoryCode)}</td>
                  <td className="text-right font-display font-semibold">{fmtUsd(needUsd(n, rate))}</td>
                  <td><StatusBadge status={n.status} /></td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">Aucun besoin. <Link className="link" href="/espace/besoins/nouveau">Créer le premier</Link></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card">
          <SectionTitle title="Répartition" subtitle="Montant par catégorie" />
          {byCat.length ? <Columns data={byCat} metric="amount" highlight={1} height={180} /> : <p className="text-sm text-slate-500">Pas encore de données.</p>}
          {subs.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="font-display text-sm font-semibold">Accusés de réception</div>
              {subs.slice(0, 3).map((x) => (
                <a key={x.id} href={`/api/receipt/${x.id}`} className="flex items-center gap-3 rounded-2xl bg-panel px-3 py-2 text-xs hover:bg-brand-50">
                  <FileDown size={16} className="text-flag-red" /><span className="flex-1"><span className="font-mono">{x.ref}</span><span className="block text-slate-500">{fmtDate(x.at)} · {fmtUsd(x.totalUsd)}</span></span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
