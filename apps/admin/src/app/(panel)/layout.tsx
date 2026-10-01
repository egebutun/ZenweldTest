import { AdminShell } from "@/components/AdminShell";

/** Giris ekrani disindaki tum panel sayfalari bu kabugun icinde. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
