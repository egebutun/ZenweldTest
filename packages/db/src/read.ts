import { and, asc, desc, eq, gt, inArray, isNotNull, type SQL } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  DB_VERSION,
  type Category,
  type CategoryGroup,
  type Coupon,
  type CouponRedemption,
  type Dealer,
  type DealerStock,
  type OptionDefinition,
  type Order,
  type Product,
  type ProductReview,
  type ProductFilterValues,
  type ProductVariant,
  type Quote,
  type Retailer,
  type RetailerStock,
  type ReturnRequest,
  type ShopSettings,
  type SiteSettings,
  type StockImport,
  type StockRow,
  type ZenweldDatabase,
} from "@zenweld/data";
import * as s from "./schema";

/**
 * VERITABANINDAN OKUMA (docs/VERITABANI.md › 14)
 *
 * Tablolardaki kayitlari sitenin kullandigi kayit sekline cevirir
 * (packages/data › types.ts); ornek veriyi yazan src/seed.ts'in tersidir.
 * Site ve panel boylece kendi kurallarini (packages/data, packages/store)
 * degistirmeden veritabanindaki veriyle calisir.
 *
 * - Bos kolon alana yazilmaz (undefined); siteye giden veri kucuk kalir.
 * - Tarih ve saatler ISO metin olarak doner (UTC).
 * - Kopya kayitlarda silinmis urun ya da uyeye bag bos ise kimlik "" olur;
 *   ad ve kod kopyasi durur.
 * - Her kayit turu ayri fonksiyonla okunur; sitenin ihtiyacina gore
 *   bunlarin bir kismi kullanilir (readDatabase hepsini birlestirir).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hem baglanti hem islem (transaction) kabul edilir
export type ReadDb = PgDatabase<PgQueryResultHKT, any>;

/** Bos kolonu (null) alan yok sayar. */
const opt = <T>(value: T | null): T | undefined => (value === null ? undefined : value);
const iso = (value: Date): string => value.toISOString();
const isoOpt = (value: Date | null): string | undefined => (value ? value.toISOString() : undefined);
/** Bos liste alan yok sayilir (urunde secenek ya da filtre yoksa). */
const list = <T>(items: T[]): T[] | undefined => (items.length > 0 ? items : undefined);

/**
 * Sorgulari sirayla calistirir: islem (transaction) icinde tek baglanti
 * vardir ve ayni baglantida es zamanli sorgu pg 9'da kalkiyor.
 */
type Tasks = readonly (() => PromiseLike<unknown>)[];
async function serial<T extends Tasks>(...tasks: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const results: unknown[] = [];
  for (const task of tasks) results.push(await task());
  return results as { [K in keyof T]: Awaited<ReturnType<T[K]>> };
}

/** Bir anahtara gore gruplar; siralama korunur. */
function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = map.get(k);
    if (bucket) bucket.push(row);
    else map.set(k, [row]);
  }
  return map;
}

/** Eski linkler: hedef turu ve kimligine gore. */
async function readRedirects(db: ReadDb) {
  const rows = await db.select().from(s.redirects).orderBy(asc(s.redirects.createdAt), asc(s.redirects.oldPath));
  return groupBy(rows, (r) => `${r.targetType}:${r.targetId}`);
}

const slugOf = (path: string, prefix: string) => (path.startsWith(prefix) ? path.slice(prefix.length) : path);

/* ------------------------------ Katalog ------------------------------ */

export interface Catalog {
  categoryGroups: CategoryGroup[];
  categories: Category[];
  optionDefinitions: OptionDefinition[];
  products: Product[];
}

