"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { FaqItem } from "@zenweld/data";
import { deleteFaq, moveFaq, saveFaq, useDatabase } from "@zenweld/store";
import { Badge, Button, FormRow, Input, Modal, Select, Textarea } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";

const TOPICS: { id: FaqItem["topic"]; label: string }[] = [
  { id: "genel", label: "Genel" },
  { id: "siparis", label: "Sipariş & Teklif" },
  { id: "garanti", label: "Garanti" },
  { id: "teknik", label: "Teknik" },
];

const EMPTY: FaqItem = {
  id: "",
  topic: "genel",
  question: "",
  answer: "",
};

/**
 * SIK SORULAN SORULAR
 *
 * Sorular sitede bu listedeki sirayla gosterilir: SSS sayfasi (konuya gore
 * suzulebilir), urun sayfalarindaki SSS sekmesi ve anasayfadaki ilk 8 soru.
 */
export default function AdminFaqPage() {
  const db = useDatabase();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setEditing(null);
    setError(null);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.question.trim() || !editing.answer.trim()) {
      return setError("Soru ve cevap zorunludur.");
    }
    saveFaq({
      ...editing,
      question: editing.question.trim(),
      answer: editing.answer.trim(),
    });
    close();
  };

  const setText = (field: "question" | "answer", value: string) =>
    editing && setEditing({ ...editing, [field]: value });

  return (
    <>
      <AdminPageHeader
        title="Sık Sorulan Sorular"
        description="SSS sayfasında, ürün sayfalarındaki SSS sekmesinde ve anasayfada (ilk 8 soru) bu sırayla görünür."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing({ ...EMPTY })}>
            Yeni Soru
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="w-20 px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Soru</th>
              <th className="px-4 py-3">Konu</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {db.faqs.map((f, i) => (
              <tr key={f.id}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="Yukarı taşı"
                      disabled={i === 0}
                      onClick={() => moveFaq(f.id, -1)}
                      className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      aria-label="Aşağı taşı"
                      disabled={i === db.faqs.length - 1}
                      onClick={() => moveFaq(f.id, 1)}
                      className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{f.question}</div>
                  <div className="line-clamp-1 text-xs text-zw-grey-500">{f.answer}</div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone="grey">{TOPICS.find((t) => t.id === f.topic)?.label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label="Düzenle"
                      onClick={() => setEditing(f)}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label="Sil"
                      onClick={() => {
                        if (confirm("Bu soru silinsin mi?")) deleteFaq(f.id);
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {db.faqs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz soru yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={close} title={editing?.id ? "Soruyu Düzenle" : "Yeni Soru"}>
        {editing && (
          <div className="space-y-4">
            <FormRow label="Konu">
              <Select
                value={editing.topic}
                onChange={(e) => setEditing({ ...editing, topic: e.target.value as FaqItem["topic"] })}
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Soru" required>
              <Input value={editing.question} onChange={(e) => setText("question", e.target.value)} />
            </FormRow>
            <FormRow label="Cevap" required>
              <Textarea value={editing.answer} onChange={(e) => setText("answer", e.target.value)} />
            </FormRow>
            {error && <p className="text-sm font-semibold text-zw-red-600">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button onClick={save}>Kaydet</Button>
              <Button variant="outline" onClick={close}>
                Vazgeç
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
