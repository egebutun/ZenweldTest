import { getTableName } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT, PgTable } from "drizzle-orm/pg-core";
import type { Product, ZenweldDatabase } from "@zenweld/data";
import * as s from "./schema";

/**
 * ORNEK VERIYI TABLOLARA YUKLEME (npm run db:seed; docs/SUNUCU.md › 5)
 *
 * Sitenin bugun tarayicida kurdugu ornek verinin (packages/data,
 * createSeedDatabase) tamami tablolara yazilir. Esleme belgedeki "Bugunku
 * veriden farklar" tablosuna gore yapilir: linkle baglanan kategori ve
 * gruplar kimlige, urunun secenekleri ve filtreleri ayri tablolara,
 * siparisin odeme, kargo ve gecmisi kolonlara ve tablolara ayrilir.
 *
 * JSON kolonlarindaki alan adlari uygulamadaki gibidir (fullName,
 * ratePercent ...); kayit katmani donusturmeden okur.
 *
 * Silinmis bir urune ya da uyeye baglanan kopya kayitlarda (siparis satiri,
 * teklif satiri, yorum ...) bag bos birakilir; ad ve kod kopyasi kalir
 * (VERITABANI.md › Genel kurallar › Silme: bosalir).
 */

type Insert<T extends PgTable> = T["$inferInsert"];

/** Tablo ve satirlari; tablolar yabanci anahtar sirasiyla yazilir. */
export interface SeedTable<T extends PgTable = PgTable> {
  table: T;
  rows: Insert<T>[];
}

const date = (iso: string | undefined): Date | undefined => (iso ? new Date(iso) : undefined);
const required = (iso: string): Date => new Date(iso);
const entry = <T extends PgTable>(table: T, rows: Insert<T>[]): SeedTable => ({ table, rows }) as unknown as SeedTable;

/** Kombinasyonun yazimi: urunun secenek sirasiyla "tanim=deger", "|" ile. */
export function combinationKey(optionIds: string[], values: Record<string, string>): string {
  return optionIds.map((id) => `${id}=${values[id]}`).join("|");
}

