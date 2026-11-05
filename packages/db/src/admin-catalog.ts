import { and, count, countDistinct, eq, inArray, max, ne, sql } from "drizzle-orm";
import {
  CATALOG_ID_PATTERN,
  CATEGORY_HAS_PRODUCTS,
  GROUP_HAS_CATEGORIES,
  categoryFiltersError,
  categoryHref,
  categorySlugTakenText,
  groupHref,
  groupSlugTakenText,
  isUploadedFile,
  normalizeCode,
  optionDefinitionError,
  optionInUseText,
  optionValueInUseText,
  optionsError,
  productCodeError,
  productSlugTakenText,
  tidyFilterValues,
  tidyOptions,
  validateDiscount,
  type Category,
  type CategoryFilter,
  type CategoryGroup,
  type OptionDefinition,
  type OptionValue,
  type Product,
  type ProductDiscount,
  type ProductFilterValues,
  type ProductImage,
  type ProductOptions,
  type ProductVariant,
  type SpecRow,
  type TopLevelSection,
  type WeldingProcess,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { movePath, parseSeo, releasePath, validSlug } from "./links";
import { checkRow, direction, fail, isFailure, newId, reorder, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { readCatalog } from "./read";
import { combinationKey } from "./seed";
import * as s from "./schema";
import { SECTIONS } from "./schema/columns";

/**
 * PANEL › KATALOG SUNUCUDA (veritabani modu; Asama 5, 3. alan; KARARLAR K-99)
 *
 * Adim 3.1: Seçenek Tanımları, Kategoriler ve gruplar; adim 3.2: Ürünler.
 * Kurallar demo modundaki panelle aynidir (packages/store › repo/options.ts,
 * categories.ts, products.ts; packages/data › catalog-rules.ts, filters.ts). Yazmalar
 * panel.ts'teki ortak kurallarla yapilir; basarili kayittan sonra sitenin
 * katalog onbellegi yenilenir (cagiran uc).
 *
 * Veritabaninda urun kategoriye, kategori gruba kimlikle baglidir: link
 * degisince kayitlar tasinmaz, yalnizca eski adres yeni adrese yonlenir
 * (redirects).
 */

type Input = Record<string, unknown>;

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const iso = (value: Date) => value.toISOString();
const stale = tr.panel.staleRecord;
const notFound = tr.panel.recordNotFound;
const invalid = () => fail(400, tr.panel.invalidRequest);
/** Ayni anda iki kayit tekil kurala (ad, link) takilmasin diye bu kayitlar sirayla yapilir. */
const serialize = (db: AuditDb, name: string) => db.execute(sql`select pg_advisory_xact_lock(hashtext(${name}))`);

/* ------------------------------ Okuma ------------------------------ */

/**
 * Panelin katalog ekranlari: gruplar, kategoriler, secenek tanimlari ve
 * urunler; onbelleksiz (panel her zaman guncel kaydi gorur). Gruplar,
 * kategoriler ve tanimlar son degisiklik anlariyla.
 */
export async function readCatalogPanel(db: AuditDb): Promise<{
  categoryGroups: CategoryGroup[];
  categories: Category[];
  optionDefinitions: OptionDefinition[];
  products: Product[];
}> {
  const catalog = await readCatalog(db);
  const stamp = async (table: typeof s.categoryGroups | typeof s.categories | typeof s.optionDefinitions) =>
    new Map((await db.select({ id: table.id, updatedAt: table.updatedAt }).from(table)).map((r) => [r.id, iso(r.updatedAt)]));
  const groups = await stamp(s.categoryGroups);
  const categories = await stamp(s.categories);
  const options = await stamp(s.optionDefinitions);
  return {
    categoryGroups: catalog.categoryGroups.map((g) => ({ ...g, updatedAt: groups.get(g.id) })),
    categories: catalog.categories.map((c) => ({ ...c, updatedAt: categories.get(c.id) })),
    optionDefinitions: catalog.optionDefinitions.map((o) => ({ ...o, updatedAt: options.get(o.id) })),
    products: catalog.products,
  };
}

/* ------------------------------ Ortak ------------------------------ */

/** Deger listesi (secenek degerleri, filtre degerleri); kimlikler gecerli ve tekrarsiz olmali. */
function parseValues(value: unknown): OptionValue[] | null {
  if (!Array.isArray(value) || value.length > 200) return null;
  const values = value.map((v) => ({ id: text(record(v).id, 80), label: text(record(v).label, 120) }));
  if (values.some((v) => !CATALOG_ID_PATTERN.test(v.id))) return null;
  return new Set(values.map((v) => v.id)).size === values.length ? values : null;
}

/* ------------------------------ Secenek tanimlari ------------------------------ */

async function readDefinitions(db: AuditDb): Promise<OptionDefinition[]> {
  const definitions = await db.select().from(s.optionDefinitions).orderBy(s.optionDefinitions.position);
  const values = await db.select().from(s.optionValues).orderBy(s.optionValues.position);
  return definitions.map((d) => ({
    id: d.id,
    name: d.name,
    values: values.filter((v) => v.optionDefinitionId === d.id).map((v) => ({ id: v.id, label: v.label })),
  }));
}

/**
 * Seçenek tanimini ekler (id yoksa) ya da gunceller: ad ve sirali degerler.
 * Degerin adi duzeltilince her yerde degisir; urunde kullanilan deger
 * kaldirilamaz.
 */
export async function adminSaveOptionDefinition(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const values = parseValues(input.values);
  if (!values) return invalid();
  const draft: OptionDefinition = { id: text(input.id, 100), name: text(input.name, 100), values };
  await serialize(db, "catalog.option_definitions");
  const all = await readDefinitions(db);
  const problem = optionDefinitionError(draft, all);
  if (problem) return fail(400, problem);

  let before: OptionDefinition | undefined;
  if (draft.id) {
    const [found] = await db.select().from(s.optionDefinitions).where(eq(s.optionDefinitions.id, draft.id)).for("update");
    const row = checkRow(found, input, notFound, stale);
    if (isFailure(row)) return row;
    before = all.find((d) => d.id === row.id);
  }
  const id = before?.id ?? newId("opt");

  if (before) {
    const removed = before.values.filter((v) => !values.some((n) => n.id === v.id));
    if (removed.length) {
      const used = await db
        .select({ valueId: s.productVariantValues.optionValueId, n: countDistinct(s.productVariantValues.productId) })
        .from(s.productVariantValues)
        .where(
          and(
            eq(s.productVariantValues.optionDefinitionId, id),
            inArray(
              s.productVariantValues.optionValueId,
              removed.map((v) => v.id),
            ),
          ),
        )
        .groupBy(s.productVariantValues.optionValueId);
      if (used.length) {
        const value = removed.find((v) => v.id === used[0].valueId)!;
        return fail(409, optionValueInUseText(value.label, used[0].n));
      }
      await db.delete(s.optionValues).where(
        and(
          eq(s.optionValues.optionDefinitionId, id),
          inArray(
            s.optionValues.id,
            removed.map((v) => v.id),
          ),
        ),
      );
    }
    await db.update(s.optionDefinitions).set({ name: draft.name, updatedAt: at }).where(eq(s.optionDefinitions.id, id));
    // Degerlerin adlari yer degistirebilir (A<->B); tekil ad kurali araya takilmasin.
    await db
      .update(s.optionValues)
      .set({ label: sql`'~' || ${s.optionValues.id}` })
      .where(eq(s.optionValues.optionDefinitionId, id));
  } else {
    const [{ last }] = await db.select({ last: max(s.optionDefinitions.position) }).from(s.optionDefinitions);
    await db
      .insert(s.optionDefinitions)
      .values({ id, name: draft.name, position: (last ?? -1) + 1, createdAt: at, updatedAt: at });
  }
  for (const [position, v] of values.entries()) {
    await db
      .insert(s.optionValues)
      .values({ optionDefinitionId: id, id: v.id, label: v.label, position })
      .onConflictDoUpdate({
        target: [s.optionValues.optionDefinitionId, s.optionValues.id],
        set: { label: v.label, position },
      });
  }

  const next = { name: draft.name, values };
  const changes = before ? changedFields({ name: before.name, values: before.values }, next, ["name", "values"]) : next;
  if (!before || Object.keys(changes).length) {
    await writeAudit(
      db,
      actor,
      { action: before ? "update" : "create", entityType: "option_definitions", entityId: id, entityLabel: draft.name, changes },
      at,
    );
  }
  return { ...saved(at), id };
}

/** Urunde kullanilan tanim silinmez; kategorilerdeki baglantisi kalkar. */
export async function adminDeleteOptionDefinition(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.optionDefinitions).where(eq(s.optionDefinitions.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const [{ n }] = await db
    .select({ n: countDistinct(s.productOptions.productId) })
    .from(s.productOptions)
    .where(eq(s.productOptions.optionDefinitionId, row.id));
  if (n > 0) return fail(409, optionInUseText(row.name, n));

  const [definition] = (await readDefinitions(db)).filter((d) => d.id === row.id);
  const linked = await db
    .select({ id: s.categoryOptionDefinitions.categoryId })
    .from(s.categoryOptionDefinitions)
    .where(eq(s.categoryOptionDefinitions.optionDefinitionId, row.id));
  // Bu tanimi listeleyen kategoriler degisti: acik kategori formu eski listeyi geri yazmasin.
  if (linked.length) {
    await db
      .update(s.categories)
      .set({ updatedAt: at })
      .where(
        inArray(
          s.categories.id,
          linked.map((l) => l.id),
        ),
      );
  }
  await db.delete(s.optionDefinitions).where(eq(s.optionDefinitions.id, row.id));
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "option_definitions",
      entityId: row.id,
      entityLabel: row.name,
      changes: { name: row.name, values: definition?.values ?? [], categories: linked.map((l) => l.id) },
    },
    at,
  );
  return { ok: true };
}

/* ------------------------------ Kategoriler ------------------------------ */

const CATEGORY_FIELDS = [
  "name",
  "slug",
  "section",
  "group",
  "description",
  "aboutText",
  "image",
  "icon",
  "code",
  "seo",
  "optionIds",
  "filters",
] as const satisfies readonly (keyof Category)[];

/** Formdaki filtreler: kimlikler gecerli, filtre ve deger kimlikleri tekrarsiz; adlar kirpilir. */
function parseFilters(value: unknown): CategoryFilter[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) return null;
  const filters: CategoryFilter[] = [];
  for (const f of value) {
    const id = text(record(f).id, 80);
    const values = parseValues(record(f).values);
    if (!CATALOG_ID_PATTERN.test(id) || !values) return null;
    filters.push({ id, name: text(record(f).name, 120), values });
  }
  return new Set(filters.map((f) => f.id)).size === filters.length ? filters : null;
}

