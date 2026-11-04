"use client";

import { useState } from "react";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";

/**
 * SIFREMI UNUTTUM (KARARLAR K-95)
 *
 * Hesap olsa da olmasa da ayni mesaj gosterilir. Veritabani modunda hesap
 * varsa 1 saat gecerli, tek kullanimlik bir baglanti e-postayla gider (ayni
 * hesap icin 15 dakikada bir). Demo modunda e-posta gitmez.
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="zw-container py-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold uppercase">{t.auth.forgotPassword}</h1>

        {sent ? (
          <Alert tone="success">{t.auth.reset.requestSent}</Alert>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const result = await requestPasswordReset(email);
              setBusy(false);
              if (result.ok) setSent(true);
              else setError(result.error ?? null);
            }}
            className="mt-6 space-y-4"
          >
            {error && <Alert tone="danger">{error}</Alert>}
            <FormRow label={t.auth.email} required htmlFor="email">
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormRow>
            <Button type="submit" fullWidth size="lg" disabled={busy}>
              {t.auth.reset.requestSubmit}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/giris" className="font-semibold text-zw-red-600 hover:underline">
            ← {t.nav.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
