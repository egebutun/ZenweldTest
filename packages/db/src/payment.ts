import { cardProgram, type CardProgram, type PaymentPos } from "@zenweld/data";

/**
 * KARTLA ODEME — DEGISTIRILEBILIR SAGLAYICI (KARARLAR K-97, K-108)
 *
 * Siparis kartla odenirken kartin programi (taksit icin) ve tahsilat
 * buradaki "odeme saglayicisi" parcasiyla yapilir (orders.ts › placeOrder).
 * Hangi saglayicinin kullanilacagini site secer
 * (apps/zenweld-web/src/lib/server/payment.ts, ODEME_SAGLAYICI).
 *
 * Bugun tek saglayici vardir: TEMSILI_ODEME. Para cekilmez; siparis odenmis
 * sayilir (K-97). Odeme kurulusu secilince (iyzico, PayTR ya da bankanin
 * sanal POS'u) ayni arayuzle yeni bir saglayici eklenir; siparisin geri
 * kalani degismez. Kurulusun anahtar ve sifreleri yalnizca sunucuda ortam
 * degiskenidir (CLAUDE.md › Guvenlik).
 *
 * Gercek kurulusta ek isler (YAPILACAKLAR › Online satis 1):
 * - 3D Secure: musteri kurulusun sayfasina gider ve geri doner. Siparis
 *   once "odeme bekleniyor" olarak kaydedilir, donuste kurulusa dogrulatilip
 *   odenmis sayilir (pay iki adima ayrilir).
 * - Odeme sayfasi kartin programini kurulusun BIN sorgusundan almali:
 *   sayfa bugun tarayicida hesapliyor; sunucuya cardProgram soran bir uc
 *   eklenir.
 * - Iade ve iptal kurulus uzerinden yapilir (refund).
 */

/** Kartla tahsilat istegi. Kart numarasinin tamami hicbir zaman gelmez. */
export interface CardPaymentRequest {
  /** Siparisin kimligi (kurulusa sepet numarasi olarak gider) */
  orderId: string;
  /** Cekilecek tutar (KDV ve vade farki dahil, TL) */
  amount: number;
  installments: number;
  /** Tahsilatin yapildigi banka POS'u (Magaza Ayarlari) */
  pos: PaymentPos;
  card: { bin: string; last4: string };
}

export type CardPaymentResult =
  | { ok: true; paidAt: Date; /** Kurulusun islem numarasi */ reference: string }
  | { ok: false; /** Musteriye gosterilecek neden */ error: string };

export interface PaymentProvider {
  /** Kayitlarda gorunen ad: "temsili", "iyzico"... */
  id: string;
  /** Kartin programi (Bonus, World...): ilk 6 haneden; bilinmiyorsa undefined. */
  cardProgram(bin: string): Promise<CardProgram | undefined>;
  /** Kartla tahsilat. */
  pay(request: CardPaymentRequest, at: Date): Promise<CardPaymentResult>;
}

/**
 * Temsili odeme (bugun): para cekilmez, her odeme basarili sayilir. Kart
 * programi ilk 6 haneden sabit bir eslemeyle bulunur (packages/data ›
 * payment.ts › cardProgram). Canliya gercek odeme baglanmadan cikilmaz
 * (K-97).
 */
export const TEMSILI_ODEME: PaymentProvider = {
  id: "temsili",
  cardProgram: async (bin) => cardProgram(bin),
  pay: async (request, at) => ({ ok: true, paidAt: at, reference: `TEMSILI-${request.orderId}` }),
};
