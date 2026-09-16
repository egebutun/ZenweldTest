"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({
  items,
  defaultOpen = -1,
}: {
  items: { id: string; title: ReactNode; content: ReactNode }[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-zw-grey-200 border-y border-zw-grey-200">
      {items.map((item, i) => (
        <div key={item.id}>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-4 py-4 text-left zw-focus"
            aria-expanded={open === i}
          >
            <span className="font-semibold text-zw-ink">{item.title}</span>
            <ChevronDown
              size={20}
              className={`shrink-0 text-zw-grey-500 transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="pb-5 text-sm leading-relaxed text-zw-grey-600">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
