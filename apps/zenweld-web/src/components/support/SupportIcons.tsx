/**
 * DESTEK VE GARANTI SEMBOLLERI
 *
 * Ust menudeki Destek ve Garanti listesi ile /destek sayfasindaki kartlar
 * ayni sembolleri kullanir. 24x24 izgarada cizildi; cizgi kalinligi ve
 * renk (currentColor) kullanildigi yerden gelir.
 */

export type SupportIconName =
  | "sss"
  | "bayi-servis"
  | "servis-talebi"
  | "iade"
  | "garanti-kayit"
  | "garanti-sorgulama"
  | "garanti-kosullari";

const PATHS: Record<SupportIconName, React.ReactNode> = {
  // Soru isareti, daire icinde
  sss: (
    <>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.35 9.4a2.75 2.75 0 0 1 5.3.95c0 1.85-2.65 2.4-2.65 4.15" />
      <circle cx="12" cy="17.35" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  // Konum isareti ve zemin cizgisi
  "bayi-servis": (
    <>
      <path d="M12 19.25s-6.25-5.2-6.25-10.3a6.25 6.25 0 0 1 12.5 0c0 5.1-6.25 10.3-6.25 10.3Z" />
      <circle cx="12" cy="8.95" r="2.3" />
      <path d="M7.25 21.75h9.5" />
    </>
  ),
  // Anahtar
  "servis-talebi": (
    <path d="M19.23 6.96 16.73 9.46a1.55 1.55 0 0 1-2.19-2.19l2.5-2.5a4.7 4.7 0 0 0-6.23 6.37l-6.44 6.43a1.45 1.45 0 0 0 2.06 2.06l6.43-6.44a4.7 4.7 0 0 0 6.37-6.23Z" />
  ),
  // Iki yonlu donus oklari
  iade: (
    <>
      <path d="M5.05 9.47A7.4 7.4 0 0 1 18.06 7.76" />
      <path d="M18.95 14.53A7.4 7.4 0 0 1 5.94 16.24" />
      <path d="M18.48 4.38 18.06 7.76l-3.31-.77" />
      <path d="M5.52 19.62 5.94 16.24l3.31.77" />
    </>
  ),
  // Kalkan ve arti: garantiyi kaydet
  "garanti-kayit": (
    <>
      <path d="M12 2.9 19 5.55v5.6c0 4.45-2.9 8.05-7 9.85-4.1-1.8-7-5.4-7-9.85v-5.6Z" />
      <path d="M12 8.6v6M9 11.6h6" />
    </>
  ),
  // Buyutec ve onay: garantiyi sorgula
  "garanti-sorgulama": (
    <>
      <circle cx="10.6" cy="10.6" r="6.6" />
      <path d="m15.4 15.4 5.1 5.1" />
      <path d="m7.9 10.75 1.95 1.95 3.45-3.6" />
    </>
  ),
  // Kosullar belgesi
  "garanti-kosullari": (
    <>
      <path d="M14.25 2.75H7.5a2.25 2.25 0 0 0-2.25 2.25v14a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V7.25Z" />
      <path d="M14.25 2.75v4.5h4.5" />
      <path d="M8.75 12.25h6.5M8.75 15.75h6.5M8.75 8.75h2.75" />
    </>
  ),
};

export function SupportIcon({
  name,
  size = 24,
  strokeWidth = 1.75,
  className,
}: {
  name: SupportIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
