"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** md | lg | xl | full */
  size?: "md" | "lg" | "xl" | "full";
}

const sizes = {
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[96rem]",
};

export function Modal({ open, onClose, title, children, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${sizes[size]} rounded-[4px] bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zw-grey-200 px-5 py-4">
          <div className="font-display text-xl font-semibold uppercase tracking-tight">
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-[3px] p-1 text-zw-grey-500 transition-colors hover:bg-zw-grey-100 hover:text-zw-ink zw-focus"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
