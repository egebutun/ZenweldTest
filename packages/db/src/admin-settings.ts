import { asc, eq, inArray, sql } from "drizzle-orm";
import {
  COMPANY_SOCIAL_KEYS,
  EMAIL_RECIPIENT_TYPES,
  RICH_TEXT_COLORS,
  RICH_TEXT_LIMITS,
  bankAccountKey,
  carrierKey,
  defaultSettings,
  heroHasUploadedFile,
  heroKey,
  parseCompanySettings,
  parseHomeHero,
  parseRecipients,
  parseShopSettings,
  posKey,
  recipientsVersion,
  richTextStyleError,
  type Carrier,
  type CompanySettings,
  type EmailRecipient,
  type HomeHeroSettings,
  type RichTextStyle,
  type ShopSettings,
  type ZenweldDatabase,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { changedFields, writeAudit, type Actor, type AuditChanges, type AuditDb } from "./audit";
import { fail, newId, saved, unchanged, type PanelResult, type Saved } from "./panel";
import { readSettings, type ReadDb } from "./read";
import * as s from "./schema";

/**
 * PANEL › MAGAZA AYARLARI SUNUCUDA (Asama 5, 5. alan, adim 5.1 ve 5.3; KARARLAR
 * K-99, K-104, K-105)
 *
 * Mağaza Ayarları'nin uc sekmesi:
 * - Genel: kargo sinir ve ucreti, kargo firmalari (takip adresleriyle),
 *   taksit alt siniri, banka POS'lari, havale hesaplari ve odeme suresi.
 *   Tek kayit gibi kaydedilir; "ekran acildiktan sonra degisti mi"
 *   settings('shop') satirinin updated_at'iyle denetlenir. POS'un API
 *   anahtari ve sifresi burada yoktur (CLAUDE.md › Guvenlik).
 * - E-posta Alicilari: Zenweld'e giden her e-posta turunun alicilari
 *   (email_recipients). Satiri olmayan tur varsayilan adrese
 *   (SUPPORT_EMAIL) gider.
 * - Şirket ve İletişim: unvan, MERSIS no, telefon, e-posta, ofisler ve
 *   sosyal medya; tek kayit, settings('company') satiri (adim 5.3, K-105).
 *
 * Görünüm ekrani (bicimli metinlerin punto ve renkleri) da burada: tek
 * kayit, settings('rich_text') satiri (adim 5.3). Anasayfa Tanıtım ekrani
 * (anasayfanin kayan tanitim alani; K-45): tek kayit, settings('home_hero').
 *
 * Kurallar tarayiciyla ortak: packages/data › settings-rules.ts,
 * content-rules.ts (Görünüm).
 */

type Input = Record<string, unknown>;

const stale = tr.panel.staleRecord;
const invalid = () => fail(400, tr.panel.invalidRequest);
const iso = (d: Date) => d.toISOString();

/** Ayni kayda iki islem ayni anda gelmesin: sirayla. */
const lock = (db: AuditDb, name: string) => db.execute(sql`select pg_advisory_xact_lock(hashtext(${name}))`);

/* ------------------------------ Okuma ------------------------------ */

async function readRecipients(db: ReadDb): Promise<EmailRecipient[]> {
  const rows = await db.select().from(s.emailRecipients).orderBy(asc(s.emailRecipients.type));
  return rows.map((r) => ({ type: r.type, recipients: r.recipients, updatedAt: iso(r.updatedAt) }));
}

/**
 * Mağaza Ayarları ekraninin verisi: ayarlar (magaza ve sirket ayarlarinin
 * son degisiklik anlariyla) ve e-posta alicilari. Sirket satiri yoksa
 * baslangic degerleri gosterilir.
 */
export async function readShopPanel(db: AuditDb): Promise<Partial<ZenweldDatabase>> {
  const settings = await readSettings(db);
  const rows = await db.select({ key: s.settings.key, updatedAt: s.settings.updatedAt }).from(s.settings);
  const stamp = (key: string) => {
    const row = rows.find((r) => r.key === key);
    return row ? { updatedAt: iso(row.updatedAt) } : {};
  };
  return {
    settings: {
      ...settings,
      shop: { ...settings.shop, ...stamp("shop") },
      company: { ...(settings.company ?? defaultSettings.company), ...stamp("company") },
    },
    emailRecipients: await readRecipients(db),
  };
}

/** E-posta gonderilirken: turun alicilari; satiri yoksa bos (varsayilan adrese gider). */
export async function emailRecipientsFor(db: ReadDb, type: string): Promise<string[]> {
  const [row] = await db.select({ recipients: s.emailRecipients.recipients }).from(s.emailRecipients).where(eq(s.emailRecipients.type, type));
  return row?.recipients ?? [];
}

/* ------------------------------ Genel ------------------------------ */

type ShopValue = Pick<ShopSettings, "freeShippingThreshold" | "shippingFee" | "minInstallmentAmount" | "transferDueDays">;
const SCALARS = ["freeShippingThreshold", "shippingFee", "minInstallmentAmount", "transferDueDays"] as const;

/**
 * Magaza ayarlarini kaydeder. input: { shop, updatedAt }. Degisen bir sey
 * yoksa hicbir sey yazilmaz. POS, hesap ve kargo firmalari listedeki
 * sirasiyla yazilir; listeden cikan silinir (siparisler POS'un ve kargo
 * firmasinin adini kendi kopyalarinda tutar).
 */
export async function adminSaveShopSettings(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const parsed = parseShopSettings(input.shop);
  if (!parsed.ok) return parsed.error ? fail(400, parsed.error) : invalid();
  const next = parsed.value;

  await lock(db, "settings:shop");
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "shop"));
  if ((row ? iso(row.updatedAt) : undefined) !== (input.updatedAt || undefined)) return fail(409, stale);
  const before = (await readSettings(db)).shop;

  const changes: AuditChanges = {
    ...changedFields<ShopValue>(before, next, SCALARS),
  };
  if (JSON.stringify(before.carriers.map(carrierKey)) !== JSON.stringify(next.carriers.map(carrierKey))) {
    changes.carriers = [before.carriers, next.carriers];
  }
  if (JSON.stringify(before.bankAccounts.map(bankAccountKey)) !== JSON.stringify(next.bankAccounts.map(bankAccountKey))) {
    changes.bankAccounts = [before.bankAccounts, next.bankAccounts];
  }
  if (JSON.stringify(before.pos.map(posKey)) !== JSON.stringify(next.pos.map(posKey))) changes.pos = [before.pos, next.pos];
  if (row && Object.keys(changes).length === 0) return unchanged(row);

  const value: ShopValue = {
    freeShippingThreshold: next.freeShippingThreshold,
    shippingFee: next.shippingFee,
    minInstallmentAmount: next.minInstallmentAmount,
    transferDueDays: next.transferDueDays,
  };
  if (row) await db.update(s.settings).set({ value, updatedAt: at }).where(eq(s.settings.key, "shop"));
  else await db.insert(s.settings).values({ key: "shop", value, updatedAt: at });

  if (changes.pos) await savePos(db, before.pos, next.pos, at);
  if (changes.bankAccounts) await saveBankAccounts(db, before.bankAccounts, next.bankAccounts, at);
  if (changes.carriers) await saveCarriers(db, next.carriers, at);

  await writeAudit(
    db,
    actor,
    { action: row ? "update" : "create", entityType: "settings", entityId: "shop", entityLabel: "Mağaza Ayarları", changes },
    at,
  );
  return saved(at);
}

