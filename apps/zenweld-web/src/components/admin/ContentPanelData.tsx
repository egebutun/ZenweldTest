import type { ReactNode } from "react";
import { readContentPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";

/**
 * PANEL › ICERIK EKRANLARININ VERISI (sunucu bileseni)
 *
 * Haberler, Etkinlikler, Blog, Sık Sorulan Sorular ve Hakkımızda. Veritabani
 * modunda her acilista ve her kayittan sonra kayitlar son degisiklik
 * anlariyla veritabanindan okunur (KARARLAR K-99); demo modunda ekran
 * tarayicidaki veriyle calisir.
 */
export async function ContentPanelData({ children }: { children: ReactNode }) {
  if (!usesDatabase()) return <>{children}</>;
  if (!(await hasPanelSession())) return null;
  return <PageData data={await readContentPanel(database())}>{children}</PageData>;
}
