"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, Landmark, User as UserIcon } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import {
  cardInstallments,
  posCommission,
  installmentQuote,
  type OrderAddress,
  type OrderInvoice,
  type PaymentMethod,
} from "@zenweld/data";
import { addAddress, addressesForUser, getShopSettings, placeOrder, useDatabase } from "@zenweld/store";
import { Alert, Button, EmptyState, FormRow, Input, Modal, Textarea } from "@zenweld/ui";
import { formatPrice } from "@zenweld/utils";
import Link from "next/link";
import { KvkkNotice } from "@/components/legal/LegalLink";
import { AddressFields, EMPTY_ADDRESS, addressComplete } from "@/components/shop/AddressFields";
import { BankAccounts } from "@/components/shop/BankAccounts";
import { CardPayment, EMPTY_CARD, type CardDraft } from "@/components/shop/CardPayment";
import {
  useDocumentTitle,
  LegalDocument,
  type LegalContext,
  type LegalDocumentKind,
} from "@/components/shop/LegalDocument";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n-client";
import {
  cardBrand,
  cardProgram,
  digitsOnly,
  isValidCardNumber,
  isValidExpiry,
  isValidTaxNumber,
  isValidTcKimlikNo,
} from "@/lib/payment";

const addressText = (a: OrderAddress) => `${a.line}, ${a.district} / ${a.city}`;

/** 3D Secure onayini taklit eden bekleme (demo). */
const DEMO_3DS_MS = 1500;

/**
 * ODEME SAYFASI
 *
 * Yalnizca uyeler siparis verebilir. Adimlar tek sayfadadir: teslimat
 * adresi, fatura bilgileri, odeme yontemi (kart + taksit ya da havale/EFT)
 * ve sozlesme onayi. Siparis kaydedilince musteri siparis detayina gider.
 */