/** POS'lar: varsayilan isareti tektir (payment_pos_one_default), once eskisi kaldirilir. */
async function savePos(db: AuditDb, before: ShopSettings["pos"], next: ShopSettings["pos"], at: Date) {
  const keep = new Set(next.map((p) => p.id));
  const removed = before.filter((p) => !keep.has(p.id)).map((p) => p.id);
  if (removed.length) await db.delete(s.paymentPos).where(inArray(s.paymentPos.id, removed));
  const stillDefault = next.find((p) => p.isDefault)?.id;
  const oldDefault = before.find((p) => p.isDefault && p.id !== stillDefault && keep.has(p.id));
  if (oldDefault) await db.update(s.paymentPos).set({ isDefault: false }).where(eq(s.paymentPos.id, oldDefault.id));

  const old = new Map(before.map((p, i) => [p.id, { key: posKey(p), position: i }]));
  for (const [position, p] of next.entries()) {
    const was = old.get(p.id);
    if (was && was.key === posKey(p) && was.position === position) continue;
    const values = {
      bankShortName: p.bankShortName,
      name: p.name,
      program: p.program ?? null,
      merchantNo: p.merchantNo,
      posName: p.posName,
      active: p.active,
      isDefault: p.isDefault,
      position,
      installments: p.installments,
      commissions: p.commissions,
      updatedAt: at,
    };
    if (was) await db.update(s.paymentPos).set(values).where(eq(s.paymentPos.id, p.id));
    else await db.insert(s.paymentPos).values({ id: p.id, ...values, createdAt: at });
  }
}