/** Eslesme tablosu: urun -> filtre degerleri (ve ekranin gordugu son degisiklik ani). */
function parseMapping(value: unknown): { productId: string; updatedAt: unknown; values: ProductFilterValues }[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 1000) return null;
  const rows = [];
  for (const m of value) {
    const productId = text(record(m).productId, 100);
    const raw = record(record(m).values);
    const values: ProductFilterValues = {};
    for (const [filterId, ids] of Object.entries(raw)) {
      if (!Array.isArray(ids)) return null;
      values[filterId] = ids.filter((x): x is string => typeof x === "string");
    }
    if (!productId) return null;
    rows.push({ productId, updatedAt: record(m).updatedAt, values });
  }
  return new Set(rows.map((r) => r.productId)).size === rows.length ? rows : null;
}

/** Filtreleri kayitli halden yeni hale getirir: yalnizca kaldirilan filtre ve degerler silinir (urunlerin eslesmesi korunur). */
async function writeFilters(db: AuditDb, categoryId: string, before: CategoryFilter[], next: CategoryFilter[]) {
  const removed = before.filter((f) => !next.some((n) => n.id === f.id)).map((f) => f.id);
  if (removed.length) {
    await db.delete(s.categoryFilters).where(and(eq(s.categoryFilters.categoryId, categoryId), inArray(s.categoryFilters.id, removed)));
  }
  // Adlar yer degistirebilir; tekil ad kurali araya takilmasin.
  await db.update(s.categoryFilters).set({ name: sql`'~' || ${s.categoryFilters.id}` }).where(eq(s.categoryFilters.categoryId, categoryId));
  await db
    .update(s.categoryFilterValues)
    .set({ label: sql`'~' || ${s.categoryFilterValues.id}` })
    .where(eq(s.categoryFilterValues.categoryId, categoryId));
  for (const [position, f] of next.entries()) {
    await db
      .insert(s.categoryFilters)
      .values({ categoryId, id: f.id, name: f.name, position })
      .onConflictDoUpdate({ target: [s.categoryFilters.categoryId, s.categoryFilters.id], set: { name: f.name, position } });
    const old = before.find((b) => b.id === f.id);
    const gone = (old?.values ?? []).filter((v) => !f.values.some((n) => n.id === v.id)).map((v) => v.id);
    if (gone.length) {
      await db
        .delete(s.categoryFilterValues)
        .where(
          and(
            eq(s.categoryFilterValues.categoryId, categoryId),
            eq(s.categoryFilterValues.filterId, f.id),
            inArray(s.categoryFilterValues.id, gone),
          ),
        );
    }
    for (const [valuePosition, v] of f.values.entries()) {
      await db
        .insert(s.categoryFilterValues)
        .values({ categoryId, filterId: f.id, id: v.id, label: v.label, position: valuePosition })
        .onConflictDoUpdate({
          target: [s.categoryFilterValues.categoryId, s.categoryFilterValues.filterId, s.categoryFilterValues.id],
          set: { label: v.label, position: valuePosition },
        });
    }
  }
}