/** Gruplar, kategoriler (secenek ve filtreleriyle), secenek tanimlari ve urunler. */
export async function readCatalog(db: ReadDb): Promise<Catalog> {
  const [groups, categories, definitions, values, categoryOptions, filters, filterValues, redirects] =
    await serial(
      () => db.select().from(s.categoryGroups).orderBy(asc(s.categoryGroups.section), asc(s.categoryGroups.position)),
      () => db.select().from(s.categories).orderBy(asc(s.categories.groupId), asc(s.categories.position)),
      () => db.select().from(s.optionDefinitions).orderBy(asc(s.optionDefinitions.position)),
      () => db.select().from(s.optionValues).orderBy(asc(s.optionValues.position)),
      () => db.select().from(s.categoryOptionDefinitions).orderBy(asc(s.categoryOptionDefinitions.position)),
      () => db.select().from(s.categoryFilters).orderBy(asc(s.categoryFilters.position)),
      () => db.select().from(s.categoryFilterValues).orderBy(asc(s.categoryFilterValues.position)),
      () => readRedirects(db),
    );

  const groupById = new Map(groups.map((g) => [g.id, g]));
  const valuesByDefinition = groupBy(values, (v) => v.optionDefinitionId);
  const optionsByCategory = groupBy(categoryOptions, (o) => o.categoryId);
  const filtersByCategory = groupBy(filters, (f) => f.categoryId);
  const valuesByFilter = groupBy(filterValues, (v) => `${v.categoryId}/${v.filterId}`);
  const paths = (type: string, id: string) => redirects.get(`${type}:${id}`)?.map((r) => r.oldPath);

  const categoryGroups: CategoryGroup[] = groups.map((g) => ({
    id: g.id,
    code: opt(g.code),
    slug: g.slug,
    section: g.section as CategoryGroup["section"],
    name: g.name,
    image: opt(g.image),
    order: g.position,
    description: opt(g.description),
    aboutText: opt(g.aboutText),
    seo: opt(g.seo),
    previousPaths: paths("group", g.id),
  }));

  const categoryList: Category[] = categories.map((c) => {
    const group = groupById.get(c.groupId)!;
    return {
      id: c.id,
      code: opt(c.code),
      slug: c.slug,
      section: group.section as Category["section"],
      group: group.slug,
      name: c.name,
      description: c.description,
      icon: opt(c.icon),
      image: opt(c.image),
      order: c.position,
      aboutText: opt(c.aboutText),
      optionIds: list((optionsByCategory.get(c.id) ?? []).map((o) => o.optionDefinitionId)),
      filters: list(
        (filtersByCategory.get(c.id) ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          values: (valuesByFilter.get(`${c.id}/${f.id}`) ?? []).map((v) => ({ id: v.id, label: v.label })),
        })),
      ),
      seo: opt(c.seo),
      previousPaths: paths("category", c.id),
    };
  });

  const optionDefinitions: OptionDefinition[] = definitions.map((d) => ({
    id: d.id,
    name: d.name,
    values: (valuesByDefinition.get(d.id) ?? []).map((v) => ({ id: v.id, label: v.label })),
  }));

  const categoryById = new Map(categoryList.map((c) => [c.id, c]));
  const products = await readProducts(db, categoryById, redirects);
  return { categoryGroups, categories: categoryList, optionDefinitions, products };
}

async function readProducts(
  db: ReadDb,
  categoryById: Map<string, Category>,
  redirects: Awaited<ReturnType<typeof readRedirects>>,
): Promise<Product[]> {
  const [rows, options, variants, variantValues, filterValues] = await serial(
    () => db.select().from(s.products).orderBy(asc(s.products.categoryId), asc(s.products.position), asc(s.products.name)),
    () => db.select().from(s.productOptions).orderBy(asc(s.productOptions.position)),
    () => db.select().from(s.productVariants).orderBy(asc(s.productVariants.position)),
    () => db.select().from(s.productVariantValues),
    () => db.select().from(s.productFilterValues),
  );
  const optionsByProduct = groupBy(options, (o) => o.productId);
  const variantsByProduct = groupBy(variants, (v) => v.productId);
  const valuesByVariant = groupBy(variantValues, (v) => `${v.productId}/${v.variantId}`);
  const filtersByProduct = groupBy(filterValues, (v) => v.productId);

  return rows.map((p) => {
    const category = categoryById.get(p.categoryId)!;
    const optionIds = (optionsByProduct.get(p.id) ?? []).map((o) => o.optionDefinitionId);
    const productRedirects = redirects.get(`product:${p.id}`) ?? [];
    const variantList: ProductVariant[] = (variantsByProduct.get(p.id) ?? []).map((v) => ({
      id: v.id,
      values: Object.fromEntries(
        (valuesByVariant.get(`${p.id}/${v.id}`) ?? []).map((x) => [x.optionDefinitionId, x.optionValueId]),
      ),
      sku: v.sku,
      priceDeltaExVat: v.priceDeltaExVat,
      specOverrides: opt(v.specOverrides),
      inTheBox: opt(v.inTheBox),
      image: opt(v.image),
      previousSlugs: list(productRedirects.filter((r) => r.variantId === v.id).map((r) => slugOf(r.oldPath, "/urun/"))),
    }));
    const filterValueMap: ProductFilterValues = {};
    for (const f of filtersByProduct.get(p.id) ?? []) (filterValueMap[f.filterId] ??= []).push(f.valueId);

    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      modelCode: opt(p.modelCode),
      brand: opt(p.brand),
      section: category.section,
      categorySlug: category.slug,
      processes: (p.processes ?? []) as Product["processes"],
      shortDescription: p.shortDescription,
      description: p.description,
      priceExVat: p.priceExVat,
      vatRate: p.vatRate,
      currency: "TRY",
      images: p.images,
      specs: p.specs,
      inTheBox: p.inTheBox,
      highlights: p.highlights,
      discount: p.discountPercent
        ? { percent: p.discountPercent, startsAt: isoOpt(p.discountStartsAt), endsAt: isoOpt(p.discountEndsAt) }
        : undefined,
      options: optionIds.length > 0 ? { optionIds, variants: variantList } : undefined,
      filterValues: Object.keys(filterValueMap).length > 0 ? filterValueMap : undefined,
      isNew: p.isNew,
      order: opt(p.position),
      manualUrl: opt(p.manualUrl),
      warrantyMonths: p.warrantyMonths,
      createdAt: iso(p.createdAt),
      updatedAt: iso(p.updatedAt),
      active: p.active,
      seo: opt(p.seo),
      previousSlugs: list(productRedirects.filter((r) => !r.variantId).map((r) => slugOf(r.oldPath, "/urun/"))),
    };
  });
}

