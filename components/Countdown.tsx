"use client";
import { useEffect, useState } from "react";

export function Countdown({ end }: { end: string }) {
  const target = new Date(`${end}T23:59:59+01:00`).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className="font-mono">—</span>;
  const d = Math.max(0, target - now);
  if (d === 0) return <span className="font-semibold">Collecte clôturée</span>;
  const parts = [Math.floor(d / 86400000), Math.floor(d / 3600000) % 24, Math.floor(d / 60000) % 60, Math.floor(d / 1000) % 60];
  const labels = ["j", "h", "min", "s"];
  return (
    <span className="font-display font-bold tabular-nums" aria-live="off">
      {parts.map((p, i) => <span key={i} className="mr-2">{String(p).padStart(2, "0")}<small className="ml-0.5 text-xs opacity-70">{labels[i]}</small></span>)}
    </span>
  );
}
