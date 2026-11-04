import { unstable_cache } from "next/cache";
import { createDb, type Db } from "@zenweld/db";

/**
 * SUNUCU VERISI — ORTAK PARCALAR (KARARLAR K-88)
 *
 * Veri kaynagi ayardan secilir: DATA_SOURCE=database ise site verisi
 * PostgreSQL'den (DATABASE_URL) okunur; yoksa site bugunku gibi koddaki
 * ornek veri ve tarayicidaki kopyayla calisir. Baglanti adresi tanimli diye
 * kendiliginden veritabanina gecilmez.
 *
 * Ayar derlemede de okunur (sayfalar derlemede hazirlanir): degistirince
 * site yeniden derlenir. Veritabani modunda derleme sirasinda veritabanina
 * erisilebilmelidir.
 *
 * Veritabaninda yapilan degisiklik en gec bir dakikada sitede gorunur.
 * Onbellek iki katmanlidir ve ikisi de 30 saniyedir: okunan veri 30 saniye
 * saklanir, bu veriyi kullanan sayfalar da 30 saniyede bir arka planda
 * yeniden hazirlanir (Next sayfanin yenilenme suresini veriden alir). Iki
 * katman ust uste en fazla 60 saniye eder. Panel veritabanina yazmaya
 * baslayinca kayit aninda yenilenecek (onbellek etiketleri).
 *
 * Bu dosya ve lib/server/ altindakiler yalnizca sunucuda calisir.
 */

/** Her katmanin onbellek suresi (saniye); ikisi toplam 60 saniye. */
const REVALIDATE_SECONDS = 30;

export function usesDatabase(): boolean {
  return process.env.DATA_SOURCE === "database";
}

/** Tek baglanti havuzu; gelistirme sunucusu dosyalari yeniden yuklese de korunur. */
const globalDb = globalThis as unknown as { zenweldDb?: Db };
function database(): Db {
  globalDb.zenweldDb ??= createDb().db;
  return globalDb.zenweldDb;
}

/**
 * Veritabanindan okuyan fonksiyonu onbellekli hale getirir. Fonksiyonun
 * aldigi degerler (orn. urun kimligi) onbellek anahtarina girer. Next'in
 * onbellegi tek kayitta en fazla 2 MB tutar; buyuk veri ayri kayitlara
 * bolunur (docs/YAPILACAKLAR.md › Veritabani).
 */
export const cached = <A extends unknown[], T>(name: string, tag: string, read: (db: Db, ...args: A) => Promise<T>) =>
  unstable_cache((...args: A) => read(database(), ...args), [name], {
    revalidate: REVALIDATE_SECONDS,
    tags: [tag],
  });

/** Derleme ani (next.config.mjs); demo verisi ve tarayicinin ilk cizimi buna gore. */
export function buildTime(): number {
  const builtAt = Date.parse(process.env.NEXT_PUBLIC_BUILD_TIME ?? "");
  return Number.isNaN(builtAt) ? Date.now() : builtAt;
}
