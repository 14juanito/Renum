"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const PALETTE = ["#0a6fd6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899", "#64748b", "#f97316", "#14b8a6", "#a855f7"];
const usd = (n: number) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(n) + " $";

type B = { label: string; count: number; amount: number };

export function HBar({ data, metric = "amount", height }: { data: B[]; metric?: "amount" | "count"; height?: number }) {
  const h = height ?? Math.max(160, data.length * 32);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickFormatter={metric === "amount" ? usd : undefined} fontSize={11} />
        <YAxis type="category" dataKey="label" width={170} fontSize={11} tickFormatter={(v: string) => (v.length > 26 ? v.slice(0, 25) + "…" : v)} />
        <Tooltip formatter={(v) => (metric === "amount" ? usd(Number(v)) : String(v))} />
        <Bar dataKey={metric} fill="#0a6fd6" radius={[0, 4, 4, 0]} name={metric === "amount" ? "Montant (USD)" : "Nombre"} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, metric = "count" }: { data: B[]; metric?: "amount" | "count" }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey={metric} nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => (metric === "amount" ? usd(Number(v)) : String(v))} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Timeline({ data }: { data: { date: string; structures: number; needs: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={11} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="structures" name="Structures (cumul)" stroke="#0a6fd6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="needs" name="Besoins (cumul)" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
