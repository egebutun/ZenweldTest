import { byteRange, fileExtension, isUploadKey, isVideoOriginalKey, MIME_TYPES } from "@zenweld/data";
import { fileStorage } from "@/lib/server/files";

/**
 * YUKLENEN DOSYALARIN ADRESI (veritabani modu; KARARLAR K-108, K-125)
 *
 *   GET /dosya/gorsel/2026/11/<16 hane>.webp
 *   GET /dosya/belge/2026/11/<16 hane>/<dosya adi>.pdf
 *   GET /dosya/video/2026/11/<16 hane>/1080.mp4 (720.mp4, kapak.webp)
 *
 * Panelde yuklenen dosya depodan akis halinde okunur ve turuyle gonderilir.
 * Anahtar degismez (her yukleme yeni anahtar), bu yuzden tarayici ve ara
 * bellekler bir yil saklayabilir. Gecersiz anahtar, ayarsiz depo ya da
 * olmayan dosya 404. Gorsel, PDF ve video tarayicida acilir; Word, Excel ve
 * ZIP indirilir. Videonun orijinali sunulmaz (yalnizca hazirlanan surumler).
 *
 * Parca parca sunma (Range): tarayici "su bayttan su bayta" isterse yalnizca
 * o bolum 206 ile gider. iPhone ve Safari video oynatmak icin bunu sart
 * kosar; ileri sarmada da yalnizca o noktadan sonrasi iner.
 */

export const runtime = "nodejs";

const INLINE = new Set(["jpg", "png", "webp", "gif", "avif", "pdf", "mp4"]);

type Context = { params: Promise<{ yol: string[] }> };

const notFound = () => new Response("Dosya bulunamadı.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

async function serve(request: Request, context: Context, head: boolean) {
  const key = (await context.params).yol.join("/");
  const storage = fileStorage();
  if (!storage || !isUploadKey(key) || isVideoOriginalKey(key)) return notFound();
  const size = await storage.size(key);
  if (size === null) return notFound();

  const ext = fileExtension(key);
  const name = key.slice(key.lastIndexOf("/") + 1);
  const headers: Record<string, string> = {
    "content-type": MIME_TYPES[ext],
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": `${INLINE.has(ext) ? "inline" : "attachment"}; filename="${name}"`,
    "accept-ranges": "bytes",
  };
  const range = byteRange(request.headers.get("range"), size);
  if (range === "invalid") return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
  if (range) {
    headers["content-range"] = `bytes ${range.start}-${range.end}/${size}`;
    headers["content-length"] = String(range.end - range.start + 1);
  } else {
    headers["content-length"] = String(size);
  }
  if (head) return new Response(null, { status: range ? 206 : 200, headers });
  const file = await storage.read(key, range ?? undefined);
  if (!file) return notFound();
  return new Response(file.stream, { status: range ? 206 : 200, headers });
}

export const GET = (request: Request, context: Context) => serve(request, context, false);
export const HEAD = (request: Request, context: Context) => serve(request, context, true);
