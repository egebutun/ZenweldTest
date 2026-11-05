import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { User, UserRole, UserStatus } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditDb } from "./audit";
import { checkRow, fail, isFailure, saved, text, unchanged, type PanelResult, type Saved } from "./panel";
import { userRecord } from "./read";
import * as s from "./schema";

/**
 * PANEL › UYELER SUNUCUDA (veritabani modu; Asama 5, 6. alan; KARARLAR K-34,
 * K-35, K-36, K-99)
 *
 * Ekran butun hesaplari (yoneticiler dahil) okur; sifre ozeti gonderilmez.
 * Yonetici bir uyenin rolunu ve durumunu (Aktif / Askida) degistirir ya da
 * uyeyi siler. Kurallar demo moduyla aynidir:
 * - Yonetici kendi rolunu degistiremez, kendini askiya alamaz (K-35).
 * - Son aktif yoneticinin rolu dusurulemez, askiya alinamaz (K-35).
 *   Yoneticilerle ilgili degisiklikler sirayla yapilir (veritabani kilidi):
 *   iki yonetici ayni anda birbirini dusuremez.
 * - Yonetici hesabi silinmez (once rolu degisir). Uye silinince adresleri,
 *   oturumlari ve favorileri silinir; siparis, teklif, servis, iade,
 *   garanti ve yorumlari gecmis kayit olarak kalir (K-36; tablolarin
 *   kurallariyla).
 * Rol ya da durum degisince uyenin acik oturumu bir sonraki istekte
 * gecersiz olur (oturum her istekte rol ve durumu denetler).
 */

const ROLES: UserRole[] = ["individual", "business", "admin"];
const STATUSES: UserStatus[] = ["active", "suspended"];

/** Uyeler ekrani: butun hesaplar, en yeni kayit once; sifre ozeti bos. */
export async function readMembersPanel(db: AuditDb): Promise<User[]> {
  const rows = await db.select().from(s.users).orderBy(desc(s.users.createdAt), s.users.email);
  return rows.map((u) => ({ ...userRecord(u), passwordHash: "", updatedAt: u.updatedAt.toISOString() }));
}

type UserRow = typeof s.users.$inferSelect;

async function lockMember(db: AuditDb, input: Record<string, unknown>) {
  // Yonetici sayisini degistirebilecek islemler sirayla (son yonetici korumasi).
  await db.execute(sql`select pg_advisory_xact_lock(hashtext('users:admins'))`);
  const id = text(input.id, 100);
  const [row] = id ? await db.select().from(s.users).where(eq(s.users.id, id)).for("update") : [];
  return checkRow(row, input, tr.panel.memberNotFound, tr.panel.staleRecord);
}

const isActiveAdmin = (u: { role: string; status: string }) => u.role === "admin" && u.status === "active";

async function otherActiveAdmins(db: AuditDb, id: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.users)
    .where(and(eq(s.users.role, "admin"), eq(s.users.status, "active"), ne(s.users.id, id)));
  return n;
}

const label = (u: UserRow) => `${u.firstName} ${u.lastName}`.trim() || u.email;

/** Rol ve durum. input: { id, updatedAt, role, status }. */
export async function adminSaveMember(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const role = input.role as UserRole;
  const status = input.status as UserStatus;
  if (!ROLES.includes(role) || !STATUSES.includes(status)) return fail(400, tr.panel.invalidRequest);
  const row = await lockMember(db, input);
  if (isFailure(row)) return row;
  const next = { role, status };
  const changes = changedFields({ role: row.role, status: row.status }, next, ["role", "status"]);
  if (!Object.keys(changes).length) return unchanged(row);
  if (row.id === actor.id) return fail(400, tr.panel.ownAccount);
  if (isActiveAdmin(row) && !isActiveAdmin(next) && (await otherActiveAdmins(db, row.id)) === 0) return fail(409, tr.panel.lastAdmin);

  await db.update(s.users).set({ ...next, updatedAt: at }).where(eq(s.users.id, row.id));
  await writeAudit(db, actor, { action: "update", entityType: "users", entityId: row.id, entityLabel: label(row), changes }, at);
  return saved(at);
}

/** Uyeyi siler (K-36). input: { id, updatedAt }. Yonetici hesabi silinmez. */
export async function adminDeleteMember(
  db: AuditDb,
  actor: Actor,
  input: Record<string, unknown>,
  at: Date,
): Promise<PanelResult<Saved>> {
  const row = await lockMember(db, input);
  if (isFailure(row)) return row;
  if (row.role === "admin") return fail(400, tr.panel.adminNotDeletable);
  await db.delete(s.users).where(eq(s.users.id, row.id));
  await writeAudit(
    db,
    actor,
    {
      action: "delete",
      entityType: "users",
      entityId: row.id,
      entityLabel: label(row),
      // Son hali (sifre ozeti ve oturum bilgisi yazilmaz).
      changes: {
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        role: row.role,
        status: row.status,
        companyName: row.companyName,
        createdAt: row.createdAt.toISOString(),
      },
    },
    at,
  );
  return { ok: true };
}
