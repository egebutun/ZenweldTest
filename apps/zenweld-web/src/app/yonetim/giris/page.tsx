"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input, ZenweldLogo } from "@zenweld/ui";

/**
 * YONETICI GIRISI
 *
 * Ana sitenin musteri girisinden tamamen ayri. Yalnizca yonetici
 * hesaplari kabul edilir; ana sitede bu hesaplarla giris yapilamaz.
 *
 * !! DEMO !! Kimlik dogrulama tarayicida yapiliyor; gercek guvenlik
 * degildir. Canliya cikmadan once sunucu tarafi giris sarttir.
 */
function LoginForm() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  // Yalnizca panel ici adreslere yonlendir (acik yonlendirme olmasin).
  const target = next && next.startsWith("/yonetim") && !next.startsWith("//") ? next : "/yonetim";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Zaten girisliyse dogrudan panele.
  useEffect(() => {
    if (ready && user) router.replace(target);
  }, [ready, user, router, target]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? "Giriş yapılamadı.");
      return;
    }
    router.replace(target);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zw-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <ZenweldLogo variant="light" className="h-8 w-auto" />
          <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
            Yönetim
          </span>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-[6px] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-zw-red-600" />
            <h1 className="font-display text-2xl font-bold uppercase">Yönetici Girişi</h1>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <FormRow label="E-posta" htmlFor="admin-email" required>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormRow>
          <FormRow label="Şifre" htmlFor="admin-password" required>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormRow>

          <Button type="submit" size="lg" fullWidth>
            Giriş Yap
          </Button>

          <p className="rounded-[4px] bg-zw-grey-50 px-3 py-2 text-xs text-zw-grey-600">
            Demo hesabı: admin@zenweld.com / admin123
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-zw-grey-400">
          Bu sayfa yalnızca Zenweld çalışanları içindir.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  // useSearchParams statik uretimde Suspense siniri ister.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
