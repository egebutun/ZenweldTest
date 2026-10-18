"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { listProducts, registerWarranty, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";
import { KvkkNotice } from "@/components/legal/LegalLink";

/**
 * GARANTI KAYDI
 *
 * Garanti sayfasinin iki secenekinden biri (/garanti/kayit). Kayit
 * tamamlaninca ziyaretci sorgulama adimina gecebilir.
 */
export function WarrantyRegister({ onCheck }: { onCheck: () => void }) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    ownerName: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    postalCode: "",
    address: "",
    categorySlug: "",
    productId: "",
    serialNumber: "",
    sellerTaxNumber: "",
    extended: false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Garanti kaydi makineler icindir: Ekipmanlar altindaki kategoriler, gruplariyla.
  const groups = db.categoryGroups
    .filter((g) => g.section === "ekipmanlar")
    .sort((a, b) => a.order - b.order)
    .map((g) => ({
      group: g,
      categories: db.categories.filter((c) => c.group === g.slug).sort((a, b) => a.order - b.order),
    }));
  const models = listProducts(db)
    .filter((p) => p.categorySlug === form.categorySlug)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  if (done) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check size={32} />
        </div>
        <h2 className="mt-6 font-display text-3xl font-bold uppercase">{t.warranty.success}</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={onCheck}>
            {t.explore.checkWarranty}
          </Button>
          {user && (
            <LocaleLink href="/hesabim/garantilerim">
              <Button>{t.account.warranties}</Button>
            </LocaleLink>
          )}
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(form.postalCode)) return setError(t.warranty.invalidPostalCode);
    if (!/^\d{10,11}$/.test(form.sellerTaxNumber)) return setError(t.warranty.invalidSellerTaxNumber);
    setError(null);
    registerWarranty(form);
    setDone(true);
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <FormRow label={t.warranty.ownerName} required>
        <Input required value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
      </FormRow>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.auth.email} required>
          <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </FormRow>
        <FormRow label={t.auth.phone} required>
          <Input type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </FormRow>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.warranty.city} required>
          <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
        </FormRow>
        <FormRow label={t.warranty.postalCode} required>
          <Input
            required
            inputMode="numeric"
            maxLength={5}
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))}
          />
        </FormRow>
      </div>

      <FormRow label={t.warranty.address} required>
        <Textarea
          required
          className="min-h-20"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </FormRow>

      <FormRow label={t.warranty.category} required>
        <Select
          required
          value={form.categorySlug}
          onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value, productId: "" }))}
        >
          <option value="">{t.warranty.categoryPlaceholder}</option>
          {groups.map(({ group, categories }) => (
            <optgroup key={group.slug} label={group.name[locale]}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name[locale]}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </FormRow>

      <FormRow label={t.warranty.model} required>
        <Select
          required
          disabled={!form.categorySlug}
          value={form.productId}
          onChange={(e) => set("productId", e.target.value)}
        >
          <option value="">{form.categorySlug ? t.warranty.modelPlaceholder : t.warranty.modelFirst}</option>
          {models.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FormRow>

      <FormRow label={t.warranty.serialNumber} required hint="Makinenin arka etiketinde yazar">
        <Input required value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
      </FormRow>

      <FormRow label={t.warranty.sellerTaxNumber} required hint={t.warranty.sellerTaxNumberHint}>
        <Input
          required
          inputMode="numeric"
          maxLength={11}
          value={form.sellerTaxNumber}
          onChange={(e) => set("sellerTaxNumber", e.target.value.replace(/\D/g, ""))}
        />
      </FormRow>

      <Checkbox
        label={t.warranty.extendOption}
        checked={form.extended}
        onChange={(e) => set("extended", e.target.checked)}
      />

      <KvkkNotice />

      {error && <Alert tone="danger">{error}</Alert>}

      <Button type="submit" size="lg" fullWidth>
        {t.warranty.submit}
      </Button>
    </form>
  );
}
