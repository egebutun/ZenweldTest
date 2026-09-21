"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { defaultSettings, type RichTextStyle } from "@zenweld/data";
import { getRichTextStyle, saveRichTextStyle, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { RichText } from "@/components/events/RichText";

/** Ayarların etkisini canlı göstermek için kullanılan örnek metin. */
const PREVIEW = `Zenweld olarak, sektörün en prestijli etkinliklerinden birinde yerimizi alıyoruz. Bu giriş paragrafıdır ve metnin ilk paragrafı her zaman biraz daha büyük gösterilir.

## Standımızda Sizleri Neler Bekliyor?

- **Yüksek Performanslı Kaynak Makineleri:** Enerji verimli ve zorlu projelerde üstün performans sunan makinelerimizi inceleyin.
- **Uygulamalı Demo Gösterileri:** Uzman ekibimizin canlı demolarıyla ürünlerimizi iş başında görün.

## Zenweld ile Geleceği Şekillendirin!

Bu bir gövde paragrafıdır. Punto ve renk ayarlarını soldaki alanlardan değiştirdiğinizde bu önizleme anında güncellenir.`;

export default function AdminAppearancePage() {
  const db = useDatabase();
  const [draft, setDraft] = useState<RichTextStyle>(() => getRichTextStyle(db));
  const [saved, setSaved] = useState(false);

  // Veri yeniden yüklendiğinde (içe aktarma, sıfırlama) formu senkronla.
  useEffect(() => {
    setDraft(getRichTextStyle(db));
  }, [db]);

  const set = <K extends keyof RichTextStyle>(key: K, value: RichTextStyle[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    saveRichTextStyle(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <AdminPageHeader
        title="Görünüm"
        description="Etkinlik ve haber sayfalarındaki metinlerin punto ve renklerini buradan ayarlayın."
        action={
          <Button
            variant="outline"
            leftIcon={<RotateCcw size={16} />}
            onClick={() => setDraft({ ...defaultSettings.richText })}
          >
            Varsayılana Dön
          </Button>
        }
      />

      {saved && (
        <div className="mb-4">
          <Alert tone="success">Görünüm ayarları kaydedildi.</Alert>
        </div>
      )}

      <div className="mb-4">
        <Alert tone="info">
          Bu ayarlar etkinlik ve haber metinlerindeki ara başlık, madde ve kalın vurguları
          etkiler. Sayfa başlıkları, menüler ve ürün sayfaları marka tasarımına bağlı olduğu
          için buradan değişmez.
        </Alert>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <AdminCard className="h-fit space-y-5">
          <Section title="Ara Başlık">
            <SizeRow
              label="Punto"
              value={draft.headingSize}
              min={14}
              max={32}
              onChange={(v) => set("headingSize", v)}
            />
            <ColorRow
              label="Renk"
              value={draft.headingColor}
              onChange={(v) => set("headingColor", v)}
            />
            <Checkbox
              label="BÜYÜK HARF göster"
              checked={draft.headingUppercase}
              onChange={(e) => set("headingUppercase", e.target.checked)}
            />
          </Section>

          <Section title="Vurgu Rengi">
            <ColorRow
              label="Çizgi ve madde noktası"
              value={draft.accentColor}
              onChange={(v) => set("accentColor", v)}
            />
            <SizeRow
              label="Başlık altı çizgi genişliği"
              value={draft.accentWidth}
              min={0}
              max={160}
              step={4}
              suffix="px"
              onChange={(v) => set("accentWidth", v)}
            />
            <p className="text-xs text-zw-grey-500">0 yaparsanız çizgi gizlenir.</p>
          </Section>

          <Section title="Metin">
            <SizeRow
              label="Giriş paragrafı puntosu"
              value={draft.leadSize}
              min={14}
              max={26}
              onChange={(v) => set("leadSize", v)}
            />
            <SizeRow
              label="Gövde puntosu"
              value={draft.bodySize}
              min={12}
              max={22}
              onChange={(v) => set("bodySize", v)}
            />
            <ColorRow
              label="Gövde rengi"
              value={draft.bodyColor}
              onChange={(v) => set("bodyColor", v)}
            />
            <ColorRow
              label="Kalın vurgu rengi"
              value={draft.strongColor}
              onChange={(v) => set("strongColor", v)}
            />
          </Section>

          <Button size="lg" className="w-full" onClick={save}>
            Ayarları Kaydet
          </Button>
        </AdminCard>

        <AdminCard>
          <div className="mb-4 border-b border-zw-grey-200 pb-3 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
            Canlı önizleme
          </div>
          {/* Kaydedilmemiş taslağı göstermek için ayarlar doğrudan geçilir. */}
          <RichText source={PREVIEW} className="max-w-2xl" overrides={draft} />
        </AdminCard>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
        {title}
      </div>
      {children}
    </div>
  );
}

function SizeRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <FormRow label={`${label} — ${value}${suffix}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-zw-red-600"
      />
    </FormRow>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormRow label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-[4px] border border-zw-grey-300 bg-white p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      </div>
    </FormRow>
  );
}
