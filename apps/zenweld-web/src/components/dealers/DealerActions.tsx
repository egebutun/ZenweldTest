"use client";

import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import type { Dealer } from "@zenweld/data";
import { useT } from "@/lib/i18n-client";

/**
 * Bir noktanin iletisim eylemleri: Ara / WhatsApp / Yol Tarifi.
 *
 * Bayi ve servis aginda listedeki kartta ve secili nokta kartinda, Force
 * sayfasinda bayi haritasinin yanindaki kartta kullanilir; ayni kodun
 * kopyalari durmasin. dark: koyu zeminde (Force sayfasi).
 */
export function DealerActions({ dealer, dark = false }: { dealer: Dealer; dark?: boolean }) {
  const t = useT();
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const cls = `inline-flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1.5 text-xs font-semibold ${
    dark ? "border-white/25 text-white hover:border-white" : "border-zw-grey-300 hover:border-zw-ink"
  }`;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a href={`tel:${dealer.phone.replace(/\s/g, "")}`} onClick={stop} className={cls}>
        <Phone size={13} /> {t.dealers.call}
      </a>
      {dealer.whatsapp && (
        <a
          href={`https://wa.me/${dealer.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          className={cls}
        >
          <MessageCircle size={13} /> {t.dealers.whatsapp}
        </a>
      )}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.lat},${dealer.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        className={cls}
      >
        <ExternalLink size={13} /> {t.dealers.directions}
      </a>
    </div>
  );
}
