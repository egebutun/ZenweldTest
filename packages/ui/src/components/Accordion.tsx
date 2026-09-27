"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

export function Accordion({
  items,
  defaultOpen = -1,
  /** "chevron" varsayilan; "plus" artı/eksi isareti gosterir. */
  icon = "chevron",
}: {
  items: { id: string; title: ReactNode; content: ReactNode }[];
  defaultOpen?: number;
  icon?: "chevron" | "plus";
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
            {icon === "plus" ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zw-grey-300 text-zw-red-600">
                {open === i ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            ) : (
              <ChevronDown
                size={20}
                className={`shrink-0 text-zw-grey-500 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            )}
          </button>
          {open === i && (
            <div className="pb-5 text-sm leading-relaxed text-zw-grey-600">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
