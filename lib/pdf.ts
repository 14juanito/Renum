import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createHash } from "crypto";

const BRAND = rgb(23 / 255, 65 / 255, 138 / 255); // #17418A (RGPNE)
const DARK = rgb(0.043, 0.145, 0.27);
const GREY = rgb(0.4, 0.45, 0.5);

/** Les polices standard PDF (WinAnsi) ne couvrent pas tout l'Unicode : normalisation défensive. */
export function pdfSafe(s: string): string {
  return s
    .replace(/[   ]/g, " ")
    .replace(/[≈]/g, "~")
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0a\x0d\x20-\x7e¡-ÿ€–—…Œœ]/g, "");
}

export const money = (n: number) => pdfSafe(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)) + " USD";

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(public doc: PDFDocument, public font: PDFFont, public bold: PDFFont, public header: string) { this.newPage(); }
  newPage() {
    this.page = this.doc.addPage([595.28, 841.89]);
    this.page.drawRectangle({ x: 0, y: 815, width: 595.28, height: 27, color: BRAND });
    // Ligne d'État : bleu #0095C9 | jaune #FFF24B | rouge #DB3832
    const w3 = 595.28 / 3;
    this.page.drawRectangle({ x: 0, y: 811, width: w3, height: 4, color: rgb(0, 149 / 255, 201 / 255) });
    this.page.drawRectangle({ x: w3, y: 811, width: w3, height: 4, color: rgb(1, 242 / 255, 75 / 255) });
    this.page.drawRectangle({ x: 2 * w3, y: 811, width: w3, height: 4, color: rgb(219 / 255, 56 / 255, 50 / 255) });
    this.page.drawText(pdfSafe(this.header), { x: 40, y: 824, size: 10, font: this.bold, color: rgb(1, 1, 1) });
    this.y = 785;
  }
  ensure(h: number) { if (this.y - h < 60) this.newPage(); }
  text(t: string, o: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number } = {}) {
    const size = o.size ?? 10, font = o.bold ? this.bold : this.font, maxW = 515 - (o.indent ?? 0);
    for (const para of pdfSafe(t).split("\n")) {
      const words = para.split(/\s+/);
      let line = "";
      const flush = () => { this.ensure(size + 4); this.page.drawText(line, { x: 40 + (o.indent ?? 0), y: this.y, size, font, color: o.color ?? DARK }); this.y -= size + 4; };
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(next, size) > maxW && line) { flush(); line = w; } else line = next;
      }
      if (line || !para) flush();
    }
  }
  gap(h = 8) { this.y -= h; }
  row(cols: { t: string; w: number; right?: boolean }[], bold = false) {
    this.ensure(16);
    let x = 40;
    const f = bold ? this.bold : this.font;
    for (const c of cols) {
      let t = pdfSafe(c.t);
      while (t.length > 1 && f.widthOfTextAtSize(t, 9) > c.w - 6) t = t.slice(0, -2) + "…";
      const tw = f.widthOfTextAtSize(t, 9);
      this.page.drawText(t, { x: c.right ? x + c.w - tw - 4 : x, y: this.y, size: 9, font: f, color: DARK });
      x += c.w;
    }
    this.y -= 14;
    this.page.drawLine({ start: { x: 40, y: this.y + 10 }, end: { x: 555, y: this.y + 10 }, thickness: 0.3, color: rgb(0.85, 0.87, 0.9) });
  }
  bar(label: string, value: number, max: number, suffix: string) {
    this.ensure(16);
    const w = max > 0 ? (value / max) * 260 : 0;
    this.page.drawText(pdfSafe(label).slice(0, 42), { x: 40, y: this.y, size: 9, font: this.font, color: DARK });
    this.page.drawRectangle({ x: 250, y: this.y - 1, width: Math.max(1, w), height: 9, color: BRAND });
    this.page.drawText(pdfSafe(suffix), { x: 256 + w, y: this.y, size: 8, font: this.font, color: GREY });
    this.y -= 15;
  }
}

async function base(header: string) {
  const doc = await PDFDocument.create();
  doc.setProducer("RENUM");
  doc.setCreator("RENUM");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return new Writer(doc, font, bold, header);
}

function footer(w: Writer, label: string) {
  const pages = w.doc.getPages();
  pages.forEach((p, i) => p.drawText(pdfSafe(`${label} — page ${i + 1}/${pages.length}`), { x: 40, y: 30, size: 8, font: w.font, color: GREY }));
}

