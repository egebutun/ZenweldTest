"use client";

import { usePathname } from "next/navigation";
import { WelcomeOverlay } from "./WelcomeOverlay";

/** Karşılama pop-up'ı yalnızca ziyaretçiye açık sayfalarda gösterilir. */
export function WelcomeGate() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/hesabim");

  if (hidden) return null;
  return <WelcomeOverlay />;
}
