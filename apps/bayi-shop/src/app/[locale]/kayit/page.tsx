"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, Checkbox, FormRow, Input } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { useHref, useT } from "@/lib/i18n-client";

export default function ShopRegisterPage() {
  const t = useT();
  const href = useHref();
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    newsletter: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="zw-container py-14">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold uppercase">{t.auth.registerTitle}</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const result = register({ role: "individual", ...form });
            if (!result.ok) setError(result.error ?? "Kayıt oluşturulamadı.");
            else router.push(href("/hesabim"));
          }}
          className="mt-6 space-y-4"
        >
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.auth.firstName} required>
              <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </FormRow>
            <FormRow label={t.auth.lastName} required>
              <Input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </FormRow>
          </div>
          <FormRow label={t.auth.email} required>
            <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.phone} required>
            <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.password} required hint="En az 6 karakter">
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </FormRow>
          <Checkbox
            label={t.auth.newsletter}
            checked={form.newsletter}
            onChange={(e) => set("newsletter", e.target.checked)}
          />
          <Button type="submit" size="lg" fullWidth>
            {t.auth.submitRegister}
          </Button>
          <p className="text-center text-sm text-zw-grey-600">
            {t.auth.hasAccount}{" "}
            <LocaleLink href="/giris" className="font-semibold text-zw-red-600 hover:underline">
              {t.nav.login}
            </LocaleLink>
          </p>
        </form>
      </div>
    </div>
  );
}
