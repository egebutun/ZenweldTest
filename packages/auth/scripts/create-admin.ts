import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { eq, sql } from "drizzle-orm";
import { createDb, schema } from "@zenweld/db";
import { passwordProblem } from "../src/rules";
import { deleteUserSessions, hashPassword } from "../src/server";

/**
 * npm run yonetici:olustur — DATABASE_URL'deki veritabaninda panel icin
 * yonetici hesabi acar ya da var olan yoneticinin sifresini degistirir.
 * Canli veritabanina hic hesap yuklenmedigi icin (KARARLAR K-91) ilk
 * yonetici bununla acilir. Sifre ekrana yazilmaz; komut terminalde calisir.
 */

const envFile = resolve("apps/zenweld-web/.env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

async function ask(question: string): Promise<string> {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

/** Yazilani ekrana basmadan okur. */
function askHidden(question: string): Promise<string> {
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();
  return new Promise((done) => {
    let value = "";
    const finish = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          finish();
          done(value);
          return;
        }
        if (ch === "\u0003") {
          finish();
          process.exit(130);
        }
        value = ch === "\u007f" || ch === "\b" ? value.slice(0, -1) : value + ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function askNewPassword(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const password = await askHidden("Şifre: ");
    const problem = passwordProblem(password);
    if (problem) {
      console.log(problem);
      continue;
    }
    if ((await askHidden("Şifre (tekrar): ")) !== password) {
      console.log("Şifreler eşleşmiyor.");
      continue;
    }
    return password;
  }
  console.error("Şifre belirlenemedi; hiçbir şey değişmedi.");
  process.exit(1);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  if (!stdin.isTTY) fail("Bu komut şifre sorar; bir terminalde çalıştırın.");
  const url = process.env.DATABASE_URL;
  if (!url) fail("DATABASE_URL tanımlı değil (README › Veritabanı).");
  console.log(`Veritabanı: ${decodeURIComponent(new URL(url).pathname.slice(1))} (${new URL(url).hostname})`);

  const email = (await ask("E-posta: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Geçerli bir e-posta adresi girin.");

  const { db, pool } = createDb(url);
  try {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(sql`lower(${schema.users.email}) = ${email}`);

    if (existing) {
      if (existing.role !== "admin") fail("Bu e-posta bir üyeye ait; yönetici hesabı açılmadı.");
      const answer = await ask("Bu e-postayla bir yönetici var. Şifresi değiştirilsin mi? (e/h): ");
      if (answer.toLocaleLowerCase("tr") !== "e") {
        console.log("Değişiklik yapılmadı.");
        return;
      }
      const passwordHash = await hashPassword(await askNewPassword());
      const now = new Date();
      await db
        .update(schema.users)
        .set({ passwordHash, passwordChangedAt: now, updatedAt: now })
        .where(eq(schema.users.id, existing.id));
      await deleteUserSessions(db, existing.id);
      console.log(`Şifre değiştirildi: ${existing.email}. Yöneticinin açık oturumları kapandı.`);
      return;
    }

    const firstName = await ask("Ad: ");
    const lastName = await ask("Soyad: ");
    const phone = await ask("Telefon: ");
    if (!firstName || !lastName || !phone) fail("Ad, soyad ve telefon zorunludur.");
    const passwordHash = await hashPassword(await askNewPassword());
    await db.insert(schema.users).values({
      id: `u-${randomBytes(6).toString("hex")}`,
      role: "admin",
      status: "active",
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
    });
    console.log(`Yönetici hesabı açıldı: ${email}.`);
  } catch (error) {
    const cause = ((error as { cause?: unknown }).cause ?? error) as { code?: string; message?: string };
    fail(cause.code === "42P01" ? "Tablolar kurulmamış. Önce: npm run db:migrate" : `Hata: ${cause.message}`);
  } finally {
    await pool.end();
  }
}

void main();
