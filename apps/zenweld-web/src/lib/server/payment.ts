import { TEMSILI_ODEME, type PaymentProvider } from "@zenweld/db";

/**
 * KARTLA ODEMENIN SAGLAYICISI (yalnizca sunucu; KARARLAR K-97, K-108)
 *
 * Hangi odeme saglayicisinin kullanilacagini sunucudaki ODEME_SAGLAYICI
 * ayari belirler (bos: "temsili"). Odeme kurulusu secilince onun parcasi
 * packages/db/src/payment.ts'teki arayuzle yazilip asagidaki listeye
 * eklenir; kurulusun anahtarlari yalnizca sunucuda ortam degiskeni olur
 * (docs/ENTEGRASYONLAR.md › 3).
 */
const PROVIDERS: Record<string, PaymentProvider> = {
  temsili: TEMSILI_ODEME,
};

export function paymentProvider(): PaymentProvider {
  const name = process.env.ODEME_SAGLAYICI || "temsili";
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Bilinmeyen ödeme sağlayıcısı (ODEME_SAGLAYICI): ${name}`);
  return provider;
}
