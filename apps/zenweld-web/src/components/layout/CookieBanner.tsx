"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button, Modal } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";

/**
 * CEREZ (TANIMLAMA BILGISI) BANDI
 *
 * Ilk ziyarette sayfanin altinda cikar: Tumunu Kabul Et / Tumunu Reddet /
 * Tanimlama Bilgisi Ayarlari. Secim ziyaretcinin TARAYICISINA kaydedilir
 * (IP ya da cihaz tanima yok): ayni tarayicida bir daha sorulmaz; baska
 * cihaz/tarayicida, gizli sekmede veya tarayici verileri silinince
 * yeniden sorulur.
 *
 * Analiz veya reklam kodu (Google Analytics, Meta Pixel ...) eklendiginde
 * yalnizca getCookieConsent() === "all" iken yuklenmelidir.
 */

const STORAGE_KEY = "zenweld.cookie-consent.v1";

export type CookieChoice = "all" | "necessary";

/** Ziyaretcinin secimi; henuz secmediyse null. */
export function getCookieConsent(): CookieChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { choice: CookieChoice }).choice : null;
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    setOpen(getCookieConsent() === null);
  }, []);

  const choose = (choice: CookieChoice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
    } catch {
      /* depolama kapali: bant bu ziyaret boyunca kapanir */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div
        role="region"
        aria-label={t.cookies.title}
        className="fixed inset-x-0 bottom-0 z-[500] border-t border-zw-grey-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      >
        <div className="zw-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex gap-3">
            <Cookie size={22} className="mt-0.5 shrink-0 text-zw-red-600" />
            <p className="text-sm leading-relaxed text-zw-grey-700">
              <strong className="text-zw-ink">{t.cookies.title}.</strong> {t.cookies.text}{" "}
              <LocaleLink
                href="/yasal/cerez-politikasi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zw-ink underline underline-offset-2 hover:text-zw-red-600"
              >
                {t.cookies.policyLink}
              </LocaleLink>
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="ghost" onClick={() => setSettings(true)}>
              {t.cookies.settings}
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose("necessary")}>
              {t.cookies.rejectAll}
            </Button>
            <Button size="sm" onClick={() => choose("all")}>
              {t.cookies.acceptAll}
            </Button>
          </div>
        </div>
      </div>

      {/* Ayarlar simdilik bos; kategoriler (analiz, pazarlama) sonra eklenecek. */}
      <Modal open={settings} onClose={() => setSettings(false)} title={t.cookies.settings} size="md">
        <p className="text-sm text-zw-grey-600">{t.cookies.settingsEmpty}</p>
      </Modal>
    </>
  );
}
