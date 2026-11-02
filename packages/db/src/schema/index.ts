/**
 * VERITABANI SEMASI (PostgreSQL)
 *
 * Tablolarin asil tanimi buradadir; belgesi docs/VERITABANI.md (ayni
 * commit'te guncel tutulur). Sema degisince yeni gecis betigi uretilir:
 * npm run db:generate (packages/db/migrations).
 */
export * from "./catalog";
export * from "./network";
export * from "./users";
export * from "./sales";
export * from "./support";
export * from "./content";
export * from "./settings";
export * from "./system";
