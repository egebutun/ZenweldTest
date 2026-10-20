"use client";

import type { ReactNode } from "react";
import type { LegalPageId, Order, OrderPayment } from "@zenweld/data";
import type { Dictionary } from "@zenweld/i18n";
import { findLegalPage, useDatabase } from "@zenweld/store";
import { RichText } from "@zenweld/ui";
import { formatDate, formatPrice } from "@zenweld/utils";
import { CONTACT, OFFICES } from "@/lib/contact";
import { addressComplete } from "./AddressFields";

/**
 * ON BILGILENDIRME FORMU ve MESAFELI SATIS SOZLESMESI
 *
 * 6502 sayili Kanun ve Mesafeli Sozlesmeler Yonetmeligi geregi tuketici,
 * odemeden once bu iki metni gorup onaylamalidir. Odeme sayfasinda metin
 * o siparisin bilgileriyle (alici, urunler, tutarlar) doldurulur; /yasal
 * altindaki sayfalarda bos sablon gosterilir.
 *
 * Satici, alici ve urun tablolari otomatiktir; altindaki metin (teslimat,
 * cayma hakki ...) yonetim panelindeki "Yasal Metinler"den duzenlenir.
 */

export type LegalDocumentKind = "preInfo" | "contract";

/** Panelde duzenlenen metnin kimligi. */
const DOC_ID: Record<LegalDocumentKind, LegalPageId> = {
  preInfo: "on-bilgilendirme-formu",
  contract: "mesafeli-satis-sozlesmesi",
};

