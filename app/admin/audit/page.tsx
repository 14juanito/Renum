import { requireRole } from "@/lib/auth";
import { listAudit } from "@/lib/db";
import { AdminTabs } from "@/components/AdminTabs";
import { fmtDate, PageTitle } from "@/components/ui";

export const metadata = { title: "Journal d'audit" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; action?: string }> }) {
  const u = await requireRole("admin", "analyste");
  const sp = await searchParams;
  const q = (sp.q ?? "").toLowerCase();
  const all = (await listAudit()).sort((a, b) => b.at.localeCompare(a.at));
  // Analyste : accès restreint (pas de valeurs avant/après)
  const list = all.filter((e) => (!sp.action || e.action.startsWith(sp.action)) && (!q || `${e.email} ${e.action} ${e.object ?? ""} ${e.ip ?? ""}`.toLowerCase().includes(q))).slice(0, 300);
  const actions = [...new Set(all.map((e) => e.action.split(".")[0]))].sort();
  return (
    <div>
      <PageTitle title="Journal d'audit" subtitle={`${all.length} entrée(s) — journal en ajout seul, non modifiable depuis l'interface.`} />
      <AdminTabs current="/admin/audit" admin={u.role === "admin"} />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q} className="input max-w-xs" placeholder="E-mail, objet, IP…" aria-label="Recherche" />
        <select name="action" defaultValue={sp.action ?? ""} className="select max-w-xs" aria-label="Action"><option value="">Toutes actions</option>{actions.map((a) => <option key={a}>{a}</option>)}</select>
        <button className="btn-secondary">Filtrer</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="table">
          <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Objet</th><th>IP</th>{u.role === "admin" && <th>Détail</th>}</tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-xs">{fmtDate(e.at)}</td>
                <td className="text-xs">{e.email ?? "—"}</td>
                <td className="font-mono text-xs">{e.action}</td>
                <td className="font-mono text-xs">{e.object ?? ""}</td>
                <td className="font-mono text-xs">{e.ip ?? ""}</td>
                {u.role === "admin" && <td className="text-xs">{(e.before !== undefined || e.after !== undefined) && <details><summary className="cursor-pointer">avant / après</summary><pre className="max-w-md overflow-x-auto whitespace-pre-wrap text-[10px]">{JSON.stringify({ avant: e.before, apres: e.after }, (k, v) => (k === "passwordHash" ? "[masqué]" : v), 1).slice(0, 4000)}</pre></details>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
