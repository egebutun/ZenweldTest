/**
 * Turkce metin normalizasyonu.
 *
 * Amac: "örtülü" ~ "ortulu", "İNVERTÖR" ~ "invertor", "ı" ~ "i" olacak sekilde
 * aksan ve buyuk/kucuk harf farklarini yok saymak. Boylece kullanici Turkce
 * karakter kullanmadan yazsa da urunu bulabilir.
 */

const MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

export function trNormalize(input: string): string {
  let out = "";
  for (const ch of input) {
    out += MAP[ch] ?? ch.toLowerCase();
  }
  return out
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** MiniSearch icin tokenizer: normalize eder ve bolerken "/" "-" "." de ayirir. */
export function trTokenize(text: string): string[] {
  return trNormalize(text)
    .split(/[\s/\-.]+/)
    .filter((t) => t.length > 0);
}