/** Urunun bu kategorideki filtre degerlerini yazar. */
async function writeProductFilters(db: AuditDb, productId: string, categoryId: string, values: ProductFilterValues | undefined) {
  await db
    .delete(s.productFilterValues)
    .where(and(eq(s.productFilterValues.productId, productId), eq(s.productFilterValues.categoryId, categoryId)));
  const rows = Object.entries(values ?? {}).flatMap(([filterId, ids]) =>
    ids.map((valueId) => ({ productId, categoryId, filterId, valueId })),
  );
  if (rows.length) await db.insert(s.productFilterValues).values(rows);
}

/** Filtre degerlerinin sirasiz karsilastirma anahtari (tablodan okunan degerler sirasizdir). */
const valuesKey = (values: ProductFilterValues | undefined) =>
  Object.entries(values ?? {})
    .filter(([, ids]) => ids.length > 0)
    .map(([filterId, ids]) => `${filterId}=${[...ids].sort().join(",")}`)
    .sort()
    .join("&");
const sameValues = (a: ProductFilterValues | undefined, b: ProductFilterValues | undefined) => valuesKey(a) === valuesKey(b);

/**
 * Kategoriyi ekler (id yoksa) ya da gunceller: temel bilgiler, secenek
 * havuzu, filtreler, eslesme tablosu ve SEO.
 * - Link ya da grup degisince eski adres yeni adrese yonlenir.
 * - Kaldirilan filtre ve deger urunlerden de kalkar.
 * - Eslesme tablosunda degistirilen urun bu arada degismisse kaydedilmez.
 */
