"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PASSWORD_MIN_LENGTH, useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";

/**
 * YENI SIFRE (sifre sifirlama baglantisi; KARARLAR K-95)
 *
 * E-postadaki baglanti /sifre-sifirla?anahtar=... adresini acar. Anahtar 1
 * saat gecerli ve tek kullanimliktir. Sifre degisince uyenin butun
 * oturumlari kapanir; giris sayfasina gidilir.
 */
function ResetForm() {
  const t = useT();
  const router = useRouter();
  const token = useSearchParams().get("anahtar") ?? "";
  const { resetPassword } = useAuth();
  const [form, setForm] = useState({ password: "", again: "" });
  const [error, setError] = useState<string | null>(token ? null : t.auth.errors.resetLinkInvalid);
  const [busy, setBusy] = useState(false);
  const invalidLink = error === t.auth.errors.resetLinkInvalid;

  return (
    <div className="zw-container py-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold uppercase">{t.auth.reset.title}</h1>
        <p className="mt-2 text-sm text-zw-grey-600">{t.auth.reset.subtitle}</p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (form.password !== form.again) {
              setError(t.auth.passwordMismatch);
              return;
            }
            setBusy(true);
            const result = await resetPassword(token, form.password);
            setBusy(false);
            if (!result.ok) {
              setError(result.error ?? t.auth.errors.failed);
              return;
            }
            router.replace("/giris?sifre=degisti");
          }}
          className="mt-6 space-y-4"
        >
          {error && (
            <Alert tone="danger">
              {error}
              {invalidLink && (
                <>
                  {" "}
                  <Link href="/sifremi-unuttum" className="font-semibold underline">
                    {t.auth.reset.newRequest}
                  </Link>
                </>
              )}
            </Alert>
          )}
          <FormRow label={t.account.newPassword} required hint={t.auth.passwordHint} htmlFor="reset-password">
            <Input
              id="reset-password"
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormRow>
          <FormRow label={t.account.newPasswordAgain} required htmlFor="reset-password-again">
            <Input
              id="reset-password-again"
              type="password"
              required
              autoComplete="new-password"
              value={form.again}
              onChange={(e) => setForm({ ...form, again: e.target.value })}
            />
          </FormRow>
          <Button type="submit" fullWidth size="lg" disabled={busy || !token}>
            {t.auth.reset.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
