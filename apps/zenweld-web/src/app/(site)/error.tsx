"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n-client";

/**
 * SITE HATA SAYFASI
 *
 * Bir sayfa cizilirken hata olursa bos ekran yerine bu cikar; ust menu ve
 * alt bilgi yerinde kalir. Ust menu ya da alt bilginin kendisi hata verirse
 * app/global-error.tsx devreye girer.
 */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="zw-container py-28 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">{t.errorPage.title}</h1>
      <p className="mt-2 text-zw-grey-600">{t.errorPage.text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[4px] bg-zw-ink px-6 py-3 text-sm font-semibold uppercase text-white hover:bg-zw-red-600"
        >
          {t.errorPage.retry}
        </button>
        <Link
          href="/"
          className="rounded-[4px] border border-zw-ink px-6 py-3 text-sm font-semibold uppercase hover:border-zw-red-600 hover:text-zw-red-600"
        >
          {t.errorPage.home}
        </Link>
      </div>
    </div>
  );
}
