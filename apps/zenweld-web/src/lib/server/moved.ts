import { readMovedPaths } from "@zenweld/db";
import { database, usesDatabase } from "./db";

/**
 * ESKI LINKLER — SUNUCUDA KALICI YONLENDIRME (KARARLAR K-120)
 *
 * Panelde linki degisen kaydin eski adresi `redirects` tablosundadir. Eski
 * adres istenince istek kontrolu (proxy.ts) ziyaretciyi ve arama motorunu
 * 301 (kalici) ile kaydin bugunku adresine gonderir: Google eski sonucu
 * yeni adresle degistirir, sayfanin degeri yeni adrese gecer.
 *
 * Yonlendirme sayfanin icinde degil istek kontrolunde yapilir: Next,
 * onbellege aldigi sayfanin yonlendirmesini bazen hedef adresi olmadan
 * sakliyor (denendi, Next 16.4).
 *
 * Liste sunucunun belleginde tutulur (her istekte veritabanina gidilmez):
 * en gec 30 saniyede bir yeniden okunur; panel kaydi ve yenileme ucu
 * (lib/server/refresh.ts) listeyi hemen bosaltir. Veritabanina
 * ulasilamazsa yonlendirme yapilmaz, sayfa her zamanki gibi acilir.
 *
 * Demo modunda sunucu eski adres bilmez; paneldeki link degisikligi
 * tarayicida yonlenir (lib/page-seo-client.ts).
 */

/** Listenin bellekte kalma suresi (sitenin diger verileriyle ayni, lib/server/db.ts). */
const KEEP_MS = 30_000;

/** Eski adresi olabilecek sayfalar. */
const PREFIXES = ["/urun/", "/blog/", "/haberler/", "/etkinlikler/", "/ekipmanlar/", "/guvenlik/", "/aksesuarlar/", "/dolgu-metalleri/"];

// Istek kontrolu ve panel kaydi ayri derlenir; ortak liste globalThis'te.
const state = globalThis as unknown as { zenweldMovedPaths?: { at: number; paths: Promise<Map<string, string>> } };

function movedPaths(): Promise<Map<string, string>> {
  const now = Date.now();
  if (!state.zenweldMovedPaths || now - state.zenweldMovedPaths.at > KEEP_MS) {
    const paths = readMovedPaths(database());
    state.zenweldMovedPaths = { at: now, paths };
    // Okunamazsa liste tutulmaz; bir sonraki istek yeniden dener.
    paths.catch(() => {
      if (state.zenweldMovedPaths?.paths === paths) state.zenweldMovedPaths = undefined;
    });
  }
  return state.zenweldMovedPaths.paths;
}

/** Panelde link degisince ya da site yenilenince liste bir sonraki istekte yeniden okunur. */
export function forgetMovedPaths(): void {
  state.zenweldMovedPaths = undefined;
}

/** Eski adresin bugunku karsiligi (`/urun/yeni-link`, `/urun/x?secenek=y`); yoksa undefined. */
export async function movedPathFor(pathname: string): Promise<string | undefined> {
  if (!usesDatabase() || !PREFIXES.some((p) => pathname.startsWith(p))) return undefined;
  try {
    return (await movedPaths()).get(pathname);
  } catch (error) {
    console.error("Eski adres listesi okunamadı; yönlendirme yapılmadı.", error);
    return undefined;
  }
}
