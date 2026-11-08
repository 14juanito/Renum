"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Palette RGPNE (principales puis secondaires)
export const PALETTE = ["#17418a", "#db3832", "#0095c9", "#ed7016", "#65b32e", "#405d64", "#894b1e", "#09242e", "#b72a25", "#1e3e07", "#e8c400", "#323230"];
const NEUTRAL = "#e8e2d9";
const usd = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n) + " $";
const tip = { contentStyle: { borderRadius: 16, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,.08)", fontSize: 12 } };

type B = { label: string; count: number; amount: number };

/** Barres horizontales arrondies : la première barre (maximum) est mise en évidence en rouge. */
export function HBar({ data, metric = "amount", height }: { data: B[]; metric?: "amount" | "count"; height?: number }) {
  const h = height ?? Math.max(160, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={170} fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v: string) => (v.length > 26 ? v.slice(0, 25) + "…" : v)} />
        <Tooltip {...tip} cursor={{ fill: "#f6f7f9" }} formatter={(v) => (metric === "amount" ? usd(Number(v)) : String(v))} />
        <Bar dataKey={metric} radius={[999, 999, 999, 999]} name={metric === "amount" ? "Montant (USD)" : "Nombre"} background={{ fill: "#f6f7f9", radius: 999 }}>
          {data.map((_, i) => <Cell key={i} fill={i === 0 ? "#db3832" : "#17418a"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Colonnes arrondies façon « Summary » : les n premières en couleur, le reste en neutre. */
export function Columns({ data, metric = "count", highlight = 3, height = 220 }: { data: B[]; metric?: "amount" | "count"; highlight?: number; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="18%">
        <XAxis dataKey="label" hide />
        <YAxis hide />
        <Tooltip {...tip} cursor={false} formatter={(v) => (metric === "amount" ? usd(Number(v)) : String(v))} />
        <Bar dataKey={metric} radius={[999, 999, 999, 999]} name={metric === "amount" ? "Montant (USD)" : "Besoins"}>
          {data.map((_, i) => <Cell key={i} fill={i < highlight ? "#db3832" : NEUTRAL} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, metric = "count" }: { data: B[]; metric?: "amount" | "count" }) {
  const total = data.reduce((a, d) => a + d[metric], 0);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <div className="relative h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={metric} nameKey="label" innerRadius={58} outerRadius={84} paddingAngle={3} cornerRadius={8} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip {...tip} formatter={(v) => (metric === "amount" ? usd(Number(v)) : String(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><div className="font-display text-xl font-bold">{metric === "amount" ? usd(total) : total}</div><div className="text-[10px] text-slate-500">total</div></div>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {data.slice(0, 8).map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 truncate">{d.label}</span>
            <span className="font-medium">{metric === "amount" ? usd(d[metric]) : d[metric]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Timeline({ data }: { data: { date: string; structures: number; needs: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -20, right: 8 }}>
        <defs>
          <linearGradient id="gNeeds" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#db3832" stopOpacity={0.25} /><stop offset="100%" stopColor="#db3832" stopOpacity={0} /></linearGradient>
          <linearGradient id="gStruct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#17418a" stopOpacity={0.2} /><stop offset="100%" stopColor="#17418a" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#eef0f3" />
        <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} />
        <YAxis fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="needs" name="Besoins (cumul)" stroke="#db3832" strokeWidth={2.5} fill="url(#gNeeds)" />
        <Area type="monotone" dataKey="structures" name="Structures (cumul)" stroke="#17418a" strokeWidth={2.5} fill="url(#gStruct)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
