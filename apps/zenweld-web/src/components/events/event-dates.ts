import type { ZenweldEvent } from "@zenweld/data";

/**
 * "2026-10-20" -> o gunun yerel 00:00'i. new Date("2026-10-20") UTC gece
 * yarisi olur (Turkiye'de 03:00); son gun sabahi etkinlik bitmis sayilirdi.
 */
function localDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Etkinligin ilk gunu 00:00 ile son gunu 23:59 arasi. */
export function eventWindow(event: Pick<ZenweldEvent, "startDate" | "endDate">): { start: Date; end: Date } {
  const end = localDay(event.endDate);
  end.setHours(23, 59, 59, 999);
  return { start: localDay(event.startDate), end };
}
