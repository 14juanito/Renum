import Link from "next/link";
export default function Denied() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-bold">Accès refusé</h1>
      <p className="mt-2 text-slate-600">Votre rôle ne permet pas d&apos;accéder à cette page.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l&apos;accueil</Link>
    </div>
  );
}
