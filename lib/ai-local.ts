// Classifieur local par mots-clés pondérés (repli sans service externe, aucune donnée transmise).
import { CATEGORIES } from "./referentials";

export const LOCAL_MODEL = "renum-keywords-v1";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function classifyLocal(text: string): { category: string; confidence: number; model: string; engine: "local"; rationale: string } {
  const t = ` ${norm(text).replace(/[^a-z0-9 -]/g, " ")} `;
  const scores = CATEGORIES.filter((c) => c.code !== "B12").map((c) => {
    const hits: string[] = [];
    let score = 0;
    const seen = new Set<string>();
    for (const kw of c.keywords) {
      const k = norm(kw);
      if (seen.has(k)) continue;
      seen.add(k);
      const re = new RegExp(`[ -]${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?[ -]`, "g");
      const m = t.match(re);
      if (m) {
        score += m.length * (k.includes(" ") ? 2 : 1);
        hits.push(kw);
      }
    }
    return { code: c.code, score, hits };
  });
  scores.sort((a, b) => b.score - a.score);
  const [best, second] = scores;
  if (!best || best.score === 0) {
    return { category: "B12", confidence: 0.2, model: LOCAL_MODEL, engine: "local", rationale: "Aucun mot-clé reconnu" };
  }
  const margin = best.score / (best.score + (second?.score ?? 0));
  const strength = 1 - Math.exp(-best.score / 2);
  const confidence = Math.round(Math.min(0.97, 0.35 + 0.4 * margin + 0.25 * strength) * 100) / 100;
  return { category: best.code, confidence, model: LOCAL_MODEL, engine: "local", rationale: `Mots-clés : ${best.hits.slice(0, 5).join(", ")}` };
}
