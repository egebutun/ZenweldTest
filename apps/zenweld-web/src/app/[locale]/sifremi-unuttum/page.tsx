"use client";

import { useState } from "react";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";

export default function ForgotPasswordPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  return (
    <div className="zw-container py-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold uppercase">{t.auth.forgotPassword}</h1>

        {sent ? (
          <Alert tone="success">
            Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. (DEMO — gerçek e-posta
            gönderilmez.)
          </Alert>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-6 space-y-4"
          >
            <FormRow label={t.auth.email} required>
              <Input type="email" required />
            </FormRow>
            <Button type="submit" fullWidth size="lg">
              Sıfırlama Bağlantısı Gönder
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <LocaleLink href="/giris" className="font-semibold text-zw-red-600 hover:underline">
            ← {t.nav.login}
          </LocaleLink>
        </p>
      </div>
    </div>
  );
}
