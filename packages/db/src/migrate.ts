import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool } from "pg";

/**
 * GECIS BETIKLERI (packages/db/migrations)
 *
 * Betikler sirayla ve bir kez calisir; hangilerinin calistigi veritabaninda
 * tutulur (drizzle.__drizzle_migrations). Ayni betikler her ortamda
 * (bilgisayar, test, deneme, canli) ayni sonucu verir.
 */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../migrations", import.meta.url));

/** Henuz calismamis betikleri calistirir. */
export async function runMigrations(pool: Pool): Promise<void> {
  await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER });
}

/** Butun tablolari ve verileri siler, betikleri bastan calistirir. Canli veritabaninda KULLANILMAZ. */
export async function resetDatabase(pool: Pool): Promise<void> {
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await runMigrations(pool);
}
