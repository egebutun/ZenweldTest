import type { ReactNode } from "react";
import { readPagesPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";

/**
 * PANEL › YASAL METINLER, BELGELER VE SAYFA SEO EKRANLARININ VERISI (sunucu bileseni)
 *
 * Veritabani modunda her acilista ve her kayittan sonra kayitlar son
 * degisiklik anlariyla veritabanindan okunur (KARARLAR K-99); demo modunda
 * ekran tarayicidaki veriyle calisir.
 */
export async function PagesPanelData({ children }: { children: ReactNode }) {
  if (!usesDatabase()) return <>{children}</>;
  if (!(await hasPanelSession())) return null;
  return <PageData data={await readPagesPanel(database())}>{children}</PageData>;
}
