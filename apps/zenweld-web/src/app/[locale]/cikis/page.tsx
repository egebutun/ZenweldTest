"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { useHref, useT } from "@/lib/i18n-client";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const href = useHref();
  const t = useT();

  useEffect(() => {
    logout();
    const id = setTimeout(() => router.push(href("/")), 1200);
    return () => clearTimeout(id);
  }, [logout, router, href]);

  return (
    <div className="zw-container py-28 text-center">
      <p className="font-display text-2xl font-bold uppercase">{t.auth.logoutSuccess}</p>
    </div>
  );
}
