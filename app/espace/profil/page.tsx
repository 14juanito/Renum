import { requireRole } from "@/lib/auth";
import { completeness, PROFILE_RECOMMENDED, PROFILE_REQUIRED } from "@/lib/rules";
import { ProfileForm } from "@/components/ProfileForm";
import { PageTitle, Progress } from "@/components/ui";

export const metadata = { title: "Ma fiche" };

export default async function Page() {
  const u = await requireRole();
  const { passwordHash: _ph, ...safe } = u;
  void _ph;
  const c = completeness(u, PROFILE_REQUIRED, PROFILE_RECOMMENDED);
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Fiche du responsable numérique" subtitle="Section B — identité, fonction et coordonnées." />
      <div className="card mb-6"><div className="mb-2 flex justify-between text-sm"><span>Complétude</span><strong>{c.pct} %</strong></div><Progress pct={c.pct} /></div>
      <ProfileForm u={safe} />
    </div>
  );
}
