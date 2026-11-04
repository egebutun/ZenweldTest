"use client";

import type { ReactNode } from "react";
import { ServerDataProvider, type ServerData } from "@zenweld/store";

/**
 * Sayfaya ozel sunucu verisi (KARARLAR K-88, Asama 3.4): veri kaynagi
 * veritabaniysa sayfanin sunucu bileseni kendi verisini (orn. urunun bayi
 * stogu ve yorumlari) bununla verir; sayfa cercevesinin katalogunun ustune
 * eklenir. Demo modunda data null'dir ve hicbir sey degismez.
 */
export function PageData({ data, children }: { data: ServerData | null; children: ReactNode }) {
  return <ServerDataProvider data={data}>{children}</ServerDataProvider>;
}
