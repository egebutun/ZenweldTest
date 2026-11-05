/**
 * PANELDEN YUKLENEN DOSYALAR (veritabani modu; KARARLAR K-108;
 * docs/IS-KURALLARI.md › 23. Yuklenen dosyalar)
 *
 * Panelde yuklenen gorsel ve belge sunucunun dosya deposuna yazilir
 * (packages/db › file-storage.ts) ve sitenin /dosya/<anahtar> adresinden
 * sunulur. Burada: hangi tur dosyanin ne buyuklukte kabul edildigi, turun
 * dosyanin icerigine bakilarak bulunmasi (adi ya da tarayicinin soyledigi
 * tur yetmez) ve dosyanin depodaki anahtari.
 */

/** Yukleme turu: gorsel (urun, kategori, icerik, temsilci) ya da belge (MSDS, sertifika...). */
export type UploadKind = "gorsel" | "belge";

const MB = 1024 * 1024;

/** Turlere gore kabul edilen dosyalar ve en buyuk boyut. */
export const UPLOAD_RULES: Record<UploadKind, { extensions: readonly string[]; maxBytes: number; label: string }> = {
  gorsel: { extensions: ["jpg", "png", "webp", "gif", "avif"], maxBytes: 5 * MB, label: "JPG, PNG, WebP, GIF ya da AVIF" },
  belge: {
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png", "zip"],
    maxBytes: 25 * MB,
    label: "PDF, Word, Excel, JPG, PNG ya da ZIP",
  },
};

export const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((b, i) => bytes[offset + i] === b);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

/** Adin uzantisi (kucuk harf; "jpeg" -> "jpg"). */
export function fileExtension(name: string): string {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return ext === "jpeg" ? "jpg" : ext;
}

/**
 * Dosyanin icerigine bakarak gercek uzantisi; taninmazsa null. Word, Excel
 * ve ZIP ayni kabuktadir (docx/xlsx/zip ZIP, doc/xls eski Office): bu
 * durumda adin uzantisi kabugun uyduguysa o kullanilir.
 */
export function detectFileType(bytes: Uint8Array, name: string): string | null {
  const declared = fileExtension(name);
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "webp";
  if (startsWith(bytes, ascii("GIF87a")) || startsWith(bytes, ascii("GIF89a"))) return "gif";
  if (startsWith(bytes, ascii("ftyp"), 4) && (startsWith(bytes, ascii("avif"), 8) || startsWith(bytes, ascii("avis"), 8))) return "avif";
  if (startsWith(bytes, ascii("%PDF-"))) return "pdf";
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return ["docx", "xlsx"].includes(declared) ? declared : "zip";
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return ["doc", "xls"].includes(declared) ? declared : null;
  return null;
}

export const UPLOAD_EMPTY = "Dosya boş.";
export const uploadTypeError = (kind: UploadKind) => `Bu dosya türü yüklenemez. Yüklenebilenler: ${UPLOAD_RULES[kind].label}.`;
export const uploadSizeError = (kind: UploadKind) => `Dosya çok büyük; en fazla ${UPLOAD_RULES[kind].maxBytes / MB} MB.`;

/** Yuklenen dosyanin denetimi: bossa, buyukse ya da turu kabul edilmiyorsa hata; uygunsa gercek uzanti. */
export function checkUpload(kind: UploadKind, name: string, bytes: Uint8Array): { ok: true; ext: string } | { ok: false; error: string } {
  if (bytes.length === 0) return { ok: false, error: UPLOAD_EMPTY };
  if (bytes.length > UPLOAD_RULES[kind].maxBytes) return { ok: false, error: uploadSizeError(kind) };
  const ext = detectFileType(bytes, name);
  if (!ext || !UPLOAD_RULES[kind].extensions.includes(ext)) return { ok: false, error: uploadTypeError(kind) };
  return { ok: true, ext };
}

const TR_ASCII: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U" };

/**
 * Belgenin adresindeki dosya adi: Turkce harfler sadelesir, harf, rakam,
 * nokta, tire ve alt cizgi disi tireye doner, en fazla 80 karakter; bos
 * kalirsa "dosya". Klasor parcalari atilir; uzanti dosyanin gercek turudur.
 * Ornek: "MSDS ER70S-6 (2026).PDF" -> "MSDS-ER70S-6-2026.pdf".
 */
export function uploadFileName(name: string, ext: string): string {
  // Klasor parcalari atilir; uzanti (son noktadan sonrasi) yerine gercek tur yazilir.
  const leaf = name.split(/[\\/]/).pop() ?? "";
  const base = leaf.includes(".") ? leaf.slice(0, leaf.lastIndexOf(".")) : leaf;
  const clean = [...base]
    .map((c) => TR_ASCII[c] ?? c)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 80)
    .replace(/[-._]+$/g, "");
  return `${clean || "dosya"}.${ext}`;
}

/**
 * Depodaki anahtar. Gorsel: "gorsel/2026/11/<16 hane>.webp"; belge:
 * "belge/2026/11/<16 hane>/<dosya adi>" (indirilen dosya adiyla gelir).
 * random: 16 kucuk onaltilik hane (sunucu uretir).
 */
export function uploadKey(kind: UploadKind, at: Date, random: string, name: string, ext: string): string {
  const month = `${at.getUTCFullYear()}/${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
  return kind === "gorsel" ? `gorsel/${month}/${random}.${ext}` : `belge/${month}/${random}/${uploadFileName(name, ext)}`;
}

const KEY_PATTERN = /^(gorsel\/\d{4}\/\d{2}\/[0-9a-f]{16}\.[a-z]{3,4}|belge\/\d{4}\/\d{2}\/[0-9a-f]{16}\/[A-Za-z0-9][A-Za-z0-9._-]{0,90}\.[a-z]{3,4})$/;

/** Gecerli depo anahtari mi (sunma ucu baska bir yolu okumaz). */
export const isUploadKey = (key: string) => KEY_PATTERN.test(key) && !key.includes("..") && Boolean(MIME_TYPES[fileExtension(key)]);

/** Sitedeki adres on eki. */
export const UPLOAD_PREFIX = "/dosya/";

export const uploadAddress = (key: string) => `${UPLOAD_PREFIX}${key}`;

/** Adres depodaki bir dosyanin adresiyse anahtari; degilse null. */
export function uploadKeyOf(address: string): string | null {
  if (!address.startsWith(UPLOAD_PREFIX)) return null;
  const key = address.slice(UPLOAD_PREFIX.length);
  return isUploadKey(key) ? key : null;
}
