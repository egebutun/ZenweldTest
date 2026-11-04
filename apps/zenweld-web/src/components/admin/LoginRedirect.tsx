"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Oturum yoksa panelin giris ekranina; donuste ayni sayfaya gelinir. */
export function LoginRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/yonetim/giris?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);
  return <div className="py-20 text-center text-zw-grey-500">Giriş sayfasına yönlendiriliyor…</div>;
}
