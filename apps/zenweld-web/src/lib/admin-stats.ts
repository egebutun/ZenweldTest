import type { Order, OrderStatus, ZenweldDatabase } from "@zenweld/data";

/**
 * YONETIM PANELI ANA SAYFASI — HESAPLAR
 *
 * Tum grafikler ayni tarih araligindan beslenir (sayfanin ustundeki
 * Bugun / 7 / 30 / 90 gun secimi); boylece rakamlar birbirini tutar.
 *
 * Ciro: iptal edilmeyen siparislerin musteriden tahsil edilen toplami
 * (KDV ve vade farki dahil). Siparisin tarihi: olusturuldugu an.
 */

export type RangeKey = "today" | "7" | "30" | "90";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "7", label: "Son 7 gün" },
  { key: "30", label: "Son 30 gün" },
  { key: "90", label: "Son 90 gün" },
];

export interface Bin {
  start: number;
  end: number;
  /** Eksende: "14:00", "18 Eki" */
  label: string;
  /** Ipucunda: "18 Ekim 2026", "4–10 Ağu" */
  longLabel: string;
}

export interface DateRange {
  key: RangeKey;
  start: number;
  end: number;
  /** Bir onceki esit uzunluktaki donem (karsilastirma icin) */
  prevStart: number;
  bins: Bin[];
  /** "Saatlik" | "Günlük" | "Haftalık" */
  binName: string;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const dayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

export function makeRange(key: RangeKey, now: Date): DateRange {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = key === "today" ? 1 : Number(key);
  const start = today.getTime() - (days - 1) * DAY;
  const end = today.getTime() + DAY;
  const prevStart = start - days * DAY;

  const bins: Bin[] = [];
  if (key === "today") {
    for (let h = 0; h < 24; h++) {
      const s = start + h * HOUR;
      const label = `${String(h).padStart(2, "0")}:00`;
      bins.push({ start: s, end: s + HOUR, label, longLabel: `Bugün ${label}` });
    }
  } else if (key === "90") {
    for (let s = start; s < end; s += 7 * DAY) {
      const e = Math.min(s + 7 * DAY, end);
      bins.push({
        start: s,
        end: e,
        label: dayFmt.format(s),
        longLabel: `${dayFmt.format(s)} – ${dayFmt.format(e - DAY)}`,
      });
    }
  } else {
    for (let s = start; s < end; s += DAY) {
      bins.push({ start: s, end: s + DAY, label: dayFmt.format(s), longLabel: longDayFmt.format(s) });
    }
  }
  return {
    key,
    start,
    end,
    prevStart,
    bins,
    binName: key === "today" ? "Saatlik" : key === "90" ? "Haftalık" : "Günlük",
  };
}

const time = (iso: string) => new Date(iso).getTime();
const within = (iso: string, a: number, b: number) => {
  const t = time(iso);
  return t >= a && t < b;
};

export const ORDER_STATUS_ORDER: { status: OrderStatus; label: string; actionable: boolean }[] = [
  { status: "awaiting_payment", label: "Ödeme bekleniyor", actionable: true },
  { status: "preparing", label: "Hazırlanıyor", actionable: true },
  { status: "shipped", label: "Kargoda", actionable: false },
  { status: "delivered", label: "Teslim edildi", actionable: false },
  { status: "cancelled", label: "İptal", actionable: false },
];

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const top = <T>(entries: [string, T][], by: (v: T) => number, n: number) =>
  entries.sort((a, b) => by(b[1]) - by(a[1])).slice(0, n);

export function dashboardStats(db: ZenweldDatabase, range: DateRange) {
  const { start, end, prevStart, bins } = range;
  const sold = (o: Order) => o.status !== "cancelled";

  const ordersIn = db.orders.filter((o) => within(o.createdAt, start, end));
  const ordersPrev = db.orders.filter((o) => within(o.createdAt, prevStart, start));
  const soldIn = ordersIn.filter(sold);
  const soldPrev = ordersPrev.filter(sold);
  const revenue = sum(soldIn.map((o) => o.total));
  const revenuePrev = sum(soldPrev.map((o) => o.total));

  const members = db.users.filter((u) => u.role !== "admin");
  const membersIn = members.filter((u) => within(u.createdAt, start, end));
  const membersPrev = members.filter((u) => within(u.createdAt, prevStart, start));

  /* 1. Ozet kutulari */
  const kpis = {
    revenue: { value: revenue, prev: revenuePrev },
    orders: { value: soldIn.length, prev: soldPrev.length },
    basket: {
      value: soldIn.length ? revenue / soldIn.length : 0,
      prev: soldPrev.length ? revenuePrev / soldPrev.length : 0,
    },
    members: { value: membersIn.length, prev: membersPrev.length },
  };

  /* 2. Zaman icinde ciro */
  const revenueBins = bins.map((b) => {
    const os = soldIn.filter((o) => within(o.createdAt, b.start, b.end));
    return { revenue: sum(os.map((o) => o.total)), orders: os.length };
  });

  /* 3. Siparis durumlari (aralikta verilen siparislerin bugunku durumu) */
  const statuses = ORDER_STATUS_ORDER.map((s) => ({
    ...s,
    count: ordersIn.filter((o) => o.status === s.status).length,
  }));
  /** Tarihten bagimsiz: su an islem bekleyen tum siparisler */
  const openNow = db.orders.filter((o) => o.status === "awaiting_payment" || o.status === "preparing").length;

  /* 4. Urun ve grup bazinda satis */
  const productById = new Map(db.products.map((p) => [p.id, p]));
  const groupOf = new Map(db.categories.map((c) => [c.slug, c.group]));
  const groupName = new Map(db.categoryGroups.map((g) => [g.slug, g.name]));
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  const byGroup = new Map<string, number>();
  soldIn.forEach((o) =>
    o.items.forEach((i) => {
      const line = i.unitPrice * i.quantity;
      const row = byProduct.get(i.productId) ?? { name: i.productName, qty: 0, revenue: 0 };
      row.qty += i.quantity;
      row.revenue += line;
      byProduct.set(i.productId, row);
      const slug = productById.get(i.productId)?.categorySlug ?? "";
      const g = groupName.get(groupOf.get(slug) ?? "") ?? "Diğer";
      byGroup.set(g, (byGroup.get(g) ?? 0) + line);
    }),
  );
  const topProducts = top([...byProduct.entries()], (v) => v.revenue, 5).map(([id, v]) => ({ id, ...v }));
  const groupRevenue = top([...byGroup.entries()], (v) => v, 12).map(([name, value]) => ({ name, value }));

  /* 5. Teklif hunisi */
  const quotesIn = db.quotes.filter((q) => within(q.createdAt, start, end));
  const won = quotesIn.filter((q) => q.status === "won").length;
  const lost = quotesIn.filter((q) => q.status === "lost").length;
  const funnel = {
    stages: [
      { label: "Gelen talep", count: quotesIn.length },
      { label: "İncelenen", count: quotesIn.filter((q) => q.status !== "new").length },
      {
        label: "Teklif verilen",
        count: quotesIn.filter((q) => ["sent", "won", "lost"].includes(q.status)).length,
      },
      { label: "Kazanılan", count: won },
    ],
    won,
    lost,
    /** Sonuclanan tekliflerde kazanma orani */
    winRate: won + lost ? won / (won + lost) : null,
  };

  /* 6. Odeme yontemi */
  const card1 = soldIn.filter((o) => o.payment.method === "card" && (o.payment.installments ?? 1) === 1);
  const cardN = soldIn.filter((o) => o.payment.method === "card" && (o.payment.installments ?? 1) > 1);
  const transfer = soldIn.filter((o) => o.payment.method === "transfer");
  const installmentCounts = [...new Set(cardN.map((o) => o.payment.installments ?? 1))]
    .sort((a, b) => a - b)
    .map((n) => ({ n, count: cardN.filter((o) => o.payment.installments === n).length }));
  const payment = {
    parts: [
      { key: "card1", label: "Kart – tek çekim", count: card1.length, revenue: sum(card1.map((o) => o.total)) },
      { key: "cardN", label: "Kart – taksitli", count: cardN.length, revenue: sum(cardN.map((o) => o.total)) },
      { key: "transfer", label: "Havale / EFT", count: transfer.length, revenue: sum(transfer.map((o) => o.total)) },
    ],
    installmentCounts,
  };

  /* 7. Yeni uyeler */
  const memberBins = bins.map((b) => {
    const us = membersIn.filter((u) => within(u.createdAt, b.start, b.end));
    return {
      individual: us.filter((u) => u.role === "individual").length,
      business: us.filter((u) => u.role === "business").length,
    };
  });

  /* 8. Sehirler */
  const byCity = new Map<string, { orders: number; revenue: number }>();
  soldIn.forEach((o) => {
    const c = o.shippingAddress.city;
    const row = byCity.get(c) ?? { orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += o.total;
    byCity.set(c, row);
  });
  const cities = top([...byCity.entries()], (v) => v.orders, 10).map(([name, v]) => ({ name, ...v }));

  /* 9. Servis talepleri ve garanti kayitlari */
  const serviceIn = db.serviceRequests.filter((s) => within(s.createdAt, start, end));
  const warrantyIn = db.warranties.filter((w) => within(w.registeredAt, start, end));
  const careBins = bins.map((b) => ({
    service: serviceIn.filter((s) => within(s.createdAt, b.start, b.end)).length,
    warranty: warrantyIn.filter((w) => within(w.registeredAt, b.start, b.end)).length,
  }));
  const byModel = new Map<string, number>();
  serviceIn.forEach((s) => byModel.set(s.productName, (byModel.get(s.productName) ?? 0) + 1));
  const serviceModels = top([...byModel.entries()], (v) => v, 5).map(([name, count]) => ({ name, count }));

  return {
    kpis,
    revenueBins,
    statuses,
    openNow,
    topProducts,
    groupRevenue,
    funnel,
    payment,
    memberBins,
    cities,
    care: { bins: careBins, service: serviceIn.length, warranty: warrantyIn.length, serviceModels },
  };
}

export type DashboardStats = ReturnType<typeof dashboardStats>;
