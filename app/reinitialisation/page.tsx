import { ResetForm } from "@/components/AuthForms";
export const metadata = { title: "Réinitialisation" };
export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Nouveau mot de passe</h1>
      <div className="card"><ResetForm token={t.slice(0, 200)} /></div>
    </div>
  );
}
