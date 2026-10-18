"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { useT } from "@/lib/i18n-client";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    logout();
    const id = setTimeout(() => router.push("/"), 1200);
    return () => clearTimeout(id);
  }, [logout, router]);

  return (
    <div className="zw-container py-28 text-center">
      <p className="font-display text-2xl font-bold uppercase">{t.auth.logoutSuccess}</p>
    </div>
  );
}
