"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { DEMO_PASSWORDS } from "@zenweld/data";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { useHref, useT } from "@/lib/i18n-client";

export default function ShopLoginPage() {
  const t = useT();
  const href = useHref();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="zw-container py-14">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold uppercase">{t.auth.loginTitle}</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const result = login(email, password);
            if (!result.ok) setError(result.error ?? "Giriş yapılamadı.");
            else router.push(href("/hesabim"));
          }}
          className="mt-6 space-y-4"
        >
          {error && <Alert tone="danger">{error}</Alert>}
          <FormRow label={t.auth.email} required>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.password} required>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormRow>
          <Button type="submit" size="lg" fullWidth>
            {t.auth.submitLogin}
          </Button>
          <p className="text-center text-sm text-zw-grey-600">
            {t.auth.noAccount}{" "}
            <LocaleLink href="/kayit" className="font-semibold text-zw-red-600 hover:underline">
              {t.nav.register}
            </LocaleLink>
          </p>
        </form>

        <div className="mt-8 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 p-4">
          <h2 className="text-sm font-bold uppercase">{t.auth.demoAccounts}</h2>
          <button
            onClick={() => {
              setEmail("bireysel@demo.com");
              setPassword(DEMO_PASSWORDS.bireysel);
            }}
            className="mt-3 w-full rounded-[4px] border border-zw-grey-300 bg-white px-3 py-2 text-left text-sm hover:border-zw-ink"
          >
            bireysel@demo.com / {DEMO_PASSWORDS.bireysel}
          </button>
        </div>
      </div>
    </div>
  );
}
