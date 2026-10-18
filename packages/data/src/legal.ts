/**
 * YASAL METINLERIN ADRESLERI
 *
 * Metinler (baslik + icerik) veritabaninda tutulur ve yonetim panelinden
 * duzenlenir; adresleri ise sabittir. Alt bilgideki "Politikalar & Yasal"
 * listesi bu sirayla gosterilir.
 */
export const LEGAL_ROUTES = [
  { id: "kullanim-kosullari", path: "/yasal/kullanim-kosullari" },
  { id: "garanti-kosullari", path: "/garanti/kosullar" },
  { id: "gizlilik", path: "/yasal/gizlilik" },
  { id: "cerez-politikasi", path: "/yasal/cerez-politikasi" },
  { id: "kvkk", path: "/yasal/kvkk" },
  { id: "kisisel-verilerin-islenmesi-politikasi", path: "/yasal/kisisel-verilerin-islenmesi-politikasi" },
  { id: "kisisel-veri-saklama-ve-imha-politikasi", path: "/yasal/kisisel-veri-saklama-ve-imha-politikasi" },
  { id: "fiziksel-guvenlik-aydinlatma-metni", path: "/yasal/fiziksel-guvenlik-aydinlatma-metni" },
  { id: "iade", path: "/yasal/iade" },
  { id: "on-bilgilendirme-formu", path: "/yasal/on-bilgilendirme-formu" },
  { id: "mesafeli-satis-sozlesmesi", path: "/yasal/mesafeli-satis-sozlesmesi" },
] as const;

export type LegalPageId = (typeof LEGAL_ROUTES)[number]["id"];

export function legalPath(id: LegalPageId): string {
  return LEGAL_ROUTES.find((r) => r.id === id)!.path;
}
