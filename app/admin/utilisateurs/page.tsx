import { requireRole } from "@/lib/auth";
import { listStructures, listUsers } from "@/lib/db";
import { ROLES } from "@/lib/referentials";
import { updateUserAction } from "@/app/actions/admin";
import { AdminTabs } from "@/components/AdminTabs";
import { AssistedForm } from "@/components/AssistedForm";
import { fmtDate, Notice, PageTitle } from "@/components/ui";

export const metadata = { title: "Utilisateurs" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; err?: string }> }) {
  const u = await requireRole("admin", "analyste");
  const sp = await searchParams;
  const admin = u.role === "admin";
  const [users, structures] = await Promise.all([listUsers(), listStructures()]);
  const q = (sp.q ?? "").toLowerCase();
  const list = users.filter((x) => !x.demo && (!sp.role || x.role === sp.role) && (!q || `${x.email} ${x.firstName} ${x.lastName}`.toLowerCase().includes(q))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sOpts = structures.filter((s) => s.status !== "archivee").sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <div className="space-y-6">
      <div>
        <PageTitle title={admin ? "Gestion des utilisateurs" : "Saisie assistée"} actions={admin && <a className="btn-secondary" href="/api/export/users?format=xlsx">Exporter</a>} />
        <AdminTabs current="/admin/utilisateurs" admin={admin} />
      </div>
      {sp.err === "self" && <Notice tone="error">Vous ne pouvez pas retirer vos propres droits d&apos;administrateur.</Notice>}
      <AssistedForm admin={admin} />
      {admin && (
        <>
          <form className="flex flex-wrap gap-2" role="search">
            <input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="Rechercher…" aria-label="Recherche" />
            <select name="role" defaultValue={sp.role ?? ""} className="select max-w-xs" aria-label="Rôle"><option value="">Tous rôles</option>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <button className="btn-secondary">Filtrer</button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="table">
              <thead><tr><th>Utilisateur</th><th>Dernière connexion</th><th>Rôle · statut · structure</th></tr></thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td><div className="font-medium">{x.firstName} {x.lastName}</div><div className="text-xs text-slate-500">{x.email}{!x.emailVerified && " · non vérifié"}{x.lockedUntil && new Date(x.lockedUntil) > new Date() && " · verrouillé"}</div></td>
                    <td className="text-xs">{fmtDate(x.lastLoginAt)}</td>
                    <td>
                      <form action={updateUserAction} className="flex flex-wrap items-center gap-1">
                        <input type="hidden" name="id" value={x.id} />
                        <select name="role" defaultValue={x.role} className="select !w-40 !py-1 text-xs" aria-label="Rôle">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                        <select name="status" defaultValue={x.status} className="select !w-28 !py-1 text-xs" aria-label="Statut"><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="pending">En attente</option></select>
                        <select name="structureId" defaultValue={x.structureId ?? ""} className="select !w-56 !py-1 text-xs" aria-label="Structure"><option value="">— aucune —</option>{sOpts.map((s) => <option key={s.id} value={s.id}>{s.acronym ? `${s.acronym} — ` : ""}{s.name}</option>)}</select>
                        <label className="text-xs"><input type="checkbox" name="unlock" /> déverrouiller</label>
                        <button className="btn-secondary btn-sm">Appliquer</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
