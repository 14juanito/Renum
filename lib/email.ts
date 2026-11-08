import "server-only";

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** E-mail transactionnel (EF-NOT-01). Sans fournisseur configuré : mode démonstration (retourne false). */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailEnabled()) {
    console.info(`[email:démo] à=${to} objet="${subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
    });
    if (!res.ok) console.error("[email] échec", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email] erreur", e);
    return false;
  }
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}
