import { unstable_cache } from "next/cache";
import { createSeedDatabase, type StockRow } from "@zenweld/data";
import {
  createDb,
  readCatalog,
  readDealers,
  readProductStock,
  readPublishedReviews,
  readRetailers,
  readSettings,
  readWarehouseStock,
  type Db,
} from "@zenweld/db";
import type { CatalogData, ServerData } from "@zenweld/store";

/**
 * SITENIN KATALOGU — SUNUCU (KARARLAR K-88)
 *
 * Veri kaynagi ayardan secilir: DATA_SOURCE=database ise urunler,
 * kategoriler, gruplar, secenek tanimlari, Zenweld depo stogu ve magaza
 * ayarlari PostgreSQL'den (DATABASE_URL) okunur; yoksa site bugunku gibi
 * koddaki ornek veri ve tarayicidaki kopyayla calisir. Baglanti adresi
 * tanimli diye kendiliginden veritabanina gecilmez.
 *
 * Agir ya da sayfaya ozel veri (bayi ve satici stogu, bayiler, yorumlar)
 * her sayfaya gitmez; yalnizca gereken sayfa kendi verisini alir
 * (asagida "Sayfaya ozel veri").
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
/** Onbellek etiketleri: panel veritabanina yazinca ilgili kayit aninda yenilenecek. */
export const STOCK_TAG = "stok";
export const DEALERS_TAG = "bayiler";
export const REVIEWS_TAG = "yorumlar";

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
const cached = <A extends unknown[], T>(name: string, tag: string, read: (db: Db, ...args: A) => Promise<T>) =>
  // Fonksiyonun aldigi degerler (orn. urun kimligi) onbellek anahtarina girer.
  unstable_cache((...args: A) => read(database(), ...args), [name], {
    revalidate: CATALOG_REVALIDATE,
    tags: [tag],
  });

const cachedCatalog = cached("urunler", CATALOG_TAG, readCatalog);
const cachedWarehouseStock = cached("depo-stogu", CATALOG_TAG, readWarehouseStock);
const cachedSettings = cached("ayarlar", CATALOG_TAG, readSettings);

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

/**
 * Sayfa cercevesinin (site layout'u) tarayiciya verdigi veri. Veritabani
 * modunda katalog; sayfaya ozel kayit turleri (bayiler, saticilar, stoklar,
 * yorumlar) bos liste: boylece hicbir sayfa bunlari tarayicidaki eski
 * kopyadan okumaz, gereken sayfa kendi verisini ekler. Demo modunda null.
 */
export async function getLayoutData(): Promise<ServerData | null> {
  const catalog = await getDatabaseCatalog();
  if (!catalog) return null;
  return { ...catalog, dealers: [], retailers: [], dealerStock: [], retailerStock: [], reviews: [] };
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

/* ------------------------------------------------------------------ */
/* Sayfaya ozel veri (Asama 3.4)                                       */
/* ------------------------------------------------------------------ */

/*
 * Yalnizca gereken sayfaya giden kayitlar. Her biri demo modunda null
 * doner (sayfa tarayicidaki veriyle calisir). Pasif bayi ve saticilar
 * siteye gitmez.
 */
const cachedDealers = cached("bayiler", DEALERS_TAG, async (db) =>
  (await readDealers(db)).filter((d) => d.active),
);
const cachedRetailers = cached("saticilar", DEALERS_TAG, async (db) =>
  (await readRetailers(db)).filter((r) => r.active),
);
const cachedProductStock = cached("urun-stogu", STOCK_TAG, readProductStock);
const cachedProductReviews = cached("urun-yorumlari", REVIEWS_TAG, (db, productId: string) =>
  readPublishedReviews(db, { productId }),
);
const cachedFeaturedReviews = cached("one-cikan-yorumlar", REVIEWS_TAG, (db) =>
  readPublishedReviews(db, { featured: true }),
);

/** Saticinin fiyati sitede gosterilmez; tarayiciya da gonderilmez. */
function withoutPrice<T extends StockRow>(row: T): T {
  const copy = { ...row };
  delete copy.price;
  return copy;
}

/**
 * Urun sayfasi: o urunun bayi ve online satici stogu (stoktaki satirlar),
 * bayiler ("Stoktaki bayileri gor" penceresi), online saticilar ve
 * urunun yayindaki yorumlari.
 */
export async function getProductPageData(productId: string): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  const stock = await cachedProductStock(productId);
  return {
    dealers: await cachedDealers(),
    retailers: await cachedRetailers(),
    dealerStock: stock.dealerStock.map(withoutPrice),
    retailerStock: stock.retailerStock.map(withoutPrice),
    reviews: await cachedProductReviews(productId),
  };
}

/** Bayi Bul sayfasi: bayiler. */
export async function getDealerPageData(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  return { dealers: await cachedDealers() };
}

/** Anasayfa: bayi bulucu icin bayiler ve kayan seritteki one cikan yorumlar. */
export async function getHomePageData(): Promise<ServerData | null> {
  if (!usesDatabase()) return null;
  return { dealers: await cachedDealers(), reviews: await cachedFeaturedReviews() };
}
