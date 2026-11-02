import { defineConfig } from "drizzle-kit";

/**
 * Gecis betiklerini uretme ayari (npm run db:generate). Betikler
 * migrations/ klasorundedir ve sirayla calisir (npm run db:migrate).
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
