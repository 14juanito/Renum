import { PageTitle } from "@/components/ui";

const FAQ = [
  ["Qui doit s'inscrire ?", "Le responsable des systèmes d'information (ou la personne qui en assume la fonction) de chaque administration : ministère, direction, établissement ou entreprise publique, agence, province, ETD, service déconcentré."],
  ["Combien de temps faut-il ?", "Environ 15 minutes : 2 minutes pour le compte, 5 pour la fiche structure et la fiche responsable, quelques minutes par besoin."],
  ["Puis-je enregistrer plusieurs besoins ?", "Oui. Chaque besoin est une fiche indépendante. Vous pouvez les modifier tant qu'ils ne sont pas soumis, puis tout soumettre en une fois."],
  ["Que se passe-t-il si la connexion coupe ?", "Le formulaire de besoin est sauvegardé automatiquement sur votre appareil à chaque saisie et restauré à la reconnexion. Pensez à cliquer sur « Enregistrer » à chaque étape."],
  ["En quelle devise saisir les coûts ?", "En USD (par défaut) ou en CDF. Les montants sont convertis en USD avec le taux paramétré au moment de la soumission, et ce taux est conservé dans la fiche."],
  ["Mes coordonnées seront-elles publiques ?", "Non : l'annuaire est réservé aux agents habilités, et vos coordonnées n'y figurent qu'avec votre consentement."],
  ["À quoi sert l'IA ?", "Elle propose une catégorie pour chaque besoin et aide à rédiger la synthèse nationale. Un analyste valide toujours ses propositions ; les chiffres proviennent uniquement de la base de données."],
  ["Je n'ai pas reçu de code de vérification", "Vérifiez vos courriers indésirables puis redemandez un code depuis la page de vérification. Pendant l'atelier, rendez-vous au stand d'assistance."],
];

export default async function Aide({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const items = FAQ.filter(([a, b]) => !q || `${a} ${b}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Aide et FAQ" subtitle="Réponses aux questions fréquentes. Assistance sur place : stand d'assistance des Journées." />
      <form className="mb-6 flex gap-2" role="search">
        <input name="q" defaultValue={q} className="input" placeholder="Rechercher dans la FAQ…" aria-label="Rechercher" />
        <button className="btn-secondary">Rechercher</button>
      </form>
      <div className="space-y-3">
        {items.map(([a, b]) => (
          <details key={a} className="card group">
            <summary className="cursor-pointer font-semibold">{a}</summary>
            <p className="mt-2 text-sm text-slate-700">{b}</p>
          </details>
        ))}
        {!items.length && <p className="text-sm text-slate-500">Aucun résultat.</p>}
      </div>
    </div>
  );
}