export default function CheckoutPage() {
  const t = useT();
  const router = useRouter();
  const db = useDatabase();
  const cart = useCart();
  const { user, ready } = useAuth();
  const shop = getShopSettings(db);
  const docTitle = useDocumentTitle();

  const saved = useMemo(() => (user ? addressesForUser(user.id, db) : []), [user, db]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<OrderAddress & { title: string }>({
    ...EMPTY_ADDRESS,
    title: "",
  });
  const [saveNew, setSaveNew] = useState(true);

  const [invoiceType, setInvoiceType] = useState<OrderInvoice["type"] | null>(null);
  const [invoice, setInvoice] = useState({ fullName: "", tcKimlikNo: "", companyName: "", taxOffice: "", taxNumber: "" });
  const [sameAddress, setSameAddress] = useState(true);
  const [invoiceAddress, setInvoiceAddress] = useState<OrderAddress>(EMPTY_ADDRESS);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [card, setCard] = useState<CardDraft>(EMPTY_CARD);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [doc, setDoc] = useState<LegalDocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [placed, setPlaced] = useState(false);

  if (!ready || !cart.ready || placed) {
    return <div className="zw-container py-20 text-center text-zw-grey-500">{t.common.loading}</div>;
  }

  if (!user) {
    return (
      <div className="zw-container py-16">
        <EmptyState
          icon={<UserIcon size={40} />}
          title={t.checkout.loginRequired}
          text={t.checkout.loginRequiredText}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/giris?next=/odeme">
                <Button size="lg">{t.nav.login}</Button>
              </Link>
              <Link href="/kayit">
                <Button size="lg" variant="outline">
                  {t.nav.register}
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="zw-container py-16">
        <EmptyState
          title={t.cart.empty}
          text={t.cart.emptyText}
          action={
            <Link href="/">
              <Button size="lg">{t.cart.continueShopping}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Varsayilanlar uyeden gelir; kullanici degistirene kadar bunlar gecerli.
  const selectedId = addressId ?? saved[0]?.id ?? "new";
  const selectedSaved = saved.find((a) => a.id === selectedId);
  const shipping: OrderAddress = selectedSaved
    ? {
        fullName: selectedSaved.fullName,
        phone: selectedSaved.phone,
        city: selectedSaved.city,
        district: selectedSaved.district,
        line: selectedSaved.line,
      }
    : newAddress;
  const type = invoiceType ?? (user.role === "business" ? "corporate" : "individual");
  const inv = {
    fullName: invoice.fullName || `${user.firstName} ${user.lastName}`,
    tcKimlikNo: invoice.tcKimlikNo,
    companyName: invoice.companyName || user.companyName || "",
    taxOffice: invoice.taxOffice || user.taxOffice || "",
    taxNumber: invoice.taxNumber || user.taxNumber || "",
  };
  const billingAddress = sameAddress ? shipping : invoiceAddress;

  const { totals } = cart;
  // Kartin bankasi (POS) ve sunulan taksitler; POS yoksa kartla odeme alinamaz.
  const { pos, options } = cardInstallments(totals.total, cardProgram(card.number), shop);
  const option = options.find((o) => o.count === card.installments) ?? options[0] ?? { count: 1, ratePercent: 0, enabled: true };
  const quote = method === "card" ? installmentQuote(totals.total, option) : { fee: 0, grandTotal: totals.total };

  const paymentLabel =
    method === "transfer"
      ? t.orders.transfer
      : [
          t.checkout.card,
          option.count > 1
            ? t.orders.installments.replace("{count}", String(option.count))
            : t.orders.singlePayment,
        ].join(" — ");

  const legalContext: LegalContext = {
    buyer: {
      name: type === "corporate" ? inv.companyName || inv.fullName : inv.fullName,
      email: user.email,
      phone: shipping.phone || user.phone,
    },
    deliveryAddress: addressComplete(shipping) ? `${shipping.fullName}, ${addressText(shipping)}` : "—",
    invoice:
      type === "corporate"
        ? `${inv.companyName} — ${inv.taxOffice} / ${inv.taxNumber}`
        : inv.fullName,
    items: cart.lines.map((l) => ({
      name: l.product.name,
      variant: l.variantLabel ? l.variantLabel : undefined,
      quantity: l.quantity,
      unitPrice: l.unitIncVat,
    })),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    installmentFee: quote.fee,
    total: quote.grandTotal,
    payment: paymentLabel,
    date: new Date().toISOString(),
  };

  const validate = (): string | null => {
    if (!addressComplete(shipping)) return t.checkout.required;
    if (!addressComplete(billingAddress)) return t.checkout.required;
    if (type === "individual") {
      if (!inv.fullName.trim()) return t.checkout.required;
      if (!isValidTcKimlikNo(inv.tcKimlikNo)) return t.checkout.invalidTc;
    } else {
      if (!inv.companyName.trim() || !inv.taxOffice.trim()) return t.checkout.required;
      if (!isValidTaxNumber(inv.taxNumber)) return t.checkout.invalidTax;
    }
    if (method === "card") {
      if (!card.holder.trim()) return t.checkout.required;
      if (!isValidCardNumber(card.number)) return t.checkout.invalidCard;
      if (!isValidExpiry(card.expiry)) return t.checkout.invalidExpiry;
      if (!/^\d{3,4}$/.test(card.cvc)) return t.checkout.invalidCvc;
      if (!pos) return t.checkout.noPos;
    }
    if (!consent) return t.checkout.consentRequired;
    return null;
  };

  const submit = () => {
    const problem = validate();
    setError(problem);
    if (problem) return;

    const now = new Date();
    const order = () =>
      placeOrder({
        userId: user.id,
        customerName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: shipping.phone,
        shippingAddress: shipping,
        invoice:
          type === "corporate"
            ? {
                type,
                companyName: inv.companyName,
                taxOffice: inv.taxOffice,
                taxNumber: inv.taxNumber,
                address: billingAddress,
              }
            : { type, fullName: inv.fullName, tcKimlikNo: inv.tcKimlikNo, address: billingAddress },
        items: cart.lines.map((l) => ({
          productId: l.product.id,
          productName: l.product.name,
          sku: l.sku,
          variantLabel: l.variantLabel,
          quantity: l.quantity,
          unitPriceExVat: l.unitExVat,
          vatRate: l.product.vatRate,
          unitPrice: l.unitIncVat,
        })),
        subtotal: totals.subtotal,
        vat: totals.vat,
        shipping: totals.shipping,
        installmentFee: quote.fee,
        total: quote.grandTotal,
        payment:
          method === "card"
            ? {
                method,
                installments: option.count,
                cardBrand: cardBrand(card.number),
                cardProgram: cardProgram(card.number),
                cardLast4: digitsOnly(card.number).slice(-4),
                posId: pos?.id,
                posName: pos?.name,
                commissionPercent: pos ? posCommission(pos, option.count) : undefined,
                paidAt: new Date().toISOString(),
              }
            : {
                method,
                dueAt: new Date(now.getTime() + shop.transferDueDays * 86_400_000).toISOString(),
              },
        customerNote: note.trim() || undefined,
        termsAcceptedAt: now.toISOString(),
      });

    const finish = () => {
      const record = order();
      if (!selectedSaved && saveNew) {
        const { title, ...address } = newAddress;
        addAddress({ ...address, userId: user.id, title: title.trim() || t.checkout.shippingAddress });
      }
      setPlaced(true);
      cart.clear();
      router.push(`/hesabim/siparislerim/${record.code}?yeni=1`);
    };

    if (method === "card") {
      setProcessing(true);
      setTimeout(finish, DEMO_3DS_MS);
    } else {
      finish();
    }
  };

  const setNew = (k: keyof typeof newAddress, v: string) => setNewAddress((a) => ({ ...a, [k]: v }));
  const setInv = (k: keyof typeof invoice, v: string) => setInvoice((i) => ({ ...i, [k]: v }));

  return (
    <div className="zw-container py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">{t.checkout.title}</h1>
        <Link href="/sepet" className="text-sm font-semibold text-zw-grey-600 hover:text-zw-red-600">
          ← {t.checkout.backToCart}
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* 1. Teslimat adresi */}
          <Step n={1} title={t.checkout.shippingAddress}>
            {saved.length > 0 && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {saved.map((a) => (
                  <Choice key={a.id} selected={selectedId === a.id} onSelect={() => setAddressId(a.id)}>
                    <div className="font-semibold">{a.title}</div>
                    <div className="mt-1 text-xs text-zw-grey-600">
                      {a.fullName} · {a.phone}
                      <br />
                      {a.line}, {a.district} / {a.city}
                    </div>
                  </Choice>
                ))}
                <Choice selected={selectedId === "new"} onSelect={() => setAddressId("new")}>
                  <div className="font-semibold">+ {t.checkout.newAddress}</div>
                </Choice>
              </div>
            )}
            {selectedId === "new" && (
              <div className="space-y-4">
                <AddressFields value={newAddress} onChange={setNew} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormRow label={t.checkout.addressTitle}>
                    <Input
                      value={newAddress.title}
                      placeholder={t.checkout.addressTitlePlaceholder}
                      onChange={(e) => setNew("title", e.target.value)}
                    />
                  </FormRow>
                </div>
                <label className="flex items-center gap-2 text-sm text-zw-grey-700">
                  <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
                  {t.checkout.saveAddress}
                </label>
              </div>
            )}
          </Step>

          {/* 2. Fatura */}
          <Step n={2} title={t.checkout.invoice}>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
              <Choice selected={type === "individual"} onSelect={() => setInvoiceType("individual")}>
                <span className="flex items-center gap-2 font-semibold">
                  <UserIcon size={16} /> {t.checkout.invoiceIndividual}
                </span>
              </Choice>
              <Choice selected={type === "corporate"} onSelect={() => setInvoiceType("corporate")}>
                <span className="flex items-center gap-2 font-semibold">
                  <Building2 size={16} /> {t.checkout.invoiceCorporate}
                </span>
              </Choice>
            </div>

            {type === "individual" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.checkout.fullName} required>
                  <Input value={inv.fullName} onChange={(e) => setInv("fullName", e.target.value)} />
                </FormRow>
                <FormRow label={t.checkout.tcKimlikNo} required>
                  <Input
                    inputMode="numeric"
                    maxLength={11}
                    value={inv.tcKimlikNo}
                    onChange={(e) => setInv("tcKimlikNo", digitsOnly(e.target.value))}
                  />
                </FormRow>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <FormRow label={t.checkout.companyName} required>
                  <Input value={inv.companyName} onChange={(e) => setInv("companyName", e.target.value)} />
                </FormRow>
                <FormRow label={t.checkout.taxOffice} required>
                  <Input value={inv.taxOffice} onChange={(e) => setInv("taxOffice", e.target.value)} />
                </FormRow>
                <FormRow label={t.checkout.taxNumber} required>
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    value={inv.taxNumber}
                    onChange={(e) => setInv("taxNumber", digitsOnly(e.target.value))}
                  />
                </FormRow>
              </div>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm text-zw-grey-700">
              <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
              {t.checkout.sameAddress}
            </label>
            {!sameAddress && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold">{t.checkout.invoiceAddress}</h3>
                <AddressFields
                  value={invoiceAddress}
                  onChange={(k, v) => setInvoiceAddress((a) => ({ ...a, [k]: v }))}
                />
              </div>
            )}
          </Step>

          {/* 3. Odeme */}
          <Step n={3} title={t.checkout.payment}>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <Choice selected={method === "card"} onSelect={() => setMethod("card")}>
                <span className="flex items-center gap-2 font-semibold">
                  <CreditCard size={17} /> {t.checkout.card}
                </span>
              </Choice>
              <Choice selected={method === "transfer"} onSelect={() => setMethod("transfer")}>
                <span className="flex items-center gap-2 font-semibold">
                  <Landmark size={17} /> {t.checkout.transfer}
                </span>
              </Choice>
            </div>

            {method === "card" ? (
              <CardPayment card={card} onChange={setCard} total={totals.total} shop={shop} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zw-grey-700">
                  {t.checkout.transferInfo.replace("{days}", String(shop.transferDueDays))}
                </p>
                <BankAccounts accounts={shop.bankAccounts} />
              </div>
            )}

            <div className="mt-6">
              <FormRow label={t.checkout.note}>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
              </FormRow>
            </div>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary totals={totals} installmentFee={quote.fee}>
            <ul className="mb-5 space-y-2 border-b border-zw-grey-200 pb-4 text-xs text-zw-grey-700">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3">
                  <span>
                    {l.quantity} × {l.product.name}
                    {l.variantLabel && <span className="text-zw-grey-500"> — {l.variantLabel}</span>}
                  </span>
                  <span className="shrink-0 font-semibold">{formatPrice(l.totalIncVat)}</span>
                </li>
              ))}
            </ul>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-zw-grey-700">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setError(null);
                }}
              />
              <span>
                {t.checkout.consentBefore}
                <DocLink onClick={() => setDoc("preInfo")}>{t.checkout.preInfo}</DocLink>
                {t.checkout.consentAnd}
                <DocLink onClick={() => setDoc("contract")}>{t.checkout.contract}</DocLink>
                {t.checkout.consentAfter}
              </span>
            </label>
            <KvkkNotice className="mt-2" />

            {error && (
              <div className="mt-4">
                <Alert tone="danger">{error}</Alert>
              </div>
            )}

            <Button size="lg" fullWidth className="mt-4" onClick={submit} disabled={processing}>
              {processing
                ? t.checkout.processing
                : method === "card"
                  ? t.checkout.pay.replace("{amount}", formatPrice(quote.grandTotal))
                  : t.checkout.placeOrder}
            </Button>
          </OrderSummary>
        </aside>
      </div>

      <Modal open={doc !== null} onClose={() => setDoc(null)} title={doc ? docTitle(doc) : ""}>
        {doc && <LegalDocument kind={doc} context={legalContext} />}
      </Modal>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[4px] border border-zw-grey-200 p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 font-display text-xl font-bold uppercase">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zw-ink text-sm text-white">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-[4px] border-2 px-4 py-3 text-left text-sm transition-colors ${
        selected ? "border-zw-red-600 bg-zw-red-50" : "border-zw-grey-200 hover:border-zw-grey-400"
      }`}
    >
      {children}
    </button>
  );
}

function DocLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-semibold text-zw-red-700 underline underline-offset-2">
      {children}
    </button>
  );
}
