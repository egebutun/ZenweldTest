import type { ReactNode } from "react";

/**
 * Kok layout — html/body, site icin app/(site)/layout.tsx'te, yonetim
 * paneli icin app/yonetim/layout.tsx'te uretiliyor. Burasi yalnizca
 * gecis katmani.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
