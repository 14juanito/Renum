import Link from "next/link";
import { AlertTriangle, Building2, FileText, UserPlus, ShieldCheck } from "lucide-react";
import { Columns } from "@/components/Charts";
import { CATEGORIES } from "@/lib/referentials";
import { requireRole } from "@/lib/auth";
import { getSettings, listNeeds, listStructures, listUsers, storageKind } from "@/lib/db";
import { costOutliers, needUsd } from "@/lib/rules";
import { AdminTabs } from "@/components/AdminTabs";
import { fmtDate, fmtNum, Kpi, Notice, PageTitle, Progress, SectionTitle } from "@/components/ui";

export const metadata = { title: "Back-office" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requireRole("analyste", "admin");
  const [needs, structures, users, settings] = await Promise.all([listNeeds(), listStructures(), listUsers(), getSettings()]);
  const day = Date.now() - 86400_000;
  const pendingStruct = structures.filter((s) => s.status === "soumise" || s.isNewRequest);
  const pendingNeeds = needs.filter((n) => n.status === "soumis" || n.status === "en_revue");
  const newUsers = users.filter((x) => new Date(x.createdAt).getTime() > day);
  const outliers = new Set<string>();
  const byCat = new Map<string, { id: string; v: number }[]>();
  for (const n of needs.filter((x) => x.status !== "brouillon")) byCat.set(n.categoryCode, [...(byCat.get(n.categoryCode) ?? []), { id: n.id, v: needUsd(n, settings.rateCdfPerUsd) }]);
  for (const vals of byCat.values()) for (const id of costOutliers(vals)) outliers.add(id);
  const lowConf = needs.filter((n) => n.ai && n.ai.confidence < settings.aiConfidenceThreshold && !n.ai.decision && n.status !== "brouillon");
  // EF-ADM-11 : couverture
  const active = structures.filter((s) => s.status !== "archivee");
  const withNeeds = new Set(needs.filter((n) => n.status !== "brouillon").map((n) => n.structureId));
  const cov = [
    ["Inscrites", active.length],
    ["Fiche soumise ou validée", active.filter((s) => ["soumise", "validee"].includes(s.status)).length],
    ["Ayant soumis des besoins", active.filter((s) => withNeeds.has(s.id)).length],
    ["Validées", active.filter((s) => s.status === "validee").length],
  ] as const;
  const noNeeds = active.filter((s) => !withNeeds.has(s.id));
  const covMax = Math.max(1, cov[0][1]);
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Back-office" title={`Bonjour, ${u.firstName}`} subtitle={`Connecté en tant que ${u.role === "admin" ? "administrateur" : "analyste"} — pilotez la collecte et la validation.`}
        actions={<><Link href="/admin/validation" className="btn-primary"><ShieldCheck size={16} />File de validation</Link><Link href="/tableau-de-bord" className="btn-secondary">Tableau de bord</Link></>} />
      <div className="space-y-2">
        {storageKind() === "file" && <Notice tone="warn">Stockage local de développement actif : configurez DATABASE_URL ou BLOB_READ_WRITE_TOKEN.</Notice>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi tone="red" label="Besoins en attente" value={<Link href="/admin/validation">{pendingNeeds.length}</Link>} icon={<FileText size={18} />} hint="À valider" />
        <Kpi label="Fiches en attente" value={<Link href="/admin/validation">{pendingStruct.length}</Link>} icon={<Building2 size={18} />} hint="Structures soumises ou doublons" />
        <Kpi label="Inscriptions (24 h)" value={fmtNum(newUsers.length)} icon={<UserPlus size={18} />} />
        <Kpi tone="dark" label="Alertes" value={outliers.size + lowConf.length} icon={<AlertTriangle size={18} />} hint={`${outliers.size} montant(s) atypique(s) · ${lowConf.length} classement(s) à revoir`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <SectionTitle title="Couverture de la collecte" subtitle="EF-ADM-11" />
          <div className="space-y-4">
            {cov.map(([k, v]) => (
              <div key={k}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{k}</span><strong className="font-display">{v}</strong></div>
                <Progress pct={Math.round((Number(v) / covMax) * 100)} />
              </div>
            ))}
          </div>
          {noNeeds.length > 0 && (
            <details className="mt-5 rounded-2xl bg-panel p-4 text-sm"><summary className="cursor-pointer font-display font-semibold">{noNeeds.length} structure(s) sans besoin soumis (à relancer)</summary>
              <ul className="mt-2 list-disc pl-5 text-xs">{noNeeds.slice(0, 30).map((s) => <li key={s.id}>{s.name} — {s.email}</li>)}</ul>
            </details>
          )}
        </div>
        <div className="card">
          <SectionTitle title="Volume par catégorie" subtitle="Besoins soumis" />
          <Columns data={[...byCat.entries()].map(([code, v]) => ({ label: CATEGORIES.find((c) => c.code === code)?.label ?? code, count: v.length, amount: 0 })).sort((a, b) => b.count - a.count)} highlight={2} height={170} />
          <SectionTitle title="Dernières inscriptions" />
          <ul className="space-y-2 text-sm">{[...users].filter((x) => !x.demo).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((x) => (
            <li key={x.id} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand-600">{x.firstName[0]}{x.lastName[0]}</span><span className="flex-1">{x.firstName} {x.lastName}<span className="block text-xs text-slate-500">{x.email}</span></span><span className="whitespace-nowrap text-xs text-slate-500">{fmtDate(x.createdAt)}</span></li>
          ))}</ul>
        </div>
      </div>
    </div>
  );
}
