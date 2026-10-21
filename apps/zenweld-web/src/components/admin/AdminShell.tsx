"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  CalendarDays,
  ChevronDown,
  Contact,
  ExternalLink,
  FileText,
  FolderOpen,
  FolderTree,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Newspaper,
  Package,
  Palette,
  PenLine,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Store,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { dismissWriteFailed, useWriteFailed } from "@zenweld/store";
import { Alert, ZenweldLogo } from "@zenweld/ui";
import { siteUrl } from "@/lib/admin-links";

/**
 * YONETIM PANELI KABUGU
 *
 * Panel ana sitenin icinde, kendi bolumunde calisir (app/yonetim): kendi
 * kabugu, kendi giris ekrani ve sitedeki musteri oturumundan ayri kendi
 * oturumu vardir. Adresi zenweld.com/yonetim; ana sitede hicbir yerden
 * baglanti verilmez.
 * Giris yapilmamissa kendi giris ekranina (/yonetim/giris) yonlendirir.
 *
 * !! GUVENLIK UYARISI !!
 * Demo amaclidir. Backend olmadigi icin yetki kontrolu yalnizca
 * tarayicida yapilir ve gelistirici araclariyla asilabilir. Canliya
 * cikmadan once sunucu tarafi kimlik dogrulama/yetkilendirme sarttir.
 */

/**
 * Sol menu gruplari. Grup basligina tiklayinca altindaki sayfalar acilir;
 * acik sayfanin grubu kendiliginden acik gelir.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    id: "satis",
    label: "Satış",
    Icon: ShoppingCart,
    items: [
      { href: "/yonetim/siparisler", label: "Siparişler", Icon: ShoppingCart },
      { href: "/yonetim/teklifler", label: "Teklifler", Icon: FileText },
      { href: "/yonetim/magaza", label: "Mağaza Ayarları", Icon: SlidersHorizontal },
    ],
  },
  {
    id: "urunler",
    label: "Ürünler",
    Icon: Package,
    items: [
      { href: "/yonetim/urunler", label: "Ürünler", Icon: Package },
      { href: "/yonetim/kategoriler", label: "Kategoriler", Icon: FolderTree },
      { href: "/yonetim/stok", label: "Stok Matrisi", Icon: Boxes },
      { href: "/yonetim/yorumlar", label: "Yorumlar", Icon: Star },
    ],
  },
  {
    id: "ag",
    label: "Bayi ve Satış Ağı",
    Icon: MapPin,
    items: [
      { href: "/yonetim/bayiler", label: "Bayiler", Icon: MapPin },
      { href: "/yonetim/saticilar", label: "Online Satıcılar", Icon: Store },
      { href: "/yonetim/satis-temsilcileri", label: "Satış Temsilcileri", Icon: Contact },
    ],
  },
  {
    id: "musteriler",
    label: "Müşteriler ve Servis",
    Icon: Users,
    items: [
      { href: "/yonetim/uyeler", label: "Üyeler", Icon: Users },
      { href: "/yonetim/servis-talepleri", label: "Servis Talepleri", Icon: Wrench },
      { href: "/yonetim/garantiler", label: "Garantiler", Icon: ShieldCheck },
    ],
  },
  {
    id: "icerik",
    label: "İçerik",
    Icon: Newspaper,
    items: [
      { href: "/yonetim/haberler", label: "Haberler", Icon: Newspaper },
      { href: "/yonetim/etkinlikler", label: "Etkinlikler", Icon: CalendarDays },
      { href: "/yonetim/blog", label: "Blog", Icon: PenLine },
      { href: "/yonetim/hakkimizda", label: "Hakkımızda", Icon: Info },
      { href: "/yonetim/sss", label: "Sık Sorulan Sorular", Icon: HelpCircle },
      { href: "/yonetim/belgeler", label: "Belgeler", Icon: FolderOpen },
      { href: "/yonetim/yasal-metinler", label: "Yasal Metinler", Icon: Scale },
      { href: "/yonetim/sayfa-seo", label: "Sayfa SEO", Icon: Search },
    ],
  },
  {
    id: "ayarlar",
    label: "Ayarlar",
    Icon: Settings,
    items: [
      { href: "/yonetim/gorunum", label: "Görünüm", Icon: Palette },
    ],
  },
];

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  Icon: LucideIcon;
  items: NavItem[];
}

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

function AdminNav() {
  const pathname = usePathname();
  const current = NAV_GROUPS.find((g) => g.items.some((i) => isActive(pathname, i.href)))?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current] : []));

  // Baska bir gruptaki sayfaya gidilince o grup da acilir.
  useEffect(() => {
    if (current) setOpen((prev) => (prev.has(current) ? prev : new Set(prev).add(current)));
  }, [current]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-zw-ink text-white" : "text-zw-grey-700 hover:bg-zw-grey-200"
    }`;

  return (
    <nav className="space-y-1">
      <Link href="/yonetim" className={linkClass(pathname === "/yonetim")}>
        <LayoutDashboard size={17} />
        Panel
      </Link>

      {NAV_GROUPS.map((group) => {
        const expanded = open.has(group.id);
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={expanded}
              className={`flex w-full items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-left text-sm font-bold transition-colors hover:bg-zw-grey-200 ${
                group.id === current ? "text-zw-red-700" : "text-zw-ink"
              }`}
            >
              <group.Icon size={17} />
              <span className="flex-1">{group.label}</span>
              <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && (
              <div className="mb-1 ml-4 space-y-0.5 border-l border-zw-grey-200 pl-2">
                {group.items.map(({ href, label, Icon }) => (
                  <Link key={href} href={href} className={linkClass(isActive(pathname, href))}>
                    <Icon size={15} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // Bilerek cikis yapildiysa "geri donulecek sayfa" eklenmez.
  const leaving = useRef(false);
  const writeFailed = useWriteFailed();

  // Giris yoksa panelin kendi giris ekranina; donuste ayni sayfaya gelinir.
  useEffect(() => {
    if (!ready || user || leaving.current) return;
    router.replace(`/yonetim/giris?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, pathname, router]);

  if (!ready || !user) {
    return <div className="py-20 text-center text-zw-grey-500">Yükleniyor…</div>;
  }

  return (
    <div className="min-h-screen bg-zw-grey-50">
      {/* Panelin kendi ust cubugu — ana sitenin menusu burada yok. */}
      <header className="bg-zw-ink text-white">
        <div className="zw-container flex flex-wrap items-center gap-3 py-3">
          <Link href="/yonetim" className="flex items-center gap-3">
            <ZenweldLogo variant="light" className="h-6 w-auto" />
            <span className="rounded-[3px] bg-zw-red-600 px-2 py-0.5 text-[11px] font-bold uppercase">
              Yönetim Paneli
            </span>
          </Link>

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
                router.replace("/yonetim/giris");
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
            <AdminNav />
          </aside>

          <div className="min-w-0">
            {/* Tum panel icin tek uyari: kayit tarayici deposuna yazilamadi. */}
            {writeFailed && (
              <div role="alert" className="sticky top-0 z-30 mb-4">
                <Alert tone="danger">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <strong>Kaydedilemedi:</strong> tarayıcı deposu dolu, son değişiklik uygulanmadı.
                      Büyük görselleri ya da kullanılmayan kayıtları silip tekrar deneyin.
                    </span>
                    <button type="button" onClick={dismissWriteFailed} className="shrink-0 font-semibold hover:underline">
                      Kapat
                    </button>
                  </span>
                </Alert>
              </div>
            )}
            {children}
          </div>
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
