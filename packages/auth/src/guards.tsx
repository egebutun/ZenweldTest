"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@zenweld/data";
import { useAuth } from "./auth-context";

interface RequireAuthProps {
  children: ReactNode;
  /** Izin verilen roller. Bos birakilirsa herhangi bir giris yeterlidir. */
  roles?: UserRole[];
  fallback: ReactNode;
  loading?: ReactNode;
}

/** Giris/rol kontrolu yapan sarmalayici. */
export function RequireAuth({ children, roles, fallback, loading }: RequireAuthProps) {
  const { user, ready } = useAuth();

  if (!ready) return <>{loading ?? null}</>;
  if (!user) return <>{fallback}</>;
  if (roles && roles.length > 0 && !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
