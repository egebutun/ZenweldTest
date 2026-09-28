"use client";

import { campaignStatus, isFlashDeal, type Product } from "@zenweld/data";
import { Badge } from "@zenweld/ui";
import { formatDateTime } from "@/lib/format";

/**
 * Yonetim panelinde bir urunun kampanya durumunu tek satirda gosterir:
 * gecerli / planlandi / bitti. Urun listesi ve urun formu ortak kullanir.
 */
export function CampaignBadge({ product, now }: { product: Product; now: Date }) {
  const status = campaignStatus(product, now);
  const d = product.discount;
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
      {isFlashDeal(product, now) ? "Flaş " : ""}Kampanya %{d.percent}
      {d.endsAt ? ` · ${formatDateTime(d.endsAt, "tr")}'e kadar` : " · süresiz"}
    </Badge>
  );
}
