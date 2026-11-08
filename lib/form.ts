export type ActionState = { error?: string; ok?: string; fields?: Record<string, string>; demoCode?: string } | null;

export const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
export const num = (fd: FormData, k: string): number | null => {
  const v = String(fd.get(k) ?? "").replace(/\s/g, "").replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
