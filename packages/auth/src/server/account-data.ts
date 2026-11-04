import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, inArray, max, ne } from "drizzle-orm";
import type { Address } from "@zenweld/data";
import { addressRecord, schema } from "@zenweld/db";
import { tr } from "@zenweld/i18n";
import { ACCOUNT_LIMITS, AUTH_ERRORS } from "../rules";
import type { AccountFailure } from "./accounts";
import type { AuthDb } from "./session";

/**
 * UYENIN ADRESLERI VE FAVORILERI (yalnizca sunucu; Asama 5.1, KARARLAR K-96)
 *
 * Adres: ilk adres varsayilandir; varsayilan silinince kalan ilk adres
 * varsayilan olur; adresi yalnizca sahibi degistirir; uye basina en fazla
 * 20 adres. Degistiren islemler bir islem (transaction) icinde cagrilir ve
 * once uyenin satirini kilitler: ayni uyeden ayni anda gelen iki istek (ör.
 * iki sekme) sirayla calisir; ikisi birden varsayilan olmaz, sinir asilmaz.
 *
 * Favori: uye basina en fazla 500; yalnizca var olan urunler. Ayni urun iki
 * kez eklenmez. Urun silinince favorilerden de silinir (veritabani).
 */

const ERRORS = tr.account.errors;
const fail = (status: AccountFailure["status"], error: string): AccountFailure => ({ ok: false, status, error });
const text = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Uyenin satirini islem bitene kadar kilitler (yukaridaki aciklama). */
async function lockMember(db: AuthDb, userId: string): Promise<void> {
  await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).for("update");
}

/* ------------------------------ Adresler ------------------------------ */

/** Uyenin adresleri: varsayilan once, sonra eklenme sirasi. */
export async function listAddresses(db: AuthDb, userId: string): Promise<Address[]> {
  const rows = await db
    .select()
    .from(schema.addresses)
    .where(eq(schema.addresses.userId, userId))
    .orderBy(desc(schema.addresses.isDefault), asc(schema.addresses.createdAt), asc(schema.addresses.id));
  return rows.map(addressRecord);
}

type AddressResult = Promise<{ ok: true; addresses: Address[] } | AccountFailure>;

/** Yeni adres (id yoksa) ya da uyenin kendi adresinin duzenlenmesi. */
export async function saveAddress(db: AuthDb, userId: string, input: Record<string, unknown>): AddressResult {
  const fields = {
    title: text(input.title, 80),
    fullName: text(input.fullName),
    phone: text(input.phone, 40),
    city: text(input.city, 80),
    district: text(input.district, 80),
    line: text(input.line, 500),
  };
  if (Object.values(fields).some((v) => !v)) return fail(400, AUTH_ERRORS.missingFields);
  await lockMember(db, userId);
  const now = new Date();

  if (typeof input.id === "string" && input.id) {
    const updated = await db
      .update(schema.addresses)
      .set({ ...fields, updatedAt: now })
      .where(and(eq(schema.addresses.id, input.id), eq(schema.addresses.userId, userId)))
      .returning({ id: schema.addresses.id });
    if (updated.length === 0) return fail(400, ERRORS.addressNotFound);
    return { ok: true, addresses: await listAddresses(db, userId) };
  }

  const [{ n, last }] = await db
    .select({ n: count(), last: max(schema.addresses.createdAt) })
    .from(schema.addresses)
    .where(eq(schema.addresses.userId, userId));
  if (n >= ACCOUNT_LIMITS.addresses) return fail(400, ERRORS.addressLimit.replace("{max}", String(ACCOUNT_LIMITS.addresses)));
  // Siralama eklenme anina gore: ayni milisaniyede eklense de yeni adres sonda.
  const createdAt = last && last >= now ? new Date(last.getTime() + 1) : now;
  await db.insert(schema.addresses).values({
    id: `adr-${randomBytes(6).toString("hex")}`,
    userId,
    ...fields,
    isDefault: n === 0,
    createdAt,
    updatedAt: now,
  });
  return { ok: true, addresses: await listAddresses(db, userId) };
}

