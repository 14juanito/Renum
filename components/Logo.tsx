/* eslint-disable @next/next/no-img-element */
/**
 * Logotype RENUM — construit sur le modèle du logotype institutionnel (RGPNE, « Partie logo ») :
 * armoiries nationales + trait vertical aux couleurs principales + dénomination en Cooper Hewitt.
 */
export function Logo({ variant = "dark", size = "md", compact = false }: { variant?: "dark" | "light"; size?: "sm" | "md" | "lg"; compact?: boolean }) {
  const s = { sm: { seal: 40, bar: "h-10", t1: "text-[15px]", t2: "text-[8.5px]" }, md: { seal: 52, bar: "h-12", t1: "text-lg", t2: "text-[10px]" }, lg: { seal: 88, bar: "h-20", t1: "text-3xl", t2: "text-sm" } }[size];
  const ink = variant === "light" ? "text-white" : "text-[#1a1a1a]";
  return (
    <span className="inline-flex items-center gap-3" aria-label="RENUM — Registre national du numérique public">
      <img src="/armoiries.png" alt="Armoiries de la République Démocratique du Congo" width={s.seal} height={s.seal} className="shrink-0 rounded-full bg-white" />
      <span className={`ligne-etat-v ${s.bar} shrink-0 rounded-full`} aria-hidden />
      {!compact && (
        <span className={`font-display leading-[1.05] ${ink}`}>
          <span className={`block font-extrabold uppercase tracking-tight ${s.t1}`}>RENUM</span>
          <span className={`block font-bold uppercase tracking-wide ${s.t2}`}>Registre national<br />du numérique public</span>
        </span>
      )}
    </span>
  );
}