export interface LegalContext {
  buyer: { name: string; email: string; phone: string };
  deliveryAddress: string;
  invoice: string;
  items: { name: string; variant?: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shipping: number;
  installmentFee: number;
  total: number;
  payment: string;
  date: string;
}

/**
 * Odeme satiri ("Visa •••• 1111 · 3 taksit"). Odeme sayfasinda onaylanan
 * sozlesme ile siparisten acilan kopya ayni metni gostersin diye tek yerde.
 */
export function paymentSummary(payment: OrderPayment, t: Dictionary): string {
  if (payment.method === "transfer") return t.orders.transfer;
  const card = payment.cardLast4
    ? t.orders.cardPayment
        .replace("{brand}", payment.cardBrand ?? "")
        .replace("{last4}", payment.cardLast4)
        .trim()
    : t.checkout.card;
  const plan =
    (payment.installments ?? 1) > 1
      ? t.orders.installments.replace("{count}", String(payment.installments))
      : t.orders.singlePayment;
  return `${card} · ${plan}`;
}

/** Sozlesmeye giren siparis bilgileri (odeme sayfasindaki taslak ya da kayitli siparis). */
export type LegalOrder = Pick<
  Order,
  "customerName" | "email" | "phone" | "shippingAddress" | "invoice" | "items" | "subtotal" | "shipping" | "installmentFee" | "total" | "payment"
>;

/**
 * On bilgilendirme formu ve sozlesmenin siparis bilgileri. Odeme sayfasi ve
 * siparis sayfasi bu tek fonksiyonu kullanir; musterinin onayladigi metin
 * ile sonradan actigi kopya ayni kalir.
 */
export function orderLegalContext(order: LegalOrder, date: string, t: Dictionary): LegalContext {
  const a = order.shippingAddress;
  const i = order.invoice;
  return {
    buyer: {
      name: (i.type === "corporate" ? i.companyName : i.fullName) || order.customerName,
      email: order.email,
      phone: order.phone,
    },
    deliveryAddress: addressComplete(a) ? `${a.fullName}, ${a.line}, ${a.district} / ${a.city}` : "—",
    invoice:
      i.type === "corporate"
        ? `${i.companyName ?? ""} — ${i.taxOffice ?? ""} / ${i.taxNumber ?? ""}`
        : i.fullName ?? "",
    items: order.items.map((item) => ({
      name: item.productName,
      variant: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    installmentFee: order.installmentFee,
    total: order.total,
    payment: paymentSummary(order.payment, t),
    date,
  };
}

const SELLER = OFFICES[0];

const TEXT = {
  seller: "Satıcı",
  buyer: "Alıcı",
  title: "Unvan",
  address: "Adres",
  phone: "Telefon",
  email: "E-posta",
  mersis: "MERSİS No",
  name: "Ad Soyad / Unvan",
  delivery: "Teslimat adresi",
  invoice: "Fatura bilgileri",
  products: "Sözleşme konusu ürünler",
  product: "Ürün",
  qty: "Adet",
  unit: "Birim fiyat (KDV dahil)",
  total: "Toplam",
  subtotal: "Ürünler toplamı",
  shipping: "Kargo ücreti",
  installmentFee: "Vade farkı",
  grandTotal: "Ödenecek toplam tutar (KDV dahil)",
  payment: "Ödeme şekli",
  date: "Sipariş tarihi",
  filledAtCheckout: "Sipariş sırasında doldurulur",
  free: "Ücretsiz",
};

/** Belgenin panelde girilen basligi (modal basliklari icin). */
export function useDocumentTitle() {
  const db = useDatabase();
  return (kind: LegalDocumentKind) => {
    const page = findLegalPage(DOC_ID[kind], db);
    return page ? page.title : "";
  };
}

export function LegalDocument({
  kind,
  context,
}: {
  kind: LegalDocumentKind;
  /** Yoksa bos sablon gosterilir */
  context?: LegalContext;
}) {
  const t = TEXT;
  const page = findLegalPage(DOC_ID[kind], useDatabase());
  const blank = <span className="italic text-zw-grey-400">[{t.filledAtCheckout}]</span>;

  return (
    <article className="space-y-6 text-sm leading-relaxed text-zw-grey-700">
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title={t.seller}>
          <Facts
            rows={[
              [t.title, SELLER.legalName ?? "Zenweld"],
              [t.address, SELLER.addressLines.join(" ")],
              [t.phone, CONTACT.phone],
              [t.email, CONTACT.email],
              [t.mersis, "[—]"],
            ]}
          />
        </Section>
        <Section title={t.buyer}>
          <Facts
            rows={[
              [t.name, context?.buyer.name ?? blank],
              [t.email, context?.buyer.email ?? blank],
              [t.phone, context?.buyer.phone ?? blank],
              [t.delivery, context?.deliveryAddress ?? blank],
              [t.invoice, context?.invoice ?? blank],
            ]}
          />
        </Section>
      </div>

      <Section title={t.products}>
        {context ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zw-grey-200 text-zw-grey-500">
                <tr>
                  <th className="py-2 pr-3">{t.product}</th>
                  <th className="py-2 pr-3 text-right">{t.qty}</th>
                  <th className="py-2 pr-3 text-right">{t.unit}</th>
                  <th className="py-2 text-right">{t.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {context.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3">
                      {i.name}
                      {i.variant && <span className="text-zw-grey-500"> — {i.variant}</span>}
                    </td>
                    <td className="py-2 pr-3 text-right">{i.quantity}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(i.unitPrice)}</td>
                    <td className="py-2 text-right">{formatPrice(i.unitPrice * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Facts
              rows={[
                [t.subtotal, formatPrice(context.subtotal)],
                [t.shipping, context.shipping === 0 ? t.free : formatPrice(context.shipping)],
                ...(context.installmentFee > 0
                  ? [[t.installmentFee, formatPrice(context.installmentFee)] as [string, ReactNode]]
                  : []),
                [t.grandTotal, <strong key="t">{formatPrice(context.total)}</strong>],
                [t.payment, context.payment],
                [t.date, formatDate(context.date)],
              ]}
            />
          </div>
        ) : (
          blank
        )}
      </Section>

      {page && <RichText source={page.body} />}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-display text-base font-bold uppercase text-zw-ink">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-2 space-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[140px_1fr] gap-2">
          <dt className="text-zw-grey-500">{label}</dt>
          <dd className="text-zw-grey-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
