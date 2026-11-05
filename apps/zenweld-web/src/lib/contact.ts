import type { CompanyOffice, CompanySettings, CompanySocial } from "@zenweld/data";

/**
 * Iletisim ve ofis bilgilerinin yardimcilari.
 *
 * Bilgilerin kendisi ayarlardadir (Magaza Ayarlari > Sirket ve Iletisim;
 * KARARLAR K-105): tarayicida lib/menu.ts > useCompany, sunucuda katalogun
 * ayarlari. Bu dosya bilerek "use client" tasimaz: sunucu tarafindaki SEO
 * yardimcilari (seo.ts) da kullanir.
 */

export type Office = CompanyOffice;

/** Merkez (ilk ofis) adresi tek satirda: alt bilgi, sozlesmelerdeki Satici. */
export const headOfficeAddress = (company: CompanySettings) => company.offices[0]?.addressLines.join(" ") ?? "";

/** Sitede gosterilen sosyal medya hesaplari (bos olanlar haric), sabit sirayla. */
export function socialLinks(company: CompanySettings): { key: keyof CompanySocial; url: string }[] {
  return (["instagram", "youtube", "linkedin", "tiktok"] as const)
    .map((key) => ({ key, url: company.social[key] }))
    .filter((s) => s.url);
}

/**
 * Adresin tek satirlik, haritaya verilebilir hali.
 * Sirket unvani eklenmez: Google Haritalar'da adres eslesmesini bozuyor.
 */
export function officeQuery(office: Office): string {
  return office.addressLines.join(", ");
}

/** Google Haritalar goml baglantisi (anahtar gerektirmez). */
export function mapEmbedUrl(office: Office): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(officeQuery(office))}&hl=tr&z=15&ie=UTF8&output=embed`;
}

/** Tiklaninca yol tarifi baslatan baglanti. */
export function mapDirectionsUrl(office: Office): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(officeQuery(office))}`;
}
