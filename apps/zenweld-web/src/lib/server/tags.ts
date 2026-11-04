/**
 * ONBELLEK ETIKETLERI (KARARLAR K-88)
 *
 * Veritabanindan okunan her veri bir etiketle saklanir; bu veriyi kullanan
 * sayfalar da ayni etiketi alir. Bir kayit degisince ilgili etiket
 * yenilenir (lib/server/refresh.ts) ve o veriyi kullanan sayfalar bir
 * sonraki ziyarette yeniden hazirlanir.
 *
 * Bu dosya saf veridir; yenileme ucunun istek denetimi (birim testli) de
 * kullanir.
 */
export const CACHE_TAGS = {
  /** Urunler, kategoriler, gruplar, secenek tanimlari, magaza ayarlari */
  katalog: "katalog",
  /** Zenweld depo stogu (SAP) */
  "depo-stogu": "depo-stogu",
  /** Bayi ve online satici stoklari */
  stok: "stok",
  /** Bayiler ve online saticilar */
  bayiler: "bayiler",
  /** Urun yorumlari */
  yorumlar: "yorumlar",
  /** Blog, haber, etkinlik, SSS, yasal metinler, Hakkimizda, temsilciler, belgeler, Sayfa SEO */
  icerik: "icerik",
} as const;

export type CacheKind = keyof typeof CACHE_TAGS;
export const CACHE_KINDS = Object.keys(CACHE_TAGS) as CacheKind[];