async function saveBankAccounts(db: AuditDb, before: ShopSettings["bankAccounts"], next: ShopSettings["bankAccounts"], at: Date) {
  const keep = new Set(next.map((b) => b.id));
  const removed = before.filter((b) => !keep.has(b.id)).map((b) => b.id);
  if (removed.length) await db.delete(s.bankAccounts).where(inArray(s.bankAccounts.id, removed));
  const old = new Map(before.map((b, i) => [b.id, { key: bankAccountKey(b), position: i }]));
  for (const [position, b] of next.entries()) {
    const was = old.get(b.id);
    if (was && was.key === bankAccountKey(b) && was.position === position) continue;
    const values = { bankName: b.bankName, accountHolder: b.accountHolder, iban: b.iban, position, updatedAt: at };
    if (was) await db.update(s.bankAccounts).set(values).where(eq(s.bankAccounts.id, b.id));
    else await db.insert(s.bankAccounts).values({ id: b.id, ...values, createdAt: at });
  }
}

/**
 * Kargo firmalari adla eslesir: kalan firmanin kimligi korunur (gonderiler
 * ona bagli), sirasi ve takip adresi guncellenir; yeni ad eklenir, listeden
 * cikan silinir (gonderiler firmanin adini kendi kopyasinda tutar).
 */
async function saveCarriers(db: AuditDb, carriers: Carrier[], at: Date) {
  const rows = await db.select().from(s.carriers);
  const byName = new Map(rows.map((r) => [r.name, r]));
  const names = carriers.map((c) => c.name);
  const removed = rows.filter((r) => !names.includes(r.name)).map((r) => r.id);
  if (removed.length) await db.delete(s.carriers).where(inArray(s.carriers.id, removed));
  for (const [position, { name, trackingUrl }] of carriers.entries()) {
    const row = byName.get(name);
    const url = trackingUrl ?? null;
    if (!row) await db.insert(s.carriers).values({ id: newId("kargo"), name, trackingUrl: url, position, createdAt: at, updatedAt: at });
    else if (row.position !== position || row.trackingUrl !== url) {
      await db.update(s.carriers).set({ position, trackingUrl: url, updatedAt: at }).where(eq(s.carriers.id, row.id));
    }
  }
}

/* ------------------------------ Sirket ve iletisim ------------------------------ */

/**
 * Sirket ve iletisim bilgilerini kaydeder. input: { company, updatedAt? }.
 * Tek kayit (settings('company')); satir yoksa eklenir. Degisen bir sey
 * yoksa hicbir sey yazilmaz.
 */
export async function adminSaveCompany(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const parsed = parseCompanySettings(input.company);
  if (!parsed.ok) return parsed.error ? fail(400, parsed.error) : invalid();
  const next = parsed.value;

  await lock(db, "settings:company");
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "company"));
  if ((row ? iso(row.updatedAt) : undefined) !== (input.updatedAt || undefined)) return fail(409, stale);
  const before = (row?.value as CompanySettings | undefined) ?? defaultSettings.company;

  // jsonb alanlarin sirasini degistirir: listeler ve sosyal medya ayni sirayla karsilastirilir.
  const changes = changedFields<CompanySettings>(before, next, ["legalName", "mersisNo", "phone", "email"]);
  const socialKey = (c: CompanySettings) => JSON.stringify(COMPANY_SOCIAL_KEYS.map((k) => c.social[k] ?? ""));
  const officesKey = (c: CompanySettings) => JSON.stringify(c.offices.map((o) => [o.id, o.city, o.addressLines, o.phones]));
  if (socialKey(before) !== socialKey(next)) changes.social = [before.social, next.social];
  if (officesKey(before) !== officesKey(next)) changes.offices = [before.offices, next.offices];
  if (row && Object.keys(changes).length === 0) return unchanged(row);

  if (row) await db.update(s.settings).set({ value: next, updatedAt: at }).where(eq(s.settings.key, "company"));
  else await db.insert(s.settings).values({ key: "company", value: next, updatedAt: at });
  await writeAudit(
    db,
    actor,
    { action: row ? "update" : "create", entityType: "settings", entityId: "company", entityLabel: "Şirket ve İletişim", changes },
    at,
  );
  return saved(at);
}

