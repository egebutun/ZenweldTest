"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { parseShopSettings, shopKey, type BankAccount, type ShopSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { getShopSettings, uid, useDatabase } from "@zenweld/store";
import { Button, FormRow, Input, Tabs } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { PaymentPosSettings } from "@/components/admin/PaymentPosSettings";
import { useSettingsActions } from "@/lib/admin-settings";
import { CarrierSettings } from "./CarrierSettings";
import { CompanySettingsForm } from "./CompanySettingsForm";
import { SaveBar } from "./SaveBar";

/**
 * MAGAZA AYARLARI — iki sekme (e-posta adresleri Panel › E-posta'dadir;
 * KARARLAR K-116):
 * - Kargo ve Ödeme: kargo (firmalar ve takip adresleri: CarrierSettings),
 *   taksit ve havale/EFT. Kartla taksit banka POS'u bazindadir: her POS'un
 *   musteriye sunulan taksitleri (vade farki) ve firma taksit oranlari
 *   (banka komisyonu) ayridir (bkz. components/admin/PaymentPosSettings.tsx).
 * - Şirket ve İletişim: unvan, MERSIS no, telefon, e-posta, ofisler, sosyal
 *   medya (CompanySettingsForm; KARARLAR K-105).
 *
 * Veritabani modunda kayit sunucuya gider (lib/admin-settings.ts); kurallar
 * tarayici ve sunucuda ortak (packages/data › settings-rules.ts).
 */
export function ShopSettingsClient() {
  const [tab, setTab] = useState<"genel" | "sirket">("genel");
  return (
    <>
      <AdminPageHeader
        title="Mağaza Ayarları"
        description="Online satışta kargo ücreti, taksit seçenekleri, havale/EFT hesapları ve şirketin iletişim bilgileri."
      />
      <Tabs
        className="mb-6"
        tabs={[
          { id: "genel", label: "Kargo ve Ödeme" },
          { id: "sirket", label: "Şirket ve İletişim" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      {/* Sekmeler acik kalir; sekme degisince kaydedilmemis degisiklik kaybolmaz. */}
      <div hidden={tab !== "genel"}>
        <ShopGeneral />
      </div>
      <div hidden={tab !== "sirket"}>
        <CompanySettingsForm />
      </div>
    </>
  );
}

function ShopGeneral() {
  const db = useDatabase();
  const actions = useSettingsActions();
  const stored = getShopSettings(db);
  const [draft, setDraft] = useState<ShopSettings>(stored);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Son degisiklik ani (updatedAt) karsilastirmaya girmez.
  const formKey = shopKey(draft);
  const storedKey = shopKey(stored);

  // Ayarlar baska yerde (baska sekmede) kaydedilirse form yenilenir;
  // kaydedilmemis degisiklik varsa korunur. Baska verinin degismesi formu etkilemez.
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (formKey === syncedKey) setDraft(stored);
  }

  const set = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  const setBank = (id: string, patch: Partial<BankAccount>) =>
    set("bankAccounts", draft.bankAccounts.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const unsaved = formKey !== storedKey;

  const save = async () => {
    const parsed = parseShopSettings(draft);
    if (!parsed.ok) return setError(parsed.error ?? tr.panel.invalidRequest);
    setError(null);
    const answer = await actions.saveShop(parsed.value, stored);
    if (!answer.ok) return setError(answer.error);
    // Form kaydedilen (kirpilmis, tekrarsiz) hale gecer.
    setDraft(parsed.value);
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

      {/* grid-cols-1: tek sutunda kutular ekran genisligini asmaz (genis tablo kendi icinde kayar). */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Kargo Firmaları</h2>
          <CarrierSettings carriers={draft.carriers} onChange={(carriers) => set("carriers", carriers)} />
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
