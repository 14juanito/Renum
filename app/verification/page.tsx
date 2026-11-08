import { VerifyForm } from "@/components/AuthForms";
import { emailEnabled } from "@/lib/email";
export const metadata = { title: "Vérification" };
export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; demo?: string }> }) {
  const sp = await searchParams;
  const demo = !emailEnabled() && sp.demo && /^\d{6}$/.test(sp.demo) ? sp.demo : undefined;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Vérifier mon adresse</h1>
      <div className="card"><VerifyForm email={(sp.email ?? "").slice(0, 200)} demo={demo} /></div>
    </div>
  );
}