/* ------------------------- Bayi, satici ve stok ------------------------- */

export async function readDealers(db: ReadDb): Promise<Dealer[]> {
  const rows = await db.select().from(s.dealers).orderBy(asc(s.dealers.id));
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    city: d.city,
    district: d.district,
    address: d.address,
    phone: d.phone,
    whatsapp: opt(d.whatsapp),
    email: opt(d.email),
    lat: d.lat,
    lng: d.lng,
    badges: d.badges as Dealer["badges"],
    workingHours: d.workingHours,
    retailerId: opt(d.retailerId),
    active: d.active,
  }));
}

export async function readRetailers(db: ReadDb): Promise<Retailer[]> {
  const rows = await db.select().from(s.retailers).orderBy(asc(s.retailers.id));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    websiteUrl: r.websiteUrl,
    logoText: r.logoText,
    logoUrl: opt(r.logoUrl),
    isOwnStore: r.isOwnStore,
    city: opt(r.city),
    active: r.active,
  }));
}

type StockColumns = {
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  price: number | null;
  url: string | null;
  updatedAt: Date;
};

const stockRow = (r: StockColumns): StockRow => ({
  productId: r.productId,
  variantId: r.variantId || undefined,
  sku: r.sku,
  quantity: r.quantity,
  price: opt(r.price),
  url: opt(r.url),
  updatedAt: iso(r.updatedAt),
});

type DealerStockColumns = StockColumns & { dealerId: string };
type RetailerStockColumns = StockColumns & { retailerId: string };
const dealerStockRow = (r: DealerStockColumns): DealerStock => ({ dealerId: r.dealerId, ...stockRow(r) });
const retailerStockRow = (r: RetailerStockColumns): RetailerStock => ({ retailerId: r.retailerId, ...stockRow(r) });

/**
 * Bir urunun bayi ve online satici stogu; yalnizca adedi 0'dan buyuk
 * satirlar (sitede gorunebilecekler; urun sayfasi, KARARLAR K-88).
 * Tazelik (son guncelleme) sitede hesaplanir.
 */
export async function readProductStock(
  db: ReadDb,
  productId: string,
): Promise<{ dealerStock: DealerStock[]; retailerStock: RetailerStock[] }> {
  const [dealer, retailer] = await serial(
    () => db
      .select()
      .from(s.dealerStock)
      .where(and(eq(s.dealerStock.productId, productId), gt(s.dealerStock.quantity, 0)))
      .orderBy(asc(s.dealerStock.dealerId), asc(s.dealerStock.variantId)),
    () => db
      .select()
      .from(s.retailerStock)
      .where(and(eq(s.retailerStock.productId, productId), gt(s.retailerStock.quantity, 0)))
      .orderBy(asc(s.retailerStock.retailerId), asc(s.retailerStock.variantId)),
  );
  return { dealerStock: dealer.map(dealerStockRow), retailerStock: retailer.map(retailerStockRow) };
}

