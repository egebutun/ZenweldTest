/**
 * Iletisim ve ofis bilgileri.
 *
 * Bu dosya bilerek "use client" tasimaz: hem sunucu tarafindaki SEO
 * yardimcilari (seo.ts) hem de istemci bilesenleri ayni veriyi okur.
 */

/** Zenweld ofisleri. Harita ve yol tarifi baglantilari adresten uretilir. */
export interface Office {
  id: string;
  city: string;
  /** Sirket unvani — merkezde tam unvan gosterilir */
  legalName?: string;
  addressLines: string[];
  phones: string[];
}

export const OFFICES: Office[] = [
  {
    id: "istanbul",
    city: "İstanbul",
    legalName: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.",
    addressLines: [
      "İkitelli O.S.B. Demirciler Sitesi A1 Blok",
      "No.7 Başakşehir 34490 İstanbul",
    ],
    phones: ["+90 212 549 61 86", "+90 212 549 61 89"],
  },
  {
    id: "izmir",
    city: "İzmir",
    addressLines: ["İTOB OSB, 10026. Sk. No:7", "35471 Menderes / İzmir"],
    phones: ["+90 232 203 37 08"],
  },
];

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

export const CONTACT = {
  /** Merkez telefon — footer ve kisa alanlarda kullanilir */
  phone: OFFICES[0].phones[0],
  /** Sehir ayrimi yok, ortak kullaniliyor */
  email: "info@zenweld.com",
  address: `${OFFICES[0].addressLines.join(" ")}`,
  offices: OFFICES,
  /** Zenweld'in resmi sosyal medya hesaplari */
  social: {
    instagram: "https://www.instagram.com/zenweldofficial/",
    youtube: "https://www.youtube.com/@ZenweldKaynak",
    linkedin:
      "https://www.linkedin.com/company/zenweld-kaynak-ve-kesme-ekipmanlar%C4%B1-i%CC%87n%C5%9Faat-sanayi-ve-ticaret-a-%C5%9F/",
    tiktok: "https://www.tiktok.com/@zenweldkaynak",
  },
};
