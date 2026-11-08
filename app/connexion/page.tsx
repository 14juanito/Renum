import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/AuthForms";
import { Notice } from "@/components/ui";
export const metadata = { title: "Connexion" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
      <h1 className="mb-6 font-display text-3xl font-bold text-[#1a1a1a]">Me connecter</h1>
      {sp.reset && <div className="mb-4"><Notice tone="ok">Mot de passe modifié. Connectez-vous.</Notice></div>}
      <div className="card"><LoginForm next={sp.next} /></div>
    </div>
  );
}
