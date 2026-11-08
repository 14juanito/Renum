import { Logo } from "@/components/Logo";
import { ForgotForm } from "@/components/AuthForms";
export const metadata = { title: "Mot de passe oublié" };
export default function Page() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
      <h1 className="mb-6 font-display text-3xl font-bold text-[#1a1a1a]">Mot de passe oublié</h1>
      <div className="card"><ForgotForm /></div>
    </div>
  );
}
