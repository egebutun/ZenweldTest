"use client";

import { useT } from "@/lib/i18n-client";

/**
 * GUVEN SERIDI (tanitim alaninin hemen alti)
 *
 * Yazilar sabittir (packages/i18n › home.trust.items); hicbir veriye ya da
 * panel ayarina bagli degildir (KARARLAR K-47). Serit yavasca kayar; fare
 * uzerindeyken durur; hareket azaltma tercihinde kaymaz.
 */
export function TrustStrip() {
  const t = useT();
  const s = t.home.trust;

  // Kesintisiz kayma icin liste iki kez yazilir; ikinci kopya ekran okuyucuya okunmaz.
  const row = (copy: number) => (
    <ul aria-hidden={copy === 1} className="flex shrink-0 items-center">
      {s.items.map((item) => (
        <li key={`${copy}-${item.label}`} className="flex items-center gap-3 whitespace-nowrap px-6 py-4 sm:px-8">
          <span className="font-display text-[26px] font-bold leading-none text-white">{item.value}</span>
          <span className="max-w-[170px] whitespace-normal text-xs leading-tight text-white/60">{item.label}</span>
          <span aria-hidden="true" className="ml-6 h-2 w-2 rotate-45 bg-zw-red-600 sm:ml-8" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={s.label} className="zw-trust overflow-hidden border-b border-white/5 bg-zw-grey-900">
      <div className="zw-trust-track flex w-max">
        {row(0)}
        {row(1)}
      </div>
    </section>
  );
}
