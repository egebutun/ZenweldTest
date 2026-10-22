"use client";

import Link from "next/link";

/**
 * PANEL HATA SAYFASI
 *
 * Bir panel ekrani cizilirken hata olursa bos ekran yerine bu cikar; sol
 * menu yerinde kalir, baska ekrana gecilebilir.
 */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Bir sorun oluştu</h1>
      <p className="text-zw-grey-600">Bu ekran açılırken beklenmeyen bir hata oluştu.</p>
      <div className="flex gap-4">
        <button type="button" onClick={reset} className="font-semibold text-zw-red-600 hover:underline">
          Tekrar dene
        </button>
        <Link href="/yonetim" className="font-semibold text-zw-red-600 hover:underline">
          Panele dön
        </Link>
      </div>
    </div>
  );
}