export async function adminSaveCategory(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const filters = parseFilters(input.filters);
  const mapping = parseMapping(input.mapping);
  const seo = parseSeo(input.seo);
  if (!filters || !mapping || seo === null) return invalid();
  const name = text(input.name, 200);
  const slug = text(input.slug, 120);
  const image = text(input.image, 2000);
  const icon = text(input.icon, 2000);
  if (!name) return fail(400, "Kategori adı zorunludur.");
  if (!validSlug(slug)) return invalid();
  if (isUploadedFile(image) || isUploadedFile(icon)) return fail(400, tr.panel.uploadDisabled);
  const filterProblem = categoryFiltersError(filters);
  if (filterProblem) return fail(400, filterProblem);
  const optionIds = Array.isArray(input.optionIds)
    ? [...new Set(input.optionIds.filter((x): x is string => typeof x === "string"))]
    : [];

  const groupId = text(input.groupId, 100);
  const [group] = groupId ? await db.select().from(s.categoryGroups).where(eq(s.categoryGroups.id, groupId)) : [];
  if (!group) return fail(400, "Bir grup seçin.");
  if (optionIds.length) {
    const existing = await db
      .select({ id: s.optionDefinitions.id })
      .from(s.optionDefinitions)
      .where(inArray(s.optionDefinitions.id, optionIds));
    if (existing.length !== optionIds.length) return fail(400, tr.panel.optionsMissing);
  }

  await serialize(db, "catalog.categories");
  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.categories.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.categories).where(eq(s.categories.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const id = row?.id ?? newId("c");
  const [clash] = await db
    .select({ name: s.categories.name })
    .from(s.categories)
    .where(and(eq(s.categories.slug, slug), ne(s.categories.id, id)));
  if (clash) return fail(409, categorySlugTakenText(slug, clash.name));

  const catalog = await readCatalog(db);
  const before = catalog.categories.find((c) => c.id === id);
  const products = before ? catalog.products.filter((p) => p.categorySlug === before.slug) : [];

  // Eslesme tablosundaki urunler kilitlenir; ekran acildiktan sonra degismisse kaydedilmez.
  for (const m of mapping) {
    if (!products.some((p) => p.id === m.productId)) return invalid();
    const [productRow] = await db.select().from(s.products).where(eq(s.products.id, m.productId)).for("update");
    const checked = checkRow(productRow, m, notFound, stale);
    if (isFailure(checked)) return checked;
  }

  const description = text(input.description, 2000);
  const aboutText = text(input.aboutText, 20000);
  const code = text(input.code, 40);
  const columns = {
    groupId: group.id,
    slug,
    name,
    description,
    aboutText: aboutText || null,
    image: image || null,
    icon: icon || null,
    code: code || null,
    seo: seo ?? null,
    updatedAt: at,
  };
  const section = group.section as TopLevelSection;
  const newPath = categoryHref({ section, group: group.slug, slug });
  if (row) {
    await db.update(s.categories).set(columns).where(eq(s.categories.id, id));
    await movePath(db, categoryHref(before!), newPath, "category", id);
  } else {
    const [{ last }] = await db
      .select({ last: max(s.categories.position) })
      .from(s.categories)
      .where(eq(s.categories.groupId, group.id));
    await db.insert(s.categories).values({ id, ...columns, position: (last ?? 0) + 1, createdAt: at });
    await releasePath(db, newPath);
  }

  await db.delete(s.categoryOptionDefinitions).where(eq(s.categoryOptionDefinitions.categoryId, id));
  if (optionIds.length) {
    await db
      .insert(s.categoryOptionDefinitions)
      .values(optionIds.map((optionDefinitionId, position) => ({ categoryId: id, optionDefinitionId, position })));
  }
  await writeFilters(db, id, before?.filters ?? [], filters);

  // Kaldirilan filtre/deger urunlerden de kalkti (tablo kurali): o urunler de degismis sayilir.
  const mapped = new Map(mapping.map((m) => [m.productId, m.values]));
  const tidied = products.filter((p) => !mapped.has(p.id) && !sameValues(p.filterValues, tidyFilterValues(p.filterValues, filters)));
  if (tidied.length) {
    await db
      .update(s.products)
      .set({ updatedAt: at })
      .where(
        inArray(
          s.products.id,
          tidied.map((p) => p.id),
        ),
      );
  }
  for (const p of products) {
    if (!mapped.has(p.id)) continue;
    const next = tidyFilterValues(mapped.get(p.id), filters);
    if (sameValues(p.filterValues, next)) continue;
    await writeProductFilters(db, p.id, id, next);
    await db.update(s.products).set({ updatedAt: at }).where(eq(s.products.id, p.id));
    await writeAudit(
      db,
      actor,
      {
        action: "update",
        entityType: "products",
        entityId: p.id,
        entityLabel: p.name,
        changes: { filterValues: [p.filterValues ?? null, next ?? null] },
      },
      at,
    );
  }

  const after: Category = {
    id,
    slug,
    section,
    group: group.slug,
    name,
    description,
    aboutText: aboutText || undefined,
    image: image || undefined,
    icon: icon || undefined,
    code: code || undefined,
    seo,
    order: before?.order ?? 0,
    optionIds: optionIds.length ? optionIds : undefined,
    filters: filters.length ? filters : undefined,
  };
  const changes = before
    ? changedFields(before, after, CATEGORY_FIELDS)
    : Object.fromEntries(CATEGORY_FIELDS.map((key) => [key, after[key] ?? null]));
  if (!before || Object.keys(changes).length) {
    await writeAudit(
      db,
      actor,
      { action: before ? "update" : "create", entityType: "categories", entityId: id, entityLabel: name, changes },
      at,
    );
  }
  return { ...saved(at), id };
}

/** Urunu olan kategori silinmez. Kuponlardaki secimi ve eski adreslerinin yonlendirmesi de kalkar. */
export async function adminDeleteCategory(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.categories).where(eq(s.categories.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const [{ n }] = await db.select({ n: count() }).from(s.products).where(eq(s.products.categoryId, row.id));
  if (n > 0) return fail(409, CATEGORY_HAS_PRODUCTS);
  const before = (await readCatalog(db)).categories.find((c) => c.id === row.id);
  await db.delete(s.redirects).where(and(eq(s.redirects.targetType, "category"), eq(s.redirects.targetId, row.id)));
  await db.delete(s.categories).where(eq(s.categories.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "categories", entityId: row.id, entityLabel: row.name, changes: before ? { ...before } : undefined },
    at,
  );
  return { ok: true };
}

/** Kategoriyi grubunda bir yukari (-1) ya da asagi (+1) tasir. Kaydin icerigi degismez. */
export async function adminMoveCategory(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const step = direction(input.direction);
  if (!step) return invalid();
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.categories).where(eq(s.categories.id, id)) : [];
  if (!row) return fail(404, notFound);
  const siblings = await db
    .select({ id: s.categories.id, name: s.categories.name, position: s.categories.position })
    .from(s.categories)
    .where(eq(s.categories.groupId, row.groupId))
    .orderBy(s.categories.position, s.categories.id)
    .for("update");
  for (const change of reorder(siblings, row.id, step)) {
    await db.update(s.categories).set({ position: change.after }).where(eq(s.categories.id, change.id));
    const name = siblings.find((x) => x.id === change.id)!.name;
    await writeAudit(
      db,
      actor,
      { action: "update", entityType: "categories", entityId: change.id, entityLabel: name, changes: { position: [change.before, change.after] } },
      at,
    );
  }
  return { ok: true };
}

/* ------------------------------ Gruplar ------------------------------ */

const GROUP_FIELDS = ["name", "slug", "section", "description", "aboutText", "image", "code", "seo"] as const satisfies readonly (keyof CategoryGroup)[];

/**
 * Grubu ekler (id yoksa) ya da gunceller. Kayitli grubun bolumu degismez.
 * Link degisince grubun ve altindaki her kategorinin eski adresi yeni
 * adrese yonlenir.
 */
export async function adminSaveGroup(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const seo = parseSeo(input.seo);
  if (seo === null) return invalid();
  const name = text(input.name, 200);
  const slug = text(input.slug, 120);
  const image = text(input.image, 2000);
  if (!name) return fail(400, "Grup adı zorunludur.");
  if (!validSlug(slug)) return invalid();
  if (isUploadedFile(image)) return fail(400, tr.panel.uploadDisabled);

  await serialize(db, "catalog.category_groups");
  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.categoryGroups.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.categoryGroups).where(eq(s.categoryGroups.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const section = (row?.section ?? SECTIONS.find((x) => x === input.section)) as TopLevelSection | undefined;
  if (!section) return invalid();
  const id = row?.id ?? newId("g");
  const [clash] = await db
    .select({ name: s.categoryGroups.name })
    .from(s.categoryGroups)
    .where(and(eq(s.categoryGroups.section, section), eq(s.categoryGroups.slug, slug), ne(s.categoryGroups.id, id)));
  if (clash) return fail(409, groupSlugTakenText(slug, clash.name));

  const catalog = await readCatalog(db);
  const before = catalog.categoryGroups.find((g) => g.id === id);
  const description = text(input.description, 2000);
  const aboutText = text(input.aboutText, 20000);
  const code = text(input.code, 40);
  const columns = {
    slug,
    name,
    description: description || null,
    aboutText: aboutText || null,
    image: image || null,
    code: code || null,
    seo: seo ?? null,
    updatedAt: at,
  };
  const newPath = groupHref({ section, slug });
  if (row && before) {
    await db.update(s.categoryGroups).set(columns).where(eq(s.categoryGroups.id, id));
    await movePath(db, groupHref(before), newPath, "group", id);
    if (before.slug !== slug) {
      for (const c of catalog.categories.filter((x) => x.section === section && x.group === before.slug)) {
        await movePath(db, categoryHref(c), categoryHref({ ...c, group: slug }), "category", c.id);
      }
    }
  } else {
    const [{ last }] = await db
      .select({ last: max(s.categoryGroups.position) })
      .from(s.categoryGroups)
      .where(eq(s.categoryGroups.section, section));
    await db.insert(s.categoryGroups).values({ id, section, ...columns, position: (last ?? 0) + 1, createdAt: at });
    await releasePath(db, newPath);
  }

  const after: CategoryGroup = {
    id,
    section,
    slug,
    name,
    description: description || undefined,
    aboutText: aboutText || undefined,
    image: image || undefined,
    code: code || undefined,
    seo,
    order: before?.order ?? 0,
  };
  const changes = before
    ? changedFields(before, after, GROUP_FIELDS)
    : Object.fromEntries(GROUP_FIELDS.map((key) => [key, after[key] ?? null]));
  if (!before || Object.keys(changes).length) {
    await writeAudit(
      db,
      actor,
      { action: before ? "update" : "create", entityType: "category_groups", entityId: id, entityLabel: name, changes },
      at,
    );
  }
  return { ...saved(at), id };
}

/** Kategorisi olan grup silinmez. */
export async function adminDeleteGroup(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.categoryGroups).where(eq(s.categoryGroups.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const [{ n }] = await db.select({ n: count() }).from(s.categories).where(eq(s.categories.groupId, row.id));
  if (n > 0) return fail(409, GROUP_HAS_CATEGORIES);
  const before = (await readCatalog(db)).categoryGroups.find((g) => g.id === row.id);
  await db.delete(s.redirects).where(and(eq(s.redirects.targetType, "group"), eq(s.redirects.targetId, row.id)));
  await db.delete(s.categoryGroups).where(eq(s.categoryGroups.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "delete", entityType: "category_groups", entityId: row.id, entityLabel: row.name, changes: before ? { ...before } : undefined },
    at,
  );
  return { ok: true };
}

/** Grubu bolumunde bir yukari (-1) ya da asagi (+1) tasir. Kaydin icerigi degismez. */
export async function adminMoveGroup(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const step = direction(input.direction);
  if (!step) return invalid();
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.categoryGroups).where(eq(s.categoryGroups.id, id)) : [];
  if (!row) return fail(404, notFound);
  const siblings = await db
    .select({ id: s.categoryGroups.id, name: s.categoryGroups.name, position: s.categoryGroups.position })
    .from(s.categoryGroups)
    .where(eq(s.categoryGroups.section, row.section))
    .orderBy(s.categoryGroups.position, s.categoryGroups.id)
    .for("update");
  for (const change of reorder(siblings, row.id, step)) {
    await db.update(s.categoryGroups).set({ position: change.after }).where(eq(s.categoryGroups.id, change.id));
    const name = siblings.find((x) => x.id === change.id)!.name;
    await writeAudit(
      db,
      actor,
      { action: "update", entityType: "category_groups", entityId: change.id, entityLabel: name, changes: { position: [change.before, change.after] } },
      at,
    );
  }
  return { ok: true };
}

/* ------------------------------ Urunler ------------------------------ */

const PROCESSES: readonly WeldingProcess[] = ["MIG", "MAG", "TIG", "MMA", "PULSE", "PLAZMA", "MULTI"];

const PRODUCT_FIELDS = [
  "name",
  "slug",
  "sku",
  "modelCode",
  "brand",
  "section",
  "categorySlug",
  "processes",
  "shortDescription",
  "description",
  "priceExVat",
  "vatRate",
  "discount",
  "images",
  "specs",
  "inTheBox",
  "highlights",
  "options",
  "isNew",
  "order",
  "manualUrl",
  "warrantyMonths",
  "active",
  "seo",
] as const satisfies readonly (keyof Product)[];

/** Varyant kimligi: deger kimliklerinden uretilir ("su-sogutmali_8-m"). */
const VARIANT_ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const texts = (value: unknown, max: number, limit = 200): string[] | null =>
  Array.isArray(value) && value.length <= limit ? value.map((x) => text(x, max)) : null;

/** Teknik ozellik satirlari. */
function parseSpecs(value: unknown): SpecRow[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 200) return null;
  return value.map((r) => ({ label: text(record(r).label, 200), value: text(record(r).value, 2000) }));
}

/** Para: 0 ya da artı, en fazla iki ondalık (kolon numeric(12,2)). */
const money = (value: unknown, allowNegative = false): number | null =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) < 1e10 && (allowNegative || value >= 0)
    ? Math.round(value * 100) / 100
    : null;