/** Bayi ve online satici stoklari ile stok islemleri. */
export async function readStock(db: ReadDb): Promise<{
  dealerStock: DealerStock[];
  retailerStock: RetailerStock[];
  stockImports: StockImport[];
  skuAliases: ZenweldDatabase["skuAliases"];
}> {
  const [dealer, retailer, imports, aliases] = await serial(
    () => db.select().from(s.dealerStock).orderBy(asc(s.dealerStock.dealerId), asc(s.dealerStock.productId), asc(s.dealerStock.variantId)),
    () => db
      .select()
      .from(s.retailerStock)
      .orderBy(asc(s.retailerStock.retailerId), asc(s.retailerStock.productId), asc(s.retailerStock.variantId)),
    () => db.select().from(s.stockImports).orderBy(desc(s.stockImports.createdAt)),
    () => db.select().from(s.skuAliases),
  );
  return {
    dealerStock: dealer.map(dealerStockRow),
    retailerStock: retailer.map(retailerStockRow),
    stockImports: imports.map((i) => ({
      id: i.id,
      sourceType: i.sourceType as StockImport["sourceType"],
      sourceId: i.sourceId,
      kind: i.kind as StockImport["kind"],
      fileName: opt(i.fileName),
      createdAt: iso(i.createdAt),
      createdBy: opt(i.createdBy),
      note: opt(i.note),
      summary: {
        rows: i.rows,
        matched: i.matched,
        unmatched: i.unmatched,
        invalid: i.invalid,
        added: i.added,
        changed: i.changed,
        zeroed: i.zeroed,
      },
      previous: opt(i.previous),
      revertedAt: isoOpt(i.revertedAt),
    })),
    skuAliases: aliases.map((a) => ({
      sourceId: a.sourceId,
      code: a.code,
      productId: a.productId,
      variantId: a.variantId || undefined,
    })),
  };
}

/** Zenweld depo stogu (SAP). */
export async function readWarehouseStock(db: ReadDb): Promise<ZenweldDatabase["warehouseStock"]> {
  const rows = await db.select().from(s.warehouseStock).orderBy(asc(s.warehouseStock.sapItemCode));
  return rows.map((r) => ({
    sapItemCode: r.sapItemCode,
    itemName: opt(r.itemName),
    quantity: r.quantity,
    syncedAt: iso(r.syncedAt),
  }));
}

/* ------------------------------ Ayarlar ------------------------------ */

export async function readSettings(db: ReadDb): Promise<SiteSettings> {
  const [rows, pos, banks, carriers] = await serial(
    () => db.select().from(s.settings),
    () => db.select().from(s.paymentPos).orderBy(asc(s.paymentPos.position)),
    () => db.select().from(s.bankAccounts).orderBy(asc(s.bankAccounts.position)),
    () => db.select().from(s.carriers).orderBy(asc(s.carriers.position)),
  );
  const value = (key: string) => rows.find((r) => r.key === key)?.value;
  const shop = (value("shop") ?? {}) as Pick<
    ShopSettings,
    "freeShippingThreshold" | "shippingFee" | "minInstallmentAmount" | "transferDueDays"
  >;
  return {
    shop: {
      freeShippingThreshold: shop.freeShippingThreshold,
      shippingFee: shop.shippingFee,
      minInstallmentAmount: shop.minInstallmentAmount,
      transferDueDays: shop.transferDueDays,
      pos: pos.map((p) => ({
        id: p.id,
        bankShortName: p.bankShortName,
        name: p.name,
        program: opt(p.program) as ShopSettings["pos"][number]["program"],
        merchantNo: p.merchantNo,
        posName: p.posName,
        active: p.active,
        isDefault: p.isDefault,
        installments: p.installments,
        commissions: p.commissions,
      })),
      bankAccounts: banks.map((b) => ({ id: b.id, bankName: b.bankName, accountHolder: b.accountHolder, iban: b.iban })),
      carriers: carriers.map((c) => c.name),
    },
    stock: value("stock") as SiteSettings["stock"],
    richText: value("rich_text") as SiteSettings["richText"],
  };
}

/* ------------------------------ Uyeler ------------------------------ */

/** Uye satiri -> sitenin uye kaydi (sifre ozetiyle; tarayiciya gonderilecekse ozet bosaltilir). */
export function userRecord(u: typeof s.users.$inferSelect): ZenweldDatabase["users"][number] {
  return {
    id: u.id,
    role: u.role as ZenweldDatabase["users"][number]["role"],
    status: u.status as ZenweldDatabase["users"][number]["status"],
    email: u.email,
    passwordHash: u.passwordHash,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    companyName: opt(u.companyName),
    taxOffice: opt(u.taxOffice),
    taxNumber: opt(u.taxNumber),
    sector: opt(u.sector),
    city: opt(u.city),
    createdAt: iso(u.createdAt),
    lastLoginAt: isoOpt(u.lastLoginAt),
    newsletter: u.newsletter,
  };
}

/** Adres satiri -> sitenin adres kaydi. */
export function addressRecord(a: typeof s.addresses.$inferSelect): ZenweldDatabase["addresses"][number] {
  return {
    id: a.id,
    userId: a.userId,
    title: a.title,
    fullName: a.fullName,
    phone: a.phone,
    city: a.city,
    district: a.district,
    line: a.line,
    isDefault: a.isDefault,
  };
}

