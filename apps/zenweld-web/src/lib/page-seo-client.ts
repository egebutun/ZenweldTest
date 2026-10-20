"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Linki panelden degismis kayit (urun, blog, haber, etkinlik): eski adresle
 * gelen ziyaretci yeni adrese yonlenir. Demoda tarayicida yapiliyor; canlida
 * sunucu 301 ile yonlendirecek (docs/YAPILACAKLAR.md).
 */
export function useMovedRedirect(moved: { slug: string } | undefined, path: string) {
  const router = useRouter();
  useEffect(() => {
    if (moved) router.replace(`${path}/${moved.slug}`);
  }, [moved, path, router]);
}

/**
 * Panelde girilen sayfa basligi demoda sekmede de gorunsun. Arama motorlari
 * basligi sunucunun urettigi sayfadan okur (generateMetadata).
 *
 * Next sayfa bilgilerini (metadata) sayfadan sonra yazabildigi icin baslik
 * sayfa acik kaldikca korunur; baska sayfaya gecilince birakilir.
 */
export function useSeoTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const path = window.location.pathname;
    const apply = () => {
      if (window.location.pathname === path && document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}
