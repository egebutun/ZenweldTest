"use client";

import { tr } from "@zenweld/i18n";
import "./globals.css";

/**
 * GENEL HATA SAYFASI
 *
 * Sitenin ya da panelin dis cercevesi (ust menu, alt bilgi, panel menusu)
 * hata verirse ya da hata (site)/error.tsx ve yonetim/(panel)/error.tsx
 * disinda kalirsa bu cikar. Cerceve calismadigi icin html/body burada
 * kurulur; ana sayfa baglantisi sayfayi bastan yukler.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = tr.errorPage;
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white antialiased">
        <title>{`${t.title} | Zenweld`}</title>
        <div className="zw-container py-28 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">{t.title}</h1>
          <p className="mt-2 text-zw-grey-600">{t.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-[4px] bg-zw-ink px-6 py-3 text-sm font-semibold uppercase text-white hover:bg-zw-red-600"
            >
              {t.retry}
            </button>
            {/* Bilerek duz baglanti: sayfa bastan yuklenir, bozuk durum temizlenir. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-[4px] border border-zw-ink px-6 py-3 text-sm font-semibold uppercase hover:border-zw-red-600 hover:text-zw-red-600"
            >
              {t.home}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
