import { Logo } from "@/components/Logo";
import { VerifyForm } from "@/components/AuthForms";
import { emailEnabled } from "@/lib/email";
export const metadata = { title: "Vérification" };
export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; demo?: string }> }) {
  const sp = await searchParams;
  const demo = !emailEnabled() && sp.demo && /^\d{6}$/.test(sp.demo) ? sp.demo : undefined;
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Logo size="lg" /></div>
      <h1 className="mb-6 font-display text-3xl font-bold text-[#1a1a1a]">Vérifier mon adresse</h1>
      <div className="card"><VerifyForm email={(sp.email ?? "").slice(0, 200)} demo={demo} /></div>
    </div>
  );
}
