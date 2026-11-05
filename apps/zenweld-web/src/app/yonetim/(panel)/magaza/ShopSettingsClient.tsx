"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  EMAIL_RECIPIENT_TYPES,
  parseRecipients,
  parseShopSettings,
  recipientsVersion,
  shopKey,
  type BankAccount,
  type EmailRecipient,
  type ShopSettings,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { getEmailRecipients, getShopSettings, uid, useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Tabs, Textarea } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { PaymentPosSettings } from "@/components/admin/PaymentPosSettings";
import { useSettingsActions } from "@/lib/admin-settings";

/** Kargo firmalari alani: satir basina bir firma. */
const parseCarriers = (text: string) => text.split("\n").map((c) => c.trim()).filter(Boolean);

const UNSAVED = "Kaydedilmemiş değişiklikler var. Saklamak için Kaydet'e basın.";

/**
 * MAGAZA AYARLARI — iki sekme:
 * - Kargo ve Ödeme: kargo, taksit ve havale/EFT. Kartla taksit banka POS'u
 *   bazindadir: her POS'un musteriye sunulan taksitleri (vade farki) ve
 *   firma taksit oranlari (banka komisyonu) ayridir (bkz.
 *   components/admin/PaymentPosSettings.tsx).
 * - E-posta Alıcıları: Zenweld'e giden her e-posta turunun alicilari
 *   (KARARLAR K-104).
 *
 * Veritabani modunda kayit sunucuya gider (lib/admin-settings.ts); kurallar
 * tarayici ve sunucuda ortak (packages/data › settings-rules.ts).
 * defaultRecipient: alicisi yazilmayan turun gittigi adres (SUPPORT_EMAIL).
 */
