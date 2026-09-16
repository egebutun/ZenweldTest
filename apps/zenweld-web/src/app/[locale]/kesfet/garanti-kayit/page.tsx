"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { registerWarranty, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, Select } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";

export default function RegisterWarrantyPage() {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    serialNumber: "",
    productId: "",
    ownerName: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    purchaseDate: "",
    dealerName: "",
    extended: true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (done) {
    return (
      <div className="zw-container py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check size={32} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold uppercase">{t.warranty.success}</h1>
        <div className="mt-6 flex justify-center gap-3">
          <LocaleLink href="/kesfet/garanti-sorgula">
            <Button variant="outline">{t.explore.checkWarranty}</Button>
          </LocaleLink>
          {user && (
            <LocaleLink href="/hesabim/garantilerim">
              <Button>{t.account.warranties}</Button>
            </LocaleLink>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero title={t.warranty.registerTitle} subtitle={t.warranty.registerSubtitle} />

      <div className="zw-container py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerWarranty(form);
            setDone(true);
          }}
          className="max-w-xl space-y-4"
        >
          <Alert tone="info">
            Kayıt yalnızca bu tarayıcıda saklanır (DEMO). Gerçek sistemde Zenweld sunucusuna
            iletilir.
          </Alert>

          <FormRow label={t.warranty.product} required>
            <Select
              required
              value={form.productId}
              onChange={(e) => set("productId", e.target.value)}
            >
              <option value="">Seçiniz…</option>
              {db.products
                .filter((p) => p.active && p.section === "ekipmanlar")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </FormRow>

          <FormRow label={t.warranty.serialNumber} required hint="Makinenin arka etiketinde yazar">
            <Input
              required
              value={form.serialNumber}
              onChange={(e) => set("serialNumber", e.target.value)}
            />
          </FormRow>

          <FormRow label={t.warranty.ownerName} required>
            <Input
              required
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
            />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.auth.email} required>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </FormRow>
            <FormRow label={t.auth.phone} required>
              <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.warranty.purchaseDate} required>
              <Input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) => set("purchaseDate", e.target.value)}
              />
            </FormRow>
            <FormRow label={t.warranty.dealerName} required>
              <Input
                required
                value={form.dealerName}
                onChange={(e) => set("dealerName", e.target.value)}
                list="dealers"
              />
              <datalist id="dealers">
                {db.dealers.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </FormRow>
          </div>

          <Checkbox
            label={t.warranty.extendOption}
            checked={form.extended}
            onChange={(e) => set("extended", e.target.checked)}
          />

          <Button type="submit" size="lg" fullWidth>
            {t.warranty.submit}
          </Button>
        </form>
      </div>
    </>
  );
}
