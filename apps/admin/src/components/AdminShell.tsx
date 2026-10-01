"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  CalendarDays,
  Database,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Newspaper,
  Package,
  Palette,
  PenLine,
  ShoppingCart,
  Star,
  Store,
  Users,
} from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { Alert, ZenweldLogo } from "@zenweld/ui";
import { siteUrl } from "@/lib/links";

/**
 * YONETIM PANELI KABUGU
 *
 * Panel ana siteden ayri bir uygulamadir (apps/admin). Adresi
 * zenweld.com/yonetim; ana sitede hicbir yerden baglanti verilmez.
 * Giris yapilmamissa kendi giris ekranina (/yonetim/giris) yonlendirir.
 *
 * !! GUVENLIK UYARISI !!
 * Demo amaclidir. Backend olmadigi icin yetki kontrolu yalnizca
 * tarayicida yapilir ve gelistirici araclariyla asilabilir. Canliya
 * cikmadan once sunucu tarafi kimlik dogrulama/yetkilendirme sarttir.
 */

/** Adresler panelin kendi icindedir; Next.js /yonetim on ekini ekler. */
const NAV = [
  { href: "/", label: "Panel", Icon: LayoutDashboard, exact: true },
  { href: "/urunler", label: "Ürünler", Icon: Package },
  { href: "/stok", label: "Stok Matrisi", Icon: Boxes },
  { href: "/saticilar", label: "Online Satıcılar", Icon: Store },
  { href: "/bayiler", label: "Bayiler", Icon: MapPin },
  { href: "/uyeler", label: "Üyeler", Icon: Users },
  { href: "/etkinlikler", label: "Etkinlikler", Icon: CalendarDays },
  { href: "/haberler", label: "Haberler", Icon: Newspaper },
  { href: "/blog", label: "Blog", Icon: PenLine },
  { href: "/yorumlar", label: "Yorumlar", Icon: Star },
  { href: "/gorunum", label: "Görünüm", Icon: Palette },
  { href: "/teklifler", label: "Teklifler", Icon: FileText },
  { href: "/siparisler", label: "Siparişler", Icon: ShoppingCart },
  { href: "/veri", label: "Veri Yönetimi", Icon: Database },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Bilerek cikis yapildiysa "geri donulecek sayfa" eklenmez.
  const leaving = useRef(false);

  // Giris yoksa panelin kendi giris ekranina; donuste ayni sayfaya gelinir.
  useEffect(() => {
    if (!ready || user || leaving.current) return;
    router.replace(`/giris?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, pathname, router]);

  if (!ready || !user) {
    return <div className="py-20 text-center text-zw-grey-500">Yükleniyor…</div>;
  }

  return (
    <div className="min-h-screen bg-zw-grey-50">
      {/* Panelin kendi ust cubugu — ana sitenin menusu burada yok. */}
      <header className="bg-zw-ink text-white">
        <div className="zw-container flex flex-wrap items-center gap-3 py-3">
          <Link href="/" className="flex items-center gap-3">
            <ZenweldLogo variant="light" className="h-6 w-auto" />
            <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-[11px] font-bold uppercase">
              Yönetim Paneli
            </span>
          </Link>
          <span className="rounded-[3px] border border-white/30 px-2 py-0.5 text-[11px] font-bold uppercase text-white/80">
            Demo
          </span>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <a
              href={siteUrl("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/80 hover:text-white"
            >
              <ExternalLink size={15} />
              Siteyi aç
            </a>
            <span className="hidden text-white/60 sm:inline">
              {user.firstName} {user.lastName}
            </span>
            <button
              type="button"
              onClick={() => {
                leaving.current = true;
                logout();
                router.replace("/giris");
              }}
              className="flex items-center gap-1.5 rounded-[4px] bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20"
            >
              <LogOut size={15} />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="zw-container py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside>
            <nav className="space-y-1">
              {NAV.map(({ href, label, Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-zw-ink text-white" : "text-zw-grey-700 hover:bg-zw-grey-200"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5">
              <Alert tone="warning">
                <strong className="block">Demo uyarısı</strong>
                Değişiklikler yalnızca bu tarayıcıda saklanır. Kalıcı hale getirmek için{" "}
                <Link href="/veri" className="underline">
                  Veri Yönetimi
                </Link>{" "}
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
