/* eslint-disable @next/next/no-img-element */
/**
 * Logotype officiel RENUM (armoiries + trait tricolore + dénomination), fourni par le commanditaire.
 * Deux déclinaisons : texte sombre (fonds clairs) et texte blanc (fonds bleus, ex. pied de page RGPNE).
 * Ratio d'origine 653 × 224 — ne jamais déformer (RGPNE, « Les interdits »).
 */
const RATIO = 653 / 224;

export function Logo({ variant = "dark", size = "md", compact = false }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg"; compact?: boolean }) {
  const h = { sm: 44, md: 56, lg: 96 }[size];
  if (compact) {
    return <img src="/armoiries.png" alt="RENUM — Armoiries de la République Démocratique du Congo" width={h} height={h} className="shrink-0 rounded-full bg-white" />;
  }
  return (
    <img
      src={variant === "light" ? "/logo-renum-blanc.png" : "/logo-renum.png"}
      alt="RENUM — Registre national du numérique public"
      width={Math.round(h * RATIO)}
      height={h}
      className="h-auto max-w-full shrink-0"
      style={{ height: h, width: "auto" }}
    />
  );
}