const isoOrUndefined = (value: unknown): string | undefined | null => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Kampanya: yoksa ya da oran 0 ise kampanya yok. */
function parseDiscount(value: unknown): ProductDiscount | undefined | null {
  if (value === undefined || value === null) return undefined;
  const input = record(value);
  if (input.percent === 0 || input.percent === undefined) return undefined;
  const startsAt = isoOrUndefined(input.startsAt);
  const endsAt = isoOrUndefined(input.endsAt);
  if (typeof input.percent !== "number" || startsAt === null || endsAt === null) return null;
  return { percent: input.percent, ...(startsAt && { startsAt }), ...(endsAt && { endsAt }) };
}

/** Secenekler ve kombinasyonlar (formun gonderdigi hal; kurallar optionsError'da). */
function parseOptions(value: unknown): ProductOptions | undefined | null {
  if (value === undefined || value === null) return undefined;
  const input = record(value);
  const optionIds = texts(input.optionIds, 100, 10);
  if (!optionIds || !Array.isArray(input.variants) || input.variants.length > 500) return null;
  const variants = [];
  for (const v of input.variants) {
    const row = record(v);
    const id = text(row.id, 200);
    const delta = money(row.priceDeltaExVat ?? 0, true);
    const values: Record<string, string> = {};
    for (const [definitionId, valueId] of Object.entries(record(row.values))) {
      if (typeof valueId !== "string") return null;
      values[definitionId] = valueId;
    }
    const specOverrides = row.specOverrides === undefined ? undefined : parseSpecs(row.specOverrides);
    const inTheBox = row.inTheBox === undefined ? undefined : texts(row.inTheBox, 500);
    if (!VARIANT_ID_PATTERN.test(id) || delta === null || specOverrides === null || inTheBox === null) return null;
    variants.push({
      id,
      values,
      sku: text(row.sku, 100),
      priceDeltaExVat: delta,
      ...(specOverrides && { specOverrides }),
      ...(inTheBox && { inTheBox }),
      ...(text(row.image, 2000) && { image: text(row.image, 2000) }),
    });
  }
  if (new Set(variants.map((v) => v.id)).size !== variants.length) return null;
  return { optionIds, variants };
}

