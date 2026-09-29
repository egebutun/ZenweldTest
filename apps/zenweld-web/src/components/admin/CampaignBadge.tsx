"use client";

import { discountStatusOf, FLASH_DISCOUNT_THRESHOLD, type ProductDiscount } from "@zenweld/data";
import { Badge } from "@zenweld/ui";
import { formatDateTime } from "@/lib/format";

/**
 * Bir kampanyanin durumunu tek satirda gosterir: gecerli / planlandi /
 * bitti. Yonetim panelindeki urun listesi ve urun formu (Zenweld
 * kampanyasi) ile bayinin Stok Bildirimi sayfasi (bayi kampanyasi) ortak
 * kullanir.
 */
export function CampaignBadge({ discount: d, now }: { discount?: ProductDiscount; now: Date }) {
  const status = discountStatusOf(d, now);
  if (status === "none" || !d) return null;

  if (status === "scheduled") {
    return (
      <Badge tone="amber">
        Planlandı %{d.percent} · {formatDateTime(d.startsAt!, "tr")} başlar
      </Badge>
    );
  }
  if (status === "ended") {
    return <Badge tone="grey">Kampanya bitti (%{d.percent})</Badge>;
  }
  return (
    <Badge tone="red">
      {d.percent >= FLASH_DISCOUNT_THRESHOLD ? "Flaş " : ""}Kampanya %{d.percent}
      {d.endsAt ? ` · ${formatDateTime(d.endsAt, "tr")}'e kadar` : " · süresiz"}
    </Badge>
  );
}
