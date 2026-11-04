import { createHash, timingSafeEqual } from "node:crypto";

/**
 * GIZLI ANAHTARLA ACILAN UCLARIN DENETIMI (/api/yenile, /api/sap/stok)
 *
 * - Anahtar (ortam degiskeni) tanimli degilse uc kapalidir (404).
 * - Istek "Authorization: Bearer <anahtar>" basligini tasimalidir; anahtar
 *   sabit surede karsilastirilir (401).
 */
const digest = (text: string) => createHash("sha256").update(text).digest();

export function checkBearer(
  secret: string | undefined,
  authorization: string | null,
): { ok: true } | { ok: false; status: 401 | 404; error: string } {
  if (!secret) return { ok: false, status: 404, error: "kapali" };
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!token || !timingSafeEqual(digest(token), digest(secret))) return { ok: false, status: 401, error: "yetkisiz" };
  return { ok: true };
}
