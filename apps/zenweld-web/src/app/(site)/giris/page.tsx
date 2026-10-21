"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";


function LoginInner() {
  const t = useT();
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
    // Yalnizca site ici adreslere yonlendir: "/giris?next=https://sahte-site"
    // ile gelen ziyaretci giristen sonra baska siteye gitmesin.
    const next = params.get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
    router.push(safe ? next : "/hesabim");
  };

  return (
    <div className="zw-container py-14">
      <div className="mx-auto max-w-md">
        <div>
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
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-zw-grey-600 hover:text-zw-red-600"
              >
                {t.auth.forgotPassword}
              </Link>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={busy}>
              {t.auth.submitLogin}
            </Button>

            <p className="text-center text-sm text-zw-grey-600">
              {t.auth.noAccount}{" "}
              <Link href="/kayit" className="font-semibold text-zw-red-600 hover:underline">
                {t.nav.register}
              </Link>
            </p>
          </form>
        </div>

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
