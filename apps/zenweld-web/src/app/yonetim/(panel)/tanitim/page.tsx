import { readHeroPanel } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { HeroClient } from "./HeroClient";

/** Anasayfa Tanıtım. Veritabani modunda her acilista ve her kayittan sonra ayar veritabanindan okunur (KARARLAR K-99). */
export default async function AdminHeroPage() {
  if (!usesDatabase()) return <HeroClient />;
  if (!(await hasPanelSession())) return null;
  return (
    <PageData data={await readHeroPanel(database())}>
      <HeroClient />
    </PageData>
  );
}
