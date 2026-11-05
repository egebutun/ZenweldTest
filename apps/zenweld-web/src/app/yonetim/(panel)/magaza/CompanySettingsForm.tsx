"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { companyKey, parseCompanySettings, type CompanyOffice, type CompanySettings, type CompanySocial } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { getCompany, uid, useDatabase } from "@zenweld/store";
import { Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { AdminCard } from "@/components/admin/AdminShell";
import { useSettingsActions } from "@/lib/admin-settings";
import { SaveBar } from "./SaveBar";

const SOCIAL: { key: keyof CompanySocial; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
];

/** Cok satirli alan: her satir bir deger (bos satirlar kayitta atlanir). */
const toText = (lines: string[]) => lines.join("\n");
const toLines = (text: string) => text.split("\n");

/**
 * SIRKET VE ILETISIM (Magaza Ayarlari'nin 3. sekmesi; KARARLAR K-105)
 *
 * Unvan, MERSIS no, telefon, e-posta, ofisler ve sosyal medya. Sitede alt
 * bilgi, Iletisim sayfasi, sozlesmelerdeki Satici bolumu ve arama
 * motorlarina verilen kurulus bilgisi buradan okunur. Ilk ofis merkezdir.
 * Kurallar tarayici ve sunucuda ortak (packages/data › settings-rules.ts).
 */
export function CompanySettingsForm() {
  const db = useDatabase();
  const actions = useSettingsActions();
  const stored = getCompany(db);
  const [draft, setDraft] = useState<CompanySettings>(stored);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bilgiler baska yerde kaydedilirse form yenilenir; kaydedilmemis degisiklik korunur.
  const storedKey = companyKey(stored);
  const formKey = companyKey(draft);
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (formKey === syncedKey) setDraft(stored);
  }

  const set = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setOffice = (id: string, patch: Partial<CompanyOffice>) =>
    set("offices", draft.offices.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const moveOffice = (i: number, step: -1 | 1) => {
    const list = [...draft.offices];
    [list[i], list[i + step]] = [list[i + step], list[i]];
    set("offices", list);
  };

  const save = async () => {
    const parsed = parseCompanySettings(draft);
    if (!parsed.ok) return setError(parsed.error ?? tr.panel.invalidRequest);
    setError(null);
    const answer = await actions.saveCompany(parsed.value, stored);
    if (!answer.ok) return setError(answer.error);
    // Form kaydedilen (kirpilmis) hale gecer.
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
        unsaved={formKey !== storedKey}
        error={error}
        savedText="Şirket ve iletişim bilgileri kaydedildi."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Şirket</h2>
          <p className="mb-4 text-sm text-zw-grey-600">
            Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi&apos;ndeki Satıcı bölümünde, alt bilgide ve İletişim
            sayfasında görünür.
          </p>
          <div className="space-y-4">
            <FormRow label="Ticari unvan" required>
              <Input value={draft.legalName} onChange={(e) => set("legalName", e.target.value)} />
            </FormRow>
            <FormRow label="MERSİS no" hint="16 rakam. Boş bırakılırsa sözleşmelerde [—] yazar.">
              <Input value={draft.mersisNo} onChange={(e) => set("mersisNo", e.target.value)} className="font-mono" />
            </FormRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Telefon" required hint="Alt bilgide ve sözleşmelerde">
                <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
              </FormRow>
              <FormRow label="E-posta" required hint="Sitede görünen adres">
                <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
              </FormRow>
            </div>
            <p className="text-xs text-zw-grey-500">
              Formlardan Zenweld&apos;e giden e-postaların alıcıları E-posta Alıcıları sekmesindedir.
            </p>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Sosyal Medya</h2>
          <p className="mb-4 text-sm text-zw-grey-600">Alt bilgide simge olarak görünür. Boş bırakılan gösterilmez.</p>
          <div className="space-y-4">
            {SOCIAL.map(({ key, label }) => (
              <FormRow key={key} label={label}>
                <Input
                  value={draft.social[key]}
                  placeholder="https://"
                  onChange={(e) => set("social", { ...draft.social, [key]: e.target.value })}
                />
              </FormRow>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <h2 className="mb-1 font-display text-xl font-bold uppercase">Ofisler</h2>
          <p className="mb-4 text-sm text-zw-grey-600">
            İletişim sayfasında harita ve yol tarifiyle görünür. İlk ofis merkezdir: adresi alt bilgide ve sözleşmelerde
            yazar.
          </p>
          <div className="space-y-3">
            {draft.offices.map((o, i) => (
              <div key={o.id} className="grid gap-3 rounded-[4px] border border-zw-grey-200 p-3 md:grid-cols-[1fr_2fr_1.4fr_auto]">
                <FormRow label={i === 0 ? "Şehir (merkez)" : "Şehir"}>
                  <Input value={o.city} onChange={(e) => setOffice(o.id, { city: e.target.value })} />
                </FormRow>
                <FormRow label="Adres" hint="Her satıra bir satır">
                  <Textarea
                    value={toText(o.addressLines)}
                    onChange={(e) => setOffice(o.id, { addressLines: toLines(e.target.value) })}
                    className="min-h-20"
                  />
                </FormRow>
                <FormRow label="Telefonlar" hint="Her satıra bir numara">
                  <Textarea
                    value={toText(o.phones)}
                    onChange={(e) => setOffice(o.id, { phones: toLines(e.target.value) })}
                    className="min-h-20"
                  />
                </FormRow>
                <div className="flex gap-1 md:flex-col md:pt-6">
                  <Button variant="outline" size="sm" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => moveOffice(i, -1)}>
                    <ArrowUp size={15} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Aşağı taşı"
                    disabled={i === draft.offices.length - 1}
                    onClick={() => moveOffice(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label="Ofisi sil"
                    onClick={() => set("offices", draft.offices.filter((x) => x.id !== o.id))}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            leftIcon={<Plus size={15} />}
            onClick={() => set("offices", [...draft.offices, { id: uid("ofis"), city: "", addressLines: [], phones: [] }])}
          >
            Ofis Ekle
          </Button>
        </AdminCard>
      </div>
    </>
  );
}
