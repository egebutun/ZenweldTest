import { readPanelMembers } from "@zenweld/db";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession, panelCatalog } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";

/** Yeni kupon. Veritabani modunda uyeler ve kapsam secimi icin katalog sunucudan gelir (KARARLAR K-99). */
export default async function NewCouponPage() {
  const page = (
    <>
      <AdminPageHeader
        title="Yeni Kupon"
        description="Müşterinin sepette yazacağı indirim kodu. Kupon kampanyalı fiyatın üstüne uygulanır, kargoya uygulanmaz."
      />
      <CouponForm />
    </>
  );
  if (!usesDatabase()) return page;
  if (!(await hasPanelSession())) return null;
  return <PageData data={{ users: await readPanelMembers(database()), ...(await panelCatalog()) }}>{page}</PageData>;
}
