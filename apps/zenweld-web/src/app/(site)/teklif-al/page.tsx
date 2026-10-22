"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { createQuote, listProducts, useDatabase } from "@zenweld/store";
import { productVariantGroup, type PaymentPreference, type Product, type User } from "@zenweld/data";
import { Alert, Badge, Button, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";
import { notifyZenweld } from "@/lib/notify";
import { useMemberPrefill } from "@/lib/member-prefill";
import { useQuoteList } from "@/lib/quote-list";
import { KvkkNotice } from "@/components/legal/LegalLink";
import { useBotTrap } from "@/components/common/BotTrap";

const STEPS = 4;

const memberValues = (user: User) => ({
  companyName: user.companyName ?? "",
  contactName: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  phone: user.phone ?? "",
  taxNumber: user.taxNumber ?? "",
  city: user.city ?? "",
});

export default function QuotePage() {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const quoteList = useQuoteList();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // "urunId|secenekId" (seceneksiz urunde "urunId|")
  const [addChoice, setAddChoice] = useState("");
  const bot = useBotTrap();

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    taxNumber: "",
    city: "",
    ...(user ? memberValues(user) : {}),
    paymentPreference: "vadeli" as PaymentPreference,
    termDays: 60,
    message: "",
  });
  useMemberPrefill(user, memberValues, setForm);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Secenekli urun her secenegiyle ayri satir olarak listelenir; teklif
  // secenegin kodu ve adiyla gider.
  const quotableChoices = useMemo(
    () =>
      listProducts(db)
        .filter((p) => p.quotable)
        .flatMap((p): { value: string; label: string; product: Product; variantId?: string }[] => {
          const group = productVariantGroup(p, db.optionDefinitions);
          return group
            ? group.options.map((o) => ({ value: `${p.id}|${o.id}`, label: `${p.name} — ${o.label} (${o.sku})`, product: p, variantId: o.id }))
            : [{ value: `${p.id}|`, label: `${p.name} (${p.sku})`, product: p, variantId: undefined }];
        }),
    [db],
  );

  const stepTitles = [t.quote.step1, t.quote.step2, t.quote.step3, t.quote.step4];

  if (code) {
    return (
      <div className="zw-container py-20">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={32} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold uppercase">
            {t.quote.successTitle}
          </h1>
          <p className="mt-3 text-zw-grey-600">
            {t.quote.successText.replace("{code}", code)}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button variant="outline">{t.common.back}</Button>
            </Link>
            {user && (
              <Link href="/hesabim/tekliflerim">
                <Button>{t.nav.myQuotes}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 1. adim (firma ve iletisim) eksikse sonraki adimlara gecilmez ve teklif
  // gonderilmez; satis ekibinin talep sahibine ulasabilmesi gerekir.
  const contactError = (): string | null => {
    const companyRequired = user?.role !== "individual";
    if ((companyRequired && !form.companyName.trim()) || !form.contactName.trim() || !form.phone.trim()) {
      return t.quote.required;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return t.quote.invalidEmail;
    return null;
  };

  const goTo = (target: number) => {
    const problem = target > 1 ? contactError() : null;
    setError(problem);
    setStep(problem ? 1 : target);
  };

  const submit = () => {
    setError(null);
    const problem = contactError();
    if (problem) {
      setError(problem);
      setStep(1);
      return;
    }
    if (quoteList.items.length === 0) {
      setError(t.quote.emptyList);
      setStep(2);
      return;
    }

    const quote = createQuote({
      userId: user?.id,
      status: "new",
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      taxNumber: form.taxNumber,
      city: form.city,
      paymentPreference: form.paymentPreference,
      termDays: form.paymentPreference === "vadeli" ? form.termDays : undefined,
      items: quoteList.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
      })),
      message: form.message,
    });

    // Teklif panelde Teklifler'e duser; info@zenweld.com'a da haber verilir.
    void notifyZenweld("teklif", {
      code: quote.code,
      companyName: quote.companyName,
      contactName: quote.contactName,
      email: quote.email,
      phone: quote.phone,
      taxNumber: quote.taxNumber,
      city: quote.city,
      items: quote.items.map(
        (i) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} · ${i.sku}`,
      ),
      payment:
        quote.paymentPreference === "vadeli"
          ? `${t.quote.vadeli} (${quote.termDays} gün)`
          : t.quote[quote.paymentPreference],
      message: quote.message,
    }, bot.website);

    quoteList.clear();
    setCode(quote.code);
  };

  return (
    <div className="zw-container py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">{t.quote.title}</h1>
        <p className="mt-3 text-zw-grey-600">{t.quote.subtitle}</p>

        {/* Adim gostergesi */}
        <ol className="mt-8 flex flex-wrap gap-2">
          {stepTitles.map((title, i) => (
            <li key={title} className="flex-1">
              <button
                onClick={() => goTo(i + 1)}
                className={`w-full border-t-4 pt-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
                  step === i + 1
                    ? "border-zw-red-600 text-zw-ink"
                    : step > i + 1
                      ? "border-zw-grey-800 text-zw-grey-600"
                      : "border-zw-grey-200 text-zw-grey-400"
                }`}
              >
                {i + 1}. {title}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}

          {step === 1 && (
            <>
              {/* Bireysel uyede firma unvani istege bagli. */}
              <FormRow label={t.quote.companyName} required={user?.role !== "individual"}>
                <Input
                  required={user?.role !== "individual"}
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                />
              </FormRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.quote.contactName} required>
                  <Input
                    required
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                  />
                </FormRow>
                <FormRow label={t.quote.taxNumber}>
                  <Input
                    value={form.taxNumber}
                    onChange={(e) => set("taxNumber", e.target.value)}
                  />
                </FormRow>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.quote.email} required>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </FormRow>
                <FormRow label={t.quote.phone} required>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </FormRow>
              </div>
              <FormRow label={t.quote.city}>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </FormRow>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-xl font-bold uppercase">{t.quote.yourList}</h2>

              {quoteList.items.length === 0 ? (
                <Alert tone="info">{t.quote.emptyList}</Alert>
              ) : (
                <div className="overflow-hidden rounded-[4px] border border-zw-grey-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-zw-grey-100">
                      {quoteList.items.map((item) => (
                        <tr key={item.key}>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{item.productName}</div>
                            <div className="text-xs text-zw-grey-500">
                              {item.variantLabel && `${item.variantLabel} · `}
                              {item.sku}
                            </div>
                          </td>
                          <td className="w-28 px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                quoteList.setQuantity(item.key, Number(e.target.value))
                              }
                              className="w-20 rounded-[3px] border border-zw-grey-300 px-2 py-1"
                            />
                          </td>
                          <td className="w-12 px-4 py-3">
                            <button
                              onClick={() => quoteList.remove(item.key)}
                              aria-label={t.quote.remove}
                              className="text-zw-grey-400 hover:text-zw-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={addChoice}
                  onChange={(e) => setAddChoice(e.target.value)}
                  className="flex-1"
                >
                  <option value="">{t.quote.addProduct}…</option>
                  {quotableChoices.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    const choice = quotableChoices.find((c) => c.value === addChoice);
                    if (choice) {
                      quoteList.add({ productId: choice.product.id, variantId: choice.variantId, productName: choice.product.name });
                      setAddChoice("");
                    }
                  }}
                >
                  {t.common.add}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <FormRow label={t.quote.paymentPreference} required>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["vadeli", t.quote.vadeli],
                      ["cek", t.quote.cek],
                      ["havale", t.quote.havale],
                      ["belirsiz", t.quote.belirsiz],
                    ] as [PaymentPreference, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("paymentPreference", value)}
                      className={`rounded-[4px] border-2 px-4 py-3 text-left font-semibold transition-colors ${
                        form.paymentPreference === value
                          ? "border-zw-red-600 bg-zw-red-50"
                          : "border-zw-grey-200 hover:border-zw-grey-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </FormRow>

              {form.paymentPreference === "vadeli" && (
                <FormRow label={t.quote.termDays}>
                  <Select
                    value={String(form.termDays)}
                    onChange={(e) => set("termDays", Number(e.target.value))}
                  >
                    {[30, 45, 60, 90, 120].map((d) => (
                      <option key={d} value={d}>
                        {d} gün
                      </option>
                    ))}
                  </Select>
                </FormRow>
              )}

              <FormRow label={t.quote.message}>
                <Textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Lorem ipsum dolor sit amet…"
                />
              </FormRow>
            </>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-[4px] border border-zw-grey-200 p-5">
                <h2 className="font-display text-xl font-bold uppercase">{t.quote.step1}</h2>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zw-grey-500">{t.quote.companyName}</dt>
                    <dd className="font-semibold">{form.companyName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zw-grey-500">{t.quote.contactName}</dt>
                    <dd className="font-semibold">{form.contactName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zw-grey-500">{t.quote.email}</dt>
                    <dd className="font-semibold">{form.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zw-grey-500">{t.quote.phone}</dt>
                    <dd className="font-semibold">{form.phone || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[4px] border border-zw-grey-200 p-5">
                <h2 className="font-display text-xl font-bold uppercase">{t.quote.products}</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {quoteList.items.map((i) => (
                    <li key={i.key}>
                      {i.quantity} × {i.productName}
                      {i.variantLabel && <span className="text-zw-grey-500"> — {i.variantLabel}</span>}
                    </li>
                  ))}
                  {quoteList.items.length === 0 && (
                    <li className="text-zw-grey-500">{t.quote.emptyList}</li>
                  )}
                </ul>
              </div>

              <div className="rounded-[4px] border border-zw-grey-200 p-5">
                <h2 className="font-display text-xl font-bold uppercase">
                  {t.quote.paymentPreference}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="dark">
                    {form.paymentPreference === "vadeli"
                      ? t.quote.vadeli
                      : form.paymentPreference === "cek"
                        ? t.quote.cek
                        : form.paymentPreference === "havale"
                          ? t.quote.havale
                          : t.quote.belirsiz}
                  </Badge>
                  {form.paymentPreference === "vadeli" && (
                    <Badge tone="grey">{form.termDays} gün</Badge>
                  )}
                </div>
                {form.message && (
                  <p className="mt-3 text-sm text-zw-grey-600">{form.message}</p>
                )}
              </div>

              <KvkkNotice className="mt-4" />
            </div>
          )}
        </div>

        {bot.field}
        <div className="mt-8 flex justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            {t.common.previous}
          </Button>

          {step < STEPS ? (
            <Button onClick={() => goTo(Math.min(STEPS, step + 1))}>{t.common.next}</Button>
          ) : (
            <Button size="lg" onClick={submit}>
              {t.quote.submit}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