/* ------------------------------ E-posta alicilari ------------------------------ */

const RECIPIENT_TYPES: readonly string[] = EMAIL_RECIPIENT_TYPES.map((t) => t.type);
const labelOf = (type: string) => EMAIL_RECIPIENT_TYPES.find((t) => t.type === type)?.label ?? type;

/**
 * E-posta alicilarini kaydeder. input: { items: [{ type, recipients }],
 * version }. version: ekranin gordugu listenin hali (recipientsVersion);
 * bu arada baska yonetici kaydettiyse 409. Alicisi bos tur silinir
 * (varsayilan adrese gider). Listede olmayan tur degismez.
 */
export async function adminSaveEmailRecipients(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  if (!Array.isArray(input.items) || input.items.length > RECIPIENT_TYPES.length) return invalid();
  const items: { type: string; recipients: string[] }[] = [];
  for (const item of input.items as unknown[]) {
    const { type, recipients } = (item ?? {}) as Record<string, unknown>;
    if (typeof type !== "string" || !RECIPIENT_TYPES.includes(type) || items.some((i) => i.type === type)) return invalid();
    if (!Array.isArray(recipients) || !recipients.every((r) => typeof r === "string")) return invalid();
    const parsed = parseRecipients(recipients.join(" "));
    if (!parsed.ok) return fail(400, `${labelOf(type)}: ${parsed.error}`);
    items.push({ type, recipients: parsed.value });
  }

  await lock(db, "email_recipients");
  const current = await readRecipients(db);
  if (recipientsVersion(current) !== input.version) return fail(409, stale);

  let changed = false;
  for (const { type, recipients } of items) {
    const before = current.find((r) => r.type === type)?.recipients ?? [];
    if (JSON.stringify(before) === JSON.stringify(recipients)) continue;
    changed = true;
    if (!recipients.length) await db.delete(s.emailRecipients).where(eq(s.emailRecipients.type, type));
    else {
      await db
        .insert(s.emailRecipients)
        .values({ type, recipients, updatedAt: at })
        .onConflictDoUpdate({ target: s.emailRecipients.type, set: { recipients, updatedAt: at } });
    }
    await writeAudit(
      db,
      actor,
      {
        action: !before.length ? "create" : recipients.length ? "update" : "delete",
        entityType: "email_recipients",
        entityId: type,
        entityLabel: `E-posta alıcıları: ${labelOf(type)}`,
        changes: { recipients: [before, recipients] },
      },
      at,
    );
  }
  return changed ? saved(at) : { ok: true };
}

/* ------------------------------ Gorunum ------------------------------ */

/** Görünüm ekraninin verisi: ayarlar (bicimli metin ayarinin son degisiklik aniyla). */
export async function readAppearancePanel(db: AuditDb): Promise<Partial<ZenweldDatabase>> {
  const settings = await readSettings(db);
  const [row] = await db.select({ updatedAt: s.settings.updatedAt }).from(s.settings).where(eq(s.settings.key, "rich_text"));
  const richText = { ...defaultSettings.richText, ...settings.richText, ...(row && { updatedAt: iso(row.updatedAt) }) };
  return { settings: { ...settings, richText } };
}

type RichTextValue = Omit<RichTextStyle, "updatedAt">;
const RICH_TEXT_KEYS = [
  "headingSize",
  "headingColor",
  "headingUppercase",
  "accentColor",
  "accentWidth",
  "leadSize",
  "bodySize",
  "bodyColor",
  "strongColor",
] as const satisfies readonly (keyof RichTextValue)[];

/** Tarayicidan gelen ayar: alan turleri dogru degilse null. */
function parseRichText(value: unknown): RichTextValue | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.headingUppercase !== "boolean") return null;
  if (!Object.keys(RICH_TEXT_LIMITS).every((k) => typeof v[k] === "number")) return null;
  if (!Object.keys(RICH_TEXT_COLORS).every((k) => typeof v[k] === "string")) return null;
  return Object.fromEntries(RICH_TEXT_KEYS.map((k) => [k, v[k]])) as unknown as RichTextValue;
}

