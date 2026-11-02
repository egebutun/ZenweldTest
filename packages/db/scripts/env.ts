import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Bilgisayarda ayarlar uygulamanin .env.local dosyasindan okunur
 * (apps/zenweld-web/.env.local; ornegi .env.example). Sunucuda ortam
 * degiskenleri dogrudan tanimlidir; dosya yoksa bir sey yapilmaz.
 */
const file = fileURLToPath(new URL("../../../apps/zenweld-web/.env.local", import.meta.url));
if (existsSync(file)) process.loadEnvFile(file);
