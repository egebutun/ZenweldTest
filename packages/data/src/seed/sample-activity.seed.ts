import type {
  Order,
  OrderAddress,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  Product,
  Quote,
  QuoteStatus,
  ServiceReason,
  ServiceRequest,
  ServiceRequestStatus,
  User,
  WarrantyRecord,
} from "../types";
import { salePriceExVat } from "../discount";
import { productOptionsView } from "../variants";
import { CARD_PROGRAMS, cardInstallments, installmentQuote, posCommission } from "../checkout";
import { products } from "./products.seed";
import { categories } from "./categories.seed";
import { optionDefinitions } from "./options.seed";
import { defaultSettings } from "./settings.seed";

/**
 * ORNEK SATIS HAREKETLERI
 *
 * Yonetim panelindeki grafikler bos gorunmesin diye son 90 gune yayilmis
 * ornek uye, siparis, teklif, servis talebi ve garanti kaydi uretir.
 *
 * - Sabit tohumlu rastgele sayi uretecidir: dagilim her kurulumda aynidir.
 * - Tarihler veritabaninin tarayicida ilk kuruldugu ana gore hesaplanir;
 *   boylece "Bugun" ve "Son 7 gun" hicbir zaman bos kalmaz.
 * - Ornek uyelerin sifresi yoktur, siteye giris yapamazlar.
 *
 * Gercek kullanimda bu dosya ve index.ts'teki cagrisi silinir.
 */

const DAYS = 90;
const DAY = 86_400_000;

