import { Pool } from "pg";
import { resetDatabase } from "../../packages/db/src/migrate";
import { testDatabaseUrl } from "./ortak";

/** Test veritabanini siler ve gecis betiklerini bastan calistirir. */
export default async function setup(): Promise<void> {
  const pool = new Pool({ connectionString: testDatabaseUrl() });
  try {
    await resetDatabase(pool);
  } finally {
    await pool.end();
  }
}
