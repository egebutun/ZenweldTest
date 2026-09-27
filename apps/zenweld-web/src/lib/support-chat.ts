/**
 * DESTEK SOHBETINI DISARIDAN ACMA
 *
 * Sohbet penceresi sayfanin en altinda, "Bize yazin" baglantisi ise
 * sayfanin ortasinda duruyor. Ikisi arasinda prop tasimak yerine kucuk
 * bir tarayici olayi kullaniyoruz: baglantiya tiklaninca olay yayilir,
 * sohbet bileseni dinleyip aciliyor.
 */
const EVENT = "zw:destek-sohbeti-ac";

export function openSupportChat(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function onOpenSupportChat(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