/** mulberry32 — kucuk, tohumlu rastgele sayi ureteci */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Diger kayitlarla ayni bicim: "2026-10-09T09:15:00+03:00" */
function isoTR(ms: number): string {
  const d = new Date(ms + 3 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00+03:00`;
}

const FIRST = ["Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim", "Murat", "Emre", "Burak", "Serkan", "Okan", "Kemal", "Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Gökhan", "Cem", "Volkan", "Tolga", "Deniz", "Onur"];
const LAST = ["Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat"];
const COMPANY = ["Metal", "Çelik Konstrüksiyon", "Makina", "Endüstri", "Kaynak Atölyesi", "Mühendislik", "Otomotiv", "Tersanecilik", "Yapı", "Tarım Makinaları"];
const SUFFIX = ["Ltd. Şti.", "A.Ş.", "San. ve Tic. Ltd. Şti."];

/** Agirlikli sehir listesi (siparis yogunluguna gore) */
const CITIES: [string, string, number][] = [
  ["İstanbul", "Başakşehir", 26], ["Ankara", "Ostim", 11], ["İzmir", "Bornova", 10],
  ["Bursa", "Nilüfer", 9], ["Kocaeli", "Gebze", 8], ["Konya", "Selçuklu", 6],
  ["Kayseri", "Melikgazi", 5], ["Gaziantep", "Şehitkamil", 5], ["Antalya", "Kepez", 4],
  ["Adana", "Seyhan", 4], ["Manisa", "Yunusemre", 3], ["Tekirdağ", "Çorlu", 3],
  ["Sakarya", "Adapazarı", 3], ["Eskişehir", "Odunpazarı", 2], ["Denizli", "Merkezefendi", 2],
];

const CARRIERS = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "Sürat Kargo"];

const COMPLAINTS: Record<ServiceReason, string> = {
  kurulum: "Yeni aldığımız makinenin kurulumu ve ilk ayarları için destek istiyoruz.",
  bakim: "Periyodik bakım zamanı geldi, servis randevusu almak istiyoruz.",
  onarim: "Makine çalışırken ark kesiliyor, hata kodu veriyor.",
  egitim: "Operatörlerimiz için kullanım eğitimi talep ediyoruz.",
};

export interface SampleActivity {
  users: User[];
  orders: Order[];
  quotes: Quote[];
  serviceRequests: ServiceRequest[];
  warranties: WarrantyRecord[];
}

export function createSampleActivity(nowMs: number = Date.now()): SampleActivity {
  const r = rng(20261018);
  const pick = <T>(list: T[]) => list[Math.floor(r() * list.length)];
  const between = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const weighted = <T>(list: [T, number][]): T => {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let x = r() * total;
    for (const [v, w] of list) if ((x -= w) < 0) return v;
    return list[list.length - 1][0];
  };
  const city = () => weighted(CITIES.map(([c, d, w]) => [[c, d] as [string, string], w]));
  const phone = () => `+90 5${between(30, 59)} ${between(100, 999)} ${between(10, 99)} ${between(10, 99)}`;
  /** Bugunden `daysAgo` gun once, mesai saatlerine yakin bir an (gelecekte olamaz). */
  const at = (daysAgo: number) => {
    const ms = nowMs - daysAgo * DAY - between(0, 10) * 3_600_000 - between(0, 59) * 60_000;
    return Math.min(ms, nowMs - 5 * 60_000);
  };
  /** Son 90 gun icinde, sona dogru hafifce artan yogunluk */
  const recentDay = () => Math.floor(DAYS * Math.pow(r(), 1.25));

  const sellable = products.filter((p) => p.active && p.priceExVat > 0);
  const machines = sellable.filter((p) => p.section === "ekipmanlar");
  const bySection = (s: Product["section"]) => sellable.filter((p) => p.section === s);

  /* ---------------- Uyeler ---------------- */
  const users: User[] = Array.from({ length: 64 }, (_, i) => {
    const business = r() < 0.4;
    const [c] = city();
    const first = pick(FIRST);
    const last = pick(LAST);
    // Ilk 16 uye pencereden once kayitli (eski musteriler)
    const daysAgo = i < 16 ? between(DAYS + 5, 300) : recentDay();
    return {
      id: `u-ornek-${i + 1}`,
      role: business ? "business" : "individual",
      status: "active",
      email: `musteri${i + 1}@example.com`,
      passwordHash: "",
      firstName: first,
      lastName: last,
      phone: phone(),
      ...(business
        ? {
            companyName: `${last} ${pick(COMPANY)} ${pick(SUFFIX)}`,
            taxOffice: c,
            taxNumber: String(between(1_000_000_000, 9_999_999_999)),
          }
        : {}),
      city: c,
      createdAt: isoTR(at(daysAgo)),
      newsletter: r() < 0.5,
    } satisfies User;
  });

  /* ---------------- Siparisler ---------------- */
  const shop = defaultSettings.shop;
  // Once anlar uretilir, sonra eskiden yeniye siralanir: numaralar zamanla artar.
  const orderSeeds = Array.from({ length: 130 }, () => {
    const daysAgo = recentDay();
    return { daysAgo, ms: at(daysAgo) };
  }).sort((a, b) => a.ms - b.ms);
  const orders: Order[] = orderSeeds.map(({ daysAgo, ms: createdMs }, i) => {
    const created = isoTR(createdMs);
    const eligible = users.filter((u) => u.createdAt <= created);
    const user = eligible.length ? pick(eligible) : users[0];
    const [c, district] = [user.city ?? "İstanbul", pick(CITIES.filter(([x]) => x === user.city).map(([, d]) => d).concat("Merkez"))];
    const address: OrderAddress = {
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      city: c,
      district,
      line: `Örnek Mah. ${between(1, 120)}. Sok. No:${between(1, 60)}`,
    };

    // 1-3 kalem; dolgu metali ve aksesuar coklu adet alinir
    const lines = new Map<string, OrderItem>();
    const count = weighted<number>([[1, 60], [2, 30], [3, 10]]);
    for (let k = 0; k < count; k++) {
      const section = weighted<Product["section"]>([
        ["ekipmanlar", 34], ["aksesuarlar", 30], ["dolgu-metalleri", 22], ["guvenlik", 14],
      ]);
      const pool = bySection(section).length ? bySection(section) : sellable;
      const p = pick(pool);
      // Secenekli urunde satilan kombinasyonlardan biri: kodu ve secenek yazisi onunki.
      const view = productOptionsView(p, optionDefinitions);
      const variant = view ? pick(view.variants) : undefined;
      const qty = section === "dolgu-metalleri" ? between(1, 6) : section === "ekipmanlar" ? 1 : between(1, 3);
      const unitPriceExVat = salePriceExVat({ ...p, priceExVat: p.priceExVat + (variant?.priceDeltaExVat ?? 0) });
      const key = `${p.id}|${variant?.id ?? ""}`;
      const prev = lines.get(key);
      lines.set(key, {
        productId: p.id,
        productName: p.name,
        sku: variant?.sku ?? p.sku,
        ...(variant ? { variantLabel: variant.fullLabel } : {}),
        quantity: (prev?.quantity ?? 0) + qty,
        unitPriceExVat,
        vatRate: p.vatRate,
        unitPrice: Math.round(unitPriceExVat * (1 + p.vatRate / 100)),
      });
    }
    const items = [...lines.values()];
    const subtotal = items.reduce((s, x) => s + x.unitPrice * x.quantity, 0);
    const exVat = items.reduce((s, x) => s + x.unitPriceExVat * x.quantity, 0);
    const shipping = subtotal >= shop.freeShippingThreshold ? 0 : shop.shippingFee;

    const byCard = r() < 0.58;
    // Kartin programi bankayi (POS) ve sunulabilecek taksitleri belirler.
    const cardProgram = pick([...CARD_PROGRAMS]);
    const { pos, options } = cardInstallments(subtotal + shipping, cardProgram, shop);
    const wanted = byCard ? weighted<number>([[1, 45], [3, 20], [6, 18], [9, 9], [12, 8]]) : 1;
    const option = options.find((o) => o.count === wanted) ?? options[0];
    const installments = option?.count ?? 1;
    const fee = byCard && option ? installmentQuote(subtotal + shipping, option).fee : 0;

    // Duruma siparisin yasina gore karar verilir
    const history: OrderStatusEvent[] = [];
    const push = (status: OrderStatus, ms: number) => history.push({ status, at: isoTR(Math.min(ms, nowMs - 60_000)) });
    let status: OrderStatus = "awaiting_payment";
    let paidMs: number | undefined;
    if (byCard) {
      paidMs = createdMs;
      push("preparing", createdMs);
    } else {
      push("awaiting_payment", createdMs);
      const unpaid = daysAgo >= 3 ? r() < 0.12 : daysAgo < 1 || r() < 0.4;
      if (unpaid) {
        status = daysAgo >= 3 ? "cancelled" : "awaiting_payment";
        if (status === "cancelled") {
          history.push({ status: "cancelled", at: isoTR(createdMs + 3 * DAY), note: "Ödeme süresi doldu" });
        }
      } else {
        paidMs = createdMs + between(2, 30) * 3_600_000;
        push("preparing", paidMs);
      }
    }
    let shipment: Order["shipment"];
    if (paidMs !== undefined) {
      status = "preparing";
      const shippedMs = paidMs + between(18, 40) * 3_600_000;
      if (shippedMs < nowMs && daysAgo >= 1) {
        status = "shipped";
        push("shipped", shippedMs);
        const deliveredMs = shippedMs + between(1, 3) * DAY;
        shipment = {
          carrier: pick(CARRIERS),
          trackingNumber: `${between(1000, 9999)} ${between(1000, 9999)} ${between(10, 99)}`,
          shippedAt: isoTR(shippedMs),
        };
        if (deliveredMs < nowMs) {
          status = "delivered";
          push("delivered", deliveredMs);
          shipment.deliveredAt = isoTR(deliveredMs);
        }
      }
    }
    const last = history[history.length - 1].at;
    const year = created.slice(0, 4);

    return {
      id: `o-ornek-${i + 1}`,
      code: `SIP-${year}-${String(i + 4).padStart(5, "0")}`,
      userId: user.id,
      status,
      customerName: address.fullName,
      email: user.email,
      phone: user.phone,
      shippingAddress: address,
      invoice:
        user.role === "business"
          ? { type: "corporate", companyName: user.companyName, taxOffice: user.taxOffice, taxNumber: user.taxNumber, address }
          : { type: "individual", fullName: address.fullName, tcKimlikNo: "10000000146", address },
      items,
      subtotal,
      vat: subtotal - Math.round(exVat),
      shipping,
      installmentFee: fee,
      total: subtotal + shipping + fee,
      payment: byCard
        ? {
            method: "card",
            installments,
            cardBrand: pick(["Visa", "Mastercard", "Troy"]),
            cardProgram,
            cardLast4: String(between(1000, 9999)),
            posId: pos?.id,
            posName: pos?.name,
            commissionPercent: pos ? posCommission(pos, installments) : undefined,
            paidAt: isoTR(createdMs),
          }
        : {
            method: "transfer",
            dueAt: isoTR(createdMs + 3 * DAY),
            ...(paidMs !== undefined ? { paidAt: isoTR(paidMs) } : {}),
          },
      ...(shipment ? { shipment } : {}),
      history,
      termsAcceptedAt: created,
      createdAt: created,
      updatedAt: last,
    } satisfies Order;
  });

  /* ---------------- Teklifler ---------------- */
  const quotes: Quote[] = Array.from({ length: 46 }, () => {
    const daysAgo = recentDay();
    return { daysAgo, ms: at(daysAgo) };
  })
    .sort((a, b) => a.ms - b.ms)
    .map(({ daysAgo, ms: createdMs }, i) => {
      const [c] = city();
      const status: QuoteStatus =
        daysAgo < 3
          ? weighted<QuoteStatus>([["new", 80], ["reviewing", 20]])
          : daysAgo < 12
            ? weighted<QuoteStatus>([["new", 10], ["reviewing", 40], ["sent", 50]])
            : weighted<QuoteStatus>([["reviewing", 8], ["sent", 22], ["won", 38], ["lost", 32]]);
      const items = Array.from({ length: between(1, 3) }, () => {
        const p = pick(machines.length ? machines : sellable);
        return { productId: p.id, productName: p.name, quantity: between(2, 12) };
      });
      const last = pick(LAST);
      return {
        id: `q-ornek-${i + 1}`,
        code: `TKL-${isoTR(createdMs).slice(0, 4)}-${String(i + 3).padStart(4, "0")}`,
        status,
        companyName: `${last} ${pick(COMPANY)} ${pick(SUFFIX)}`,
        contactName: `${pick(FIRST)} ${last}`,
        email: `satinalma${i + 1}@example.com`,
        phone: phone(),
        city: c,
        paymentPreference: pick(["vadeli", "cek", "havale", "belirsiz"] as const),
        items,
        createdAt: isoTR(createdMs),
        updatedAt: isoTR(Math.min(createdMs + between(0, 6) * DAY, nowMs - 60_000)),
      } satisfies Quote;
    });

  /* ---------------- Servis talepleri ---------------- */
  const machineCategories = categories.filter((c) => c.section === "ekipmanlar");
  const serviceRequests: ServiceRequest[] = Array.from({ length: 34 }, () => recentDay())
    .sort((a, b) => b - a)
    .map((daysAgo, i) => {
      const createdMs = at(daysAgo);
      const p = pick(machines.length ? machines : sellable);
      const category = machineCategories.find((c) => c.slug === p.categorySlug) ?? machineCategories[0];
      const reason = weighted<ServiceReason>([["onarim", 45], ["bakim", 30], ["kurulum", 15], ["egitim", 10]]);
      const status: ServiceRequestStatus =
        daysAgo < 3 ? "new" : daysAgo < 12 ? weighted<ServiceRequestStatus>([["in_progress", 70], ["done", 30]]) : weighted<ServiceRequestStatus>([["done", 90], ["in_progress", 10]]);
      const [c, district] = city();
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      return {
        id: `sr-ornek-${i + 1}`,
        code: `SRV-${isoTR(createdMs).slice(0, 4)}-${String(i + 1).padStart(4, "0")}`,
        status,
        categorySlug: category.slug,
        productId: p.id,
        productName: p.name,
        reasons: [reason],
        complaint: COMPLAINTS[reason],
        companyName: `${pick(LAST)} ${pick(COMPANY)} ${pick(SUFFIX)}`,
        address: `Örnek Sanayi Sitesi ${between(1, 40)}. Blok No:${between(1, 30)}`,
        city: c,
        district,
        email: `servis${i + 1}@example.com`,
        phone: phone(),
        contactName: name,
        contactGsm: phone(),
        createdAt: isoTR(createdMs),
        updatedAt: isoTR(Math.min(createdMs + between(0, 5) * DAY, nowMs - 60_000)),
      } satisfies ServiceRequest;
    });

  /* ---------------- Garanti kayitlari ---------------- */
  const warranties: WarrantyRecord[] = Array.from({ length: 52 }, () => recentDay())
    .sort((a, b) => b - a)
    .map((daysAgo, i) => {
      const ms = at(daysAgo);
      const p = pick(machines.length ? machines : sellable);
      const extended = r() < 0.55;
      const [c, district] = city();
      const expires = new Date(ms);
      expires.setUTCMonth(expires.getUTCMonth() + (p.warrantyMonths ?? 24) + (extended ? 12 : 0));
      return {
        id: `w-ornek-${i + 1}`,
        serialNumber: `ZW-${isoTR(ms).slice(0, 4)}-${String(between(100000, 999999))}`,
        categorySlug: p.categorySlug,
        productId: p.id,
        ownerName: `${pick(FIRST)} ${pick(LAST)}`,
        email: `garanti${i + 1}@example.com`,
        phone: phone(),
        city: c,
        postalCode: String(between(1000, 81999)).padStart(5, "0"),
        address: `Örnek Mah. ${between(1, 90)}. Sok. No:${between(1, 50)} ${district}`,
        sellerTaxNumber: String(between(1_000_000_000, 9_999_999_999)),
        registeredAt: isoTR(ms),
        expiresAt: expires.toISOString().slice(0, 10),
        extended,
      } satisfies WarrantyRecord;
    });

  return { users, orders, quotes, serviceRequests, warranties };
}