/** Kargo firmasinin kimligi adindan: "Yurtiçi Kargo" -> "yurtici-kargo". */
export function carrierId(name: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return name
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (ch) => map[ch])
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Ornek verinin tablolara karsiligi; veritabanina dokunmaz (test edilebilir). */
export function seedTables(data: ZenweldDatabase): SeedTable[] {
  const productIds = new Set(data.products.map((p) => p.id));
  const userIds = new Set(data.users.map((u) => u.id));
  const productOf = (id: string | undefined) => (id && productIds.has(id) ? id : null);
  const userOf = (id: string | undefined) => (id && userIds.has(id) ? id : null);
  const groupId = new Map(data.categoryGroups.map((g) => [`${g.section}/${g.slug}`, g.id]));
  const categoryId = new Map(data.categories.map((c) => [c.slug, c.id]));
  const categoryOf = (slug: string | undefined) => (slug ? (categoryId.get(slug) ?? null) : null);
  const productName = new Map(data.products.map((p) => [p.id, p.name]));
  const shop = data.settings.shop;
  const carrierIds = new Map(shop.carriers.map(({ name }) => [name, carrierId(name)]));

  /* ------------------------------ Katalog ------------------------------ */

  const groups = data.categoryGroups.map((g) => ({
    id: g.id,
    section: g.section,
    slug: g.slug,
    name: g.name,
    description: g.description,
    aboutText: g.aboutText,
    image: g.image,
    position: g.order,
    code: g.code,
    seo: g.seo,
  }));

  const categories = data.categories.map((c) => {
    const group = groupId.get(`${c.section}/${c.group}`);
    if (!group) throw new Error(`Kategorinin grubu yok: ${c.slug} (${c.section}/${c.group})`);
    return {
      id: c.id,
      groupId: group,
      slug: c.slug,
      name: c.name,
      description: c.description,
      aboutText: c.aboutText,
      image: c.image,
      icon: c.icon,
      code: c.code,
      position: c.order,
      seo: c.seo,
    };
  });

  const optionDefinitions = data.optionDefinitions.map((d, i) => ({ id: d.id, name: d.name, position: i }));
  const optionValues = data.optionDefinitions.flatMap((d) =>
    d.values.map((v, i) => ({ optionDefinitionId: d.id, id: v.id, label: v.label, position: i })),
  );
  const categoryOptionDefinitions = data.categories.flatMap((c) =>
    (c.optionIds ?? []).map((id, i) => ({ categoryId: c.id, optionDefinitionId: id, position: i })),
  );
  const categoryFilters = data.categories.flatMap((c) =>
    (c.filters ?? []).map((f, i) => ({ categoryId: c.id, id: f.id, name: f.name, position: i })),
  );
  const categoryFilterValues = data.categories.flatMap((c) =>
    (c.filters ?? []).flatMap((f) =>
      f.values.map((v, i) => ({ categoryId: c.id, filterId: f.id, id: v.id, label: v.label, position: i })),
    ),
  );

  const productCategory = (p: Product) => {
    const id = categoryId.get(p.categorySlug);
    if (!id) throw new Error(`Ürünün kategorisi yok: ${p.slug} (${p.categorySlug})`);
    return id;
  };

  const products = data.products.map((p) => {
    const discount = p.discount && p.discount.percent > 0 ? p.discount : undefined;
    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      categoryId: productCategory(p),
      modelCode: p.modelCode,
      brand: p.brand,
      shortDescription: p.shortDescription,
      description: p.description,
      priceExVat: p.priceExVat,
      vatRate: p.vatRate,
      currency: p.currency,
      discountPercent: discount?.percent,
      discountStartsAt: date(discount?.startsAt),
      discountEndsAt: date(discount?.endsAt),
      images: p.images,
      specs: p.specs,
      inTheBox: p.inTheBox,
      highlights: p.highlights,
      processes: p.processes,
      position: p.order,
      manualUrl: p.manualUrl,
      warrantyMonths: p.warrantyMonths,
      active: p.active,
      seo: p.seo,
      createdAt: required(p.createdAt),
      updatedAt: required(p.updatedAt),
    };
  });

  const productOptions = data.products.flatMap((p) =>
    (p.options?.optionIds ?? []).map((id, i) => ({ productId: p.id, optionDefinitionId: id, position: i })),
  );
  const productVariants = data.products.flatMap((p) =>
    (p.options?.variants ?? []).map((v, i) => ({
      productId: p.id,
      id: v.id,
      combinationKey: combinationKey(p.options!.optionIds, v.values),
      sku: v.sku,
      priceDeltaExVat: v.priceDeltaExVat,
      specOverrides: v.specOverrides,
      inTheBox: v.inTheBox,
      image: v.image,
      position: i,
    })),
  );
  const productVariantValues = data.products.flatMap((p) =>
    (p.options?.variants ?? []).flatMap((v) =>
      Object.entries(v.values).map(([definitionId, valueId]) => ({
        productId: p.id,
        variantId: v.id,
        optionDefinitionId: definitionId,
        optionValueId: valueId,
      })),
    ),
  );
  const productFilterValues = data.products.flatMap((p) =>
    Object.entries(p.filterValues ?? {}).flatMap(([filterId, valueIds]) =>
      valueIds.map((valueId) => ({ productId: p.id, categoryId: productCategory(p), filterId, valueId })),
    ),
  );

  const redirects = [
    ...data.products.flatMap((p) => [
      ...(p.previousSlugs ?? []).map((slug) => ({ oldPath: `/urun/${slug}`, targetType: "product", targetId: p.id })),
      ...(p.options?.variants ?? []).flatMap((v) =>
        (v.previousSlugs ?? []).map((slug) => ({
          oldPath: `/urun/${slug}`,
          targetType: "product",
          targetId: p.id,
          variantId: v.id,
        })),
      ),
    ]),
    ...data.categories.flatMap((c) =>
      (c.previousPaths ?? []).map((path) => ({ oldPath: path, targetType: "category", targetId: c.id })),
    ),
    ...data.categoryGroups.flatMap((g) =>
      (g.previousPaths ?? []).map((path) => ({ oldPath: path, targetType: "group", targetId: g.id })),
    ),
    ...data.blogPosts.flatMap((b) =>
      (b.previousSlugs ?? []).map((slug) => ({ oldPath: `/blog/${slug}`, targetType: "blog", targetId: b.id })),
    ),
    ...data.news.flatMap((n) =>
      (n.previousSlugs ?? []).map((slug) => ({ oldPath: `/haberler/${slug}`, targetType: "news", targetId: n.id })),
    ),
    ...data.events.flatMap((e) =>
      (e.previousSlugs ?? []).map((slug) => ({ oldPath: `/etkinlikler/${slug}`, targetType: "event", targetId: e.id })),
    ),
  ];

  /* --------------------------- Bayi ve stok --------------------------- */

  const retailers = data.retailers.map((r) => ({
    id: r.id,
    name: r.name,
    websiteUrl: r.websiteUrl,
    logoText: r.logoText,
    logoUrl: r.logoUrl,
    isOwnStore: r.isOwnStore,
    city: r.city,
    active: r.active,
  }));
  const dealers = data.dealers.map((d) => ({
    id: d.id,
    name: d.name,
    city: d.city,
    district: d.district,
    address: d.address,
    phone: d.phone,
    whatsapp: d.whatsapp,
    email: d.email,
    lat: d.lat,
    lng: d.lng,
    badges: d.badges,
    workingHours: d.workingHours,
    retailerId: d.retailerId,
    forceDealer: d.forceDealer,
    active: d.active,
  }));
  const stockImports = data.stockImports.map((i) => ({
    id: i.id,
    sourceType: i.sourceType,
    sourceId: i.sourceId,
    kind: i.kind,
    fileName: i.fileName,
    note: i.note,
    createdAt: required(i.createdAt),
    createdBy: i.createdBy,
    ...i.summary,
    previous: i.previous,
    revertedAt: date(i.revertedAt),
  }));
  const stockRow = (r: ZenweldDatabase["dealerStock"][number] | ZenweldDatabase["retailerStock"][number]) => ({
    productId: r.productId,
    variantId: r.variantId ?? "",
    sku: r.sku,
    quantity: r.quantity,
    price: r.price,
    url: r.url,
    updatedAt: required(r.updatedAt),
  });
  const dealerStock = data.dealerStock.map((r) => ({ dealerId: r.dealerId, ...stockRow(r) }));
  const retailerStock = data.retailerStock.map((r) => ({ retailerId: r.retailerId, ...stockRow(r) }));
  const skuAliases = data.skuAliases.map((a) => ({
    sourceId: a.sourceId,
    code: a.code,
    productId: a.productId,
    variantId: a.variantId ?? "",
  }));

  /* ------------------------------ Uyeler ------------------------------ */

  const users = data.users.map((u) => ({
    id: u.id,
    role: u.role,
    status: u.status,
    email: u.email,
    passwordHash: u.passwordHash,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    companyName: u.companyName,
    taxOffice: u.taxOffice,
    taxNumber: u.taxNumber,
    sector: u.sector,
    city: u.city,
    newsletter: u.newsletter,
    createdAt: required(u.createdAt),
    updatedAt: required(u.createdAt),
    lastLoginAt: date(u.lastLoginAt),
  }));
  const addresses = data.addresses.map((a) => ({
    id: a.id,
    userId: a.userId,
    title: a.title,
    fullName: a.fullName,
    phone: a.phone,
    city: a.city,
    district: a.district,
    line: a.line,
    isDefault: a.isDefault,
  }));

  /* ---------------------- Ayarlar, odeme ve kargo ---------------------- */

  const paymentPos = shop.pos.map((p, i) => ({
    id: p.id,
    bankShortName: p.bankShortName,
    name: p.name,
    program: p.program,
    merchantNo: p.merchantNo,
    posName: p.posName,
    active: p.active,
    isDefault: p.isDefault,
    position: i,
    installments: p.installments,
    commissions: p.commissions,
  }));
  const posIds = new Set(shop.pos.map((p) => p.id));
  const bankAccounts = shop.bankAccounts.map((b, i) => ({
    id: b.id,
    bankName: b.bankName,
    accountHolder: b.accountHolder,
    iban: b.iban,
    position: i,
  }));
  const carriers = shop.carriers.map((c, i) => ({ id: carrierId(c.name), name: c.name, trackingUrl: c.trackingUrl ?? null, position: i }));
  const settings = [
    {
      key: "shop",
      value: {
        freeShippingThreshold: shop.freeShippingThreshold,
        shippingFee: shop.shippingFee,
        minInstallmentAmount: shop.minInstallmentAmount,
        transferDueDays: shop.transferDueDays,
      },
    },
    { key: "stock", value: data.settings.stock },
    { key: "rich_text", value: data.settings.richText },
    { key: "home_hero", value: data.settings.homeHero },
    { key: "company", value: data.settings.company },
  ];

  /* ------------------------ Teklif ve siparis ------------------------ */

  const quotes = data.quotes.map((q) => ({
    id: q.id,
    code: q.code,
    userId: userOf(q.userId),
    status: q.status,
    companyName: q.companyName,
    contactName: q.contactName,
    email: q.email,
    phone: q.phone,
    taxNumber: q.taxNumber,
    city: q.city,
    paymentPreference: q.paymentPreference,
    termDays: q.termDays,
    message: q.message,
    assignedTo: q.assignedTo,
    adminNote: q.adminNote,
    createdAt: required(q.createdAt),
    updatedAt: required(q.updatedAt),
  }));
  const quoteItems = data.quotes.flatMap((q) =>
    q.items.map((item, line) => ({
      quoteId: q.id,
      line,
      productId: productOf(item.productId),
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      note: item.note,
    })),
  );

  const orders = data.orders.map((o) => ({
    id: o.id,
    code: o.code,
    userId: userOf(o.userId),
    status: o.status,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress,
    invoice: o.invoice,
    subtotal: o.subtotal,
    vat: o.vat,
    shipping: o.shipping,
    installmentFee: o.installmentFee,
    couponCode: o.coupon?.code,
    couponDiscount: o.coupon?.discount ?? 0,
    total: o.total,
    paymentMethod: o.payment.method,
    installments: o.payment.installments,
    cardBrand: o.payment.cardBrand,
    cardProgram: o.payment.cardProgram,
    cardLast4: o.payment.cardLast4,
    posId: o.payment.posId && posIds.has(o.payment.posId) ? o.payment.posId : null,
    posName: o.payment.posName,
    commissionPercent: o.payment.commissionPercent,
    paidAt: date(o.payment.paidAt),
    dueAt: date(o.payment.dueAt),
    customerNote: o.customerNote,
    adminNote: o.adminNote,
    termsAcceptedAt: required(o.termsAcceptedAt),
    createdAt: required(o.createdAt),
    updatedAt: required(o.updatedAt),
  }));
  const orderItems = data.orders.flatMap((o) =>
    o.items.map((item, line) => ({
      orderId: o.id,
      line,
      productId: productOf(item.productId),
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPriceExVat: item.unitPriceExVat,
      vatRate: item.vatRate,
      unitPrice: item.unitPrice,
      couponDiscount: item.couponDiscount ?? 0,
    })),
  );
  const orderStatusHistory = data.orders.flatMap((o) =>
    o.history.map((h, seq) => ({ orderId: o.id, seq, status: h.status, at: required(h.at), note: h.note })),
  );
  const shipments = data.orders.flatMap((o) =>
    o.shipment
      ? [
          {
            id: `shp-${o.id}`,
            orderId: o.id,
            kind: "outbound",
            carrierId: carrierIds.get(o.shipment.carrier) ?? null,
            carrierName: o.shipment.carrier,
            trackingNumber: o.shipment.trackingNumber,
            shippedAt: required(o.shipment.shippedAt),
            deliveredAt: date(o.shipment.deliveredAt),
          },
        ]
      : [],
  );

  const returnRequests = data.returnRequests.map((r) => ({
    id: r.id,
    code: r.code,
    orderId: r.orderId,
    orderCode: r.orderCode,
    userId: userOf(r.userId),
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    reason: r.reason,
    note: r.note,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: required(r.createdAt),
    updatedAt: required(r.updatedAt),
  }));
  const returnRequestItems = data.returnRequests.flatMap((r) =>
    r.items.map((item) => ({
      returnRequestId: r.id,
      orderLine: item.line,
      productId: productOf(item.productId),
      productName: item.productName,
      sku: item.sku,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
    })),
  );

  /* ------------------------------ Kuponlar ------------------------------ */

  const coupons = data.coupons.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minCartTotal: c.minCartTotal,
    startsAt: date(c.startsAt),
    endsAt: date(c.endsAt),
    totalUsageLimit: c.totalUsageLimit,
    perUserLimit: c.perUserLimit,
    scope: c.scope,
    audience: c.audience,
    active: c.active,
    createdAt: required(c.createdAt),
    updatedAt: required(c.updatedAt),
  }));
  const couponTargets = data.coupons.flatMap((c) => [
    ...c.productIds.filter((id) => productIds.has(id)).map((productId) => ({ couponId: c.id, productId })),
    ...c.categoryIds.map((categoryId) => ({ couponId: c.id, categoryId })),
  ]);
  const couponCustomers = data.coupons.flatMap((c) => c.customerEmails.map((email) => ({ couponId: c.id, email })));
  const couponRedemptions = data.couponRedemptions.map((r) => ({
    couponId: r.couponId,
    couponCode: r.couponCode,
    userId: userOf(r.userId),
    orderId: r.orderId,
    discountAmount: r.discountAmount,
    createdAt: required(r.createdAt),
    releasedAt: date(r.releasedAt),
  }));

  /* --------------------- Servis, garanti ve yorumlar --------------------- */

  const serviceRequests = data.serviceRequests.map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    categoryId: categoryOf(r.categorySlug),
    productId: productOf(r.productId),
    productName: r.productName,
    reasons: r.reasons,
    complaint: r.complaint,
    companyName: r.companyName,
    address: r.address,
    city: r.city,
    district: r.district,
    email: r.email,
    phone: r.phone,
    contactName: r.contactName,
    contactGsm: r.contactGsm,
    userId: userOf(r.userId),
    adminNote: r.adminNote,
    createdAt: required(r.createdAt),
    updatedAt: required(r.updatedAt),
  }));
  const warranties = data.warranties.map((w) => ({
    id: w.id,
    serialNumber: w.serialNumber,
    categoryId: categoryOf(w.categorySlug),
    productId: productOf(w.productId),
    productName: productName.get(w.productId),
    ownerName: w.ownerName,
    email: w.email,
    phone: w.phone,
    city: w.city,
    postalCode: w.postalCode,
    address: w.address,
    sellerTaxNumber: w.sellerTaxNumber,
    registeredAt: required(w.registeredAt),
    expiresAt: w.expiresAt.slice(0, 10),
    extended: w.extended,
  }));
  const reviews = data.reviews.map((r) => ({
    id: r.id,
    productId: productOf(r.productId),
    userId: userOf(r.userId),
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    media: r.media,
    verifiedPurchase: r.verifiedPurchase,
    approved: r.approved,
    featured: r.featured,
    createdAt: required(r.createdAt),
    updatedAt: required(r.createdAt),
  }));

  /* ------------------------------ Icerik ------------------------------ */

  const blogPosts = data.blogPosts.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    body: b.body,
    coverUrl: b.coverUrl,
    category: b.category,
    author: b.author,
    publishedAt: required(b.publishedAt),
    active: b.active ?? true,
    seo: b.seo,
  }));
  const news = data.news.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    body: n.body,
    coverUrl: n.coverUrl,
    images: n.images,
    publishedAt: required(n.publishedAt),
    active: n.active,
    seo: n.seo,
  }));
  const events = data.events.map((e) => ({
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
    websiteUrl: e.websiteUrl,
    active: e.active,
    seo: e.seo,
  }));
  const faqs = data.faqs.map((f, i) => ({ id: f.id, question: f.question, answer: f.answer, topic: f.topic, position: i }));
  const salesReps = data.salesReps.map((r) => ({
    id: r.id,
    name: r.name,
    region: r.region,
    phone: r.phone,
    email: r.email,
    photoUrl: r.photoUrl,
    position: r.order,
    active: r.active,
  }));
  const legalPages = data.legalPages.map((p) => ({ id: p.id, title: p.title, body: p.body, updatedAt: required(p.updatedAt) }));
  const aboutPage = [
    {
      id: 1,
      heroTitle: data.about.heroTitle,
      heroSubtitle: data.about.heroSubtitle,
      heroImage: data.about.heroImage,
      stats: data.about.stats,
      sections: data.about.sections,
      updatedAt: required(data.about.updatedAt),
    },
  ];
  const pageSeo = Object.entries(data.pageSeo ?? {}).map(([path, f]) => ({
    path,
    title: f.title,
    description: f.description,
  }));
  const documentPages = data.documentPages.map((p) => ({ section: p.section, title: p.title, subtitle: p.subtitle }));
  const documents = data.documents.map((d, i) => ({
    id: d.id,
    section: d.section,
    title: d.title,
    productId: productOf(d.productId),
    lotNumber: d.lotNumber,
    fileName: d.fileName,
    mimeType: d.mimeType,
    sizeBytes: d.size,
    fileKey: d.fileKey,
    active: d.active,
    position: i,
    createdAt: required(d.createdAt),
    updatedAt: required(d.updatedAt),
  }));
  const recordCounters = Object.entries(data.recordCounters).map(([prefix, lastNumber]) => ({ prefix, lastNumber }));

  return [
    entry(s.categoryGroups, groups),
    entry(s.categories, categories),
    entry(s.optionDefinitions, optionDefinitions),
    entry(s.optionValues, optionValues),
    entry(s.categoryOptionDefinitions, categoryOptionDefinitions),
    entry(s.categoryFilters, categoryFilters),
    entry(s.categoryFilterValues, categoryFilterValues),
    entry(s.products, products),
    entry(s.productOptions, productOptions),
    entry(s.productVariants, productVariants),
    entry(s.productVariantValues, productVariantValues),
    entry(s.productFilterValues, productFilterValues),
    entry(s.redirects, redirects),
    entry(s.retailers, retailers),
    entry(s.dealers, dealers),
    entry(s.stockImports, stockImports),
    entry(s.dealerStock, dealerStock),
    entry(s.retailerStock, retailerStock),
    entry(s.skuAliases, skuAliases),
    entry(s.users, users),
    entry(s.addresses, addresses),
    entry(s.paymentPos, paymentPos),
    entry(s.bankAccounts, bankAccounts),
    entry(s.carriers, carriers),
    entry(s.settings, settings),
    entry(s.quotes, quotes),
    entry(s.quoteItems, quoteItems),
    entry(s.orders, orders),
    entry(s.orderItems, orderItems),
    entry(s.orderStatusHistory, orderStatusHistory),
    entry(s.shipments, shipments),
    entry(s.returnRequests, returnRequests),
    entry(s.returnRequestItems, returnRequestItems),
    entry(s.coupons, coupons),
    entry(s.couponTargets, couponTargets),
    entry(s.couponCustomers, couponCustomers),
    entry(s.couponRedemptions, couponRedemptions),
    entry(s.serviceRequests, serviceRequests),
    entry(s.warranties, warranties),
    entry(s.reviews, reviews),
    entry(s.blogPosts, blogPosts),
    entry(s.news, news),
    entry(s.events, events),
    entry(s.faqs, faqs),
    entry(s.salesReps, salesReps),
    entry(s.legalPages, legalPages),
    entry(s.aboutPage, aboutPage),
    entry(s.pageSeo, pageSeo),
    entry(s.documentPages, documentPages),
    entry(s.documents, documents),
    entry(s.recordCounters, recordCounters),
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hem baglanti hem islem (transaction) kabul edilir
type Database = PgDatabase<PgQueryResultHKT, any>;

/** Bir seferde yazilan satir (PostgreSQL'in parametre sinirinin altinda kalir). */
const BATCH = 500;

/**
 * Ornek veriyi yazar; tablo basina yazilan satir sayisini dondurur. Islemi
 * (transaction) cagiran yonetir: yarida kalan yukleme geri alinsin.
 */
export async function seedDatabase(db: Database, data: ZenweldDatabase): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const { table, rows } of seedTables(data)) {
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(table).values(rows.slice(i, i + BATCH));
    }
    counts[getTableName(table)] = rows.length;
  }

  // Zenweld depo stogu: tek bir SAP okumasi olarak yazilir.
  if (data.warehouseStock.length > 0) {
    const syncedAt = data.warehouseStock.reduce((max, r) => (r.syncedAt > max ? r.syncedAt : max), "");
    const [run] = await db
      .insert(s.sapSyncRuns)
      .values({
        kind: "stock",
        startedAt: new Date(syncedAt),
        finishedAt: new Date(syncedAt),
        status: "success",
        rowsRead: data.warehouseStock.length,
      })
      .returning({ id: s.sapSyncRuns.id });
    const rows = data.warehouseStock.map((r) => ({
      sapItemCode: r.sapItemCode,
      itemName: r.itemName,
      quantity: r.quantity,
      syncedAt: new Date(r.syncedAt),
      syncRunId: run.id,
    }));
    for (let i = 0; i < rows.length; i += BATCH) await db.insert(s.warehouseStock).values(rows.slice(i, i + BATCH));
    counts.sap_sync_runs = 1;
    counts.warehouse_stock = rows.length;
  }
  return counts;
}
