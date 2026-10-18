import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";

/** Hesap sayfaları arama sonuçlarında çıkmasın. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