/**
 * Görünüm ayarlarini kaydeder. input: { style, updatedAt? }. Degisen bir sey
 * yoksa hicbir sey yazilmaz.
 */
export async function adminSaveRichText(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const next = parseRichText(input.style);
  if (!next) return invalid();
  const error = richTextStyleError(next);
  if (error) return fail(400, error);

  await lock(db, "settings:rich_text");
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "rich_text"));
  if ((row ? iso(row.updatedAt) : undefined) !== (input.updatedAt || undefined)) return fail(409, stale);
  const before = { ...defaultSettings.richText, ...((row?.value ?? {}) as Partial<RichTextValue>) };
  const changes = changedFields<RichTextValue>(before, next, RICH_TEXT_KEYS);
  if (Object.keys(changes).length === 0) return row ? unchanged(row) : { ok: true };

  if (row) await db.update(s.settings).set({ value: next, updatedAt: at }).where(eq(s.settings.key, "rich_text"));
  else await db.insert(s.settings).values({ key: "rich_text", value: next, updatedAt: at });
  await writeAudit(
    db,
    actor,
    { action: row ? "update" : "create", entityType: "settings", entityId: "rich_text", entityLabel: "Görünüm", changes },
    at,
  );
  return saved(at);
}

/* ------------------------------ Anasayfa tanitim alani ------------------------------ */

/** Anasayfa Tanıtım ekraninin verisi: ayarlar (tanitim alaninin son degisiklik aniyla). */
export async function readHeroPanel(db: AuditDb): Promise<Partial<ZenweldDatabase>> {
  const settings = await readSettings(db);
  const [row] = await db.select({ updatedAt: s.settings.updatedAt }).from(s.settings).where(eq(s.settings.key, "home_hero"));
  return { settings: { ...settings, homeHero: { ...settings.homeHero, ...(row && { updatedAt: iso(row.updatedAt) }) } } };
}

/**
 * Anasayfa tanitim alanini kaydeder. input: { hero, updatedAt? }. Kurallar
 * packages/data › hero-rules.ts; yuklenen dosya (data:) kaydedilmez, gorsel
 * dosya deposuna yuklenir (K-108). Degisen bir sey yoksa hicbir sey yazilmaz.
 */
export async function adminSaveHomeHero(db: AuditDb, actor: Actor, input: Input, at: Date): Promise<PanelResult<Saved>> {
  const parsed = parseHomeHero(input.hero);
  if (!parsed.ok) return parsed.error ? fail(400, parsed.error) : invalid();
  const next = parsed.value;
  if (heroHasUploadedFile(next)) return fail(400, tr.panel.uploadDisabled);

  await lock(db, "settings:home_hero");
  const [row] = await db.select().from(s.settings).where(eq(s.settings.key, "home_hero"));
  if ((row ? iso(row.updatedAt) : undefined) !== (input.updatedAt || undefined)) return fail(409, stale);
  // jsonb alanlarin sirasini degistirir: onceki deger ayni kurallardan gecirilip karsilastirilir.
  const stored = (row?.value as HomeHeroSettings | undefined) ?? defaultSettings.homeHero;
  const normalized = parseHomeHero(stored);
  const before = normalized.ok ? normalized.value : stored;
  if (row && heroKey(before) === heroKey(next)) return unchanged(row);

  const changes: AuditChanges = {};
  if (before.intervalSeconds !== next.intervalSeconds) changes.intervalSeconds = [before.intervalSeconds, next.intervalSeconds];
  if (JSON.stringify(before.slides) !== JSON.stringify(next.slides)) changes.slides = [before.slides, next.slides];

  if (row) await db.update(s.settings).set({ value: next, updatedAt: at }).where(eq(s.settings.key, "home_hero"));
  else await db.insert(s.settings).values({ key: "home_hero", value: next, updatedAt: at });
  await writeAudit(
    db,
    actor,
    { action: row ? "update" : "create", entityType: "settings", entityId: "home_hero", entityLabel: "Anasayfa Tanıtım", changes },
    at,
  );
  return saved(at);
}
