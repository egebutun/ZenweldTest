"use client";

import type { ReactNode } from "react";
import type { Locale } from "@zenweld/i18n";
import { formatDate, formatPrice } from "@zenweld/utils";
import { CONTACT, OFFICES } from "@/lib/contact";
import { useLocale } from "@/lib/i18n-client";

/**
 * ON BILGILENDIRME FORMU ve MESAFELI SATIS SOZLESMESI
 *
 * 6502 sayili Kanun ve Mesafeli Sozlesmeler Yonetmeligi geregi tuketici,
 * odemeden once bu iki metni gorup onaylamalidir. Odeme sayfasinda metin
 * o siparisin bilgileriyle (alici, urunler, tutarlar) doldurulur; /yasal
 * altindaki sayfalarda bos sablon gosterilir.
 *
 * !! TASLAK: Metnin yapisi yonetmelikteki basliklara gore kuruldu; nihai
 * hukuki metni Zenweld'in hukuk danismani yazmalidir.
 */

export type LegalDocumentKind = "preInfo" | "contract";

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

const SELLER = OFFICES[0];

const TEXT = {
  tr: {
    preInfo: "Ön Bilgilendirme Formu",
    contract: "Mesafeli Satış Sözleşmesi",
    draft: "TASLAK — Bu metin örnektir; yayına almadan önce hukuk danışmanınız tarafından hazırlanmalıdır.",
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
    sections: {
      deliveryTitle: "Teslimat",
      delivery:
        "Ürünler, sipariş onayından itibaren en geç 30 gün içinde Alıcı'nın bildirdiği teslimat adresine kargo ile teslim edilir. Kargo firması ve takip numarası, ürün kargoya verildiğinde Alıcı'nın Hesabım > Siparişlerim sayfasında gösterilir.",
      withdrawalTitle: "Cayma hakkı",
      withdrawal:
        "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir. Cayma bildirimi e-posta ile Satıcı'ya iletilir; Satıcı bildirimi aldıktan sonra 14 gün içinde ödemeyi iade eder. Cayma hakkının kullanılamayacağı ürünler ve iade kargo masrafları hukuk danışmanı tarafından belirlenecektir.",
      corporateTitle: "Kurumsal alıcılar",
      corporate:
        "Ürünü ticari veya mesleki amaçla satın alan Alıcı, tüketici sayılmaz; bu durumda cayma hakkı ve tüketici mevzuatına ilişkin hükümler uygulanmayabilir.",
      warrantyTitle: "Garanti",
      warranty:
        "Ürünler, ürün sayfasında belirtilen süre boyunca Zenweld garantisi altındadır. Garanti koşulları için Garanti Koşulları sayfasına bakınız.",
      disputeTitle: "Şikâyet ve uyuşmazlık",
      dispute:
        "Alıcı, şikâyetlerini Satıcı'nın iletişim bilgilerine iletebilir. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar dahilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.",
      subjectTitle: "Sözleşmenin konusu",
      subject:
        "Bu sözleşme, Alıcı'nın Satıcı'ya ait zenweld.com internet sitesinden elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler.",
      generalTitle: "Genel hükümler",
      general:
        "Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli onayı verdiğini kabul eder. Sözleşme, Alıcı'nın siparişi onaylamasıyla yürürlüğe girer; bir kopyası Alıcı'nın e-posta adresine gönderilir.",
    },
  },
  en: {
    preInfo: "Pre-Information Form",
    contract: "Distance Sales Contract",
    draft: "DRAFT — This text is a sample; it must be prepared by your legal adviser before going live.",
    seller: "Seller",
    buyer: "Buyer",
    title: "Company",
    address: "Address",
    phone: "Phone",
    email: "Email",
    mersis: "MERSIS No",
    name: "Name / Company",
    delivery: "Delivery address",
    invoice: "Billing details",
    products: "Products covered by the contract",
    product: "Product",
    qty: "Qty",
    unit: "Unit price (incl. VAT)",
    total: "Total",
    subtotal: "Products total",
    shipping: "Shipping fee",
    installmentFee: "Instalment fee",
    grandTotal: "Total amount payable (incl. VAT)",
    payment: "Payment method",
    date: "Order date",
    filledAtCheckout: "Filled in at checkout",
    free: "Free",
    sections: {
      deliveryTitle: "Delivery",
      delivery:
        "Products are delivered by courier to the address given by the Buyer within 30 days of order confirmation at the latest. The carrier and tracking number are shown on the Buyer's Account > My Orders page once the product ships.",
      withdrawalTitle: "Right of withdrawal",
      withdrawal:
        "The Buyer may withdraw from the contract within 14 days of receiving the product without giving any reason and without penalty. The withdrawal notice is sent to the Seller by email; the Seller refunds the payment within 14 days of receiving the notice. Products excluded from withdrawal and return shipping costs will be defined by the legal adviser.",
      corporateTitle: "Corporate buyers",
      corporate:
        "A Buyer purchasing for commercial or professional purposes is not a consumer; in that case the right of withdrawal and consumer-law provisions may not apply.",
      warrantyTitle: "Warranty",
      warranty:
        "Products are covered by the Zenweld warranty for the period stated on the product page. See the Warranty Terms page for conditions.",
      disputeTitle: "Complaints and disputes",
      dispute:
        "The Buyer may send complaints to the Seller's contact details. Disputes are handled by the Consumer Arbitration Committees at the Buyer's place of residence within the monetary limits announced each year by the Ministry of Trade, and by Consumer Courts above those limits.",
      subjectTitle: "Subject of the contract",
      subject:
        "This contract sets out the rights and obligations of the parties regarding the sale and delivery of the products below, ordered electronically by the Buyer on the Seller's website zenweld.com.",
      generalTitle: "General provisions",
      general:
        "The Buyer confirms having read the preliminary information on the product's main characteristics, sale price, payment method and delivery, and having given the required electronic approval. The contract takes effect when the Buyer confirms the order; a copy is sent to the Buyer's email address.",
    },
  },
} satisfies Record<Locale, unknown>;

