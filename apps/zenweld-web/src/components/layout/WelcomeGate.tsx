"use client";

import { usePathname } from "next/navigation";
import { WelcomeOverlay } from "./WelcomeOverlay";

/** Karşılama pop-up'ı yalnızca ziyaretçiye açık sayfalarda gösterilir. */
export function WelcomeGate() {
  const pathname = usePathname();
  const hidden =
    pathname.includes("/admin") ||
    pathname.includes("/hesabim") ||
    pathname.includes("/account");

  if (hidden) return null;
  return <WelcomeOverlay />;
}
