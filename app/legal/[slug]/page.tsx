import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";

const PAGES: Record<string, { title: string; body: string[] }> = {
  mentions: {
    title: "Mentions légales",
    body: [
      "Éditeur : organisateurs des Journées des responsables numériques des administrations (dénomination officielle à valider avec le commanditaire).",
      "Hébergement : Vercel Inc. (phase événementielle, option C du cahier des charges) ; migration vers un hébergement national envisagée en phase P2.",
      "Responsable de la publication : à désigner par le commanditaire.",
    ],
  },
  confidentialite: {
    title: "Politique de confidentialité",
    body: [
      "Finalité : constituer l'annuaire national des responsables numériques et collecter les besoins numériques des administrations afin d'éclairer la décision publique.",
      "Données collectées : identité, fonction, coordonnées professionnelles, informations sur la structure et ses besoins. Seules les données nécessaires sont demandées (minimisation).",
      "Base légale et cadre : Code du numérique (ordonnance-loi n° 23/010 du 13 mars 2023) — références à confirmer par le service juridique du commanditaire.",
      "Publication : vos coordonnées n'apparaissent dans l'annuaire consultable par les agents habilités qu'avec votre consentement explicite.",
      "Intelligence artificielle : le texte des besoins peut être analysé automatiquement pour proposer une catégorie ; les coordonnées sont retirées avant tout traitement externe et chaque proposition est validée par un analyste.",
      "Droits : accès, rectification, effacement et export de vos données sur demande auprès de l'administrateur de la plateforme.",
      "Conservation : durée de la campagne et de son exploitation, à préciser dans le registre des traitements.",
    ],
  },
  cgu: {
    title: "Conditions d'utilisation",
    body: [
      "La plateforme est réservée aux agents des administrations publiques et aux personnes habilitées.",
      "L'utilisateur certifie l'exactitude des informations déclarées et s'engage à ne pas partager ses identifiants.",
      "Les estimations de coûts sont déclaratives et ne constituent ni un engagement de financement ni une procédure de passation de marchés.",
      "Toute action sensible est journalisée à des fins de sécurité et de traçabilité.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PAGES[slug];
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title={p.title} />
      <div className="card space-y-3 text-sm leading-relaxed text-slate-700">{p.body.map((b, i) => <p key={i}>{b}</p>)}</div>
    </div>
  );
}
