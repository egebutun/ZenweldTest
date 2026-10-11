"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BankAccount, ShopSettings } from "@zenweld/data";
import { getShopSettings, saveShopSettings, uid, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, Textarea } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";

/**
 * MAGAZA AYARLARI — kargo, taksit ve havale/EFT.
 *
 * Taksit oranlari sitede musteriye gosterilen vade farkidir. Gercek
 * odeme kurulusu baglaninca bankalarin oranlari buradaki degerlerin
 * yerini alabilir (bkz. lib/payment.ts).
 */
export default function AdminShopSettingsPage() {
  const db = useDatabase();
  const [draft, setDraft] = useState<ShopSettings>(() => getShopSettings(db));
  const [carriers, setCarriers] = useState(() => draft.carriers.join("\n"));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Veri yeniden yuklendiginde (ice aktarma, sifirlama) formu senkronla.
  useEffect(() => {
    const shop = getShopSettings(db);
    setDraft(shop);
    setCarriers(shop.carriers.join("\n"));
  }, [db]);

  const set = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  const setBank = (id: string, patch: Partial<BankAccount>) =>
    set("bankAccounts", draft.bankAccounts.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const save = () => {
    const carrierList = carriers.split("\n").map((c) => c.trim()).filter(Boolean);
    if (carrierList.length === 0) return setError("En az bir kargo firması girin.");
    if (draft.bankAccounts.some((b) => !b.bankName.trim() || !b.iban.trim())) {
      return setError("Her banka hesabında banka adı ve IBAN zorunludur.");
    }
    setError(null);
    saveShopSettings({ ...draft, carriers: carrierList });
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

        <AdminCard>
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Kartla Taksit</h2>
          <p className="mb-4 text-sm text-zw-grey-600">
            Vade farkı %0 ise müşteri peşin fiyatına taksit yapar, banka komisyonunu Zenweld öder.
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
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-zw-grey-500">
              <tr>
                <th className="py-2">Taksit</th>
                <th className="py-2">Sunulsun</th>
                <th className="py-2">Vade farkı (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zw-grey-100">
              {draft.installments.map((o, idx) => (
                <tr key={o.count}>
                  <td className="py-2 font-semibold">{o.count} taksit</td>
                  <td className="py-2">
                    <Checkbox
                      label=""
                      checked={o.enabled}
                      onChange={(e) =>
                        set(
                          "installments",
                          draft.installments.map((x, i) => (i === idx ? { ...x, enabled: e.target.checked } : x)),
                        )
                      }
                    />
                  </td>
                  <td className="py-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={o.ratePercent}
                      disabled={!o.enabled}
                      onChange={(e) =>
                        set(
                          "installments",
                          draft.installments.map((x, i) =>
                            i === idx ? { ...x, ratePercent: num(e.target.value) } : x,
                          ),
                        )
                      }
                      className="w-28 py-1.5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
