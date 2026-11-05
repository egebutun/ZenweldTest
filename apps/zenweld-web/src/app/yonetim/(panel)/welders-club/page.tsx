import { readWeldersClub } from "@zenweld/db";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { WeldersClubClient } from "./WeldersClubClient";

/**
 * Welders Club katilimlari. Kayitlar yalnizca veritabaninda tutulur; her
 * acilista ve her kayittan sonra sunucuda okunur (Asama 5, 2. alan;
 * KARARLAR K-100). Demo modunda liste bostur.
 */
export default async function WeldersClubPage() {
  if (!usesDatabase()) return <WeldersClubClient members={[]} />;
  if (!(await hasPanelSession())) return null;
  return <WeldersClubClient members={await readWeldersClub(database())} />;
}
