import { requireRole, isStaff } from "@/lib/auth";
import { listStructures, listUsers } from "@/lib/db";
import { ADMIN_TYPES, label, PROVINCES, STRUCTURE_STATUS } from "@/lib/referentials";
import { completeness, STRUCTURE_RECOMMENDED, STRUCTURE_REQUIRED } from "@/lib/rules";
import { PageTitle, Progress, StatusBadge } from "@/components/ui";

export const metadata = { title: "Annuaire" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const u = await requireRole();
  const sp = await searchParams;
  const q = (sp.q ?? "").toLowerCase().slice(0, 100);
  const [structures, users] = await Promise.all([listStructures(), listUsers()]);
  const staff = isStaff(u.role) || u.role === "decideur";
  // Responsables : uniquement les fiches validées (+ la leur) ; staff : tout sauf archivées
  const visible = structures.filter((s) => s.status !== "archivee" && (staff || s.status === "validee" || s.id === u.structureId));
  const list = visible
    .filter((s) => (!sp.type || s.typeCode === sp.type) && (!sp.province || s.province === sp.province) && (!sp.status || s.status === sp.status))
    .filter((s) => !q || `${s.name} ${s.acronym ?? ""} ${s.city} ${s.tutelle ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <div>
      <PageTitle title="Annuaire des structures et responsables" subtitle={`${list.length} structure(s). Coordonnées visibles uniquement avec le consentement du responsable.`}
        actions={staff && <><a className="btn-secondary" href="/api/export/annuaire?format=xlsx">Excel</a><a className="btn-secondary" href="/api/export/annuaire?format=csv">CSV</a></>} />
      <form className="card mb-6 grid gap-3 sm:grid-cols-5" role="search">
        <input name="q" defaultValue={sp.q} className="input sm:col-span-2" placeholder="Nom, sigle, ville, tutelle…" aria-label="Recherche" />
        <select name="type" defaultValue={sp.type ?? ""} className="select" aria-label="Type"><option value="">Tous types</option>{ADMIN_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
        <select name="province" defaultValue={sp.province ?? ""} className="select" aria-label="Province"><option value="">Toutes provinces</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select>
        {staff ? <select name="status" defaultValue={sp.status ?? ""} className="select" aria-label="Statut"><option value="">Tous statuts</option>{Object.entries(STRUCTURE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : <span />}
        <button className="btn-primary sm:col-span-5 sm:justify-self-start">Rechercher</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => {
          const r = users.find((x) => x.structureId === s.id && x.role === "responsable");
          const showContact = r && (r.consentPublish || u.role === "admin");
          const c = completeness(s, STRUCTURE_REQUIRED, STRUCTURE_RECOMMENDED);
          return (
            <article key={s.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-tight">{s.name}{s.acronym && <span className="text-slate-500"> ({s.acronym})</span>}</h2>
                {staff && <StatusBadge status={s.status} />}
              </div>
              <p className="text-xs text-slate-600">{label(ADMIN_TYPES, s.typeCode)} · {s.city}, {s.province}</p>
              {s.tutelle && <p className="text-xs text-slate-600">Tutelle : {s.tutelle}</p>}
              <div className="border-t pt-2 text-sm">
                {r ? (
                  <>
                    <p className="font-medium">{r.civility} {r.firstName} {r.lastName}</p>
                    <p className="text-xs text-slate-600">{r.title}</p>
                    {showContact ? <p className="text-xs">{r.email}{r.phone && ` · ${r.phone}`}</p> : <p className="text-xs italic text-slate-500">Coordonnées non publiées</p>}
                  </>
                ) : <p className="text-xs italic text-slate-500">Responsable non renseigné</p>}
              </div>
              {staff && <div><div className="mb-1 flex justify-between text-xs"><span>Complétude</span><span>{c.pct} %</span></div><Progress pct={c.pct} /></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