export function ShopSettingsClient({ defaultRecipient }: { defaultRecipient: string }) {
  const [tab, setTab] = useState<"genel" | "eposta">("genel");
  return (
    <>
      <AdminPageHeader
        title="Mağaza Ayarları"
        description="Online satışta kargo ücreti, taksit seçenekleri, havale/EFT hesapları ve Zenweld'e giden e-postaların alıcıları."
      />
      <Tabs
        className="mb-6"
        tabs={[
          { id: "genel", label: "Kargo ve Ödeme" },
          { id: "eposta", label: "E-posta Alıcıları" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      {/* Iki sekme de acik kalir; sekme degisince kaydedilmemis degisiklik kaybolmaz. */}
      <div hidden={tab !== "genel"}>
        <ShopGeneral />
      </div>
      <div hidden={tab !== "eposta"}>
        <EmailRecipients defaultRecipient={defaultRecipient} />
      </div>
    </>
  );
}

/** Kaydet dugmesi ve sonuc mesajlari (her sekmenin ustunde). */
function SaveBar({
  onSave,
  disabled,
  saved,
  unsaved,
  error,
  savedText,
}: {
  onSave: () => void;
  disabled: boolean;
  saved: boolean;
  unsaved: boolean;
  error: string | null;
  savedText: string;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={disabled}>
          Kaydet
        </Button>
      </div>
      {saved && <Alert tone="success">{savedText}</Alert>}
      {!saved && unsaved && <Alert tone="warning">{UNSAVED}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}

function ShopGeneral() {
  const db = useDatabase();
  const actions = useSettingsActions();
  const stored = getShopSettings(db);
  const [draft, setDraft] = useState<ShopSettings>(stored);
  const [carriers, setCarriers] = useState(() => stored.carriers.join("\n"));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Son degisiklik ani (updatedAt) karsilastirmaya girmez.
  const formKey = shopKey({ ...draft, carriers: parseCarriers(carriers) });
  const storedKey = shopKey(stored);

  // Ayarlar baska yerde (baska sekmede) kaydedilirse form yenilenir;
  // kaydedilmemis degisiklik varsa korunur. Baska verinin degismesi formu etkilemez.
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (formKey === syncedKey) {
      setDraft(stored);
      setCarriers(stored.carriers.join("\n"));
    }
  }

  const set = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  const setBank = (id: string, patch: Partial<BankAccount>) =>
    set("bankAccounts", draft.bankAccounts.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const unsaved = formKey !== storedKey;

  const save = async () => {
    const parsed = parseShopSettings({ ...draft, carriers: parseCarriers(carriers) });
    if (!parsed.ok) return setError(parsed.error ?? tr.panel.invalidRequest);
    setError(null);
    const answer = await actions.saveShop(parsed.value, stored);
    if (!answer.ok) return setError(answer.error);
    // Form kaydedilen (kirpilmis, tekrarsiz) hale gecer.
    setDraft(parsed.value);
    setCarriers(parsed.value.carriers.join("\n"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <SaveBar
        onSave={() => void save()}
        disabled={actions.pending}
        saved={saved}
        unsaved={unsaved}
        error={error}
        savedText="Mağaza ayarları kaydedildi."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-4 font-display text-xl font-bold uppercase">Kargo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Ücretsiz kargo sınırı (₺, KDV dahil)" hint="Sepet bu tutar ve üzerindeyse kargo ücretsiz">
              <Input
                type="number"
                min={0}
                value={draft.freeShippingThreshold}
                onChange={(e) => set("freeShippingThreshold", num(e.target.value))}
              />
            </FormRow>
            <FormRow label="Kargo ücreti (₺, KDV dahil)" hint="Sınırın altındaki siparişlerde">
              <Input
                type="number"
                min={0}
                value={draft.shippingFee}
                onChange={(e) => set("shippingFee", num(e.target.value))}
              />
            </FormRow>
          </div>
          <div className="mt-4">
            <FormRow label="Kargo firmaları" hint="Her satıra bir firma; sipariş kargoya verilirken seçilir">
              <Textarea value={carriers} onChange={(e) => setCarriers(e.target.value)} className="min-h-32" />
            </FormRow>
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Kartla Taksit</h2>
          <p className="mb-4 text-sm text-zw-grey-600">
            Her bankanın kendi taksit seçenekleri ve komisyonu vardır. Ödeme sayfasında kart, programı eşleşen
            bankanın taksitleriyle çekilir; eşleşmeyen kartlar varsayılan POS'tan tek çekim ödenir.
          </p>
          <FormRow label="Taksit için en düşük sipariş tutarı (₺)">
            <Input
              type="number"
              min={0}
              value={draft.minInstallmentAmount}
              onChange={(e) => set("minInstallmentAmount", num(e.target.value))}
              className="sm:w-48"
            />
          </FormRow>
          <div className="mt-4">
            <PaymentPosSettings pos={draft.pos} onChange={(pos) => set("pos", pos)} />
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold uppercase">Havale / EFT</h2>
              <p className="text-sm text-zw-grey-600">
                Bu hesaplar ödeme sayfasında ve müşterinin sipariş detayında gösterilir.
              </p>
            </div>
            <FormRow label="Ödeme süresi (gün)" hint="Dolunca sipariş iptal edilir">
              <Input
                type="number"
                min={1}
                value={draft.transferDueDays}
                onChange={(e) => set("transferDueDays", Math.max(1, Math.floor(num(e.target.value))))}
                className="w-28"
              />
            </FormRow>
          </div>

          <div className="space-y-3">
            {draft.bankAccounts.map((b) => (
              <div key={b.id} className="grid gap-3 rounded-[4px] border border-zw-grey-200 p-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
                <FormRow label="Banka">
                  <Input value={b.bankName} onChange={(e) => setBank(b.id, { bankName: e.target.value })} />
                </FormRow>
                <FormRow label="Alıcı">
                  <Input value={b.accountHolder} onChange={(e) => setBank(b.id, { accountHolder: e.target.value })} />
                </FormRow>
                <FormRow label="IBAN">
                  <Input
                    value={b.iban}
                    onChange={(e) => setBank(b.id, { iban: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />
                </FormRow>
                <Button
                  variant="danger"
                  size="sm"
                  aria-label="Hesabı sil"
                  onClick={() => set("bankAccounts", draft.bankAccounts.filter((x) => x.id !== b.id))}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            leftIcon={<Plus size={15} />}
            onClick={() =>
              set("bankAccounts", [
                ...draft.bankAccounts,
                { id: uid("ba"), bankName: "", accountHolder: draft.bankAccounts[0]?.accountHolder ?? "", iban: "" },
              ])
            }
          >
            Hesap Ekle
          </Button>
        </AdminCard>
      </div>
    </>
  );
}

/** Turun alicilari, kutuda gorundugu haliyle (virgulle ayrilmis). */
const recipientTexts = (list: EmailRecipient[]) =>
  Object.fromEntries(
    EMAIL_RECIPIENT_TYPES.map((t) => [t.type, (list.find((r) => r.type === t.type)?.recipients ?? []).join(", ")]),
  ) as Record<string, string>;

function EmailRecipients({ defaultRecipient }: { defaultRecipient: string }) {
  const db = useDatabase();
  const actions = useSettingsActions();
  const stored = getEmailRecipients(db);
  const [texts, setTexts] = useState(() => recipientTexts(stored));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alicilar baska yerde kaydedilirse form yenilenir; kaydedilmemis degisiklik korunur.
  const storedKey = JSON.stringify(recipientTexts(stored));
  const formKey = JSON.stringify(texts);
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (formKey === syncedKey) setTexts(recipientTexts(stored));
  }

  const save = async () => {
    const items: EmailRecipient[] = [];
    for (const t of EMAIL_RECIPIENT_TYPES) {
      const parsed = parseRecipients(texts[t.type] ?? "");
      if (!parsed.ok) return setError(`${t.label}: ${parsed.error}`);
      items.push({ type: t.type, recipients: parsed.value });
    }
    setError(null);
    const answer = await actions.saveEmailRecipients(items, recipientsVersion(stored));
    if (!answer.ok) return setError(answer.error);
    setTexts(recipientTexts(items));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <SaveBar
        onSave={() => void save()}
        disabled={actions.pending}
        saved={saved}
        unsaved={formKey !== storedKey}
        error={error}
        savedText="E-posta alıcıları kaydedildi."
      />
      <AdminCard>
        <h2 className="mb-1 font-display text-xl font-bold uppercase">E-posta Alıcıları</h2>
        <p className="mb-4 text-sm text-zw-grey-600">
          Sitedeki formlardan ve siparişlerden Zenweld&apos;e giden e-postalar buraya yazılan adreslere gider. Birden
          fazla adres virgülle ayrılır (en fazla 10). Boş bırakılan türün e-postası {defaultRecipient} adresine gider.
          Müşteriye giden e-postalar (şifre sıfırlama) bu listeden etkilenmez.
        </p>
        <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200">
          <table className="w-full text-sm">
            <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
              <tr>
                <th className="px-3 py-2.5">E-posta</th>
                <th className="px-3 py-2.5">Alıcılar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zw-grey-100">
              {EMAIL_RECIPIENT_TYPES.map((t) => (
                <tr key={t.type}>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold">{t.label}</td>
                  <td className="w-full px-3 py-2">
                    <Input
                      value={texts[t.type] ?? ""}
                      onChange={(e) => setTexts((x) => ({ ...x, [t.type]: e.target.value }))}
                      placeholder={defaultRecipient}
                      aria-label={`${t.label} alıcıları`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </>
  );
}