export async function receiptPdf(d: {
  ref: string; at: string; structure: string; province: string; responsable: string; email: string;
  needs: { ref: string; title: string; category: string; amount: string; usd: number }[]; totalUsd: number; rate: number;
}) {
  const w = await base("RENUM — Accusé de réception");
  w.text("ACCUSÉ DE RÉCEPTION", { size: 18, bold: true, color: BRAND });
  w.gap(6);
  w.text(`Référence : ${d.ref}`, { bold: true, size: 12 });
  w.text(`Horodatage : ${new Date(d.at).toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })} (heure de Kinshasa)`);
  w.gap();
  w.text(`Structure : ${d.structure} — ${d.province}`);
  w.text(`Déposé par : ${d.responsable} <${d.email}>`);
  w.gap(14);
  w.row([{ t: "Réf.", w: 95 }, { t: "Besoin", w: 215 }, { t: "Catégorie", w: 110 }, { t: "Montant", w: 95, right: true }], true);
  for (const n of d.needs) w.row([{ t: n.ref, w: 95 }, { t: n.title, w: 215 }, { t: n.category, w: 110 }, { t: n.amount, w: 95, right: true }]);
  w.gap(6);
  w.text(`Total consolidé : ${money(d.totalUsd)} (taux appliqué : ${d.rate} CDF pour 1 USD)`, { bold: true, size: 11 });
  w.gap(14);
  w.text("Ce document atteste du dépôt des besoins numériques listés ci-dessus sur la plateforme RENUM. Il ne constitue ni un engagement de financement ni une validation : chaque besoin sera examiné par la cellule d'analyse.", { size: 9, color: GREY });
  const digest = createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0, 32);
  w.gap(6);
  w.text(`Empreinte d'intégrité : ${digest}`, { size: 8, color: GREY });
  footer(w, `Accusé ${d.ref}`);
  return w.doc.save();
}

export async function notePdf(d: {
  title: string; period: string; generatedBy: string; synthesis: string; engine: string;
  kpis: [string, string][]; byCategory: { label: string; count: number; amount: number }[];
  byProvince: { label: string; count: number; amount: number }[]; byType: { label: string; count: number; amount: number }[];
  top: { title: string; structure: string; amountUsd: number }[];
}) {
  const w = await base("RENUM — Note de synthèse au Ministre");
  w.text("NOTE DE SYNTHÈSE", { size: 18, bold: true, color: BRAND });
  w.text(d.title, { size: 12, bold: true });
  w.text(`Période : ${d.period} — générée le ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Kinshasa" })} par ${d.generatedBy}`, { size: 9, color: GREY });
  w.gap(12);
  w.text("Chiffres clés", { size: 13, bold: true, color: BRAND });
  for (const [k, v] of d.kpis) w.row([{ t: k, w: 330 }, { t: v, w: 185, right: true }]);
  w.gap(10);
  const sec = (t: string, items: { label: string; count: number; amount: number }[]) => {
    w.text(t, { size: 13, bold: true, color: BRAND });
    w.gap(4);
    const max = Math.max(...items.map((i) => i.amount), 1);
    for (const i of items.slice(0, 12)) w.bar(i.label, i.amount, max, `${money(i.amount)} · ${i.count}`);
    w.gap(8);
  };
  sec("Besoins par catégorie (montant)", d.byCategory);
  sec("Besoins par province (montant)", d.byProvince);
  sec("Besoins par type d'administration", d.byType);
  w.text("Dix besoins prioritaires (critiques, par montant)", { size: 13, bold: true, color: BRAND });
  w.gap(4);
  d.top.slice(0, 10).forEach((n, i) => w.row([{ t: `${i + 1}. ${n.title}`, w: 300 }, { t: n.structure, w: 120 }, { t: money(n.amountUsd), w: 95, right: true }]));
  w.gap(12);
  w.text("Analyse et recommandations", { size: 13, bold: true, color: BRAND });
  w.gap(4);
  w.text(d.synthesis, { size: 10 });
  w.gap(12);
  w.text(
    `Méthodologie : chiffres calculés directement sur la base RENUM (besoins soumis ou validés, conversion USD au taux figé à la soumission). Rédaction ${d.engine === "llm" ? "assistée par un modèle de langage à partir de ces seuls chiffres, relue par la cellule d'analyse" : "générée par gabarit"}. Les recommandations sont indicatives.`,
    { size: 8, color: GREY },
  );
  footer(w, "Note de synthèse RENUM");
  return w.doc.save();
}