/** Adresi siler; varsayilan silinirse kalan ilk adres varsayilan olur. */
export async function deleteAddress(db: AuthDb, userId: string, addressId: unknown): AddressResult {
  if (typeof addressId !== "string") return fail(400, ERRORS.addressNotFound);
  await lockMember(db, userId);
  const [removed] = await db
    .delete(schema.addresses)
    .where(and(eq(schema.addresses.id, addressId), eq(schema.addresses.userId, userId)))
    .returning({ isDefault: schema.addresses.isDefault });
  if (!removed) return fail(400, ERRORS.addressNotFound);
  if (removed.isDefault) {
    const [next] = await listAddresses(db, userId);
    if (next) await db.update(schema.addresses).set({ isDefault: true }).where(eq(schema.addresses.id, next.id));
  }
  return { ok: true, addresses: await listAddresses(db, userId) };
}

/** Odeme sayfasinda ilk secili gelen adres. */
export async function setDefaultAddress(db: AuthDb, userId: string, addressId: unknown): AddressResult {
  if (typeof addressId !== "string") return fail(400, ERRORS.addressNotFound);
  await lockMember(db, userId);
  const [target] = await db
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(and(eq(schema.addresses.id, addressId), eq(schema.addresses.userId, userId)));
  if (!target) return fail(400, ERRORS.addressNotFound);
  // Once digerleri: uye basina tek varsayilan kurali ara adimda da bozulmasin.
  await db
    .update(schema.addresses)
    .set({ isDefault: false })
    .where(and(eq(schema.addresses.userId, userId), ne(schema.addresses.id, addressId)));
  await db.update(schema.addresses).set({ isDefault: true }).where(eq(schema.addresses.id, addressId));
  return { ok: true, addresses: await listAddresses(db, userId) };
}

/* ------------------------------ Favoriler ------------------------------ */

/** Uyenin favori urunleri, eklenme sirasiyla. */
export async function listFavourites(db: AuthDb, userId: string): Promise<string[]> {
  const rows = await db
    .select({ productId: schema.favourites.productId })
    .from(schema.favourites)
    .where(eq(schema.favourites.userId, userId))
    .orderBy(asc(schema.favourites.createdAt), asc(schema.favourites.productId));
  return rows.map((r) => r.productId);
}

type FavouriteResult = Promise<{ ok: true; ids: string[] } | AccountFailure>;

/**
 * Favori ekler (tek urun ya da giriste tarayicidaki liste). Olmayan urun ve
 * zaten favoride olan atlanir. Sinir asilacaksa: tek urunde hata; giriste
 * birlestirmede sigan kadari eklenir.
 */
export async function addFavourites(db: AuthDb, userId: string, input: unknown): FavouriteResult {
  const wanted = [...new Set(Array.isArray(input) ? input.filter((id): id is string => typeof id === "string") : [])].slice(
    0,
    ACCOUNT_LIMITS.favourites,
  );
  await lockMember(db, userId);
  const current = await listFavourites(db, userId);
  const existing = wanted.length
    ? (await db.select({ id: schema.products.id }).from(schema.products).where(inArray(schema.products.id, wanted))).map(
        (r) => r.id,
      )
    : [];
  const fresh = wanted.filter((id) => existing.includes(id) && !current.includes(id));
  const room = ACCOUNT_LIMITS.favourites - current.length;
  if (fresh.length > room && wanted.length === 1) {
    return fail(400, ERRORS.favouriteLimit.replace("{max}", String(ACCOUNT_LIMITS.favourites)));
  }
  const toAdd = fresh.slice(0, Math.max(0, room));
  if (toAdd.length > 0) {
    const now = Date.now();
    // Sira korunsun: eklenme ani milisaniye farkla.
    await db
      .insert(schema.favourites)
      .values(toAdd.map((productId, i) => ({ userId, productId, createdAt: new Date(now + i) })))
      .onConflictDoNothing();
  }
  return { ok: true, ids: await listFavourites(db, userId) };
}

export async function removeFavourite(db: AuthDb, userId: string, productId: unknown): FavouriteResult {
  if (typeof productId === "string") {
    await db
      .delete(schema.favourites)
      .where(and(eq(schema.favourites.userId, userId), eq(schema.favourites.productId, productId)));
  }
  return { ok: true, ids: await listFavourites(db, userId) };
}
