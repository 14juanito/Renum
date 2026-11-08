import Link from "next/link";
import { Logo } from "./Logo";
import { PublicNav } from "./PublicNav";

/** En-tête RGPNE : fond blanc, hauteur 90 px, logotype à gauche, navigation en Cooper Hewitt 11,5 px (actif #274285). */
export function PublicHeader() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex min-h-[90px] max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" aria-label="Accueil RENUM"><Logo /></Link>
        <PublicNav />
      </div>
      <div className="ligne-etat" aria-hidden />
    </header>
  );
}

/** Pied de page RGPNE : fond #17418A, Ligne d'État, logotype + coordonnées (Poppins 10 px blanc), titres Cooper Hewitt Bold. */
export function PublicFooter({ campaign }: { campaign: string }) {
  return (
    <footer className="no-print mt-16 bg-brand-600 text-white">
      <div className="ligne-etat" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-4">
          <Logo variant="light" />
          <p className="text-[10px] leading-relaxed">Ministère de l&apos;Économie Numérique<br />République Démocratique du Congo<br />{campaign}</p>
        </div>
        <div>
          <h2 className="font-display font-bold">Accès rapide</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[["/", "Accueil"], ["/inscription", "Je m'enregistre"], ["/connexion", "Me connecter"], ["/aide", "Aide & FAQ"]].map(([h, l]) => <li key={h}><Link className="hover:underline" href={h}>{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="font-display font-bold">Liens utiles</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="hover:underline" href="https://economienumerique.gouv.cd" rel="noopener noreferrer" target="_blank">Ministère de l&apos;Économie Numérique</a></li>
            <li><Link className="hover:underline" href="/aide">Guide d&apos;utilisation</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display font-bold">Informations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[["/legal/mentions", "Mentions légales"], ["/legal/confidentialite", "Confidentialité"], ["/legal/cgu", "Conditions d'utilisation"]].map(([h, l]) => <li key={h}><Link className="hover:underline" href={h}>{l}</Link></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-brand-100">© {new Date().getFullYear()} RENUM — Plateforme numérique de l&apos;État conforme au RGPNE</div>
    </footer>
  );
}
