import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSettings, listNeeds, listStructures, listUsers, storageKind } from "@/lib/db";
import { llmEnabled } from "@/lib/ai";
import { emailEnabled } from "@/lib/email";
import { costOutliers, needUsd } from "@/lib/rules";
import { AdminTabs } from "@/components/AdminTabs";
import { fmtDate, fmtNum, Kpi, Notice, PageTitle } from "@/components/ui";

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
  return (
    <div>
      <PageTitle title="Back-office" subtitle={`Connecté en tant que ${u.role === "admin" ? "administrateur" : "analyste"}.`} />
      <AdminTabs current="/admin" admin={u.role === "admin"} />
      <div className="mb-6 grid gap-2">
        {storageKind() === "file" && <Notice tone="warn">Stockage local de développement actif : configurez DATABASE_URL ou BLOB_READ_WRITE_TOKEN.</Notice>}
        {!emailEnabled() && <Notice tone="warn">E-mail transactionnel non configuré (RESEND_API_KEY, EMAIL_FROM) : mode démonstration.</Notice>}
        <Notice>Moteur IA : {llmEnabled() ? `modèle de langage (${process.env.AI_MODEL || "claude-opus-5-5"})` : "classifieur local par mots-clés (ANTHROPIC_API_KEY non configurée)"} · Persistance : {storageKind()}</Notice>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Nouvelles inscriptions (24 h)" value={fmtNum(newUsers.length)} />
        <Kpi label="Fiches en attente" value={<Link className="link" href="/admin/validation">{pendingStruct.length}</Link>} />
        <Kpi label="Besoins en attente" value={<Link className="link" href="/admin/validation">{pendingNeeds.length}</Link>} />
        <Kpi label="Alertes" value={outliers.size + lowConf.length} hint={`${outliers.size} montant(s) atypique(s) · ${lowConf.length} classement(s) à revoir`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Couverture de la collecte</h2>
          <ul className="space-y-2 text-sm">{cov.map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></li>)}</ul>
          {noNeeds.length > 0 && (
            <details className="mt-4 text-sm"><summary className="cursor-pointer text-slate-600">{noNeeds.length} structure(s) sans besoin soumis (à relancer)</summary>
              <ul className="mt-2 list-disc pl-5">{noNeeds.slice(0, 30).map((s) => <li key={s.id}>{s.name} — {s.email}</li>)}</ul>
            </details>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Dernières inscriptions</h2>
          <ul className="space-y-1 text-sm">{[...users].filter((x) => !x.demo).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map((x) => <li key={x.id} className="flex justify-between gap-2"><span>{x.firstName} {x.lastName} <span className="text-slate-500">({x.email})</span></span><span className="whitespace-nowrap text-xs text-slate-500">{fmtDate(x.createdAt)}</span></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
