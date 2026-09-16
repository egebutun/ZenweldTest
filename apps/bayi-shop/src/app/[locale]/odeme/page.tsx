"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Truck } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { createOrder } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Select } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { useHref, useLocale, useT } from "@/lib/i18n-client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-config";

const STEPS = ["Teslimat", "Kargo", "Ödeme"];

export default function CheckoutPage() {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const router = useRouter();
  const cart = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState("kart");
  const [form, setForm] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    district: "",
    address: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (cart.items.length === 0) {
    return (
      <div className="zw-container py-20 text-center">
        <p className="text-zw-grey-600">{t.shop.emptyCart}</p>
        <LocaleLink href="/magaza" className="mt-4 inline-block">
          <Button>{t.shop.continueShopping}</Button>
        </LocaleLink>
      </div>
    );
  }

  const placeOrder = () => {
    const subtotal = Math.round(cart.subtotal / 1.2);
    const order = createOrder({
      userId: user?.id,
      channel: "bayi-shop",
      status: "pending",
      customerName: form.fullName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      address: `${form.address}, ${form.district} / ${form.city}`,
      items: cart.items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      subtotal,
      vat: cart.subtotal - subtotal,
      shipping: cart.shipping,
      total: cart.total,
    });
    cart.clear();
    router.push(href(`/siparis-tamam?kod=${order.code}`));
  };

  return (
    <div className="zw-container py-10">
      <h1 className="font-display text-4xl font-bold uppercase">{t.shop.checkout}</h1>

      <div className="mt-4">
        <Alert tone="warning">{t.shop.demoCheckout}</Alert>
      </div>

      <ol className="mt-6 flex gap-2">
        {STEPS.map((title, i) => (
          <li key={title} className="flex-1">
            <button
              onClick={() => setStep(i)}
              className={`w-full border-t-4 pt-2 text-left text-xs font-semibold uppercase tracking-wide ${
                step === i
                  ? "border-zw-red-600 text-zw-ink"
                  : step > i
                    ? "border-zw-grey-800 text-zw-grey-600"
                    : "border-zw-grey-200 text-zw-grey-400"
              }`}
            >
              {i + 1}. {title}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Ad Soyad" required>
                  <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
                </FormRow>
                <FormRow label="Telefon" required>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </FormRow>
              </div>
              <FormRow label="E-posta" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </FormRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Şehir" required>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </FormRow>
                <FormRow label="İlçe">
                  <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
                </FormRow>
              </div>
              <FormRow label="Adres" required>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </FormRow>
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {[
                { id: "standart", label: "Standart Kargo (2-4 iş günü)", price: cart.shipping },
                { id: "hizli", label: "Hızlı Kargo (1-2 iş günü)", price: cart.shipping + 250 },
              ].map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 rounded-[4px] border-2 border-zw-grey-200 px-4 py-4 hover:border-zw-grey-400"
                >
                  <input type="radio" name="shipping" defaultChecked={option.id === "standart"} className="accent-zw-red-600" />
                  <Truck size={20} className="text-zw-grey-500" />
                  <span className="font-semibold">{option.label}</span>
                  <span className="ml-auto font-semibold">
                    {option.price === 0 ? t.shop.freeShipping : formatPrice(option.price, locale)}
                  </span>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {[
                { id: "kart", label: "Kredi / Banka Kartı", Icon: CreditCard },
                { id: "havale", label: "Havale / EFT", Icon: Landmark },
              ].map(({ id, label, Icon }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-[4px] border-2 px-4 py-4 ${
                    payment === id ? "border-zw-red-600 bg-zw-red-50" : "border-zw-grey-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === id}
                    onChange={() => setPayment(id)}
                    className="accent-zw-red-600"
                  />
                  <Icon size={20} className="text-zw-grey-500" />
                  <span className="font-semibold">{label}</span>
                </label>
              ))}

              {payment === "kart" && (
                <div className="space-y-4 rounded-[4px] border border-zw-grey-200 p-5">
                  <FormRow label="Kart Üzerindeki İsim">
                    <Input placeholder="AD SOYAD" />
                  </FormRow>
                  <FormRow label="Kart Numarası">
                    <Input placeholder="0000 0000 0000 0000" />
                  </FormRow>
                  <div className="grid grid-cols-3 gap-4">
                    <FormRow label="Ay">
                      <Select>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i}>{String(i + 1).padStart(2, "0")}</option>
                        ))}
                      </Select>
                    </FormRow>
                    <FormRow label="Yıl">
                      <Select>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <option key={i}>{2026 + i}</option>
                        ))}
                      </Select>
                    </FormRow>
                    <FormRow label="CVV">
                      <Input placeholder="000" maxLength={4} />
                    </FormRow>
                  </div>
                  <p className="text-xs text-zw-grey-500">{t.shop.demoCheckout}</p>
                </div>
              )}

              {payment === "havale" && (
                <div className="rounded-[4px] border border-zw-grey-200 p-5 text-sm text-zw-grey-600">
                  <p className="font-semibold text-zw-ink">{STORE.legalName}</p>
                  <p className="mt-1">IBAN: TR00 0000 0000 0000 0000 0000 00 (DEMO)</p>
                  <p className="mt-2">Açıklama kısmına sipariş numaranızı yazınız.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t.common.previous}
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)}>{t.common.next}</Button>
            ) : (
              <Button size="lg" onClick={placeOrder}>
                Siparişi Onayla
              </Button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-[4px] border border-zw-grey-200 p-5">
          <h2 className="font-display text-xl font-bold uppercase">Sipariş Özeti</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="text-zw-grey-600">
                  {i.quantity} × {i.name}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPrice(i.unitPrice * i.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-zw-grey-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-zw-grey-600">{t.shop.shipping}</dt>
              <dd>{cart.shipping === 0 ? t.shop.freeShipping : formatPrice(cart.shipping, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-zw-grey-200 pt-3">
              <dt className="font-bold">{t.shop.total}</dt>
              <dd className="font-display text-2xl font-bold">{formatPrice(cart.total, locale)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
