import QRCode from "qrcode";
import { appUrl } from "@/lib/email";

export async function GET() {
  const svg = await QRCode.toString(`${appUrl()}/inscription?src=qr`, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0b2545", light: "#ffffff" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
