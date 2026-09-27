"use client";

import { useState } from "react";
import { useDatabase } from "@zenweld/store";
import { Accordion } from "@zenweld/ui";
import { useT, useText } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";

/**
 * MAGAZA — SIK SORULAN SORULAR
 *
 * Sorular ana siteyle AYNI kaynaktan (db.faqs) gelir; Zenweld merkez
 * yonetim panelinden duzenlenir, magazanin ayri bir kopyasi yoktur.
 * Boylece iki sitede birbirini tutmayan cevaplar olusmaz.
 */
const TOPICS = [
  { id: "", label: "Tümü" },
  { id: "genel", label: "Genel" },
  { id: "siparis", label: "Sipariş & Teklif" },
  { id: "garanti", label: "Garanti" },
  { id: "teknik", label: "Teknik" },
];

export default function ShopFaqPage() {
  const t = useT();
  const text = useText();
  const db = useDatabase();
  const [topic, setTopic] = useState("");

  const faqs = topic ? db.faqs.filter((f) => f.topic === topic) : db.faqs;

  return (
    <div className="zw-container py-12">
      <h1 className="font-display text-4xl font-bold uppercase">{t.support.faqTitle}</h1>
      <p className="mt-2 max-w-2xl text-zw-grey-600">{t.support.subtitle}</p>

      <div className="mt-8 mb-6 flex flex-wrap gap-2">
        {TOPICS.map((tp) => (
          <button
            key={tp.id}
            type="button"
            onClick={() => setTopic(tp.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              topic === tp.id
                ? "bg-zw-ink text-white"
                : "bg-zw-grey-100 text-zw-grey-700 hover:bg-zw-grey-200"
            }`}
          >
            {tp.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        <Accordion
          defaultOpen={0}
          items={faqs.map((f) => ({
            id: f.id,
            title: text(f.question),
            content: text(f.answer),
          }))}
        />
      </div>

      <p className="mt-10 text-sm text-zw-grey-500">
        Aradığınız yanıtı bulamadıysanız {STORE.phone} numarasından bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
