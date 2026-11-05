import { cookies } from "next/headers";
import { readSession } from "@zenweld/auth/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoginRedirect } from "@/components/admin/LoginRedirect";
import { PanelFeatures } from "@/components/admin/PanelFeatures";
import { database, usesDatabase } from "@/lib/server/db";
import { fileStorage } from "@/lib/server/files";
import { SESSION_COOKIES } from "@/lib/server/session-cookie";

/**
 * Giris ekrani disindaki tum panel sayfalari bu kabugun icinde.
 *
 * Veritabani modunda panel sunucuda korunur (Asama 4.3): gecerli yonetici
 * oturumu yoksa (hic yok, suresi dolmus, askiya alinmis ya da yonetici
 * degil) sayfa gonderilmez, giris ekranina yonlendirilir. Dosya deposu
 * ayarliysa panelde dosya yukleme acilir (KARARLAR K-108).
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (usesDatabase()) {
    const token = (await cookies()).get(SESSION_COOKIES.admin)?.value;
    if (!(await readSession(database(), token, "admin"))) return <LoginRedirect />;
  }
  return (
    <PanelFeatures uploads={fileStorage() !== null}>
      <AdminShell>{children}</AdminShell>
    </PanelFeatures>
  );
}
