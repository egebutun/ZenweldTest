import type {
  AboutContent,
  BlogPost,
  DocumentFile,
  DocumentPage,
  FaqItem,
  LegalPage,
  NewsItem,
  RichTextStyle,
  ZenweldEvent,
} from "./types";

/**
 * ICERIK KAYIT KURALLARI — PANEL (demo ve veritabani modu ayni)
 *
 * Haberler, Etkinlikler, Blog, Sık Sorulan Sorular, Hakkımızda, Yasal
 * Metinler, Belgeler ve Görünüm formlarinin dogrulamasi. Tarayici (panel
 * ekranlari) ve sunucu (packages/db › admin-content.ts, admin-pages.ts,
 * admin-settings.ts) ayni kurallari kullanir; sunucu tarayicidan geleni
 * yeniden denetler.
 */

/**
 * Link bos kalirsa (adda Latin harf ya da rakam yok, orn. Rusca bir
 * etkinlik adi) kayit yapilmaz; bos linkli sayfa acilamazdi.
 */
export const EMPTY_SLUG_ERROR =
  "Link oluşturulamadı: adda Latin harf ya da rakam yok. SEO sekmesinde Latin harf ve rakamlarla bir link yazın.";

/** Haber: baslik zorunlu. Sorun yoksa null. */
export const newsDraftError = (draft: Pick<NewsItem, "title">): string | null =>
  draft.title.trim() ? null : "Haber başlığı zorunludur.";

/** Blog yazisi: baslik zorunlu. Sorun yoksa null. */
export const blogDraftError = (draft: Pick<BlogPost, "title">): string | null =>
  draft.title.trim() ? null : "Yazı başlığı zorunludur.";

/** Etkinlik: ad zorunlu; bitis baslangictan once olamaz. Sorun yoksa null. */
export function eventDraftError(draft: Pick<ZenweldEvent, "title" | "startDate" | "endDate">): string | null {
  if (!draft.title.trim()) return "Etkinlik adı zorunludur.";
  if (draft.endDate < draft.startDate) return "Bitiş tarihi başlangıç tarihinden önce olamaz.";
  return null;
}

export const newsSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" haberinde kullanılıyor.`;
export const blogSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" yazısında kullanılıyor.`;
export const eventSlugTakenText = (slug: string, title: string) => `"${slug}" adresi "${title}" etkinliğinde kullanılıyor.`;

/** Sik sorulan soru: soru ve cevap zorunlu. Sorun yoksa null. */
export const faqDraftError = (draft: Pick<FaqItem, "question" | "answer">): string | null =>
  draft.question.trim() && draft.answer.trim() ? null : "Soru ve cevap zorunludur.";

/** SSS konulari (sitedeki suzgecle ayni). */
export const FAQ_TOPICS: FaqItem["topic"][] = ["genel", "siparis", "garanti", "teknik"];

/** Hakkimizda: sayfa basligi zorunlu. Sorun yoksa null. */
export const aboutDraftError = (draft: Pick<AboutContent, "heroTitle">): string | null =>
  draft.heroTitle.trim() ? null : "Sayfa başlığı zorunludur.";

/** Yasal metinde ve belge sayfasinda baslik bos birakildi. */
export const TITLE_REQUIRED = "Başlık zorunludur.";

/** Yasal metin: baslik ve metin zorunlu. Sorun yoksa null. */
export function legalDraftError(draft: Pick<LegalPage, "title" | "body">): string | null {
  if (!draft.title.trim()) return TITLE_REQUIRED;
  if (!draft.body.trim()) return "Metin zorunludur.";
  return null;
}

/* ------------------------------ Belgeler ------------------------------ */

/** Belge sayfasinin metni (MSDS vb.): baslik zorunlu. Sorun yoksa null. */
export const documentPageError = (page: Pick<DocumentPage, "title">): string | null =>
  page.title.trim() ? null : TITLE_REQUIRED;

/**
 * Veritabani modunda belge dosyasi yuklenmez, dosyanin adresi girilir
 * (dosya deposu gelene kadar; KARARLAR K-104). Adres kaydin dosya
 * anahtarinda (fileKey) durur: "https://", "http://" ya da "/" ile baslar.
 * Tarayicida yuklenen dosyanin anahtari (demo modu) boyle baslamaz.
 */
export const isDocumentAddress = (fileKey: string) => /^(https?:\/\/|\/)\S+$/i.test(fileKey);

/** Belge adresi: bos olamaz, "https://" (ya da "/") ile baslamali, bosluk icermez. Sorun yoksa null. */
export function documentAddressError(address: string): string | null {
  const value = address.trim();
  if (!value) return "Dosyanın adresini girin.";
  if (!isDocumentAddress(value)) return "Dosya adresi https:// ile başlamalı ve boşluk içermemeli.";
  return null;
}

const DOCUMENT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  zip: "application/zip",
};

/**
 * Adresi girilen belgenin dosya adi ve turu: adresin son parcasindan
 * ("…/MSDS-ER70S-6.pdf" -> "MSDS-ER70S-6.pdf", PDF). Son parca yoksa
 * baslik kullanilir; uzantisi bilinmeyen dosyanin turu genel ikili dosyadir.
 * Boyutu bilinmez (0).
 */
export function documentFileFromAddress(address: string, title: string): Pick<DocumentFile, "fileName" | "mimeType" | "size"> {
  const path = address.trim().split(/[?#]/)[0];
  let last = path.slice(path.lastIndexOf("/") + 1);
  try {
    last = decodeURIComponent(last);
  } catch {
    // Bozuk kodlanmis ad oldugu gibi kalir.
  }
  const fileName = last.trim() || title.trim();
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  return { fileName, mimeType: DOCUMENT_MIME[ext] ?? "application/octet-stream", size: 0 };
}

/* ------------------------------ Gorunum ------------------------------ */

/** Görünüm ekranindaki punto ve genislik sinirlari (px): [en az, en cok]. */
export const RICH_TEXT_LIMITS = {
  headingSize: [14, 32],
  accentWidth: [0, 160],
  leadSize: [14, 26],
  bodySize: [12, 22],
} as const satisfies Partial<Record<keyof RichTextStyle, readonly [number, number]>>;

/** Görünüm ekranindaki renk alanlari ve adlari. */
export const RICH_TEXT_COLORS = {
  headingColor: "Ara başlık rengi",
  accentColor: "Vurgu rengi",
  bodyColor: "Gövde rengi",
  strongColor: "Kalın vurgu rengi",
} as const satisfies Partial<Record<keyof RichTextStyle, string>>;

/** Renk: #RRGGBB (renk seçicinin verdigi bicim). */
export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** Görünüm ayarlari: renkler #RRGGBB, puntolar sinirlar icinde tam sayi. Sorun yoksa null. */
export function richTextStyleError(style: RichTextStyle): string | null {
  for (const [key, label] of Object.entries(RICH_TEXT_COLORS) as [keyof typeof RICH_TEXT_COLORS, string][]) {
    if (!isHexColor(style[key])) return `${label} #RRGGBB biçiminde olmalı (örnek: #141619).`;
  }
  for (const [key, [min, max]] of Object.entries(RICH_TEXT_LIMITS) as [keyof typeof RICH_TEXT_LIMITS, readonly [number, number]][]) {
    const value = style[key];
    if (!Number.isInteger(value) || value < min || value > max) return `Punto ve genişlik değerleri ${min}–${max} arasında olmalı.`;
  }
  return null;
}