export async function readUsers(db: ReadDb): Promise<Pick<ZenweldDatabase, "users" | "addresses">> {
  const [users, addresses] = await serial(
    () => db.select().from(s.users).orderBy(asc(s.users.createdAt), asc(s.users.id)),
    () => db.select().from(s.addresses).orderBy(asc(s.addresses.userId), desc(s.addresses.isDefault), asc(s.addresses.id)),
  );
  return {
    users: users.map(userRecord),
    addresses: addresses.map(addressRecord),
  };
}

/* ------------------------- Teklif, siparis, iade ------------------------- */

export async function readQuotes(db: ReadDb): Promise<Quote[]> {
  const [quotes, items] = await serial(
    () => db.select().from(s.quotes).orderBy(desc(s.quotes.createdAt)),
    () => db.select().from(s.quoteItems).orderBy(asc(s.quoteItems.line)),
  );
  const itemsByQuote = groupBy(items, (i) => i.quoteId);
  return quotes.map((q) => ({
    id: q.id,
    code: q.code,
    userId: opt(q.userId),
    status: q.status as Quote["status"],
    companyName: q.companyName,
    contactName: q.contactName,
    email: q.email,
    phone: q.phone,
    taxNumber: opt(q.taxNumber),
    city: q.city,
    paymentPreference: q.paymentPreference as Quote["paymentPreference"],
    termDays: opt(q.termDays),
    items: (itemsByQuote.get(q.id) ?? []).map((i) => ({
      productId: i.productId ?? "",
      productName: i.productName,
      sku: opt(i.sku),
      variantLabel: opt(i.variantLabel),
      quantity: i.quantity,
      note: opt(i.note),
    })),
    message: opt(q.message),
    assignedTo: opt(q.assignedTo),
    adminNote: opt(q.adminNote),
    createdAt: iso(q.createdAt),
    updatedAt: iso(q.updatedAt),
  }));
}

/**
 * Siparisler, yeniden eskiye. where verilirse yalnizca o siparisler ve
 * onlarin satirlari (or. bir uyenin siparisleri; Asama 5.2).
 */
export async function readOrders(db: ReadDb, where?: SQL): Promise<Order[]> {
  const orders = await db.select().from(s.orders).where(where).orderBy(desc(s.orders.createdAt), desc(s.orders.code));
  if (where && orders.length === 0) return [];
  const ids = orders.map((o) => o.id);
  const own = <T>(column: T) => (where ? inArray(column as never, ids) : undefined);
  const [items, history, shipments, redemptions] = await serial(
    () => db.select().from(s.orderItems).where(own(s.orderItems.orderId)).orderBy(asc(s.orderItems.line)),
    () => db.select().from(s.orderStatusHistory).where(own(s.orderStatusHistory.orderId)).orderBy(asc(s.orderStatusHistory.seq)),
    () => db.select().from(s.shipments).where(own(s.shipments.orderId)).orderBy(asc(s.shipments.shippedAt)),
    () =>
      db
        .select({ orderId: s.couponRedemptions.orderId, couponId: s.couponRedemptions.couponId })
        .from(s.couponRedemptions)
        .where(own(s.couponRedemptions.orderId)),
  );
  const itemsByOrder = groupBy(items, (i) => i.orderId);
  const historyByOrder = groupBy(history, (h) => h.orderId);
  const outbound = new Map(shipments.filter((x) => x.kind === "outbound").map((x) => [x.orderId, x]));
  const couponIdByOrder = new Map(redemptions.map((r) => [r.orderId, r.couponId]));

  return orders.map((o) => {
    const shipment = outbound.get(o.id);
    return {
      id: o.id,
      code: o.code,
      userId: o.userId ?? "",
      status: o.status as Order["status"],
      customerName: o.customerName,
      email: o.email,
      phone: o.phone,
      shippingAddress: o.shippingAddress,
      invoice: o.invoice,
      items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
        productId: i.productId ?? "",
        productName: i.productName,
        sku: i.sku,
        variantLabel: opt(i.variantLabel),
        quantity: i.quantity,
        unitPriceExVat: i.unitPriceExVat,
        vatRate: i.vatRate,
        unitPrice: i.unitPrice,
        couponDiscount: i.couponDiscount > 0 ? i.couponDiscount : undefined,
      })),
      subtotal: o.subtotal,
      coupon: o.couponCode
        ? { couponId: couponIdByOrder.get(o.id) ?? "", code: o.couponCode, discount: o.couponDiscount }
        : undefined,
      vat: o.vat,
      shipping: o.shipping,
      installmentFee: o.installmentFee,
      total: o.total,
      payment: {
        method: o.paymentMethod as Order["payment"]["method"],
        installments: opt(o.installments),
        cardBrand: opt(o.cardBrand),
        cardProgram: opt(o.cardProgram),
        cardLast4: opt(o.cardLast4),
        posId: opt(o.posId),
        posName: opt(o.posName),
        commissionPercent: opt(o.commissionPercent),
        paidAt: isoOpt(o.paidAt),
        dueAt: isoOpt(o.dueAt),
      },
      shipment: shipment
        ? {
            carrier: shipment.carrierName,
            trackingNumber: shipment.trackingNumber,
            shippedAt: iso(shipment.shippedAt),
            deliveredAt: isoOpt(shipment.deliveredAt),
          }
        : undefined,
      history: (historyByOrder.get(o.id) ?? []).map((h) => ({
        status: h.status as Order["status"],
        at: iso(h.at),
        note: opt(h.note),
      })),
      customerNote: opt(o.customerNote),
      adminNote: opt(o.adminNote),
      termsAcceptedAt: iso(o.termsAcceptedAt),
      createdAt: iso(o.createdAt),
      updatedAt: iso(o.updatedAt),
    };
  });
}

