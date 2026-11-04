import { revalidateTag } from "next/cache";
import { CACHE_KINDS, CACHE_TAGS, type CacheKind } from "./tags";

/**
 * SITEYI YENILEME (KARARLAR K-88, Asama 3.6)
 *
 * Bir kayit degisince cagrilir: verilen turlerin onbellegi o anda gecersiz
 * olur; bu veriyi kullanan sayfalar bir sonraki ziyarette veritabanindan
 * yeniden hazirlanir (ziyaretci eski hali gormez). Turler verilmezse hepsi.
 *
 * Kullananlar:
 * - Yenileme ucu (app/api/yenile; `npm run site:yenile`): db:studio'da
 *   yapilan degisiklikten sonra beklemeden yenilemek icin.
 * - Ileride: panel kaydi (Asama 5) ve SAP stok okuma isi.
 *
 * Sureye bagli yenileme (en gec 60 saniye) yedek olarak calismaya devam
 * eder.
 */
export function refreshSite(kinds: readonly CacheKind[] = CACHE_KINDS): CacheKind[] {
  for (const kind of kinds) revalidateTag(CACHE_TAGS[kind], { expire: 0 });
  return [...kinds];
}
