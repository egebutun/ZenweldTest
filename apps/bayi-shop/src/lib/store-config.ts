/**
 * BAYI MAGAZA YAPILANDIRMASI
 *
 * Bu site, e-ticaret sitesi olmayan Zenweld bayileri icin hazirlanmis
 * "beyaz etiket" magaza sablonudur. Yeni bir bayi icin yalnizca asagidaki
 * degerleri degistirmek yeterlidir.
 */
export const STORE = {
  /** packages/data icindeki retailer kaydiyla eslesmeli */
  retailerId: "r-zenweld-bayi-a",
  dealerId: "d-zenweld-bayi-a",
  name: "ZENWELD-BAYİ-A",
  legalName: "ZENWELD-BAYİ-A Kaynak Teknolojileri Ltd. Şti.",
  phone: "+90 212 000 00 02",
  whatsapp: "+90 532 000 00 02",
  email: "satis@zenweld-bayi-a.com",
  address: "Lorem OSB 5. Blok No:44, Başakşehir / İstanbul",
  workingHours: "Hafta içi 08:00 – 19:00 · Cumartesi 09:00 – 17:00",
  /** Ana Zenweld sitesinin adresi — NEXT_PUBLIC_ZENWELD_URL ile degistirilebilir */
  zenweldUrl:
    process.env.NEXT_PUBLIC_ZENWELD_URL?.replace(/\/$/, "") || "http://localhost:3000",
  freeShippingOver: 5000,
  shippingFee: 350,
} as const;