/** Kombinasyon, eski ayri urun linkleri olmadan (linkler kayitli halden alinir). */
function withoutPreviousSlugs(variant: ProductVariant): ProductVariant {
  const copy = { ...variant };
  delete copy.previousSlugs;
  return copy;
}

/** Islem kaydi icin secenekler: eski ayri urunlerin linkleri (yonlendirme) haric. */
const optionsForAudit = (options: ProductOptions | undefined) =>
  options && {
    optionIds: options.optionIds,
    variants: options.variants.map((v) => withoutPreviousSlugs(v)),
  };

/** Urunun tablolardaki son hali ve kategorisi. */
async function productParts(db: AuditDb, id: string) {
  const catalog = await readCatalog(db);
  return { catalog, product: catalog.products.find((p) => p.id === id) };
}

/**
 * Urunu ekler (id yoksa) ya da gunceller: temel bilgiler, fiyat ve
 * kampanya, aciklamalar, gorseller (adres; yuklenmis dosya kabul edilmez,
 * K-101), teknik ozellikler, kutu icerigi, secenekler ve kombinasyonlar,
 * filtre degerleri, SEO.
 * - Urun ve kombinasyon kodlari tek havuzda benzersizdir; link urunler
 *   arasinda benzersizdir.
 * - Link degisince eski adres yeni adrese yonlenir.
 * - Kaldirilan kombinasyonun (secenek listesi degistiyse butun
 *   kombinasyonlarin) bayi/satici stok satirlari ve kod eslesmeleri silinir.
 * - Degisiklik yoksa hicbir sey yazilmaz.
 */
