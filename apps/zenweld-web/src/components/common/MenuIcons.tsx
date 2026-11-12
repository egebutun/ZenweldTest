/**
 * MENU SEMBOLLERI
 *
 * Ust menudeki Destek ve Garanti ile Kesfet listeleri ve /destek
 * sayfasindaki kartlar bu sembolleri kullanir. 24x24 izgarada cizildi;
 * cizgi kalinligi ve renk (currentColor) kullanildigi yerden gelir.
 */

export type MenuIconName =
  // Destek ve Garanti
  | "iletisim"
  | "sss"
  | "bayi-servis"
  | "servis-talebi"
  | "iade"
  | "garanti-kayit"
  | "garanti-sorgulama"
  | "garanti-kosullari"
  // Kesfet
  | "hakkimizda"
  | "satis-temsilcileri"
  | "bayilik-basvurusu"
  | "haberler"
  | "etkinlikler"
  | "blog"
  | "welders-club"
  | "urun-secici"
  | "kaynak-rehberi"
  | "msds"
  | "parti-sertifikalari";

const PATHS: Record<MenuIconName, React.ReactNode> = {
  // Zarf
  iletisim: (
    <>
      <rect x="3" y="5.25" width="18" height="13.5" rx="2.25" />
      <path d="m3.75 6.75 8.25 6.25 8.25-6.25" />
    </>
  ),
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
  // Fabrika
  "hakkimizda": (
    <>
      <path d="M2.75 20.25h18.5" />
      <path d="M4.25 20.25V10.5l4.75 3.25V10.5l4.75 3.25V4.75h4.5v15.5" />
      <path d="M7.25 17.25h2.5M11.75 17.25h2.5" />
    </>
  ),
  // Kulaklikli kisi
  "satis-temsilcileri": (
    <>
      <circle cx="12" cy="9.5" r="2.75" />
      <path d="M5 20.25c.55-3.55 3.4-5.75 7-5.75s6.45 2.2 7 5.75" />
      <path d="M6.25 10a5.75 5.75 0 0 1 11.5 0" />
      <path d="M17.75 10v1.25a2 2 0 0 1-2 2H14.5" />
    </>
  ),
  // Tenteli dukkan
  "bayilik-basvurusu": (
    <>
      <path d="M4.25 11.75v8h15.5v-8" />
      <path d="M3 9 4.5 4.25h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M10 19.75v-4.5h4v4.5" />
    </>
  ),
  // Gazete
  "haberler": (
    <>
      <path d="M3.75 4.25h12.5v13.5a2 2 0 0 0 2 2H5.75a2 2 0 0 1-2-2Z" />
      <path d="M16.25 8.75h4v9a2 2 0 0 1-2 2" />
      <path d="M7 8.25h6M7 11.75h6M7 15.25h3.5" />
    </>
  ),
  // Takvim
  "etkinlikler": (
    <>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2" />
      <path d="M3.75 9.75h16.5M8 3.25v4M16 3.25v4" />
      <circle cx="8.25" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.75" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.25" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  // Kalem
  "blog": (
    <>
      <path d="M15 4.5 19.5 9 9.25 19.25l-5 1 1-5Z" />
      <path d="m12.75 6.75 4.5 4.5" />
      <path d="M13.5 20.25h6.75" />
    </>
  ),
  // Iki kisi: topluluk
  "welders-club": (
    <>
      <circle cx="9" cy="8.25" r="3.25" />
      <path d="M3.25 19.75a5.75 5.75 0 0 1 11.5 0" />
      <path d="M15.5 5.1a3.25 3.25 0 0 1 0 6.3" />
      <path d="M17.5 14.35a5.75 5.75 0 0 1 3.25 5.4" />
    </>
  ),
  // Ayar surgusu
  "urun-secici": (
    <>
      <path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
      <circle cx="15" cy="6.5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  // Acik kitap
  "kaynak-rehberi": (
    <>
      <path d="M12 6.5c-1.9-1.5-4.6-2-8.25-1.75v13c3.65-.25 6.35.25 8.25 1.75 1.9-1.5 4.6-2 8.25-1.75v-13C16.6 4.5 13.9 5 12 6.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // Deney sisesi
  "msds": (
    <>
      <path d="M9.25 3.25h5.5" />
      <path d="M10 3.25v5.5l-5.1 8.9a1.75 1.75 0 0 0 1.5 2.6h11.2a1.75 1.75 0 0 0 1.5-2.6L14 8.75v-5.5" />
      <path d="M7.1 14.75h9.8" />
    </>
  ),
  // Muhurlu sertifika
  "parti-sertifikalari": (
    <>
      <path d="M20.25 10.25V6a1.75 1.75 0 0 0-1.75-1.75h-13A1.75 1.75 0 0 0 3.75 6v10.5a1.75 1.75 0 0 0 1.75 1.75h6" />
      <path d="M7.25 8.5h9.5M7.25 12h4.5" />
      <circle cx="16.75" cy="14" r="2.75" />
      <path d="m15.1 16.2-.6 4.3 2.25-1.1 2.25 1.1-.6-4.3" />
    </>
  ),
};

export function MenuIcon({
  name,
  size = 24,
  strokeWidth = 1.75,
  className,
}: {
  name: MenuIconName;
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
