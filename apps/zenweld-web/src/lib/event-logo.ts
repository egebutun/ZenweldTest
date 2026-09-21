const EXTENSIONS = ["svg", "png", "jpg", "jpeg", "webp"];

/**
 * Etkinlik logosunun alternatif uzantilarini uretir.
 *
 * Seed verisinde logo yolu ".png" olarak tanimlidir; dosya SVG veya JPG
 * olarak yuklendiyse gorsel bu listeden bulunur. Hicbiri yuklenemezse
 * markali yer tutucu gosterilir.
 */
export function logoAlternates(logoUrl?: string): string[] {
  if (!logoUrl || logoUrl.startsWith("data:")) return [];
  const match = logoUrl.match(/^(.*)\.([a-z0-9]+)$/i);
  if (!match) return [];
  const [, base, ext] = match;
  return EXTENSIONS.filter((e) => e !== ext.toLowerCase()).map((e) => `${base}.${e}`);
}
