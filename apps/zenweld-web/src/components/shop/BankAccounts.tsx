"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { BankAccount } from "@zenweld/data";
import { useT } from "@/lib/i18n-client";

/** Havale/EFT icin Zenweld hesaplari; IBAN tek tikla kopyalanir. */
export function BankAccounts({ accounts }: { accounts: BankAccount[] }) {
  const t = useT();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {accounts.map((a) => (
        <div key={a.id} className="rounded-[4px] border border-zw-grey-200 bg-white p-4 text-sm">
          <div className="font-semibold text-zw-ink">{a.bankName}</div>
          <div className="mt-1 text-xs text-zw-grey-500">
            {t.checkout.accountHolder}: {a.accountHolder}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-[3px] bg-zw-grey-50 px-2 py-1.5">
            <span className="font-mono text-xs tracking-wide text-zw-ink">{a.iban}</span>
            <CopyButton value={a.iban.replace(/\s/g, "")} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CopyButton({ value }: { value: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zw-grey-600 hover:text-zw-red-600"
      aria-label={t.orders.copy}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? t.orders.copied : t.orders.copy}
    </button>
  );
}
