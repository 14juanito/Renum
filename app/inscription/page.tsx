import { RegisterForm } from "@/components/AuthForms";
export const metadata = { title: "Inscription" };
export default function Page() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-brand-900">Je m&apos;enregistre</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">Étape 1 sur 4 — création du compte du responsable numérique.</p>
      <div className="card"><RegisterForm /></div>
    </div>
  );
}
