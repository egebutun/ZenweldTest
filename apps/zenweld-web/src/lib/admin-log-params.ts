/**
 * Islem kaydi ve e-posta kaydi ekranlarinin adres suzgecleri
 * (?tur=…&baslangic=…&bitis=…&ara=…&once=…). Sunucu sayfasi okur, ekran
 * ayni adlarla geri yazar.
 */
export type LogParams = Record<string, string | string[] | undefined>;

export const param = (params: LogParams, name: string) => {
  const value = params[name];
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text.slice(0, 100) : undefined;
};

/** Sayfalama: bu numaradan eski kayitlar. */
export const beforeParam = (params: LogParams) => {
  const n = Number(param(params, "once"));
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
};

/** Ayni suzgeclerle baska bir sayfanin adresi. */
export function logHref(path: string, filter: Record<string, string | undefined>, before?: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) query.set(key, value);
  if (before) query.set("once", String(before));
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
