export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    // En az basamak da 0: eski tarayicilar (yalniz en cok 0 verilince) hata verir.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * ISO tarih <-> <input type="datetime-local"> degeri.
 * Girdi yerel saatle calisir; kayit ISO (UTC) olarak tutulur.
 */
export function toDateTimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function priceWithVat(exVat: number, vatRate: number): number {
  return Math.round(exVat * (1 + vatRate / 100));
}

/** HTML'e gomulecek kullanici metnini zararsiz hale getirir (e-posta, harita baloncugu). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Yerel saatle bugunun tarihi: "YYYY-AA-GG". toISOString() UTC verdigi icin
 * Turkiye'de gece 00:00–03:00 arasi bir gun geride kalir; tarih karsilastirmada
 * bu kullanilir.
 */
export function localDateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-AA-GG" tarihine ay ekler (eksi deger cikarir). */
export function addMonthsToDate(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return localDateKey(new Date(y, m - 1 + months, d));
}