/** Iade talepleri, yeniden eskiye; where verilirse yalnizca o talepler. */
export async function readReturnRequests(db: ReadDb, where?: SQL): Promise<ReturnRequest[]> {
  const requests = await db.select().from(s.returnRequests).where(where).orderBy(desc(s.returnRequests.createdAt));
  if (where && requests.length === 0) return [];
  const ids = requests.map((r) => r.id);
  const items = await db
    .select()
    .from(s.returnRequestItems)
    .where(where ? inArray(s.returnRequestItems.returnRequestId, ids) : undefined)
    .orderBy(asc(s.returnRequestItems.orderLine));
  const itemsByRequest = groupBy(items, (i) => i.returnRequestId);
  return requests.map((r) => ({
    id: r.id,
    code: r.code,
    orderId: r.orderId,
    orderCode: r.orderCode,
    userId: r.userId ?? "",
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    items: (itemsByRequest.get(r.id) ?? []).map((i) => ({
      line: i.orderLine,
      productId: i.productId ?? "",
      productName: i.productName,
      sku: i.sku,
      variantLabel: opt(i.variantLabel),
      quantity: i.quantity,
    })),
    reason: r.reason as ReturnRequest["reason"],
    note: opt(r.note),
    status: r.status as ReturnRequest["status"],
    adminNote: opt(r.adminNote),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  }));
}

/* ------------------------------ Kuponlar ------------------------------ */

/** Kuponlar ve kullanimlari; where verilirse yalnizca o kuponlar (or. koda gore; Asama 5.2). */
export async function readCoupons(
  db: ReadDb,
  where?: SQL,
): Promise<{ coupons: Coupon[]; couponRedemptions: CouponRedemption[] }> {
  const coupons = await db.select().from(s.coupons).where(where).orderBy(desc(s.coupons.createdAt));
  if (where && coupons.length === 0) return { coupons: [], couponRedemptions: [] };
  const ids = coupons.map((c) => c.id);
  const own = <T>(column: T) => (where ? inArray(column as never, ids) : undefined);
  const [targets, customers, redemptions] = await serial(
    () => db.select().from(s.couponTargets).where(own(s.couponTargets.couponId)).orderBy(asc(s.couponTargets.id)),
    () => db.select().from(s.couponCustomers).where(own(s.couponCustomers.couponId)).orderBy(asc(s.couponCustomers.id)),
    () =>
      db.select().from(s.couponRedemptions).where(own(s.couponRedemptions.couponId)).orderBy(asc(s.couponRedemptions.createdAt)),
  );
  const targetsByCoupon = groupBy(targets, (t) => t.couponId);
  const customersByCoupon = groupBy(customers, (c) => c.couponId);
  return {
    coupons: coupons.map((c) => {
      const own = targetsByCoupon.get(c.id) ?? [];
      return {
        id: c.id,
        code: c.code,
        name: opt(c.name),
        discountType: c.discountType as Coupon["discountType"],
        discountValue: c.discountValue,
        minCartTotal: opt(c.minCartTotal),
        startsAt: isoOpt(c.startsAt),
        endsAt: isoOpt(c.endsAt),
        totalUsageLimit: opt(c.totalUsageLimit),
        perUserLimit: opt(c.perUserLimit),
        scope: c.scope as Coupon["scope"],
        productIds: own.flatMap((t) => (t.productId ? [t.productId] : [])),
        categoryIds: own.flatMap((t) => (t.categoryId ? [t.categoryId] : [])),
        audience: c.audience as Coupon["audience"],
        customerEmails: (customersByCoupon.get(c.id) ?? []).map((x) => x.email),
        active: c.active,
        createdAt: iso(c.createdAt),
        updatedAt: iso(c.updatedAt),
      };
    }),
    couponRedemptions: redemptions.map((r) => ({
      id: String(r.id),
      couponId: r.couponId,
      couponCode: r.couponCode,
      userId: opt(r.userId),
      orderId: r.orderId,
      discountAmount: r.discountAmount,
      createdAt: iso(r.createdAt),
      releasedAt: isoOpt(r.releasedAt),
    })),
  };
}

