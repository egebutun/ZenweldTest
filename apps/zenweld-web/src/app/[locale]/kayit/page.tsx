"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Store, User as UserIcon } from "lucide-react";
import { useAuth, type RegisterInput } from "@zenweld/auth";
import { Alert, Button, Checkbox, FormRow, Input } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useHref, useT } from "@/lib/i18n-client";

type AccountType = "individual" | "business" | "dealer";

export default function RegisterPage() {
  const t = useT();
  const href = useHref();
  const router = useRouter();
  const { register } = useAuth();

  const [type, setType] = useState<AccountType>("individual");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
    passwordAgain: "",
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    sector: "",
    dealerCode: "",
    newsletter: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const types: { id: AccountType; label: string; desc: string; Icon: typeof UserIcon }[] = [
    {
      id: "individual",
      label: t.auth.accountTypeIndividual,
      desc: t.auth.accountTypeIndividualDesc,
      Icon: UserIcon,
    },
    {
      id: "business",
      label: t.auth.accountTypeBusiness,
      desc: t.auth.accountTypeBusinessDesc,
      Icon: Building2,
    },
    {
      id: "dealer",
      label: t.auth.accountTypeDealer,
      desc: t.auth.accountTypeDealerDesc,
      Icon: Store,
    },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordAgain) {
      setError(t.auth.passwordMismatch);
      return;
    }

    const input: RegisterInput = {
      role: type,
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      city: form.city,
      newsletter: form.newsletter,
      ...(type !== "individual"
        ? {
            companyName: form.companyName,
            taxOffice: form.taxOffice,
            taxNumber: form.taxNumber,
            sector: form.sector,
          }
        : {}),
      ...(type === "dealer" ? { dealerCode: form.dealerCode } : {}),
    };

    const result = register(input);
    if (!result.ok) {
      setError(result.error ?? "Kayıt oluşturulamadı.");
      return;
    }

    if (type === "dealer") {
      setNotice(t.auth.dealerPending);
      setTimeout(() => router.push(href("/hesabim")), 2500);
    } else {
      router.push(href("/hesabim"));
    }
  };

  return (
    <div className="zw-container py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-bold uppercase">{t.auth.registerTitle}</h1>
        <p className="mt-2 text-sm text-zw-grey-600">{t.auth.registerSubtitle}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {types.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`rounded-[4px] border-2 p-4 text-left transition-colors ${
                type === id
                  ? "border-zw-red-600 bg-zw-red-50"
                  : "border-zw-grey-200 hover:border-zw-grey-400"
              }`}
            >
              <Icon size={22} className={type === id ? "text-zw-red-600" : "text-zw-grey-500"} />
              <div className="mt-2 font-display text-lg font-semibold uppercase">{label}</div>
              <p className="mt-1 text-xs leading-snug text-zw-grey-500">{desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.auth.firstName} required>
              <Input
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </FormRow>
            <FormRow label={t.auth.lastName} required>
              <Input
                required
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </FormRow>
          </div>

          {type !== "individual" && (
            <>
              <FormRow label={t.auth.companyName} required>
                <Input
                  required
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                />
              </FormRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.auth.taxOffice}>
                  <Input
                    value={form.taxOffice}
                    onChange={(e) => set("taxOffice", e.target.value)}
                  />
                </FormRow>
                <FormRow label={t.auth.taxNumber}>
                  <Input
                    value={form.taxNumber}
                    onChange={(e) => set("taxNumber", e.target.value)}
                  />
                </FormRow>
              </div>
            </>
          )}

          {type === "business" && (
            <FormRow label={t.auth.sector}>
              <Input value={form.sector} onChange={(e) => set("sector", e.target.value)} />
            </FormRow>
          )}

          {type === "dealer" && (
            <FormRow
              label={t.auth.dealerCode}
              hint="Bayi kodunuz yoksa boş bırakabilirsiniz; ekibimiz başvurunuzu değerlendirecektir."
            >
              <Input
                value={form.dealerCode}
                onChange={(e) => set("dealerCode", e.target.value)}
              />
            </FormRow>
          )}

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
              <Input
                required
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </FormRow>
          </div>

          <FormRow label={t.auth.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.auth.password} required hint="En az 6 karakter">
              <Input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </FormRow>
            <FormRow label={t.auth.passwordAgain} required>
              <Input
                type="password"
                required
                value={form.passwordAgain}
                onChange={(e) => set("passwordAgain", e.target.value)}
              />
            </FormRow>
          </div>

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
