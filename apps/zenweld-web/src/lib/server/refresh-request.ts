import { createHash, timingSafeEqual } from "node:crypto";
import { CACHE_KINDS, type CacheKind } from "./tags";

/**
 * YENILEME UCUNUN ISTEK DENETIMI (app/api/yenile)
 *
 * - Ortam degiskeni REVALIDATE_SECRET tanimli degilse uc kapalidir (404).
 * - Istek "Authorization: Bearer <anahtar>" basligini tasimalidir; anahtar
 *   sabit surede karsilastirilir (401).
 * - Govde istege bagli: {"kayitlar": ["katalog", "icerik"]}. Bossa butun
 *   turler yenilenir; bilinmeyen tur 400.
 *
 * Next'e bagli degildir; birim testi tests/unit/yenileme.test.ts.
 */
export type RefreshRequest =
  | { ok: true; kinds: CacheKind[] }
  | { ok: false; status: 400 | 401 | 404; error: string };

const digest = (text: string) => createHash("sha256").update(text).digest();

export function parseRefreshRequest({
  secret,
  authorization,
  body,
}: {
  secret: string | undefined;
  authorization: string | null;
  body: unknown;
}): RefreshRequest {
  if (!secret) return { ok: false, status: 404, error: "kapali" };
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token || !timingSafeEqual(digest(token), digest(secret))) {
    return { ok: false, status: 401, error: "yetkisiz" };
  }
  const requested = body && typeof body === "object" && "kayitlar" in body ? (body as { kayitlar: unknown }).kayitlar : undefined;
  if (requested === undefined || (Array.isArray(requested) && requested.length === 0)) {
    return { ok: true, kinds: [...CACHE_KINDS] };
  }
  if (!Array.isArray(requested) || !requested.every((k) => (CACHE_KINDS as string[]).includes(k))) {
    return { ok: false, status: 400, error: "bilinmeyen-kayit-turu" };
  }
  return { ok: true, kinds: [...new Set(requested as CacheKind[])] };
}
