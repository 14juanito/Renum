import { Logo } from "@/components/Logo";
import { RegisterForm } from "@/components/AuthForms";
export const metadata = { title: "Inscription" };
export default function Page() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
      <h1 className="font-display text-3xl font-bold text-[#1a1a1a]">Je m&apos;enregistre</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">Étape 1 sur 4 — création du compte du responsable numérique.</p>
      <div className="card"><RegisterForm /></div>
    </div>
  );
}
