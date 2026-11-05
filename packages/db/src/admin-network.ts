import { and, eq, gt, inArray, isNotNull, max, ne, sql } from "drizzle-orm";
import {
  DEALER_STORE_TAKEN,
  dealerDraftError,
  isUploadedFile,
  retailerDraftError,
  salesRepDraftError,
  type Dealer,
  type DealerBadge,
  type Retailer,
  type SalesRep,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { checkRow, direction, fail, isFailure, newId, reorder, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { dealerStockRow, readDealers, readRetailers, readSettings, retailerStockRow } from "./read";
import * as s from "./schema";

/**
 * PANEL › BAYI AGI SUNUCUDA (veritabani modu; Asama 5, 4. alan, adim 4.1;
 * KARARLAR K-99, K-103)
 *
 * Bayiler, Online Satıcılar ve Satış Temsilcileri. Kurallar demo modundaki
 * panelle aynidir (packages/store › repo/dealers.ts, retailers.ts,
 * content.ts; packages/data › network-rules.ts). Yazmalar panel.ts'teki
 * ortak kurallarla yapilir; basarili kayittan sonra sitenin ilgili
 * onbellegi yenilenir (cagiran uc).
 */

type Input = Record<string, unknown>;

const iso = (value: Date) => value.toISOString();
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;
const invalid = () => fail(400, tr.panel.invalidRequest);
/** Ayni anda iki kayit tekil kurala takilmasin diye bu kayitlar sirayla yapilir. */
const serialize = (db: AuditDb, name: string) => db.execute(sql`select pg_advisory_xact_lock(hashtext(${name}))`);
const stamps = async (table: typeof s.dealers | typeof s.retailers | typeof s.salesReps, db: AuditDb) =>
  new Map((await db.select({ id: table.id, updatedAt: table.updatedAt }).from(table)).map((r) => [r.id, iso(r.updatedAt)]));

const BADGES: readonly DealerBadge[] = ["yetkili-satici", "yetkili-servis"];

/** Bayinin ya da saticinin stogu, gecmisi ve kod eslestirmeleri (kaynak silinince). */
async function removeStockOfSource(db: AuditDb, type: "dealer" | "retailer", id: string) {
  await db.delete(s.stockImports).where(and(eq(s.stockImports.sourceType, type), eq(s.stockImports.sourceId, id)));
  await db.delete(s.skuAliases).where(eq(s.skuAliases.sourceId, id));
}

/* ------------------------------ Okuma ------------------------------ */

/** Bayiler ekrani: bayiler (son degisiklik anlariyla) ve online magaza secimi icin saticilar. */
export async function readDealersPanel(db: AuditDb): Promise<Pick<ZenweldDatabase, "dealers" | "retailers">> {
  const updated = await stamps(s.dealers, db);
  return {
    dealers: (await readDealers(db)).map((d) => ({ ...d, updatedAt: updated.get(d.id) })),
    retailers: await readRetailers(db),
  };
}

/**
 * Online Satıcılar ekrani: saticilar (son degisiklik anlariyla), bayiler ve
 * "N urun sayfasinda" sayisi icin yalnizca sitede gorunebilecek stok
 * satirlari (adet > 0 ve linkli; bayide yalnizca online magazasi olanlar).
 */
export async function readRetailersPanel(
  db: AuditDb,
): Promise<Pick<ZenweldDatabase, "retailers" | "dealers" | "dealerStock" | "retailerStock" | "settings">> {
  const updated = await stamps(s.retailers, db);
  const dealers = await readDealers(db);
  const linked = dealers.filter((d) => d.retailerId).map((d) => d.id);
  const retailerStock = await db
    .select()
    .from(s.retailerStock)
    .where(and(gt(s.retailerStock.quantity, 0), isNotNull(s.retailerStock.url)));
  const dealerStock = linked.length
    ? await db
        .select()
        .from(s.dealerStock)
        .where(and(inArray(s.dealerStock.dealerId, linked), gt(s.dealerStock.quantity, 0), isNotNull(s.dealerStock.url)))
    : [];
  return {
    retailers: (await readRetailers(db)).map((r) => ({ ...r, updatedAt: updated.get(r.id) })),
    dealers,
    dealerStock: dealerStock.map(dealerStockRow),
    retailerStock: retailerStock.map(retailerStockRow),
    settings: await readSettings(db),
  };
}

/** Satış Temsilcileri ekrani: butun temsilciler (pasifler dahil), sirasiyla. */
export async function readSalesRepsPanel(db: AuditDb): Promise<Pick<ZenweldDatabase, "salesReps">> {
  const rows = await db.select().from(s.salesReps).orderBy(s.salesReps.position, s.salesReps.id);
  return { salesReps: rows.map(salesRep) };
}

const salesRep = (r: typeof s.salesReps.$inferSelect): SalesRep => ({
  id: r.id,
  name: r.name,
  region: r.region,
  phone: r.phone,
  email: r.email,
  ...(r.photoUrl && { photoUrl: r.photoUrl }),
  order: r.position,
  active: r.active,
  updatedAt: iso(r.updatedAt),
});

/* ------------------------------ Bayiler ------------------------------ */

const DEALER_FIELDS = [
  "name",
  "city",
  "district",
  "address",
  "phone",
  "whatsapp",
  "lat",
  "lng",
  "badges",
  "workingHours",
  "retailerId",
  "active",
] as const satisfies readonly (keyof Dealer)[];

const coordinate = (value: unknown, limit: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit ? Math.round(value * 1e6) / 1e6 : null;

/**
 * Bayiyi ekler (id yoksa) ya da gunceller. Bir online magaza yalnizca bir
 * bayiye baglanabilir.
 */
export async function adminSaveDealer(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<{ id: string } & Saved>> {
  const lat = coordinate(input.lat, 90);
  const lng = coordinate(input.lng, 180);
  const badges = Array.isArray(input.badges) ? [...new Set(input.badges)] : null;
  if (lat === null || lng === null || !badges || badges.some((b) => !BADGES.includes(b as DealerBadge)) || typeof input.active !== "boolean") {
    return invalid();
  }
  const draft = {
    name: text(input.name, 200),
    city: text(input.city, 100),
    district: text(input.district, 100),
    address: text(input.address, 500),
    phone: text(input.phone, 50),
    whatsapp: text(input.whatsapp, 50) || undefined,
    lat,
    lng,
    badges: badges as DealerBadge[],
    workingHours: text(input.workingHours, 200),
    retailerId: text(input.retailerId, 100) || undefined,
    active: input.active,
  };
  const problem = dealerDraftError(draft);
  if (problem) return fail(400, problem);

  // Magaza baglantisinin tekilligi: bayi kayitlari sirayla yapilir.
  await serialize(db, "network.dealers");
  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.dealers.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.dealers).where(eq(s.dealers.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const id = row?.id ?? newId("d");
  if (draft.retailerId) {
    const [store] = await db.select({ id: s.retailers.id }).from(s.retailers).where(eq(s.retailers.id, draft.retailerId));
    if (!store) return fail(400, tr.panel.storeMissing);
    const [owner] = await db
      .select({ id: s.dealers.id })
      .from(s.dealers)
      .where(and(eq(s.dealers.retailerId, draft.retailerId), ne(s.dealers.id, id)));
    if (owner) return fail(409, DEALER_STORE_TAKEN);
  }

  const before = row && (await readDealers(db)).find((d) => d.id === row.id);
  const after: Dealer = { id, ...draft };
  const changes = before
    ? changedFields(before, after, DEALER_FIELDS)
    : Object.fromEntries(DEALER_FIELDS.map((key) => [key, after[key] ?? null]));
  if (row && !Object.keys(changes).length) return { ...unchanged(row), id };

  const columns = { ...draft, whatsapp: draft.whatsapp ?? null, retailerId: draft.retailerId ?? null, updatedAt: at };
  if (row) await db.update(s.dealers).set(columns).where(eq(s.dealers.id, id));
  else await db.insert(s.dealers).values({ id, ...columns, createdAt: at });
  await writeAudit(db, actor, { action: row ? "update" : "create", entityType: "dealers", entityId: id, entityLabel: draft.name, changes }, at);
  return { ...saved(at), id };
}

/**
 * Bayiyi siler. Stok satirlari (tablo kurali), stok gecmisi ve kod
 * eslestirmeleri de silinir; bayilik basvurusundaki baglantisi bosalir.
 */
export async function adminDeleteDealer(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.dealers).where(eq(s.dealers.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const before = (await readDealers(db)).find((d) => d.id === row.id);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.dealerStock).where(eq(s.dealerStock.dealerId, row.id));
  await removeStockOfSource(db, "dealer", row.id);
  await db.delete(s.dealers).where(eq(s.dealers.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "dealers", entityId: row.id, entityLabel: row.name, changes: { ...before, stockRows: n } },
    at,
  );
  return { ok: true };
}

/* ------------------------------ Online saticilar ------------------------------ */

const RETAILER_FIELDS = ["name", "websiteUrl", "logoText", "isOwnStore", "city", "active"] as const satisfies readonly (keyof Retailer)[];

/** Online saticiyi ekler (id yoksa) ya da gunceller. Logo metni bossa adin buyuk harfli hali. */
export async function adminSaveRetailer(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<{ id: string } & Saved>> {
  if (typeof input.isOwnStore !== "boolean" || typeof input.active !== "boolean") return invalid();
  const name = text(input.name, 200);
  const draft = {
    name,
    websiteUrl: text(input.websiteUrl, 500),
    logoText: text(input.logoText, 100) || name.toLocaleUpperCase("tr"),
    isOwnStore: input.isOwnStore,
    city: text(input.city, 100) || undefined,
    active: input.active,
  };
  const problem = retailerDraftError(draft);
  if (problem) return fail(400, problem);

  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.retailers.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.retailers).where(eq(s.retailers.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const id = row?.id ?? newId("r");
  const before = row && (await readRetailers(db)).find((r) => r.id === row.id);
  const after: Retailer = { id, ...draft };
  const changes = before
    ? changedFields(before, after, RETAILER_FIELDS)
    : Object.fromEntries(RETAILER_FIELDS.map((key) => [key, after[key] ?? null]));
  if (row && !Object.keys(changes).length) return { ...unchanged(row), id };

  const columns = { ...draft, city: draft.city ?? null, updatedAt: at };
  if (row) await db.update(s.retailers).set(columns).where(eq(s.retailers.id, id));
  else await db.insert(s.retailers).values({ id, ...columns, createdAt: at });
  await writeAudit(db, actor, { action: row ? "update" : "create", entityType: "retailers", entityId: id, entityLabel: name, changes }, at);
  return { ...saved(at), id };
}

/**
 * Online saticiyi siler. Stok satirlari (tablo kurali), stok gecmisi ve kod
 * eslestirmeleri de silinir; bu magazaya bagli bayinin baglantisi kalkar
 * (bayi degismis sayilir: acik bayi formu eski baglantiyi geri yazamaz).
 */
export async function adminDeleteRetailer(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.retailers).where(eq(s.retailers.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const before = (await readRetailers(db)).find((r) => r.id === row.id);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.retailerStock).where(eq(s.retailerStock.retailerId, row.id));
  const linked = await db.select({ id: s.dealers.id }).from(s.dealers).where(eq(s.dealers.retailerId, row.id));
  if (linked.length) {
    await db
      .update(s.dealers)
      .set({ retailerId: null, updatedAt: at })
      .where(
        inArray(
          s.dealers.id,
          linked.map((d) => d.id),
        ),
      );
  }
  await removeStockOfSource(db, "retailer", row.id);
  await db.delete(s.retailers).where(eq(s.retailers.id, row.id));
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "retailers",
      entityId: row.id,
      entityLabel: row.name,
      changes: { ...before, stockRows: n, dealers: linked.map((d) => d.id) },
    },
    at,
  );
  return { ok: true };
}

/* ------------------------------ Satis temsilcileri ------------------------------ */

const REP_FIELDS = ["name", "region", "phone", "email", "photoUrl", "active"] as const satisfies readonly (keyof SalesRep)[];

/**
 * Temsilciyi ekler (id yoksa; listenin sonuna) ya da gunceller. Fotograf
 * adresle girilir; yuklenmis dosya kabul edilmez (dosya deposu gelene kadar,
 * KARARLAR K-101).
 */
export async function adminSaveSalesRep(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<{ id: string } & Saved>> {
  if (typeof input.active !== "boolean") return invalid();
  const draft = {
    name: text(input.name, 200),
    region: text(input.region, 200),
    phone: text(input.phone, 50),
    email: text(input.email, 200),
    photoUrl: text(input.photoUrl, 2000) || undefined,
    active: input.active,
  };
  const problem = salesRepDraftError(draft);
  if (problem) return fail(400, problem);
  if (isUploadedFile(draft.photoUrl)) return fail(400, tr.panel.uploadDisabled);

  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.salesReps.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.salesReps).where(eq(s.salesReps.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const id = row?.id ?? newId("rep");
  const before = row && salesRep(row);
  const changes = before
    ? changedFields(before, { ...before, ...draft }, REP_FIELDS)
    : Object.fromEntries(REP_FIELDS.map((key) => [key, draft[key] ?? null]));
  if (row && !Object.keys(changes).length) return { ...unchanged(row), id };

  const columns = { ...draft, photoUrl: draft.photoUrl ?? null, updatedAt: at };
  if (row) {
    await db.update(s.salesReps).set(columns).where(eq(s.salesReps.id, id));
  } else {
    await serialize(db, "network.sales_reps");
    const [{ last }] = await db.select({ last: max(s.salesReps.position) }).from(s.salesReps);
    await db.insert(s.salesReps).values({ id, ...columns, position: (last ?? 0) + 1, createdAt: at });
  }
  await writeAudit(db, actor, { action: row ? "update" : "create", entityType: "sales_reps", entityId: id, entityLabel: draft.name, changes }, at);
  return { ...saved(at), id };
}

/** Sitede goster / gizle (listedeki rozet). */
export async function adminSetSalesRepActive(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return invalid();
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.salesReps).where(eq(s.salesReps.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  if (row.active === input.active) return unchanged(row);
  await db.update(s.salesReps).set({ active: input.active, updatedAt: at }).where(eq(s.salesReps.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: "sales_reps", entityId: row.id, entityLabel: row.name, changes: { active: [row.active, input.active] } },
    at,
  );
  return saved(at);
}

/** Temsilciyi bir yukari (-1) ya da asagi (+1) tasir. Kaydin icerigi degismez. */
export async function adminMoveSalesRep(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const step = direction(input.direction);
  if (!step) return invalid();
  const id = text(input.id, 100);
  await serialize(db, "network.sales_reps");
  const rows = await db
    .select({ id: s.salesReps.id, name: s.salesReps.name, position: s.salesReps.position })
    .from(s.salesReps)
    .orderBy(s.salesReps.position, s.salesReps.id)
    .for("update");
  if (!rows.some((r) => r.id === id)) return fail(404, notFound);
  for (const change of reorder(rows, id, step)) {
    await db.update(s.salesReps).set({ position: change.after }).where(eq(s.salesReps.id, change.id));
    const name = rows.find((r) => r.id === change.id)!.name;
    await writeAudit(
      db,
      actor,
      { action: "update", entityType: "sales_reps", entityId: change.id, entityLabel: name, changes: { position: [change.before, change.after] } },
      at,
    );
  }
  return { ok: true };
}

/** Temsilciyi siler. */
export async function adminDeleteSalesRep(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.salesReps).where(eq(s.salesReps.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  await db.delete(s.salesReps).where(eq(s.salesReps.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "sales_reps", entityId: row.id, entityLabel: row.name, changes: { ...salesRep(row), updatedAt: undefined } },
    at,
  );
  return { ok: true };
}
