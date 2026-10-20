import type { DocumentPage, DocumentSection } from "../types";

/** Belge sayfalari: adresleri ve panelde/menude gorunen adlari. */
export const DOCUMENT_SECTIONS: { id: DocumentSection; label: string; href: string }[] = [
  { id: "msds", label: "MSDS", href: "/msds" },
  { id: "kaynak-rehberi", label: "Ultimate Kaynak Rehberi", href: "/kaynak-rehberi" },
  { id: "parti-sertifikalari", label: "Parti Sertifikaları", href: "/parti-sertifikalari" },
];

/** Sayfa basliklari; belgeler panelden yuklenir (baslangicta bos). */
export const documentPages: DocumentPage[] = [
  {
    section: "msds",
    title: "MSDS — Malzeme Güvenlik Bilgi Formları",
    subtitle: "Ürünlerimize ait malzeme güvenlik bilgi formlarını buradan sorgulayabilirsiniz.",
  },
  {
    section: "kaynak-rehberi",
    title: "Ultimate Kaynak Rehberi",
    subtitle: "Ücretsiz dijital kopyayı edinin veya basılı sürümü sipariş edin.",
  },
  {
    section: "parti-sertifikalari",
    title: "Parti Sertifikaları",
    subtitle: "Ürün uygunluk ve parti sertifikalarını indirin.",
  },
];
