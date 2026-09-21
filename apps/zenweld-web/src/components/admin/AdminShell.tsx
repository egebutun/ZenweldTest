"use client";

import { usePathname } from "next/navigation";
import {
  Boxes,
  CalendarDays,
  Database,
  FileText,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Package,
  Palette,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, EmptyState } from "@zenweld/ui";
import { ZenweldLogo } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";

/**
 * ADMIN PANEL KABUGU
 *
 * !! GUVENLIK UYARISI !!
 * Bu panel demo amaclidir. Backend olmadigi icin yetki kontrolu yalnizca
 * tarayicida yapilir — /admin adresini bilen herkes acabilir ve tarayici
 * gelistirici araclariyla asilabilir. Canliya cikmadan once gercek bir
 * sunucu tarafi kimlik dogrulama/yetkilendirme eklenmelidir.
 */

const NAV = [
  { href: "/admin", label: "Panel", Icon: LayoutDashboard, exact: true },
  { href: "/admin/urunler", label: "Ürünler", Icon: Package },
  { href: "/admin/stok", label: "Stok Matrisi", Icon: Boxes },
  { href: "/admin/saticilar", label: "Online Satıcılar", Icon: Store },
  { href: "/admin/bayiler", label: "Bayiler", Icon: MapPin },
  { href: "/admin/uyeler", label: "Üyeler", Icon: Users },
  { href: "/admin/etkinlikler", label: "Etkinlikler", Icon: CalendarDays },
  { href: "/admin/haberler", label: "Haberler", Icon: Newspaper },
  { href: "/admin/gorunum", label: "Görünüm", Icon: Palette },
  { href: "/admin/teklifler", label: "Teklifler", Icon: FileText },
  { href: "/admin/siparisler", label: "Siparişler", Icon: ShoppingCart },
  { href: "/admin/veri", label: "Veri Yönetimi", Icon: Database },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready) {
    return <div className="zw-container py-20 text-center text-zw-grey-500">Yükleniyor…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="zw-container py-20">
        <EmptyState
          title="Yönetim paneline erişim yetkiniz yok"
          text="Bu alana yalnızca yönetici hesapları erişebilir. Demo yönetici hesabı: admin@zenweld.com / admin123"
          action={
            <LocaleLink href="/giris?next=/admin">
              <Button size="lg">Yönetici Girişi</Button>
            </LocaleLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zw-grey-50">
      <div className="zw-container py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-zw-grey-200 pb-5">
          <ZenweldLogo className="h-7 w-auto" />
          <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">
            Yönetim Paneli
          </span>
          <span className="rounded-[3px] bg-zw-ink px-2 py-0.5 text-[11px] font-bold uppercase text-white">
            Demo
          </span>
          <span className="ml-auto text-sm text-zw-grey-600">
            {user.firstName} {user.lastName}
          </span>
          <LocaleLink href="/" className="text-sm font-semibold text-zw-red-600 hover:underline">
            Siteye dön →
          </LocaleLink>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="space-y-1">
              {NAV.map(({ href, label, Icon, exact }) => {
                const active = exact ? pathname.endsWith(href) : pathname.includes(href);
                return (
                  <LocaleLink
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-zw-ink text-white" : "text-zw-grey-700 hover:bg-zw-grey-200"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </LocaleLink>
                );
              })}
            </nav>

            <div className="mt-5">
              <Alert tone="warning">
                <strong className="block">Demo uyarısı</strong>
                Değişiklikler yalnızca bu tarayıcıda saklanır. Kalıcı hale getirmek için{" "}
                <LocaleLink href="/admin/veri" className="underline">
                  Veri Yönetimi
                </LocaleLink>{" "}
                sayfasından JSON dışa aktarın.
              </Alert>
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">{title}</h1>
        {description && <p className="mt-1 text-sm text-zw-grey-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[4px] border border-zw-grey-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}
