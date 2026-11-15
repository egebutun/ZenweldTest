import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { EMAIL_KINDS } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminSaveEmailSettings,
  emailSettingFor,
  importIncomingEmail,
  logEmail,
  mailboxSourcesFromEnv,
  readEmailLog,
  readEmailSettings,
  readEntityEmails,
  readMailboxStates,
  readMailboxes,
  type Actor,
  type IncomingEmail,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { EMAIL_TYPES } from "../../packages/db/src/schema/system";
import { closePool, inTransaction } from "./ortak";

/*
 * PANEL › E-POSTA SUNUCUDA (packages/db/src/emails.ts, mailbox.ts;
 * KARARLAR K-116): turun gonderici ve alici adresleri, metniyle saklanan
 * yazismalar, posta kutusundan gelen e-postanin kayda baglanmasi ve klasor
 * (deneme) posta kutusunun okunmasi. Her test kendi isleminde calisir ve
 * geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-eposta", name: "E-posta Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");

async function withDb(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone) VALUES ($1, 'admin', 'eposta-yonetici@ornek.com', 'x', 'E', 'Y', '1')", [admin.id]);
    await client.query(
      `INSERT INTO service_requests (id, code, product_name, reasons, complaint, company_name, address, city, district, email, phone, contact_name, contact_gsm, created_at, updated_at)
       VALUES ('sr-e1', 'SRV-2026-9901', 'ForceMIG 200', '{onarim}', 'Ark yok', 'Firma', 'Adres', 'İzmir', 'Bornova', 'musteri@ornek.com', '1', 'Ali Veli', '1', $1, $1)`,
      [T0],
    );
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [admin.id])).rows;

const mail = (patch: Partial<IncomingEmail>): IncomingEmail => ({
  references: [],
  from: "musteri@ornek.com",
  to: ["info@zenweld.com"],
  subject: "Merhaba",
  text: "Metin",
  attachments: [],
  ...patch,
});

describe("E-posta › Adresler", () => {
  it("türler veritabanındaki listeyle aynı", () => {
    expect(EMAIL_KINDS.map((k) => k.type)).toEqual([...EMAIL_TYPES]);
  });

  it("gönderici ve alıcılar eklenir, değişir, boşaltılınca silinir; e-posta gönderilirken okunur; işlem kaydına yazılır", async () => {
    await withDb(async (db, client) => {
      expect(await emailSettingFor(db, "servis")).toEqual({ sender: undefined, recipients: [] });
      const save = (input: Record<string, unknown>, at: Date) => adminSaveEmailSettings(db, admin, input, at);

      expect(await save({ type: "servis", sender: "Servis@Zenweld.com", recipients: "servis@zenweld.com, Teknik@zenweld.com", version: "0|" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await emailSettingFor(db, "servis")).toEqual({ sender: "servis@zenweld.com", recipients: ["servis@zenweld.com", "teknik@zenweld.com"] });
      expect(await readEmailSettings(db)).toEqual([
        { type: "servis", sender: "servis@zenweld.com", recipients: ["servis@zenweld.com", "teknik@zenweld.com"], updatedAt: T1.toISOString() },
      ]);

      // Ayni ekranla ikinci kayit: liste bu arada degisti.
      expect(await save({ type: "teklif", sender: "", recipients: "satis@zenweld.com", version: "0|" }, T2)).toEqual({
        ok: false,
        status: 409,
        error: tr.panel.staleRecord,
      });
      const version = `1|${T1.toISOString()}`;
      // Yalnizca musteriye giden turde alici yazilmaz (yazilsa da alinmaz).
      expect(await save({ type: "sifre-sifirlama", sender: "uyelik@zenweld.com", recipients: "x@zenweld.com", version }, T2)).toMatchObject({ ok: true });
      expect(await emailSettingFor(db, "sifre-sifirlama")).toEqual({ sender: "uyelik@zenweld.com", recipients: [] });
      const next = `2|${T2.toISOString()}`;
      // Degisiklik yok: yazilmaz.
      expect(await save({ type: "servis", sender: "servis@zenweld.com", recipients: "servis@zenweld.com teknik@zenweld.com", version: next }, T2)).toEqual({ ok: true });
      expect(await save({ type: "servis", sender: "", recipients: "", version: next }, T2)).toMatchObject({ ok: true });
      expect(await emailSettingFor(db, "servis")).toEqual({ sender: undefined, recipients: [] });

      expect((await audit(client)).map((r) => [r.action, r.entity_type, r.entity_id])).toEqual([
        ["create", "email_settings", "servis"],
        ["create", "email_settings", "sifre-sifirlama"],
        ["delete", "email_settings", "servis"],
      ]);
    });
  });

  it("geçersiz adres ve bilinmeyen tür reddedilir", async () => {
    await withDb(async (db) => {
      const version = "0|";
      expect(await adminSaveEmailSettings(db, admin, { type: "servis", sender: "servis@", recipients: "", version }, T1)).toEqual({
        ok: false,
        status: 400,
        error: 'Gönderici: "servis@" geçerli bir e-posta adresi değil.',
      });
      expect(await adminSaveEmailSettings(db, admin, { type: "servis", sender: "", recipients: "a@b.com, yanlis", version }, T1)).toMatchObject({
        status: 400,
        error: 'Alıcılar: "yanlis" geçerli bir e-posta adresi değil.',
      });
      expect(await adminSaveEmailSettings(db, admin, { type: "uydurma", sender: "", recipients: "", version }, T1)).toMatchObject({ status: 400 });
    });
  });
});

describe("E-posta › Yazışmalar", () => {
  it("metniyle kaydedilir; kaydın yazışmaları ve giden/gelen süzgeci okunur", async () => {
    await withDb(async (db) => {
      const out = await logEmail(
        db,
        {
          type: "servis",
          entityType: "service_requests",
          entityId: "sr-e1",
          from: "info@zenweld.com",
          recipients: ["musteri@ornek.com"],
          subject: "Servis talebiniz SRV-2026-9901 hakkında",
          body: "Seri numarasını gönderir misiniz?",
          status: "sent",
          messageId: "<giden-1@zenweld.com>",
          actor: admin,
        },
        T0,
      );
      await logEmail(db, { type: "servis", direction: "in", entityType: "service_requests", entityId: "sr-e1", from: "musteri@ornek.com", recipients: ["info@zenweld.com"], subject: "Re: x", body: "Yanıt", status: "received", parentId: out, attachments: ["foto.jpg"] }, T1);

      const own = await readEntityEmails(db, "service_requests", "sr-e1");
      expect(own.map((m) => [m.direction, m.status, m.body])).toEqual([
        ["in", "received", "Yanıt"],
        ["out", "sent", "Seri numarasını gönderir misiniz?"],
      ]);
      expect(own[0]).toMatchObject({ parentId: String(out), attachments: ["foto.jpg"], from: "musteri@ornek.com" });
      expect(own[1]).toMatchObject({ actorName: admin.name, to: ["musteri@ornek.com"] });

      const incoming = await readEmailLog(db, { type: "servis", direction: "in", q: "SRV-2026" });
      expect(incoming.entries).toEqual([]);
      expect((await readEmailLog(db, { type: "servis", q: "seri numarası" })).entries.map((m) => m.id)).toEqual([String(out)]);
      expect((await readEmailLog(db, { type: "servis", direction: "in", q: "musteri@" })).entries).toHaveLength(1);
    });
  });

  it("gelen e-posta yalnızca 'received', giden e-posta 'received' olamaz", async () => {
    await withDb(async (db) => {
      await expect(logEmail(db, { type: "servis", direction: "in", recipients: ["a"], subject: "x", status: "sent" })).rejects.toThrow();
    });
  });
});

describe("E-posta › Gelen e-postanın kayda bağlanması", () => {
  it("yanıt başlığı, aynı kişiye giden aynı konu ya da kayıt numarasıyla bağlanır; başka e-posta alınmaz", async () => {
    await withDb(async (db) => {
      const out = await logEmail(
        db,
        { type: "teklif", entityType: "quotes", entityId: "q-9", recipients: ["firma@ornek.com"], subject: "Teklifiniz hazır", status: "sent", messageId: "<t-1@zenweld.com>" },
        T0,
      );
      const own = ["info@zenweld.com"];

      // 1. Yanit basligi
      const byHeader = await importIncomingEmail(db, mail({ from: "firma@ornek.com", subject: "Başka konu", inReplyTo: "<t-1@zenweld.com>", messageId: "<g-1@ornek.com>" }), own, T1);
      expect(byHeader).toMatchObject({ status: "imported", type: "teklif", entity: { type: "quotes", id: "q-9" } });
      // Ayni e-posta ikinci kez alinmaz.
      expect(await importIncomingEmail(db, mail({ from: "firma@ornek.com", inReplyTo: "<t-1@zenweld.com>", messageId: "<g-1@ornek.com>" }), own, T1)).toEqual({ status: "duplicate" });

      // 2. Ayni kisiye giden ayni konu (Re:, YNT: atilir)
      expect(await importIncomingEmail(db, mail({ from: "Firma@Ornek.com", subject: "YNT: RE: Teklifiniz hazır", messageId: "<g-2@ornek.com>" }), own, T1)).toMatchObject({
        status: "imported",
        type: "teklif",
      });
      // Konu ayni ama gonderen baskasi: bagli degil.
      expect(await importIncomingEmail(db, mail({ from: "baska@ornek.com", subject: "Re: Teklifiniz hazır", messageId: "<g-3@ornek.com>" }), own, T1)).toEqual({
        status: "unmatched",
      });

      // 3. Kayit numarasi (konuda ya da metinde); olmayan numara bagli degil.
      expect(await importIncomingEmail(db, mail({ subject: "Talebim", text: "srv-2026-9901 numaralı talebim ne durumda?", messageId: "<g-4@ornek.com>" }), own, T1)).toMatchObject({
        status: "imported",
        type: "servis",
        entity: { type: "service_requests", id: "sr-e1" },
      });
      expect(await importIncomingEmail(db, mail({ subject: "SRV-2026-0404 hakkında", messageId: "<g-5@ornek.com>" }), own, T1)).toEqual({ status: "unmatched" });

      // Sitenin kendi adresinden gelen (info@'ya giden bildirimin kopyasi) alinmaz.
      expect(await importIncomingEmail(db, mail({ from: "INFO@zenweld.com", subject: "Yeni servis talebi — SRV-2026-9901" }), own, T1)).toEqual({ status: "own" });

      const rows = (await readEmailLog(db, { direction: "in" })).entries;
      expect(rows.map((r) => [r.type, r.entityId, r.parentId])).toEqual([
        ["servis", "sr-e1", undefined],
        ["teklif", "q-9", String(out)],
        ["teklif", "q-9", String(out)],
      ]);
    });
  });
});

describe("E-posta › Posta kutusu (klasör parçası)", () => {
  it("klasördeki .eml dosyaları sırayla okunur; okunan yer saklanır, ikinci okumada yalnızca yeniler alınır", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zw-posta-"));
    try {
      const eml = (id: string, from: string, subject: string, body: string) =>
        [
          `Message-ID: <${id}@ornek.com>`,
          `From: Ali Veli <${from}>`,
          "To: info@zenweld.com",
          `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
          "MIME-Version: 1.0",
          "Content-Type: text/plain; charset=utf-8",
          "Content-Transfer-Encoding: 8bit",
          "",
          body,
        ].join("\r\n");
      await writeFile(join(dir, "001.eml"), eml("k-1", "musteri@ornek.com", "Talebim SRV-2026-9901", "Makine çalışmıyor."));
      await writeFile(join(dir, "002.eml"), eml("k-2", "reklam@ornek.com", "Kampanya", "İndirim!"));

      const sources = mailboxSourcesFromEnv({ POSTA_KLASORU: dir });
      expect(sources.map((s) => s.key)).toEqual([`klasor:${dir}`]);

      await withDb(async (db) => {
        expect(await readMailboxes(db, sources, ["info@zenweld.com"], T1)).toEqual([{ mailbox: `klasor:${dir}`, read: 2, imported: 1 }]);
        const [imported] = (await readEmailLog(db, { direction: "in" })).entries;
        expect(imported).toMatchObject({ type: "servis", entityId: "sr-e1", subject: "Talebim SRV-2026-9901", body: "Makine çalışmıyor.", from: "musteri@ornek.com" });
        expect(await readMailboxStates(db)).toMatchObject([{ mailbox: `klasor:${dir}`, lastUid: 2, checkedAt: T1.toISOString() }]);

        await writeFile(join(dir, "003.eml"), eml("k-3", "musteri@ornek.com", "Re: Talebim SRV-2026-9901", "Fotoğraf ekte."));
        expect(await readMailboxes(db, sources, ["info@zenweld.com"], T2)).toEqual([{ mailbox: `klasor:${dir}`, read: 1, imported: 1 }]);
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("IMAP kutuları ortam değişkenlerinden kurulur; eksik bilgiyle kurulmaz", () => {
    expect(mailboxSourcesFromEnv({}).length).toBe(0);
    expect(mailboxSourcesFromEnv({ IMAP_HOST: "imap.ornek.com", IMAP_USER: "info@zenweld.com" }).length).toBe(0);
    const keys = mailboxSourcesFromEnv({
      IMAP_HOST: "imap.ornek.com",
      IMAP_USER: "info@zenweld.com",
      IMAP_PASSWORD: "x",
      IMAP_HOST_2: "imap.ornek.com",
      IMAP_USER_2: "servis@zenweld.com",
      IMAP_PASSWORD_2: "y",
      IMAP_KLASOR_2: "Servis",
    }).map((s) => s.key);
    expect(keys).toEqual(["imap:info@zenweld.com/INBOX", "imap:servis@zenweld.com/Servis"]);
  });
});
