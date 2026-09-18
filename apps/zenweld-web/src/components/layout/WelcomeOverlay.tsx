"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin, X } from "lucide-react";
import { Button, ZenweldLogo } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { WelderAnimation } from "@/components/common/WelderAnimation";
import { useT } from "@/lib/i18n-client";

/**
 * KARŞILAMA POP-UP'I
 *
 * Site ilk açıldığında bir kez gösterilir; kapatıldıktan sonra o oturum
 * boyunca tekrar çıkmaz (sessionStorage). Sekme kapanıp yeniden açılırsa
 * yeniden gösterilir.
 *
 * Kapatma yolları: buton, ESC, dışarı tıklama.
 * Yönetim paneli ve hesap sayfalarında gösterilmez.
 */

const STORAGE_KEY = "zenweld.welcome.seen";

export function WelcomeOverlay() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* gizli sekme vb. */
    }
    if (seen) return;

    // Sayfa yerleşsin, sonra açılsın
    const timer = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setClosing(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* yok say */
    }
    window.setTimeout(() => setOpen(false), 260);
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[400] flex items-center justify-center p-4 transition-opacity duration-250 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zw-welcome-title"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} aria-hidden />

      <div
        className={`relative w-full max-w-3xl overflow-hidden rounded-[6px] bg-zw-ink shadow-2xl transition-all duration-300 ${
          closing ? "translate-y-2 scale-[0.98]" : "translate-y-0 scale-100"
        }`}
      >
        <button
          onClick={close}
          aria-label={t.welcome.skip}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Animasyon sahnesi */}
        <div className="relative bg-[#0c0f13]">
          <WelderAnimation className="mx-auto h-56 w-full max-w-lg sm:h-64" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zw-ink to-transparent" />
        </div>

        {/* Metin */}
        <div className="px-6 pb-7 pt-1 text-center sm:px-10 sm:pb-9">
          <ZenweldLogo variant="light" className="mx-auto h-7 w-auto" />

          <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-zw-red-500">
            {t.welcome.eyebrow}
          </div>

          <h2
            id="zw-welcome-title"
            className="mt-1.5 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl"
          >
            {t.welcome.title}
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zw-grey-300">
            {t.welcome.text}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LocaleLink href="/ekipmanlar" onClick={close}>
              <Button size="lg" fullWidth rightIcon={<ArrowRight size={18} />}>
                {t.welcome.cta}
              </Button>
            </LocaleLink>
            <LocaleLink href="/nereden-alabilirim" onClick={close}>
              <Button
                size="lg"
                fullWidth
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white hover:text-zw-ink"
                leftIcon={<MapPin size={18} />}
              >
                {t.welcome.secondary}
              </Button>
            </LocaleLink>
          </div>
        </div>
      </div>
    </div>
  );
}
