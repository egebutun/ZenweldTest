"use client";

import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[4px] bg-zw-grey-200 ${className}`} />;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={`mb-8 flex flex-col gap-3 ${align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}
    >
      <div className={align === "center" ? "max-w-2xl" : ""}>
        {eyebrow && (
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zw-red-600">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 max-w-2xl text-zw-grey-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[4px] border border-dashed border-zw-grey-300 bg-zw-grey-50 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-zw-grey-400">{icon}</div>}
      <h3 className="font-display text-xl font-semibold uppercase">{title}</h3>
      {text && <p className="mt-2 max-w-md text-sm text-zw-grey-600">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-zw-grey-100 text-zw-grey-700 border-zw-grey-300",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-zw-red-50 text-zw-red-800 border-zw-red-200",
  };
  return (
    <div className={`rounded-[4px] border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}
