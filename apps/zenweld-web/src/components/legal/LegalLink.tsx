"use client";

import type { ReactNode } from "react";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";

/**
 * Formlardaki yasal metin baglantisi: alti cizili ve YENI SEKMEDE acilir,
 * boylece ziyaretcinin doldurdugu form kaybolmaz.
 */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <LocaleLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-zw-ink underline underline-offset-2 hover:text-zw-red-600"
    >
      {children}
    </LocaleLink>
  );
}

/** "Kisisel verileriniz KVKK Aydinlatma Metni kapsaminda islenir." */
export function KvkkNotice({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <p className={`text-xs text-zw-grey-500 ${className}`}>
      {t.legal.kvkkNoticeBefore}
      <LegalLink href="/yasal/kvkk">{t.legal.kvkkNoticeLink}</LegalLink>
      {t.legal.kvkkNoticeAfter}
    </p>
  );
}
