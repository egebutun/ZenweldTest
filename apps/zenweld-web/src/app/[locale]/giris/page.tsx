"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { DEMO_PASSWORDS } from "@zenweld/data";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useHref, useT } from "@/lib/i18n-client";

const DEMO_ACCOUNTS = [
  { label: "Yönetici (Admin)", email: "admin@zenweld.com", password: DEMO_PASSWORDS.admin },
  { label: "Bireysel", email: "bireysel@demo.com", password: DEMO_PASSWORDS.bireysel },
  { label: "Kurumsal", email: "kurumsal@demo.com", password: DEMO_PASSWORDS.kurumsal },
  { label: "Bayi (ZENWELD-BAYİ-A)", email: "bayi@zenweld-bayi-a.com", password: DEMO_PASSWORDS.bayi },
];

function LoginInner() {
  const t = useT();
  const href = useHref();
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Giriş yapılamadı.");
      return;
    }
    const next = params.get("next");
    if (next) router.push(href(next));
    else if (result.user?.role === "admin") router.push(href("/admin"));
    else router.push(href("/hesabim"));
  };

  return (
    <div className="zw-container py-14">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_360px]">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <h1 className="font-display text-4xl font-bold uppercase">{t.auth.loginTitle}</h1>
          <p className="mt-2 text-sm text-zw-grey-600">{t.auth.loginSubtitle}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}

            <FormRow label={t.auth.email} required htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormRow>

            <FormRow label={t.auth.password} required htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormRow>

            <div className="flex items-center justify-between">
              <LocaleLink
                href="/sifremi-unuttum"
                className="text-sm text-zw-grey-600 hover:text-zw-red-600"
              >
                {t.auth.forgotPassword}
              </LocaleLink>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={busy}>
              {t.auth.submitLogin}
            </Button>

            <p className="text-center text-sm text-zw-grey-600">
              {t.auth.noAccount}{" "}
              <LocaleLink href="/kayit" className="font-semibold text-zw-red-600 hover:underline">
                {t.nav.register}
              </LocaleLink>
            </p>
          </form>
        </div>

        <aside className="rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-5">
          <h2 className="font-display text-lg font-bold uppercase">{t.auth.demoAccounts}</h2>
          <p className="mt-1 text-xs text-zw-grey-500">{t.auth.demoHint}</p>
          <div className="mt-4 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="w-full rounded-[4px] border border-zw-grey-300 bg-white px-3 py-2.5 text-left transition-colors hover:border-zw-ink"
              >
                <div className="text-sm font-semibold">{acc.label}</div>
                <div className="truncate text-xs text-zw-grey-500">{acc.email}</div>
                <div className="text-xs text-zw-grey-400">şifre: {acc.password}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="zw-container py-20">…</div>}>
      <LoginInner />
    </Suspense>
  );
}
