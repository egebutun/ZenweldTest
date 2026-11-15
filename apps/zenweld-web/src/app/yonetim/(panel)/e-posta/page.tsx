import { isEmailType } from "@zenweld/data";
import { readEmailLog, readEmailSettings, readMailboxStates } from "@zenweld/db";
import { PageData } from "@/components/common/PageData";
import { hasPanelSession } from "@/lib/server/admin";
import { database, usesDatabase } from "@/lib/server/db";
import { DEFAULT_SENDER, SUPPORT_EMAIL } from "@/lib/server/mail";
import { mailboxKeys } from "@/lib/server/mailbox";
import { beforeParam, param, type LogParams } from "@/lib/admin-log-params";
import { EmailClient } from "./EmailClient";

/**
 * PANEL › E-POSTA (KARARLAR K-116): sitenin her e-posta turu icin bir sekme;
 * sekmede yazismalar (gonderilen ve gelen e-postalar, metniyle), adresler
 * (gonderici ve alicilar) ve Yeni e-posta. Tur, sekme ve suzgecler adreste
 * durur (?tur=servis&sekme=adresler).
 *
 * Veritabani modunda her acilista sunucuda okunur (yazismalar sayfa basina
 * 50); posta kutularinin son okumasi da gosterilir. Demo modunda tarayicidaki
 * veri gosterilir.
 */
export default async function EmailPage({ searchParams }: { searchParams: Promise<LogParams> }) {
  const params = await searchParams;
  const tur = param(params, "tur");
  const type = isEmailType(tur) ? tur : "siparis";
  const filter = {
    tur: type,
    sekme: param(params, "sekme") === "adresler" ? "adresler" : undefined,
    yon: param(params, "yon"),
    durum: param(params, "durum"),
    baslangic: param(params, "baslangic"),
    bitis: param(params, "bitis"),
    ara: param(params, "ara"),
  };
  const defaults = { sender: DEFAULT_SENDER, recipient: SUPPORT_EMAIL };
  if (!usesDatabase()) return <EmailClient type={type} filter={filter} defaults={defaults} />;
  if (!(await hasPanelSession())) return null;
  const db = database();
  const [settings, page, states] = await Promise.all([
    readEmailSettings(db),
    readEmailLog(db, {
      type,
      direction: filter.yon,
      status: filter.durum,
      from: filter.baslangic,
      to: filter.bitis,
      q: filter.ara,
      before: beforeParam(params),
    }),
    readMailboxStates(db),
  ]);
  const mailboxes = mailboxKeys().map((key) => states.find((s) => s.mailbox === key) ?? { mailbox: key, lastUid: 0 });
  return (
    <PageData data={{ emailSettings: settings }}>
      <EmailClient type={type} filter={filter} defaults={defaults} page={page} paged={beforeParam(params) !== undefined} mailboxes={mailboxes} />
    </PageData>
  );
}
