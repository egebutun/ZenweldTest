/**
 * Panelin Anasayfa Tanıtım ekrani ile onizleme sayfasi
 * (/yonetim/onizleme/tanitim) arasindaki mesajlarin turleri.
 */
export const HERO_PREVIEW = {
  path: "/yonetim/onizleme/tanitim",
  /** Panel -> onizleme: kaydedilmemis taslak ve acilacak sayfa */
  draft: "zw-hero-preview",
  /** Onizleme -> panel: sayfa hazir, taslak gonderilebilir */
  ready: "zw-hero-preview-ready",
  /** Onizleme -> panel: tanitim alaninin yuksekligi */
  size: "zw-hero-preview-size",
} as const;