export async function adminSaveProduct(
  db: AuditDb,
  actor: Actor,
  input: Input,
  at: Date,
): Promise<PanelResult<{ id: string } & Saved>> {
  const seo = parseSeo(input.seo);
  const discount = parseDiscount(input.discount);
  const options = parseOptions(input.options);
  const specs = parseSpecs(input.specs);
  const inTheBox = texts(input.inTheBox, 500);
  const highlights = texts(input.highlights, 500);
  const priceExVat = money(input.priceExVat);
  const vatRate = typeof input.vatRate === "number" && input.vatRate >= 0 && input.vatRate <= 100 ? input.vatRate : null;
  const warrantyMonths = Number.isInteger(input.warrantyMonths) && (input.warrantyMonths as number) >= 0 ? (input.warrantyMonths as number) : null;
  const order = input.order === undefined || input.order === null ? undefined : Number.isInteger(input.order) && (input.order as number) >= 1 ? (input.order as number) : null;
  const images = Array.isArray(input.images) && input.images.length <= 50
    ? input.images.map((i): ProductImage => ({ url: text(record(i).url, 2000), alt: text(record(i).alt, 300) }))
    : null;
  const filterValues: ProductFilterValues = {};
  for (const [filterId, ids] of Object.entries(record(input.filterValues))) {
    if (!Array.isArray(ids)) return invalid();
    filterValues[filterId] = ids.filter((x): x is string => typeof x === "string");
  }
  if (
    seo === null ||
    discount === null ||
    options === null ||
    !specs ||
    !inTheBox ||
    !highlights ||
    !images ||
    images.some((i) => !i.url) ||
    priceExVat === null ||
    vatRate === null ||
    warrantyMonths === null ||
    order === null ||
    typeof input.isNew !== "boolean" ||
    typeof input.active !== "boolean"
  ) {
    return invalid();
  }
  const name = text(input.name, 300);
  const slug = text(input.slug, 200);
  const sku = text(input.sku, 100);
  if (!name) return fail(400, "Ürün adı zorunludur.");
  if (!normalizeCode(sku)) return fail(400, "Ürün kodu zorunludur.");
  if (!validSlug(slug)) return invalid();
  if (images.some((i) => isUploadedFile(i.url))) return fail(400, tr.panel.uploadDisabled);
  if (discount) {
    const problem = validateDiscount(discount);
    if (problem) return fail(400, problem);
  }

  // Kod ve link tekilligi: urun kayitlari sirayla yapilir.
  await serialize(db, "catalog.products");
  const isNew = input.id === undefined || input.id === null || input.id === "";
  let row: typeof s.products.$inferSelect | undefined;
  if (!isNew) {
    const id = text(input.id, 100);
    const [found] = id ? await db.select().from(s.products).where(eq(s.products.id, id)).for("update") : [];
    const checked = checkRow(found, input, notFound, stale);
    if (isFailure(checked)) return checked;
    row = checked;
  }
  const id = row?.id ?? newId("p");
  const { catalog, product: before } = await productParts(db, id);
  const category = catalog.categories.find((c) => c.slug === text(input.categorySlug, 200));
  if (!category) return fail(400, tr.panel.categoryMissing);
  const [categoryRow] = await db.select({ id: s.categories.id }).from(s.categories).where(eq(s.categories.id, category.id));

  const draft: Product = {
    id,
    slug,
    sku,
    name,
    modelCode: text(input.modelCode, 100) || undefined,
    brand: text(input.brand, 100) || undefined,
    section: category.section,
    categorySlug: category.slug,
    processes: (texts(input.processes, 20, 10) ?? []).filter((x): x is WeldingProcess => PROCESSES.includes(x as WeldingProcess)),
    shortDescription: text(input.shortDescription, 2000),
    description: text(input.description, 100000),
    priceExVat,
    vatRate,
    currency: "TRY",
    images,
    specs,
    inTheBox,
    highlights,
    discount,
    options,
    isNew: input.isNew,
    order,
    manualUrl: text(input.manualUrl, 2000) || undefined,
    warrantyMonths,
    createdAt: before?.createdAt ?? iso(at),
    updatedAt: iso(at),
    active: input.active,
    seo,
  };
  const codeProblem = productCodeError(draft, catalog.products);
  if (codeProblem) return fail(409, codeProblem);
  const clash = catalog.products.find((p) => p.id !== id && p.slug === slug);
  if (clash) return fail(409, productSlugTakenText(slug, clash.name));
  const optionsProblem = optionsError(draft, catalog.optionDefinitions, catalog.products);
  if (optionsProblem) return fail(400, optionsProblem);

  // Eski ayri urunlerin linkleri (kombinasyona yonlenenler) kayitli halden alinir.
  const tidy = tidyOptions(draft);
  const previous = new Map((before?.options?.variants ?? []).map((v) => [v.id, v.previousSlugs]));
  const nextOptions: ProductOptions | undefined = tidy && {
    optionIds: tidy.optionIds,
    variants: tidy.variants.map((v) => ({
      ...withoutPreviousSlugs(v),
      ...(previous.get(v.id)?.length && { previousSlugs: previous.get(v.id) }),
    })),
  };
  const nextFilters = tidyFilterValues(filterValues, category.filters);
  const after: Product = { ...draft, options: nextOptions, filterValues: nextFilters };

  // SEO alanlari ayni bicimde karsilastirilir (bos alan yazilmaz).
  const compare = (p: Product) => ({ ...p, options: optionsForAudit(p.options), seo: parseSeo(p.seo) ?? undefined });
  const changes = before
    ? {
        ...changedFields(compare(before), compare(after), PRODUCT_FIELDS),
        ...(!sameValues(before.filterValues, nextFilters) && { filterValues: [before.filterValues ?? null, nextFilters ?? null] }),
      }
    : Object.fromEntries([...PRODUCT_FIELDS, "filterValues" as const].map((key) => [key, compare(after)[key] ?? null]));
  if (row && !Object.keys(changes).length) return { ...unchanged(row), id };

  const columns = {
    slug,
    sku,
    name,
    categoryId: categoryRow.id,
    modelCode: draft.modelCode ?? null,
    brand: draft.brand ?? null,
    shortDescription: draft.shortDescription,
    description: draft.description,
    priceExVat,
    vatRate,
    discountPercent: discount?.percent ?? null,
    discountStartsAt: discount?.startsAt ? new Date(discount.startsAt) : null,
    discountEndsAt: discount?.endsAt ? new Date(discount.endsAt) : null,
    images,
    specs,
    inTheBox,
    highlights,
    processes: draft.processes,
    isNew: draft.isNew,
    manualUrl: draft.manualUrl ?? null,
    warrantyMonths,
    active: draft.active,
    seo: seo ?? null,
    updatedAt: at,
  };
  if (row) {
    // Kombinasyonlar yeniden yazilir: kodlar urunler ve kombinasyonlar arasinda yer degistirebilir.
    await db.delete(s.productVariants).where(eq(s.productVariants.productId, id));
    await db.delete(s.productOptions).where(eq(s.productOptions.productId, id));
    await db.update(s.products).set({ ...columns, position: order ?? null }).where(eq(s.products.id, id));
  } else {
    const [{ last }] = await db
      .select({ last: max(s.products.position) })
      .from(s.products)
      .where(eq(s.products.categoryId, categoryRow.id));
    after.order = order ?? (last ?? 0) + 1;
    await db.insert(s.products).values({ id, ...columns, position: after.order, createdAt: at });
  }

  if (nextOptions) {
    await db
      .insert(s.productOptions)
      .values(nextOptions.optionIds.map((optionDefinitionId, position) => ({ productId: id, optionDefinitionId, position })));
    await db.insert(s.productVariants).values(
      nextOptions.variants.map((v, position) => ({
        productId: id,
        id: v.id,
        combinationKey: combinationKey(nextOptions.optionIds, v.values),
        sku: v.sku,
        priceDeltaExVat: v.priceDeltaExVat,
        specOverrides: v.specOverrides ?? null,
        inTheBox: v.inTheBox ?? null,
        image: v.image ?? null,
        position,
      })),
    );
    await db.insert(s.productVariantValues).values(
      nextOptions.variants.flatMap((v) =>
        nextOptions.optionIds.map((optionDefinitionId) => ({
          productId: id,
          variantId: v.id,
          optionDefinitionId,
          optionValueId: v.values[optionDefinitionId],
        })),
      ),
    );
    // Kombinasyonun silinmesi onun eski ayri urun linklerini de sildi; kalan kombinasyonlarinki geri yazilir.
    const kept = nextOptions.variants.flatMap((v) =>
      (v.previousSlugs ?? []).map((old) => ({ oldPath: `/urun/${old}`, targetType: "product", targetId: id, variantId: v.id })),
    );
    if (kept.length) await db.insert(s.redirects).values(kept).onConflictDoNothing();
  }

  const path = `/urun/${slug}`;
  if (before) await movePath(db, `/urun/${before.slug}`, path, "product", id);
  else await releasePath(db, path);

  await db.delete(s.productFilterValues).where(eq(s.productFilterValues.productId, id));
  const filterRows = Object.entries(nextFilters ?? {}).flatMap(([filterId, ids]) =>
    ids.map((valueId) => ({ productId: id, categoryId: categoryRow.id, filterId, valueId })),
  );
  if (filterRows.length) await db.insert(s.productFilterValues).values(filterRows);

  if (before) {
    // Kaldirilan kombinasyonlarin stok satirlari ve kod eslesmeleri silinir. Secenek listesi
    // degistiyse hepsi: iki tanimda ayni kimlikli deger ("3-m") olabilir, eski stok yeni
    // kombinasyonun sanilmasin. Butun kombinasyonlar icin girilmis satirlar (variant_id bos) kalir.
    const sameOptions = (before.options?.optionIds ?? []).join("|") === (nextOptions?.optionIds ?? []).join("|");
    const keep = sameOptions ? (nextOptions?.variants ?? []).map((v) => v.id) : [];
    for (const table of [s.dealerStock, s.retailerStock, s.skuAliases]) {
      await db
        .delete(table)
        .where(
          and(
            eq(table.productId, id),
            ne(table.variantId, ""),
            ...(keep.length ? [sql`${table.variantId} NOT IN (${sql.join(keep.map((k) => sql`${k}`), sql`, `)})`] : []),
          ),
        );
    }
  }

  await writeAudit(
    db,
    actor,
    {
      action: before ? "update" : "create",
      entityType: "products",
      entityId: id,
      entityLabel: name,
      changes: before ? changes : { ...changes, order: after.order ?? null },
    },
    at,
  );
  return { ...saved(at), id };
}

