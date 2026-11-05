import type { Carrier, OrderShipment } from "./types";

/**
 * KARGO TAKIP BAGLANTISI (KARARLAR K-105)
 *
 * Her kargo firmasinin takip sayfasinin adresi panelde (Magaza Ayarlari >
 * Kargo ve Odeme) girilir; adresteki {takip} yerine gonderinin takip
 * numarasi yazilir. Site (Hesabim > Siparislerim) ve panel (siparis
 * detayi) baglantiyi buradan alir.
 *
 * Kargo firmasinin API'si baglanirsa (etiket, durum ve teslim bilgisi;
 * YAPILACAKLAR > Online satis 9) o firmanin baglanti parcasi sunucuda yazilir
 * ve takip baglantisi da gerekirse buradan, tek yerden degisir.
 */

/** Takip adresinde takip numarasinin yerini gosteren isaret. */
export const TRACKING_PLACEHOLDER = "{takip}";

/** Takip adresi: https:// (ya da http://) ile baslar, {takip} icerir, bosluk icermez. */
export const isTrackingUrl = (url: string) =>
  /^https?:\/\/\S+$/i.test(url) && url.includes(TRACKING_PLACEHOLDER);

/** Takip adresi kuralina uymayan firma icin hata metni. */
export const trackingUrlError = (carrier: string) =>
  `${carrier}: takip adresi https:// ile başlamalı, ${TRACKING_PLACEHOLDER} içermeli ve boşluk içermemeli.`;

/**
 * Gonderinin takip baglantisi: gonderideki firma adiyla listedeki firma
 * bulunur (buyuk/kucuk harf fark etmez), {takip} yerine bosluklari atilmis
 * takip numarasi yazilir. Firmanin takip adresi yoksa ya da firma listeden
 * cikarildiysa undefined.
 */
export function trackingLink(carriers: Carrier[], shipment: Pick<OrderShipment, "carrier" | "trackingNumber">): string | undefined {
  const key = shipment.carrier.trim().toLocaleLowerCase("tr");
  const url = carriers.find((c) => c.name.toLocaleLowerCase("tr") === key)?.trackingUrl;
  const number = shipment.trackingNumber.replace(/\s+/g, "");
  if (!url || !number) return undefined;
  return url.split(TRACKING_PLACEHOLDER).join(encodeURIComponent(number));
}
