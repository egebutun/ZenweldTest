import type { Order, OrderAddress, OrderItem, PaymentMethod } from "../types";
import { salePriceExVat } from "../discount";
import { posCommission, posForCard } from "../checkout";
import { products } from "./products.seed";
import { defaultSettings } from "./settings.seed";

/**
 * Ornek online siparisler — sunumda Siparisler sayfasi ve musterinin
 * kargo takibi bos gorunmesin diye. Gercek kullanimda silinir.
 */

function item(slug: string, quantity: number): OrderItem {
  const p = products.find((x) => x.slug === slug)!;
  const unitPriceExVat = salePriceExVat(p);
  return {
    productId: p.id,
    productName: p.name,
    sku: p.sku,
    quantity,
    unitPriceExVat,
    vatRate: p.vatRate,
    unitPrice: Math.round(unitPriceExVat * (1 + p.vatRate / 100)),
  };
}

function totals(items: OrderItem[], installmentFee = 0) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const { freeShippingThreshold, shippingFee } = defaultSettings.shop;
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const exVat = items.reduce((s, i) => s + i.unitPriceExVat * i.quantity, 0);
  return {
    subtotal,
    vat: subtotal - exVat,
    shipping,
    installmentFee,
    total: subtotal + shipping + installmentFee,
  };
}

const ahmet: OrderAddress = {
  fullName: "Ahmet Yılmaz",
  phone: "+90 532 111 11 11",
  city: "İstanbul",
  district: "Maltepe",
  line: "Lorem Mah. 12. Sok. No:5 D:8",
};

const elif: OrderAddress = {
  fullName: "Elif Demir",
  phone: "+90 533 222 22 22",
  city: "İstanbul",
  district: "Tuzla",
  line: "Lorem OSB 3. Cadde No:17",
};

const card = (installments: number, last4: string, paidAt: string) => {
  const pos = posForCard("World", defaultSettings.shop).pos!;
  return {
    method: "card" as PaymentMethod,
    installments,
    cardBrand: "Mastercard",
    cardProgram: "World",
    cardLast4: last4,
    posId: pos.id,
    posName: pos.name,
    commissionPercent: posCommission(pos, installments),
    paidAt,
  };
};

const delivered = [item("zenmask-auto-9000", 1), item("gazalti-teli-sg2-08", 1)];
const shipped = [item("evomig-205-p", 1), item("gazalti-teli-sg2-08", 4)];
const preparing = [item("arc-200", 1)];

const shippedTotals = totals(shipped);
const shippedFee = Math.round(shippedTotals.total * 0.045);

export const orders: Order[] = [
  {
    id: "o-demo-3",
    code: "SIP-2026-00003",
    userId: "u-bireysel",
    status: "preparing",
    customerName: "Ahmet Yılmaz",
    email: "bireysel@demo.com",
    phone: ahmet.phone,
    shippingAddress: ahmet,
    invoice: { type: "individual", fullName: "Ahmet Yılmaz", tcKimlikNo: "10000000146", address: ahmet },
    items: preparing,
    ...totals(preparing),
    payment: {
      method: "transfer",
      dueAt: "2026-10-12T09:15:00+03:00",
      paidAt: "2026-10-10T14:40:00+03:00",
    },
    history: [
      { status: "awaiting_payment", at: "2026-10-09T09:15:00+03:00" },
      { status: "preparing", at: "2026-10-10T14:40:00+03:00" },
    ],
    termsAcceptedAt: "2026-10-09T09:15:00+03:00",
    createdAt: "2026-10-09T09:15:00+03:00",
    updatedAt: "2026-10-10T14:40:00+03:00",
  },
  {
    id: "o-demo-2",
    code: "SIP-2026-00002",
    userId: "u-kurumsal",
    status: "shipped",
    customerName: "Elif Demir",
    email: "kurumsal@demo.com",
    phone: elif.phone,
    shippingAddress: elif,
    invoice: {
      type: "corporate",
      companyName: "Demir Metal Sanayi A.Ş.",
      taxOffice: "Kadıköy",
      taxNumber: "1234567890",
      address: elif,
    },
    items: shipped,
    ...totals(shipped, shippedFee),
    payment: card(6, "4417", "2026-10-06T11:02:00+03:00"),
    shipment: {
      carrier: "Yurtiçi Kargo",
      trackingNumber: "YK 1029 3847 56",
      shippedAt: "2026-10-07T16:20:00+03:00",
    },
    history: [
      { status: "preparing", at: "2026-10-06T11:02:00+03:00" },
      { status: "shipped", at: "2026-10-07T16:20:00+03:00" },
    ],
    termsAcceptedAt: "2026-10-06T11:02:00+03:00",
    createdAt: "2026-10-06T11:02:00+03:00",
    updatedAt: "2026-10-07T16:20:00+03:00",
  },
  {
    id: "o-demo-1",
    code: "SIP-2026-00001",
    userId: "u-bireysel",
    status: "delivered",
    customerName: "Ahmet Yılmaz",
    email: "bireysel@demo.com",
    phone: ahmet.phone,
    shippingAddress: ahmet,
    invoice: { type: "individual", fullName: "Ahmet Yılmaz", tcKimlikNo: "10000000146", address: ahmet },
    items: delivered,
    ...totals(delivered),
    payment: card(1, "0217", "2026-09-22T20:31:00+03:00"),
    shipment: {
      carrier: "Aras Kargo",
      trackingNumber: "AR 5520 1983 04",
      shippedAt: "2026-09-23T15:10:00+03:00",
      deliveredAt: "2026-09-25T12:45:00+03:00",
    },
    history: [
      { status: "preparing", at: "2026-09-22T20:31:00+03:00" },
      { status: "shipped", at: "2026-09-23T15:10:00+03:00" },
      { status: "delivered", at: "2026-09-25T12:45:00+03:00" },
    ],
    termsAcceptedAt: "2026-09-22T20:31:00+03:00",
    createdAt: "2026-09-22T20:31:00+03:00",
    updatedAt: "2026-09-25T12:45:00+03:00",
  },
];
