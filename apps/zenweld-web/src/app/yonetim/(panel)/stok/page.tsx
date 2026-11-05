import { readStockPanel, type StockPanelView } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { StockClient } from "./StockClient";

type Search = Promise<Record<string, string | string[] | undefined>>;

/** Adresteki gorunum: ?kaynak=dealer:<id> | ?sekme=urun[&urun=<id>] | liste. */
function viewOf(params: Record<string, string | string[] | undefined>): StockPanelView {
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const [type, ...rest] = (one("kaynak") ?? "").split(":");
  if ((type === "dealer" || type === "retailer") && rest.length) return { source: { type, id: rest.join(":") } };
  return one("sekme") === "urun" ? { tab: "urun", productId: one("urun") } : { tab: "kaynaklar" };
}

/**
 * Stok Matrisi. Veritabani modunda her acilista ve her kayittan sonra
 * yalnizca gorunumun gerektirdigi stok okunur (KARARLAR K-99, K-103).
 */
export default async function AdminStockPage({ searchParams }: { searchParams: Search }) {
  if (!usesDatabase()) return <StockClient />;
  if (!(await hasPanelSession())) return null;
  const { data, summaries } = await readStockPanel(database(), viewOf(await searchParams));
  return (
    <PageData data={data}>
      <StockClient summaries={summaries} />
    </PageData>
  );
}
