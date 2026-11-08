"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS: [string, string][] = [["/", "Accueil"], ["/aide", "Aide & FAQ"], ["/legal/confidentialite", "Confidentialité"], ["/connexion", "Me connecter"]];

/** Navigation publique RGPNE : barre horizontale (≥ md), menu hamburger (mobile). */
export function PublicNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const item = (h: string) => `rounded-md px-[15px] py-2 ${path === h ? "bg-brand-500 text-white" : "text-brand-500 hover:bg-brand-500 hover:text-white"}`;
  return (
    <>
      <nav className="ml-auto hidden items-center gap-1 font-display text-[11.5px] font-bold uppercase md:flex" aria-label="Navigation principale">
        {LINKS.map(([h, l]) => <Link key={h} href={h} className={item(h)}>{l}</Link>)}
        <Link href="/inscription" className="rounded-md bg-brand-500 px-[15px] py-2 text-white hover:bg-brand-600">Je m&apos;enregistre</Link>
      </nav>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-panel text-brand-500 md:hidden"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="menu-mobile"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <nav id="menu-mobile" className="w-full border-t border-slate-100 pt-2 font-display text-sm font-bold uppercase md:hidden" aria-label="Menu mobile">
          <ul className="flex flex-col">
            {LINKS.map(([h, l]) => (
              <li key={h}><Link href={h} className={`block rounded-lg px-3 py-3 ${path === h ? "bg-brand-50 text-brand-600" : "text-brand-500"}`}>{l}</Link></li>
            ))}
            <li className="pt-2"><Link href="/inscription" className="block rounded-lg bg-brand-500 px-3 py-3 text-center text-white">Je m&apos;enregistre</Link></li>
          </ul>
        </nav>
      )}
    </>
  );
}