/* --------------------- Servis, garanti ve yorumlar --------------------- */

export async function readSupport(
  db: ReadDb,
): Promise<Pick<ZenweldDatabase, "serviceRequests" | "warranties" | "reviews">> {
  const [services, warranties, reviews, categories] = await serial(
    () => db.select().from(s.serviceRequests).orderBy(desc(s.serviceRequests.createdAt)),
    () => db.select().from(s.warranties).orderBy(desc(s.warranties.registeredAt)),
    () => db.select().from(s.reviews).orderBy(desc(s.reviews.createdAt)),
    () => db.select({ id: s.categories.id, slug: s.categories.slug }).from(s.categories),
  );
  const slugOfCategory = (id: string | null) => (id ? (categories.find((c) => c.id === id)?.slug ?? "") : "");
  return {
    serviceRequests: services.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status as ZenweldDatabase["serviceRequests"][number]["status"],
      categorySlug: slugOfCategory(r.categoryId),
      productId: r.productId ?? "",
      productName: r.productName,
      reasons: r.reasons as ZenweldDatabase["serviceRequests"][number]["reasons"],
      complaint: r.complaint,
      companyName: r.companyName,
      address: r.address,
      city: r.city,
      district: r.district,
      email: r.email,
      phone: r.phone,
      contactName: r.contactName,
      contactGsm: r.contactGsm,
      userId: opt(r.userId),
      adminNote: opt(r.adminNote),
      createdAt: iso(r.createdAt),
      updatedAt: iso(r.updatedAt),
    })),
    warranties: warranties.map((w) => ({
      id: w.id,
      serialNumber: w.serialNumber,
      categorySlug: slugOfCategory(w.categoryId),
      productId: w.productId ?? "",
      ownerName: w.ownerName,
      email: w.email,
      phone: w.phone,
      city: w.city,
      postalCode: w.postalCode,
      address: w.address,
      sellerTaxNumber: w.sellerTaxNumber,
      registeredAt: iso(w.registeredAt),
      expiresAt: w.expiresAt,
      extended: w.extended,
    })),
    reviews: reviews.map(reviewRecord),
  };
}

const reviewRecord = (r: typeof s.reviews.$inferSelect): ProductReview => ({
  id: r.id,
  productId: r.productId ?? "",
  userId: opt(r.userId),
  authorName: r.authorName,
  rating: r.rating,
  title: opt(r.title),
  body: r.body,
  media: r.media,
  verifiedPurchase: opt(r.verifiedPurchase),
  approved: r.approved,
  featured: r.featured,
  createdAt: iso(r.createdAt),
});

/**
 * Sitede yayinda olan (onayli) yorumlar, en yeni once: bir urunun
 * yorumlari (urun sayfasi) ya da anasayfada one cikarilanlar. Onay
 * bekleyenler siteye gitmez.
 */
export async function readPublishedReviews(
  db: ReadDb,
  filter: { productId: string } | { featured: true },
): Promise<ProductReview[]> {
  const where: SQL[] = [eq(s.reviews.approved, true), isNotNull(s.reviews.productId)];
  if ("productId" in filter) where.push(eq(s.reviews.productId, filter.productId));
  else where.push(eq(s.reviews.featured, true));
  const rows = await db
    .select()
    .from(s.reviews)
    .where(and(...where))
    .orderBy(desc(s.reviews.createdAt));
  return rows.map(reviewRecord);
}

/* ------------------------------ Icerik ------------------------------ */

export type Content = Pick<
  ZenweldDatabase,
  | "blogPosts"
  | "news"
  | "events"
  | "faqs"
  | "salesReps"
  | "legalPages"
  | "about"
  | "pageSeo"
  | "documentPages"
  | "documents"
>;