/** Urunu yayina alir ya da yayindan kaldirir (Ürünler listesindeki goz). */
export async function adminSetProductActive(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  if (typeof input.active !== "boolean") return invalid();
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.products).where(eq(s.products.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  if (row.active === input.active) return unchanged(row);
  await db.update(s.products).set({ active: input.active, updatedAt: at }).where(eq(s.products.id, row.id));
  await writeAudit(
    db,
    actor,
    { action: "update", entityType: "products", entityId: row.id, entityLabel: row.name, changes: { active: [row.active, input.active] } },
    at,
  );
  return saved(at);
}

/**
 * Urunu siler. Bagli kayitlar tablo kurallariyla temizlenir: secenekleri,
 * kombinasyonlari, filtre degerleri, bayi/satici stok satirlari, kod
 * eslesmeleri, favoriler, kuponlardaki secimi ve eski linkleri silinir;
 * belgelerdeki baglantisi bosalir. Gecmis siparis, teklif, yorum, servis ve
 * garanti kayitlarindaki ad ve kod kopyasi kalir.
 */
export async function adminDeleteProduct(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult> {
  const id = text(input.id, 100);
  const [found] = id ? await db.select().from(s.products).where(eq(s.products.id, id)).for("update") : [];
  const row = checkRow(found, input, notFound, stale);
  if (isFailure(row)) return row;
  const { product } = await productParts(db, row.id);
  await db.delete(s.products).where(eq(s.products.id, row.id));
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "products",
      entityId: row.id,
      entityLabel: row.name,
      changes: product ? { ...product, options: optionsForAudit(product.options) } : undefined,
    },
    at,
  );
  return { ok: true };
}
