/**
 * ANA SITEYE BAGLANTI
 *
 * Panel, ana sitenin sayfalarina (ornegin "Haber sayfasini gor") yeni
 * sekmede baglanti verir. Panel ana sitenin icinde calistigi icin goreli
 * adres yeterli. Panel ileride admin.zenweld.com gibi ayri bir adrese
 * tasinirsa NEXT_PUBLIC_MAIN_SITE_URL = https://zenweld.com tanimlanir.
 */
const MAIN_SITE = (process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "").replace(/\/$/, "");

/** Ana sitenin sayfasina adres: siteUrl("/urun/arc-200") */
export function siteUrl(path = "/"): string {
  return `${MAIN_SITE}${path.startsWith("/") ? path : `/${path}`}`;
}
