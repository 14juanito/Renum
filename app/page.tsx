import Link from "next/link";
import { getSettings, listNeeds, listStructures } from "@/lib/db";
import { currentUser, homeFor } from "@/lib/auth";
import { Countdown } from "@/components/Countdown";
import { fmtNum } from "@/components/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(homeFor(user.role));
  const settings = await getSettings();
  const [structures, needs] = settings.publicCounters ? await Promise.all([listStructures(), listNeeds()]) : [[], []];
  const nStruct = structures.filter((s) => !["archivee", "rejetee"].includes(s.status)).length;
  const nNeeds = needs.filter((n) => !["brouillon", "rejete"].includes(n.status)).length;
  const steps = [
    ["1", "Je crée mon compte", "Par e-mail, en 2 minutes, avec un code de vérification."],
    ["2", "Je décris ma structure", "Type d'administration, localisation, contacts et ma fiche de responsable."],
    ["3", "Je dépose mes besoins", "Un formulaire court par besoin : catégorie, description, coût et priorité."],
    ["4", "Je soumets et je suis", "Accusé de réception en PDF et suivi du statut de chaque besoin."],
  ];
  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-2xl bg-brand-900 text-white shadow-lg">
        <div className="grid gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-flag-yellow">{settings.campaignName}</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">Un guichet unique pour recenser le numérique public</h1>
            <p className="mt-4 max-w-xl text-brand-100">
              Responsables des systèmes d&apos;information des administrations : déclarez votre structure et exprimez vos besoins numériques.
              Les données consolidées éclairent la politique publique du numérique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn bg-flag-yellow px-6 py-3 text-base text-brand-900 hover:brightness-95">Je m&apos;enregistre</Link>
              <Link href="/connexion" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">Me connecter</Link>
            </div>
          </div>
          <div className="space-y-4 self-center">
            <div className="rounded-xl bg-white/10 p-5">
              <div className="text-xs uppercase tracking-wide text-brand-100">Clôture de la collecte</div>
              <div className="mt-2 text-2xl"><Countdown end={settings.campaignEnd} /></div>
              <div className="mt-1 text-xs text-brand-100">Du {new Date(settings.campaignStart).toLocaleDateString("fr-FR")} au {new Date(settings.campaignEnd).toLocaleDateString("fr-FR")}</div>
            </div>
            {settings.publicCounters && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-5"><div className="text-3xl font-bold">{fmtNum(nStruct)}</div><div className="text-xs text-brand-100">structures inscrites</div></div>
                <div className="rounded-xl bg-white/10 p-5"><div className="text-3xl font-bold">{fmtNum(nNeeds)}</div><div className="text-xs text-brand-100">besoins déposés</div></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-900">Comment ça marche</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {steps.map(([n, t, d]) => (
            <li key={n} className="card">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{n}</span>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card"><h3 className="font-semibold">Pourquoi participer ?</h3><p className="mt-2 text-sm text-slate-600">Vos besoins sont pris en compte dans la note de synthèse nationale et dans les pistes de mutualisation entre administrations.</p></div>
        <div className="card"><h3 className="font-semibold">Moins de 15 minutes</h3><p className="mt-2 text-sm text-slate-600">Formulaire mobile-first, sauvegarde automatique des brouillons, utilisable en 3G.</p></div>
        <div className="card"><h3 className="font-semibold">Données protégées</h3><p className="mt-2 text-sm text-slate-600">Accès par rôle, chiffrement en transit, journal d&apos;audit. Vos coordonnées ne sont publiées qu&apos;avec votre consentement.</p></div>
      </section>
    </div>
  );
}
