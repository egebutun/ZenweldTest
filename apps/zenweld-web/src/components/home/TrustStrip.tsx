"use client";

import { useMemo } from "react";
import { getCompany, getShopSettings, listDealers, useDatabase } from "@zenweld/store";
import { formatPrice } from "@zenweld/utils";
import { useT } from "@/lib/i18n-client";

/**
 * GUVEN SERIDI (tanitim alaninin hemen alti)
 *
 * Sayilar sitedeki veriden gelir: yetkili bayi ve servis sayisi ve
 * sehirleri (Bayiler), en cok taksit (Magaza Ayarlari › banka POS'lari),
 * ucretsiz kargo siniri, ofis sayisi (Sirket ve Iletisim). Garanti uzatma
 * (+12 ay) ve 14 gun iade sitenin kuralidir. Serit yavasca kayar; fare
 * uzerindeyken durur; hareket azaltma tercihinde kaymaz.
 */
export function TrustStrip() {
  const t = useT();
  const s = t.home.trust;
  const db = useDatabase();

  const items = useMemo(() => {
    const dealers = listDealers(db);
    const cities = new Set(dealers.map((d) => d.city.trim().toLocaleLowerCase("tr")).filter(Boolean));
    const shop = getShopSettings(db);
    const maxInstallments = Math.max(
      0,
      ...shop.pos.filter((p) => p.active).flatMap((p) => p.installments.filter((i) => i.enabled).map((i) => i.count)),
    );
    const offices = getCompany(db).offices.length;

    const list: { value: string; label: string }[] = [];
    if (dealers.length) list.push({ value: `${dealers.length}+`, label: s.dealers });
    if (cities.size) list.push({ value: String(cities.size), label: s.cities });
    list.push({ value: s.warrantyValue, label: s.warranty });
    if (maxInstallments > 1) list.push({ value: s.installmentsValue.replace("{count}", String(maxInstallments)), label: s.installments });
    if (shop.freeShippingThreshold > 0) list.push({ value: formatPrice(shop.freeShippingThreshold), label: s.freeShipping });
    list.push({ value: s.returnsValue, label: s.returns });
    list.push({ value: s.corporateValue, label: s.corporate });
    if (offices) {
      list.push({
        value: s.officesValue.replace("{count}", String(offices)),
        label: getCompany(db).offices.map((o) => o.city).join(" · "),
      });
    }
    return list;
  }, [db, s]);

  // Kesintisiz kayma icin liste iki kez yazilir; ikinci kopya ekran okuyucuya okunmaz.
  const row = (copy: number) => (
    <ul aria-hidden={copy === 1} className="flex shrink-0 items-center">
      {items.map((item) => (
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