export async function readContent(db: ReadDb): Promise<Content> {
  const [blog, news, events, faqs, reps, legal, about, pageSeo, documentPages, documents, redirects] = await serial(
    () => db.select().from(s.blogPosts).orderBy(desc(s.blogPosts.publishedAt)),
    () => db.select().from(s.news).orderBy(desc(s.news.publishedAt)),
    () => db.select().from(s.events).orderBy(desc(s.events.startDate)),
    () => db.select().from(s.faqs).orderBy(asc(s.faqs.position)),
    () => db.select().from(s.salesReps).orderBy(asc(s.salesReps.position)),
    () => db.select().from(s.legalPages),
    () => db.select().from(s.aboutPage),
    () => db.select().from(s.pageSeo),
    () => db.select().from(s.documentPages),
    () => db.select().from(s.documents).orderBy(asc(s.documents.position)),
    () => readRedirects(db),
  );
  const slugs = (type: string, id: string, prefix: string) =>
    list((redirects.get(`${type}:${id}`) ?? []).map((r) => slugOf(r.oldPath, prefix)));
  const page = about[0];

  return {
    blogPosts: blog.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt,
      body: b.body,
      coverUrl: b.coverUrl,
      category: b.category,
      author: b.author,
      publishedAt: iso(b.publishedAt),
      active: b.active,
      seo: opt(b.seo),
      previousSlugs: slugs("blog", b.id, "/blog/"),
    })),
    news: news.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      body: n.body,
      coverUrl: n.coverUrl,
      images: n.images,
      publishedAt: iso(n.publishedAt),
      active: n.active,
      seo: opt(n.seo),
      previousSlugs: slugs("news", n.id, "/haberler/"),
    })),
    events: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      summary: e.summary,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      venue: e.venue,
      city: e.city,
      country: e.country,
      logoUrl: e.logoUrl,
      images: e.images,
      websiteUrl: opt(e.websiteUrl),
      active: e.active,
      seo: opt(e.seo),
      previousSlugs: slugs("event", e.id, "/etkinlikler/"),
    })),
    faqs: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      topic: f.topic as ZenweldDatabase["faqs"][number]["topic"],
    })),
    salesReps: reps.map((r) => ({
      id: r.id,
      name: r.name,
      region: r.region,
      phone: r.phone,
      email: r.email,
      photoUrl: opt(r.photoUrl),
      order: r.position,
      active: r.active,
    })),
    legalPages: legal.map((l) => ({ id: l.id, title: l.title, body: l.body, updatedAt: iso(l.updatedAt) })),
    about: {
      heroTitle: page?.heroTitle ?? "",
      heroSubtitle: page?.heroSubtitle ?? "",
      heroImage: page ? opt(page.heroImage) : undefined,
      stats: page?.stats ?? [],
      sections: page?.sections ?? [],
      updatedAt: page ? iso(page.updatedAt) : new Date(0).toISOString(),
    },
    pageSeo: Object.fromEntries(
      pageSeo.map((p) => [p.path, { title: opt(p.title), description: opt(p.description) }]),
    ),
    documentPages: documentPages.map((p) => ({
      section: p.section as ZenweldDatabase["documentPages"][number]["section"],
      title: p.title,
      subtitle: p.subtitle,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      section: d.section as ZenweldDatabase["documents"][number]["section"],
      title: d.title,
      productId: opt(d.productId),
      lotNumber: opt(d.lotNumber),
      fileName: d.fileName,
      mimeType: d.mimeType,
      size: d.sizeBytes,
      fileKey: d.fileKey,
      active: d.active,
      createdAt: iso(d.createdAt),
      updatedAt: iso(d.updatedAt),
    })),
  };
}

/** Son verilen kayit numaralari. */
export async function readRecordCounters(db: ReadDb): Promise<Record<string, number>> {
  const rows = await db.select().from(s.recordCounters);
  return Object.fromEntries(rows.map((r) => [r.prefix, r.lastNumber]));
}

/**
 * Butun veritabani, sitenin bugun tarayicida tuttugu sekilde. Panel
 * veritabanina baglanirken ve gidis-donus testinde kullanilir; site
 * sayfalari yalnizca ihtiyac duydugu parcalari okur.
 */
export async function readDatabase(db: ReadDb): Promise<ZenweldDatabase> {
  const [catalog, dealers, retailers, stock, warehouseStock, settings, people, quotes, orders, returns, coupons, support, content, recordCounters] =
    await serial(
      () => readCatalog(db),
      () => readDealers(db),
      () => readRetailers(db),
      () => readStock(db),
      () => readWarehouseStock(db),
      () => readSettings(db),
      () => readUsers(db),
      () => readQuotes(db),
      () => readOrders(db),
      () => readReturnRequests(db),
      () => readCoupons(db),
      () => readSupport(db),
      () => readContent(db),
      () => readRecordCounters(db),
    );
  return {
    version: DB_VERSION,
    ...catalog,
    dealers,
    retailers,
    ...stock,
    warehouseStock,
    ...people,
    quotes,
    orders,
    ...coupons,
    ...content,
    ...support,
    returnRequests: returns,
    recordCounters,
    settings,
  };
}
