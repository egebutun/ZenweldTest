import "./env";
import { createDb } from "../src/client";
import { runMigrations } from "../src/migrate";

/** npm run db:migrate — henuz calismamis gecis betiklerini calistirir. */
const { pool } = createDb();
try {
  await runMigrations(pool);
  console.log("Veritabanı güncel: bütün geçiş betikleri çalıştı.");
} finally {
  await pool.end();
}
