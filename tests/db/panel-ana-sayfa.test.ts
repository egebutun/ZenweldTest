import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { readDashboardPanel } from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction, user } from "./ortak";

/*
 * PANEL ANA SAYFASI SUNUCUDA (packages/db/src/admin-dashboard.ts; Asama 5,
 * 6. alan, adim 6.3): ozet ve grafiklerin verisi; once suresi dolan havale
 * siparisleri iptal edilir; uyelerin sifre ozeti ve adresleri gonderilmez.
 * Test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

describe("panel ana sayfası", () => {
  it("özet verisi okunur; süresi dolan havale iptal edilir; şifre özeti gönderilmez", async () => {
    await inTransaction(async (client) => {
      await user(client, "ana-u1", "ana-u1@ornek.com");
      await client.query(
        `INSERT INTO orders (id, code, user_id, status, customer_name, email, phone, shipping_address, invoice,
                             subtotal, vat, shipping, total, payment_method, due_at, terms_accepted_at, created_at, updated_at)
         VALUES ('ana-o1', 'SIP-ANA-1', 'ana-u1', 'awaiting_payment', 'Ad', 'a@ornek.com', '0555', '{}', '{}', 0, 0, 0, 100,
                 'transfer', '2026-03-01T00:00:00Z', now(), '2026-02-27T09:00:00Z', '2026-02-27T09:00:00Z')`,
      );
      await client.query("INSERT INTO order_status_history (order_id, seq, status, at) VALUES ('ana-o1', 0, 'awaiting_payment', '2026-02-27T09:00:00Z')");
      const data = await readDashboardPanel(drizzle(client, { schema }), new Date("2026-03-05T09:00:00Z"));

      expect(Object.keys(data).sort()).toEqual(
        [
          "categories",
          "categoryGroups",
          "dealerStock",
          "dealers",
          "events",
          "news",
          "orders",
          "products",
          "quotes",
          "retailerStock",
          "retailers",
          "serviceRequests",
          "settings",
          "users",
          "warranties",
        ].sort(),
      );
      expect(data.orders?.find((o) => o.id === "ana-o1")?.status).toBe("cancelled");
      expect(data.users?.find((u) => u.id === "ana-u1")).toMatchObject({ email: "ana-u1@ornek.com", passwordHash: "" });
      expect(data.users?.every((u) => u.passwordHash === "")).toBe(true);
      expect(data).not.toHaveProperty("addresses");
    });
  });
});
