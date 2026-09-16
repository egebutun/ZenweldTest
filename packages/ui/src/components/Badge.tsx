import type { ReactNode } from "react";

type Tone = "red" | "grey" | "green" | "amber" | "dark" | "outline";

const tones: Record<Tone, string> = {
  red: "bg-zw-red-600 text-white",
  grey: "bg-zw-grey-100 text-zw-grey-700",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  dark: "bg-zw-ink text-white",
  outline: "bg-white text-zw-grey-600 border border-zw-grey-300",
};

export function Badge({
  children,
  tone = "grey",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
