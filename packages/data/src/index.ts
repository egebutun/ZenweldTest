export * from "./types";
export * from "./highlights";
export * from "./discount";
export * from "./checkout";
export * from "./legal";
export * from "./stock";
export * from "./catalog";
export * from "./variants";
export { categories, categoryGroups } from "./seed/categories.seed";
export { products } from "./seed/products.seed";
export { dealers } from "./seed/dealers.seed";
export { retailers } from "./seed/retailers.seed";
export { users, addresses } from "./seed/users.seed";
export { blogPosts, faqs, quotes, warranties } from "./seed/content.seed";
export { orders } from "./seed/orders.seed";
export { reviews } from "./seed/reviews.seed";
export { events, news } from "./seed/events.seed";
export { stockPhotos } from "./seed/images";
export { defaultSettings } from "./seed/settings.seed";
export { about, salesReps } from "./seed/company.seed";
export { legalPages } from "./seed/legal.seed";
export { DOCUMENT_SECTIONS, documentPages } from "./seed/documents.seed";

import type { ZenweldDatabase } from "./types";
import { categories, categoryGroups } from "./seed/categories.seed";
import { optionDefinitions } from "./seed/options.seed";
import { products } from "./seed/products.seed";
import { dealers } from "./seed/dealers.seed";
import { retailers } from "./seed/retailers.seed";
import { createSampleStock } from "./seed/stock.seed";
import { users, addresses } from "./seed/users.seed";
import { blogPosts, faqs, quotes, warranties } from "./seed/content.seed";
import { orders } from "./seed/orders.seed";
import { reviews } from "./seed/reviews.seed";
import { events, news } from "./seed/events.seed";
import { defaultSettings } from "./seed/settings.seed";
import { about, salesReps } from "./seed/company.seed";
import { legalPages } from "./seed/legal.seed";
import { documentPages } from "./seed/documents.seed";
import { createSampleActivity } from "./seed/sample-activity.seed";

/** localStorage'a yuklenecek baslangic veritabani. */
export const DB_VERSION = 58;

/**
 * now: ornek hareketlerin (siparis, stok ...) tarihlendigi an. Tarayicida
 * kurulum ani; sunucu anlik goruntusunde derleme ani (hydration tutarli kalsin).
 */
export function createSeedDatabase(now: number = Date.now()): ZenweldDatabase {
  // Panel grafikleri icin son 90 gunun ornek hareketleri (bkz. sample-activity.seed.ts)
  const sample = createSampleActivity(now);
  const stock = createSampleStock(now);
  return JSON.parse(
    JSON.stringify({
      version: DB_VERSION,
      products,
      categories,
      categoryGroups,
      optionDefinitions,
      dealers,
      retailers,
      dealerStock: stock.dealerStock,
      retailerStock: stock.retailerStock,
      stockImports: stock.stockImports,
      skuAliases: [],
      users: [...users, ...sample.users],
      addresses,
      quotes: [...quotes, ...sample.quotes],
      orders: [...orders, ...sample.orders],
      blogPosts,
      events,
      news,
      faqs,
      documentPages,
      documents: [],
      reviews,
      warranties: [...warranties, ...sample.warranties],
      about,
      salesReps,
      legalPages,
      serviceRequests: sample.serviceRequests,
      // Ornek kayitlarin numaralari nextCode'da mevcut en buyuk numaradan okunur.
      recordCounters: {},
      settings: defaultSettings,
    }),
  ) as ZenweldDatabase;
}
