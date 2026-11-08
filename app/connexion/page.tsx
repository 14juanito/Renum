import { LoginForm } from "@/components/AuthForms";
import { Notice } from "@/components/ui";
export const metadata = { title: "Connexion" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Me connecter</h1>
      {sp.reset && <div className="mb-4"><Notice tone="ok">Mot de passe modifié. Connectez-vous.</Notice></div>}
      <div className="card"><LoginForm next={sp.next} /></div>
    </div>
  );
}
