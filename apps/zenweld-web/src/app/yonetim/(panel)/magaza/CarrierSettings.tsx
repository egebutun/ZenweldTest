"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { TRACKING_PLACEHOLDER, type Carrier } from "@zenweld/data";
import { Button, FormRow, Input } from "@zenweld/ui";

/**
 * KARGO FIRMALARI (Magaza Ayarlari > Kargo ve Odeme)
 *
 * Her firmanin adi ve takip sayfasinin adresi (KARARLAR K-105). Adresteki
 * {takip} yerine gonderinin takip numarasi yazilir; adres bossa musteriye
 * takip baglantisi gosterilmez (packages/data › shipping.ts). Sira, siparis
 * kargoya verilirken firma listesindeki siradir.
 */
export function CarrierSettings({ carriers, onChange }: { carriers: Carrier[]; onChange: (carriers: Carrier[]) => void }) {
  const update = (i: number, patch: Partial<Carrier>) => onChange(carriers.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, step: -1 | 1) => {
    const list = [...carriers];
    [list[i], list[i + step]] = [list[i + step], list[i]];
    onChange(list);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zw-grey-600">
        Sipariş kargoya verilirken firma bu listeden seçilir. Takip adresinde {TRACKING_PLACEHOLDER} yerine takip
        numarası yazılır (ör. https://kargo.example/sorgula?no={TRACKING_PLACEHOLDER}); müşteri sipariş detayında
        &quot;Kargoyu takip et&quot; bağlantısını görür. Adres boşsa bağlantı gösterilmez; adresi kargo firmasından öğrenin.
      </p>
      {carriers.map((c, i) => (
        <div key={i} className="grid gap-3 rounded-[4px] border border-zw-grey-200 p-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <FormRow label="Firma">
            <Input value={c.name} onChange={(e) => update(i, { name: e.target.value })} />
          </FormRow>
          <FormRow label="Takip adresi">
            <Input
              value={c.trackingUrl ?? ""}
              placeholder={`https://…${TRACKING_PLACEHOLDER}`}
              onChange={(e) => update(i, { trackingUrl: e.target.value })}
              className="font-mono text-xs"
            />
          </FormRow>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp size={15} />
            </Button>
            <Button variant="outline" size="sm" aria-label="Aşağı taşı" disabled={i === carriers.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown size={15} />
            </Button>
            <Button variant="danger" size="sm" aria-label="Firmayı sil" onClick={() => onChange(carriers.filter((_, j) => j !== i))}>
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" leftIcon={<Plus size={15} />} onClick={() => onChange([...carriers, { name: "" }])}>
        Firma Ekle
      </Button>
    </div>
  );
}
