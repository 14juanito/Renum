import { Logo } from "@/components/Logo";
import { ResetForm } from "@/components/AuthForms";
export const metadata = { title: "Réinitialisation" };
export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
      <h1 className="mb-6 font-display text-3xl font-bold text-[#1a1a1a]">Nouveau mot de passe</h1>
      <div className="card"><ResetForm token={t.slice(0, 200)} /></div>
    </div>
  );
}