export function documentTitle(kind: LegalDocumentKind, locale: Locale): string {
  return TEXT[locale][kind];
}

export function LegalDocument({
  kind,
  context,
}: {
  kind: LegalDocumentKind;
  /** Yoksa bos sablon gosterilir */
  context?: LegalContext;
}) {
  const locale = useLocale();
  const t = TEXT[locale];
  const blank = <span className="italic text-zw-grey-400">[{t.filledAtCheckout}]</span>;
  const price = (n: number) => formatPrice(n, locale);
  const s = t.sections;

  return (
    <article className="space-y-6 text-sm leading-relaxed text-zw-grey-700">
      <p className="rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
        {t.draft}
      </p>

      {kind === "contract" && <Section title={s.subjectTitle}>{s.subject}</Section>}

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
                    <td className="py-2 pr-3 text-right">{price(i.unitPrice)}</td>
                    <td className="py-2 text-right">{price(i.unitPrice * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Facts
              rows={[
                [t.subtotal, price(context.subtotal)],
                [t.shipping, context.shipping === 0 ? t.free : price(context.shipping)],
                ...(context.installmentFee > 0
                  ? [[t.installmentFee, price(context.installmentFee)] as [string, ReactNode]]
                  : []),
                [t.grandTotal, <strong key="t">{price(context.total)}</strong>],
                [t.payment, context.payment],
                [t.date, formatDate(context.date, locale)],
              ]}
            />
          </div>
        ) : (
          blank
        )}
      </Section>

      {kind === "contract" && <Section title={s.generalTitle}>{s.general}</Section>}
      <Section title={s.deliveryTitle}>{s.delivery}</Section>
      <Section title={s.withdrawalTitle}>{s.withdrawal}</Section>
      <Section title={s.corporateTitle}>{s.corporate}</Section>
      <Section title={s.warrantyTitle}>{s.warranty}</Section>
      <Section title={s.disputeTitle}>{s.dispute}</Section>
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
