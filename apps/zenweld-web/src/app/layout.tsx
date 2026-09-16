import type { ReactNode } from "react";

/**
 * Kok layout — html/body [locale] layout'unda uretiliyor.
 * Burasi yalnizca gecis katmani.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
