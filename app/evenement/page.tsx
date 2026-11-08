import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { appUrl } from "@/lib/email";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Événement" };

export default async function Page() {
  await requireRole("admin", "analyste");
  const url = `${appUrl()}/inscription?src=qr`;
  return (
    <div>
      <PageTitle title="Outils de l'événement" subtitle="QR code d'accès, écran de projection et mode de secours." actions={<Link href="/live" className="btn-primary">Ouvrir l&apos;écran live</Link>} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card text-center">
          <h2 className="font-semibold">QR code d&apos;inscription (EF-EVT-01)</h2>
          <img src="/api/qr" alt="QR code menant à l'inscription" className="mx-auto my-4 h-64 w-64" />
          <p className="break-all font-mono text-xs">{url}</p>
          <div className="no-print mt-4 flex justify-center gap-2"><a href="/api/qr" download="renum-qr.svg" className="btn-secondary">Télécharger (SVG)</a></div>
          <p className="help">Imprimez cette page (Ctrl+P) pour l&apos;affichage en salle et sur les badges.</p>
        </div>
        <div className="card space-y-3 no-print">
          <h2 className="font-semibold">Mode de secours (EF-EVT-10)</h2>
          <p className="text-sm text-slate-600">En cas de coupure, distribuez le formulaire Excel hors ligne, puis importez-le depuis le back-office une fois la connexion rétablie.</p>
          <a href="/api/template" className="btn-secondary">Télécharger le formulaire de secours (.xlsx)</a>
          <Link href="/admin/import" className="btn-secondary">Importer des formulaires</Link>
          <h2 className="pt-4 font-semibold">Stand d&apos;assistance (EF-EVT-09)</h2>
          <p className="text-sm text-slate-600">Créez un compte pour un participant en difficulté et communiquez-lui son mot de passe provisoire.</p>
          <Link href="/admin/utilisateurs" className="btn-secondary">Saisie assistée</Link>
        </div>
      </div>
    </div>
  );
}
