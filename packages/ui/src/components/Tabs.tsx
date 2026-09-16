"use client";

import type { ReactNode } from "react";

export function Tabs({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: { id: string; label: ReactNode; badge?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-zw-grey-200 ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={[
            "shrink-0 border-b-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors zw-focus",
            active === t.id
              ? "border-zw-red-600 text-zw-ink"
              : "border-transparent text-zw-grey-500 hover:text-zw-ink",
          ].join(" ")}
        >
          {t.label}
          {t.badge != null && (
            <span className="ml-2 rounded-full bg-zw-grey-100 px-2 py-0.5 text-[11px] text-zw-grey-600">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
