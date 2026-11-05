import { readSupportMessages } from "@zenweld/db";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { MessagesClient } from "./MessagesClient";

/**
 * Mesajlar: sitedeki iletisim formu ve urun sayfasindaki destek sorulari.
 * Kayitlar yalnizca veritabaninda tutulur; her acilista ve her kayittan
 * sonra sunucuda okunur (Asama 5, 2. alan; KARARLAR K-100). Demo modunda
 * tarayicidaki kayitlar gosterilir (KARARLAR K-109).
 */
export default async function MessagesPage() {
  if (!usesDatabase()) return <MessagesClient />;
  if (!(await hasPanelSession())) return null;
  return <MessagesClient messages={await readSupportMessages(database())} />;
}
