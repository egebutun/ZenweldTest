"use client";

import type { ComponentProps, FocusEvent, MouseEvent, TouchEvent } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

/**
 * SITENIN BAGLANTISI (docs/YAPILACAKLAR.md › Ölçüm (hız) 9)
 *
 * Next.js'in baglantisi ekranda gorunen her baglantinin sayfasini onceden
 * indirir. Telefonda bu, sayfa basina ~90–100 KB ve islemci demekti (olcum,
 * 2026-11-25); sahibinin karariyla sayfa yalnizca ziyaretci niyet edince
 * onceden indirilir:
 * - masaustunde fare baglantinin uzerine gelince,
 * - telefonda baglantiya dokunulunca (parmak kalkmadan once),
 * - klavyede baglantiya gelince.
 * Boylece tiklanan sayfa yine hizli acilir, gorunen ama tiklanmayan
 * baglantilar indirilmez. Bir baglanti onceden yuklemeyi acikca isterse
 * (prefetch) o kullanilir.
 *
 * Sitede next/link yerine bu kullanilir.
 */
export default function Link({ prefetch, onMouseEnter, onTouchStart, onFocus, ...props }: ComponentProps<typeof NextLink>) {
  const router = useRouter();
  const href = typeof props.href === "string" ? props.href : props.href.pathname ? `${props.href.pathname}${props.href.search ?? ""}` : null;
  // Yalnizca sitenin kendi sayfalari (dis adres, e-posta, telefon degil).
  const warm = () => {
    if (prefetch === undefined && href?.startsWith("/") && !href.startsWith("//")) router.prefetch(href);
  };
  return (
    <NextLink
      {...props}
      prefetch={prefetch ?? false}
      onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e: TouchEvent<HTMLAnchorElement>) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        warm();
        onFocus?.(e);
      }}
    />
  );
}
