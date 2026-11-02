import { defineConfig } from "drizzle-kit";
import "./scripts/env";

/**
 * Gecis betiklerini uretme (npm run db:generate) ve tablo goruntuleyici
 * (npm run db:studio) ayari. Betikler migrations/ klasorundedir ve sirayla
 * calisir (npm run db:migrate).
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
