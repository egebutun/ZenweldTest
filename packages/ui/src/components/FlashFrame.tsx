"use client";

import type { ReactNode } from "react";

/**
 * Alev dillerinin kart KENARI uzerindeki konumlari.
 * left/bottom yuzde olarak kartin kenarina oturur; her dilin yarisi
 * kartin arkasinda kalir, yarisi disarida gorunur.
 */
const FLAME_SPOTS: { left: string; bottom: string; delay: number }[] = [
  // alt kenar
  { left: "14%", bottom: "0%", delay: 0 },
  { left: "38%", bottom: "0%", delay: 0.5 },
  { left: "62%", bottom: "0%", delay: 0.25 },
  { left: "86%", bottom: "0%", delay: 0.75 },
  // sol kenar
  { left: "0%", bottom: "16%", delay: 0.35 },
  { left: "0%", bottom: "44%", delay: 0.9 },
  { left: "0%", bottom: "72%", delay: 0.15 },
  // sag kenar
  { left: "100%", bottom: "24%", delay: 0.65 },
  { left: "100%", bottom: "54%", delay: 0.1 },
  { left: "100%", bottom: "80%", delay: 1.05 },
];

/**
 * FLAS INDIRIM CERCEVESI
 *
 * Esigi asan urun kartini alevli cercevenin icine alir. Stiller
 * packages/ui/src/theme.css icinde (.zw-flash / .zw-flame). Iki site de
 * ayni bileseni kullanir ki bayi magazasinda alev gorunumu ana siteden
 * sapmasin.
 */
export function FlashFrame({ children }: { children: ReactNode }) {
  return (
    <div className="zw-flash h-full">
      <span aria-hidden className="zw-flame-layer">
        {FLAME_SPOTS.map((f, i) => (
          <span
            key={i}
            className="zw-flame"
            style={{ left: f.left, bottom: f.bottom, animationDelay: `${f.delay}s` }}
          />
        ))}
      </span>
      {children}
    </div>
  );
}
