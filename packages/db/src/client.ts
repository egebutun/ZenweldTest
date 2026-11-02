import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Veritabani baglantisi. Adres yalnizca sunucuda ortam degiskenidir
 * (DATABASE_URL); koda, panele ve tarayiciya yazilmaz.
 */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL tanimli degil (README › Veritabani).");
  const pool = new Pool({ connectionString: url });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];
