import { fileExtension, isUploadKey, MIME_TYPES } from "@zenweld/data";
import { fileStorage } from "@/lib/server/files";

/**
 * YUKLENEN DOSYALARIN ADRESI (veritabani modu; KARARLAR K-108)
 *
 *   GET /dosya/gorsel/2026/11/<16 hane>.webp
 *   GET /dosya/belge/2026/11/<16 hane>/<dosya adi>.pdf
 *
 * Panelde yuklenen dosya depodan okunur ve turuyle gonderilir. Anahtar
 * degismez (her yukleme yeni anahtar), bu yuzden tarayici ve ara bellekler
 * bir yil saklayabilir. Gecersiz anahtar, ayarsiz depo ya da olmayan dosya
 * 404. Gorsel, PDF, JPG ve PNG tarayicida acilir; Word, Excel ve ZIP
 * indirilir.
 */

export const runtime = "nodejs";

const INLINE = new Set(["jpg", "png", "webp", "gif", "avif", "pdf"]);

type Context = { params: Promise<{ yol: string[] }> };

export async function GET(_request: Request, context: Context) {
  const key = (await context.params).yol.join("/");
  const storage = fileStorage();
  const bytes = storage && isUploadKey(key) ? await storage.get(key) : null;
  if (!bytes) return new Response("Dosya bulunamadı.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const ext = fileExtension(key);
  const name = key.slice(key.lastIndexOf("/") + 1);
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": MIME_TYPES[ext],
      "content-length": String(bytes.length),
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": `${INLINE.has(ext) ? "inline" : "attachment"}; filename="${name}"`,
    },
  });
}
