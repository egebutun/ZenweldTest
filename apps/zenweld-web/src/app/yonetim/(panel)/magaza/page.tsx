"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BankAccount, ShopSettings } from "@zenweld/data";
import { getShopSettings, saveShopSettings, uid, useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { PaymentPosSettings } from "@/components/admin/PaymentPosSettings";

/** Kargo firmalari alani: satir basina bir firma. */
const parseCarriers = (text: string) => text.split("\n").map((c) => c.trim()).filter(Boolean);

/**
 * MAGAZA AYARLARI — kargo, taksit ve havale/EFT.
 *
 * Kartla taksit banka POS'u bazindadir: her POS'un musteriye sunulan
 * taksitleri (vade farki) ve firma taksit oranlari (banka komisyonu)
 * ayridir (bkz. components/admin/PaymentPosSettings.tsx).
 */
export default function AdminShopSettingsPage() {
  const db = useDatabase();
  const stored = getShopSettings(db);
  const [draft, setDraft] = useState<ShopSettings>(stored);
  const [carriers, setCarriers] = useState(() => stored.carriers.join("\n"));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formKey = JSON.stringify({ ...draft, carriers: parseCarriers(carriers) });
  const storedKey = JSON.stringify(stored);

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

  const save = () => {
    const carrierList = parseCarriers(carriers);
    if (carrierList.length === 0) return setError("En az bir kargo firması girin.");
    if (draft.bankAccounts.some((b) => !b.bankName.trim() || !b.iban.trim())) {
      return setError("Her banka hesabında banka adı ve IBAN zorunludur.");
    }
    setError(null);
    if (!saveShopSettings({ ...draft, carriers: carrierList })) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <AdminPageHeader
        title="Mağaza Ayarları"
        description="Online satışta kargo ücreti, taksit seçenekleri ve havale/EFT hesapları."
        action={<Button onClick={save}>Kaydet</Button>}
      />

      {saved && (
        <div className="mb-4">
          <Alert tone="success">Mağaza ayarları kaydedildi.</Alert>
        </div>
      )}
      {!saved && unsaved && (
        <div className="mb-4">
          <Alert tone="warning">Kaydedilmemiş değişiklikler var. Saklamak için Kaydet'e basın.</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

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
                onChange={(e) => set("transferDueDays", Math.max(1, num(e.target.value)))}
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
