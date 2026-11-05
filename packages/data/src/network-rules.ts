import type { Dealer, Retailer, SalesRep } from "./types";

/**
 * BAYI AGI KAYIT KURALLARI — PANEL (demo ve veritabani modu ayni)
 *
 * Bayiler, Online Satıcılar ve Satış Temsilcileri formlarinin dogrulamasi.
 * Tarayici (panel ekranlari) ve sunucu (packages/db › admin-network.ts) ayni
 * kurallari kullanir; sunucu tarayicidan geleni yeniden denetler.
 */

/** Bir online magaza yalnizca bir bayiye baglanabilir (dealers.retailer_id tekil). */
export const DEALER_STORE_TAKEN =
  "Bu online mağaza başka bir bayiye bağlı. Bir online mağaza yalnızca bir bayiye bağlanabilir.";

/** Bayi: ad, sehir ve tur (Yetkili Bayi, Yetkili Servis ya da ikisi) zorunlu. Sorun yoksa null. */
export function dealerDraftError(dealer: Pick<Dealer, "name" | "city" | "badges">): string | null {
  if (!dealer.name.trim() || !dealer.city.trim()) return "Bayi adı ve şehir zorunludur.";
  if (!dealer.badges.length) return "Bayi türünü seçin: Yetkili Bayi, Yetkili Servis ya da ikisi.";
  return null;
}

/** Online satici: ad ve site adresi zorunlu. Sorun yoksa null. */
export function retailerDraftError(retailer: Pick<Retailer, "name" | "websiteUrl">): string | null {
  if (!retailer.name.trim() || !retailer.websiteUrl.trim()) return "Satıcı adı ve site adresi zorunludur.";
  return null;
}

/** Satis temsilcisi: ad, bolge, telefon (en az 10 rakam) ve gecerli e-posta zorunlu. Sorun yoksa null. */
export function salesRepDraftError(rep: Pick<SalesRep, "name" | "region" | "phone" | "email">): string | null {
  const email = rep.email.trim();
  if (!rep.name.trim() || !rep.region.trim() || !rep.phone.trim() || !email) {
    return "Ad soyad, bölge / görev, telefon ve e-posta zorunludur.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "E-posta adresi geçersiz görünüyor.";
  if (rep.phone.replace(/\D/g, "").length < 10) return "Telefon numarası eksik görünüyor (ör. +90 532 000 00 00).";
  return null;
}
