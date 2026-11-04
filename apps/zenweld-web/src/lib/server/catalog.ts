import { unstable_cache } from "next/cache";
import { createSeedDatabase } from "@zenweld/data";
import { createDb, readCatalog, readSettings, readWarehouseStock, type Db } from "@zenweld/db";
import type { CatalogData } from "@zenweld/store";

/**
 * SITENIN KATALOGU — SUNUCU (KARARLAR K-88)
 *
 * Veri kaynagi ayardan secilir: DATA_SOURCE=database ise urunler,
 * kategoriler, gruplar, secenek tanimlari, Zenweld depo stogu ve magaza
 * ayarlari PostgreSQL'den (DATABASE_URL) okunur; yoksa site bugunku gibi
 * koddaki ornek veri ve tarayicidaki kopyayla calisir. Baglanti adresi
 * tanimli diye kendiliginden veritabanina gecilmez.
 *
 * Ayar derlemede de okunur (sayfalar derlemede hazirlanir): degistirince
 * site yeniden derlenir. Veritabani modunda derleme sirasinda veritabanina
 * erisilebilmelidir.
 *
 * Veritabaninda yapilan degisiklik en gec bir dakikada sitede gorunur
 * (KARARLAR K-88). Onbellek iki katmanlidir ve ikisi de 30 saniyedir:
 * okunan veri 30 saniye saklanir, bu veriyi kullanan sayfalar da 30
 * saniyede bir arka planda yeniden hazirlanir (Next sayfanin yenilenme
 * suresini veriden alir). Iki katman ust uste en fazla 60 saniye eder.
 * Panel veritabanina yazmaya baslayinca kayit aninda yenilenecek
 * (etiket: CATALOG_TAG).
 *
 * Bu dosya yalnizca sunucuda calisir (veritabani baglantisi).
 */

export const CATALOG_TAG = "katalog";

/** Her katmanin onbellek suresi (saniye); ikisi toplam 60 saniye. */
const CATALOG_REVALIDATE = 30;

export function usesDatabase(): boolean {
  return process.env.DATA_SOURCE === "database";
}

/** Tek baglanti havuzu; gelistirme sunucusu dosyalari yeniden yuklese de korunur. */
const globalDb = globalThis as unknown as { zenweldDb?: Db };
function database(): Db {
  globalDb.zenweldDb ??= createDb().db;
  return globalDb.zenweldDb;
}

/*
 * Katalog, depo stogu ve ayarlar ayri kayitlar olarak saklanir: Next'in
 * onbellegi tek kayitta en fazla 2 MB tutar (bugun katalogun tamami
 * ~110 KB; sinira ~1.000 urunde yaklasilir, docs/YAPILACAKLAR.md).
 */
const cached = <T>(name: string, read: (db: Db) => Promise<T>) =>
  unstable_cache(() => read(database()), [CATALOG_TAG, name], {
    revalidate: CATALOG_REVALIDATE,
    tags: [CATALOG_TAG],
  });

const cachedCatalog = cached("urunler", readCatalog);
const cachedWarehouseStock = cached("depo-stogu", readWarehouseStock);
const cachedSettings = cached("ayarlar", readSettings);

/**
 * Veritabani modunda katalog (onbellekli); demo modunda null. Demo modunda
 * onbellek hic kullanilmaz: sayfalar bugunku gibi derlemede bir kez
 * hazirlanir, sonradan yenilenmez.
 */
export async function getDatabaseCatalog(): Promise<CatalogData | null> {
  if (!usesDatabase()) return null;
  const catalog = await cachedCatalog();
  const warehouseStock = await cachedWarehouseStock();
  const settings = await cachedSettings();
  return { ...catalog, warehouseStock, settings };
}

let demo: CatalogData | undefined;

/** Demo modunda sunucunun bildigi katalog: koddaki ornek veri (derleme anina gore). */
function demoCatalog(): CatalogData {
  if (!demo) {
    const builtAt = Date.parse(process.env.NEXT_PUBLIC_BUILD_TIME ?? "");
    const seed = createSeedDatabase(Number.isNaN(builtAt) ? Date.now() : builtAt);
    demo = {
      products: seed.products,
      categories: seed.categories,
      categoryGroups: seed.categoryGroups,
      optionDefinitions: seed.optionDefinitions,
      warehouseStock: seed.warehouseStock,
      settings: seed.settings,
    };
  }
  return demo;
}

/**
 * Sunucuda uretilen sayfa bilgileri (baslik, yapisal veri, site haritasi,
 * onceden hazirlanan sayfalar) icin katalog: veritabani ya da ornek veri.
 */
export async function getServerCatalog(): Promise<CatalogData> {
  return (await getDatabaseCatalog()) ?? demoCatalog();
}
