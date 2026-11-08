"use client";
import { useEffect, useRef, useState } from "react";

type Live = {
  campaign: string; structures: number; needs: number; totalUsd: number;
  byCategory: { label: string; count: number; amount: number }[];
  byProvince: { label: string; count: number }[];
  latest: { name: string; province: string; at: string }[];
  at: string;
};

function useAnimated(target: number) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current, d = 1200;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / d);
      setV(Math.round(a + (target - a) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step); else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export function LiveScreen() {
  const [d, setD] = useState<Live | null>(null);
  const [view, setView] = useState(0);
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Live;
        if (alive) { setD(j); setErr(false); }
      } catch { if (alive) setErr(true); }
    };
    load();
    const t = setInterval(load, 5000);
    const r = setInterval(() => setView((v) => (v + 1) % 3), 12000); // EF-EVT-03 : rotation automatique
    return () => { alive = false; clearInterval(t); clearInterval(r); };
  }, []);

  const s = useAnimated(d?.structures ?? 0), n = useAnimated(d?.needs ?? 0), m = useAnimated(d?.totalUsd ?? 0);
  const max = Math.max(1, ...(d?.byCategory.map((c) => c.amount) ?? [1]));
  const maxP = Math.max(1, ...(d?.byProvince.map((c) => c.count) ?? [1]));

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-brand-600 p-8 text-white">
      <div className="ligne-etat absolute inset-x-0 top-0" aria-hidden />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5"><img src="/armoiries.png" alt="" className="h-16 w-16 rounded-full bg-white" /><span className="ligne-etat-v h-16 rounded-full" /><div>
          <div className="text-sm uppercase tracking-[0.3em] text-flag-yellow">En direct</div>
          <h1 className="font-display text-2xl font-bold md:text-4xl">{d?.campaign ?? "RENUM"}</h1>
        </div></div>
        <div className="flex items-center gap-3 text-sm">
          {err && <span className="rounded bg-flag-red px-2 py-1">Connexion perdue — nouvelle tentative…</span>}
          <button className="rounded border border-white/30 px-3 py-1 hover:bg-white/10" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : ref.current?.requestFullscreen())}>Plein écran</button>
          <a href="/" className="rounded border border-white/30 px-3 py-1 hover:bg-white/10">Quitter</a>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-6">
        {[["Structures inscrites", nf(s)], ["Besoins déposés", nf(n)], ["Montant cumulé (USD)", nf(m)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/10 p-6"><div className="text-lg text-brand-100">{k}</div><div className="mt-2 font-display text-5xl font-extrabold tabular-nums md:text-7xl">{v}</div></div>
        ))}
      </div>
      <div className="mt-8 flex-1 rounded-2xl bg-white/5 p-6">
        {view === 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Besoins par catégorie (montant)</h2>
            <div className="space-y-3">{d?.byCategory.map((c) => (
              <div key={c.label} className="flex items-center gap-4"><div className="w-80 truncate text-lg">{c.label}</div><div className="h-8 flex-1 rounded bg-white/10"><div className="h-8 rounded bg-flag-yellow transition-all duration-1000" style={{ width: `${(c.amount / max) * 100}%` }} /></div><div className="w-40 text-right font-mono">{nf(c.amount)} $</div></div>
            ))}</div>
          </div>
        )}
        {view === 1 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Besoins par province</h2>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">{d?.byProvince.map((c) => (
              <div key={c.label} className="flex items-center gap-4"><div className="w-40 truncate text-lg">{c.label}</div><div className="h-6 flex-1 rounded bg-white/10"><div className="h-6 rounded bg-flag-blue transition-all duration-1000" style={{ width: `${(c.count / maxP) * 100}%` }} /></div><div className="w-12 text-right font-mono">{c.count}</div></div>
            ))}</div>
          </div>
        )}
        {view === 2 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Dernières structures inscrites</h2>
            <ul className="space-y-3 text-xl">{d?.latest.map((l) => <li key={l.name + l.at} className="flex justify-between border-b border-white/10 pb-2"><span>{l.name}</span><span className="text-brand-100">{l.province}</span></li>)}</ul>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-brand-100">
        <span>Inscrivez-vous : scannez le QR code affiché dans la salle</span>
        <img src="/api/qr" alt="QR code d'inscription" className="h-24 w-24 rounded bg-white p-1" />
      </div>
    </div>
  );
}
