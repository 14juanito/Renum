import { ForgotForm } from "@/components/AuthForms";
export const metadata = { title: "Mot de passe oublié" };
export default function Page() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Mot de passe oublié</h1>
      <div className="card"><ForgotForm /></div>
    </div>
  );
}
