/**
 * ANA SITEYE BAGLANTI
 *
 * Panel, ana sitenin sayfalarina (ornegin "Haber sayfasini gor") baglanti
 * verir. Bu baglantilar Next.js'in <Link> bileseniyle VERILMEZ: <Link>
 * panelin /yonetim on ekini ekler ve adres yanlis olur.
 *
 * NEXT_PUBLIC_MAIN_SITE_URL bos ise (simdiki durum) panel ana sitenin
 * adresi altinda calistigi icin goreli adres yeterli. Panel ileride
 * admin.zenweld.com gibi ayri bir adrese tasinirsa bu degisken
 * https://zenweld.com olarak tanimlanir.
 */
const MAIN_SITE = (process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "").replace(/\/$/, "");

/** Ana sitenin Turkce sayfasina mutlak adres: siteUrl("/urun/arc-200") */
export function siteUrl(path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${MAIN_SITE}/tr${clean}`;
}
