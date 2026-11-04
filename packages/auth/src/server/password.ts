import { hash, verify } from "@node-rs/argon2";
import { demoHash } from "../hash";

/**
 * SIFRE OZETI (yalnizca sunucu; KARARLAR K-94, docs/VERITABANI.md › 14 ›
 * Sifre ve oturum)
 *
 * Sifreler argon2id ile ozetlenir (kutuphanenin varsayilani: 19 MB bellek,
 * 2 tur, 1 is parcacigi; guncel guvenlik onerisi). Ozet tuz ve ayarlari
 * icinde tasir; ayarlar ileride arttirilirsa eski ozetler yine dogrulanir.
 *
 * Eski demo ozeti ("zw1$..."; bilgisayardaki ve denemedeki ornek hesaplar)
 * da dogrulanir; dogruysa yeni ozet doner, cagiran kaydeder (ilk giriste
 * guclu ozete gecilir).
 */

const LEGACY_PREFIX = "zw1$";

export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function checkPassword(plain: string, stored: string): Promise<{ ok: boolean; upgraded?: string }> {
  if (stored.startsWith(LEGACY_PREFIX)) {
    if (demoHash(plain) !== stored) return { ok: false };
    return { ok: true, upgraded: await hashPassword(plain) };
  }
  try {
    return { ok: await verify(stored, plain) };
  } catch {
    // Bozuk ya da taninmayan ozet: giris yapilamaz.
    return { ok: false };
  }
}
