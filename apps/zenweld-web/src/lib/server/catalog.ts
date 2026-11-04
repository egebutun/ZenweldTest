import { createSeedDatabase, type StockRow } from "@zenweld/data";
import {
  readCatalog,
  readDealers,
  readProductStock,
  readPublishedReviews,
  readRetailers,
  readSettings,
  readWarehouseStock,
} from "@zenweld/db";
import type { CatalogData, ServerData } from "@zenweld/store";
import { getLayoutContent } from "./content";
import { buildTime, cached, usesDatabase } from "./db";

/**
 * SITENIN KATALOGU — SUNUCU (KARARLAR K-88)
 *
 * Veritabani modunda (lib/server/db.ts) urunler, kategoriler, gruplar,
 * secenek tanimlari, Zenweld depo stogu ve magaza ayarlari veritabanindan
 * okunur; demo modunda sunucu koddaki ornek veriyi kullanir.
 *
 * Agir ya da sayfaya ozel veri (bayi ve satici stogu, bayiler, yorumlar)
 * her sayfaya gitmez; yalnizca gereken sayfa kendi verisini alir
 * (asagida "Sayfaya ozel veri"). Icerik (blog, yasal metinler...):
 * lib/server/content.ts.
 */

export const CATALOG_TAG = "katalog";
/** Onbellek etiketleri: panel veritabanina yazinca ilgili kayit aninda yenilenecek. */
export const STOCK_TAG = "stok";
export const DEALERS_TAG = "bayiler";
export const REVIEWS_TAG = "yorumlar";

/*
 * Katalog, depo stogu ve ayarlar ayri kayitlar olarak saklanir (bugun
 * katalogun tamami ~110 KB; 2 MB sinirina ~1.000 urunde yaklasilir).
 */
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
 * modunda katalog ve her sayfada kullanilan icerik (getLayoutContent);
 * sayfaya ozel kayit turleri (bayiler, saticilar, stoklar, yorumlar) bos
 * liste: boylece hicbir sayfa bunlari tarayicidaki eski kopyadan okumaz,
 * gereken sayfa kendi verisini ekler. Demo modunda null.
 */
export async function getLayoutData(): Promise<ServerData | null> {
  const catalog = await getDatabaseCatalog();
  if (!catalog) return null;
  return {
    ...catalog,
    dealers: [],
    retailers: [],
    dealerStock: [],
    retailerStock: [],
    reviews: [],
    ...(await getLayoutContent()),
  };
}

let demo: CatalogData | undefined;

/** Demo modunda sunucunun bildigi katalog: koddaki ornek veri (derleme anina gore). */
function demoCatalog(): CatalogData {
  if (!demo) {
    const seed = createSeedDatabase(buildTime());
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
