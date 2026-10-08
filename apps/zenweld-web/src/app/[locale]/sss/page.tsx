"use client";

import { useState } from "react";
import { useDatabase } from "@zenweld/store";
import { Accordion } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { useT, useText } from "@/lib/i18n-client";

const TOPICS = [
  { id: "", label: "Tümü" },
  { id: "genel", label: "Genel" },
  { id: "siparis", label: "Sipariş & Teklif" },
  { id: "garanti", label: "Garanti" },
  { id: "teknik", label: "Teknik" },
];

export default function FaqPage() {
  const t = useT();
  const text = useText();
  const db = useDatabase();
  const [topic, setTopic] = useState("");

  const faqs = topic ? db.faqs.filter((f) => f.topic === topic) : db.faqs;

  return (
    <>
      <PageHero title={t.support.faqTitle} subtitle={t.support.subtitle} />

      <div className="zw-container py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {TOPICS.map((tp) => (
            <button
              key={tp.id}
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
      </div>
    </>
  );
}
