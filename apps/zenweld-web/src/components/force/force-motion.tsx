"use client";

import { useEffect, useRef } from "react";

/**
 * FORCE SAYFASI: KAYDIRINCA YUMUSAK BELIRME
 *
 * Sayfada tek hareket budur: bolum ekrana girince icindeki [data-fx]
 * ogeleri sirayla, hafifce yukselerek belirir (--d gecikmesiyle). Hareket
 * azaltma tercihinde hicbiri calismaz; icerik hemen gorunur
 * (globals.css › Force sayfasi).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      el.dataset.shown = "true";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.shown = "true";
        observer.disconnect();
      },
      // Uzun bolumler (tablo) de ust kenari ekranin alt %15'ine girince belirir.
      { threshold: 0, rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}
