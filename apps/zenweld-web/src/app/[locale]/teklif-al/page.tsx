"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { createQuote, useDatabase } from "@zenweld/store";
import type { PaymentPreference } from "@zenweld/data";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";
import { useQuoteList } from "@/lib/quote-list";

const STEPS = 4;

export default function QuotePage() {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const quoteList = useQuoteList();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addProductId, setAddProductId] = useState("");
  const [kvkk, setKvkk] = useState(false);

  const [form, setForm] = useState({
    companyName: user?.companyName ?? "",
    contactName: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    taxNumber: user?.taxNumber ?? "",
    city: user?.city ?? "",
    paymentPreference: "vadeli" as PaymentPreference,
    termDays: 60,
    message: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const quotableProducts = useMemo(
    () => db.products.filter((p) => p.active && p.quotable),
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
            <LocaleLink href="/">
              <Button variant="outline">{t.common.back}</Button>
            </LocaleLink>
            {user && (
              <LocaleLink href="/hesabim/tekliflerim">
                <Button>{t.nav.myQuotes}</Button>
              </LocaleLink>
            )}
          </div>
        </div>
      </div>
    );
  }

  const submit = () => {
    setError(null);
    if (quoteList.items.length === 0) {
      setError(t.quote.emptyList);
      setStep(2);
      return;
    }
    if (!kvkk) {
      setError("Devam etmek için KVKK aydınlatma metnini onaylamalısınız.");
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
        quantity: i.quantity,
      })),
      message: form.message,
    });

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
                onClick={() => setStep(i + 1)}
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
              <FormRow label={t.quote.companyName} required>
                <Input
                  required
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
                        <tr key={item.productId}>
                          <td className="px-4 py-3 font-semibold">{item.productName}</td>
                          <td className="w-28 px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                quoteList.setQuantity(item.productId, Number(e.target.value))
                              }
                              className="w-20 rounded-[3px] border border-zw-grey-300 px-2 py-1"
                            />
                          </td>
                          <td className="w-12 px-4 py-3">
                            <button
                              onClick={() => quoteList.remove(item.productId)}
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
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">{t.quote.addProduct}…</option>
                  {quotableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    const product = quotableProducts.find((p) => p.id === addProductId);
                    if (product) {
                      quoteList.add({ productId: product.id, productName: product.name });
                      setAddProductId("");
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
                    <li key={i.productId}>
                      {i.quantity} × {i.productName}
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

              <Checkbox
                label={
                  <>
                    KVKK aydınlatma metnini okudum ve kişisel verilerimin işlenmesini kabul
                    ediyorum.
                  </>
                }
                checked={kvkk}
                onChange={(e) => setKvkk(e.target.checked)}
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            {t.common.previous}
          </Button>

          {step < STEPS ? (
            <Button onClick={() => setStep((s) => Math.min(STEPS, s + 1))}>{t.common.next}</Button>
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
