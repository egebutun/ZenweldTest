"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { ZenweldLogo } from "@zenweld/ui";
import { useAuth } from "@zenweld/auth";
import { locales, localeNames, switchLocaleInPath, type Locale } from "@zenweld/i18n";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useHref, useLocale, useT } from "@/lib/i18n-client";
import { useMainMenu, useSupportMenu, type TopMenu } from "@/lib/menu";
import { useQuoteList } from "@/lib/quote-list";

export function Header() {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const pathname = usePathname();
  const router = useRouter();
  const menus = useMainMenu();
  const supportLinks = useSupportMenu();
  const { user, logout } = useAuth();
  const quoteList = useQuoteList();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const isAdminArea = pathname.includes("/admin");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const changeLocale = (next: Locale) => {
    router.push(switchLocaleInPath(pathname, next));
  };

  // Yonetim paneli kendi basligini kullanir.
  if (isAdminArea) return null;

  return (
    <>
      <header
        className="sticky top-0 z-[100] border-b border-zw-grey-200 bg-white"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="zw-container flex h-[72px] items-center gap-4">
          <button
            className="-ml-1 rounded-[3px] p-2 text-zw-ink lg:hidden zw-focus"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menü"
          >
            <Menu size={22} />
          </button>

          <LocaleLink href="/" className="shrink-0">
            <ZenweldLogo className="h-7 w-auto sm:h-8" />
          </LocaleLink>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onMouseEnter={() => setOpenMenu(menu.id)}
                onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors zw-focus ${
                  openMenu === menu.id
                    ? "bg-zw-grey-100 text-zw-ink"
                    : "text-zw-grey-700 hover:text-zw-ink"
                }`}
              >
                {menu.label}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openMenu === menu.id ? "rotate-180" : ""}`}
                />
              </button>
            ))}
            {/* Destek: tiklamak yerine uzerine gelince acilan kisa liste */}
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu("destek")}
              onFocus={() => setOpenMenu("destek")}
            >
              <LocaleLink
                href="/destek"
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors zw-focus ${
                  openMenu === "destek"
                    ? "bg-zw-grey-100 text-zw-ink"
                    : "text-zw-grey-700 hover:text-zw-ink"
                }`}
              >
                {t.nav.support}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openMenu === "destek" ? "rotate-180" : ""}`}
                />
              </LocaleLink>
              {openMenu === "destek" && (
                <div className="absolute left-0 top-full z-50 w-60 rounded-[4px] border border-zw-grey-200 bg-white py-1.5 shadow-xl">
                  {supportLinks.map((item) => (
                    <LocaleLink
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm font-semibold text-zw-grey-700 transition-colors hover:bg-zw-grey-50 hover:text-zw-red-600"
                    >
                      {item.label}
                    </LocaleLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-[4px] border border-zw-grey-300 px-3 text-sm text-zw-grey-500 transition-colors hover:border-zw-ink md:w-44 xl:w-60 zw-focus"
              aria-label={t.common.search}
            >
              <Search size={18} />
              <span className="hidden truncate md:inline">{t.common.search}</span>
              <kbd className="ml-auto hidden rounded border border-zw-grey-300 px-1 text-[10px] text-zw-grey-400 lg:inline">
                ⌘K
              </kbd>
            </button>

            <LocaleLink
              href="/nereden-alabilirim"
              className="rounded-[4px] p-2 text-zw-ink transition-colors hover:bg-zw-grey-100"
              aria-label={t.nav.findDealer}
              title={t.nav.findDealer}
            >
              <MapPin size={20} />
            </LocaleLink>

            <LocaleLink
              href="/teklif-al"
              className="relative rounded-[4px] p-2 text-zw-ink transition-colors hover:bg-zw-grey-100"
              aria-label={t.product.requestQuote}
              title={t.product.requestQuote}
            >
              <ShoppingBag size={20} />
              {quoteList.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zw-red-600 px-1 text-[10px] font-bold text-white">
                  {quoteList.count}
                </span>
              )}
            </LocaleLink>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1 rounded-[4px] p-2 text-zw-ink transition-colors hover:bg-zw-grey-100 zw-focus"
                aria-label={t.nav.account}
              >
                <UserIcon size={20} />
                {user && (
                  <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline lg:hidden xl:inline">
                    {user.firstName}
                  </span>
                )}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-[4px] border border-zw-grey-200 bg-white py-1 shadow-xl">
                  {user ? (
                    <>
                      <div className="border-b border-zw-grey-100 px-4 py-2.5">
                        <div className="text-sm font-semibold">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="truncate text-xs text-zw-grey-500">{user.email}</div>
                      </div>
                      <LocaleLink
                        href="/hesabim"
                        className="block px-4 py-2 text-sm hover:bg-zw-grey-50"
                      >
                        {t.account.title}
                      </LocaleLink>
                      {(user.role === "business" || user.role === "dealer") && (
                        <LocaleLink
                          href="/hesabim/tekliflerim"
                          className="block px-4 py-2 text-sm hover:bg-zw-grey-50"
                        >
                          {t.nav.myQuotes}
                        </LocaleLink>
                      )}
                      {user.role === "dealer" && (
                        <LocaleLink
                          href="/hesabim/stok-bildirimi"
                          className="block px-4 py-2 text-sm hover:bg-zw-grey-50"
                        >
                          {t.account.stockNotice}
                        </LocaleLink>
                      )}
                      {user.role === "admin" && (
                        <LocaleLink
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zw-red-600 hover:bg-zw-red-50"
                        >
                          <LayoutDashboard size={15} />
                          {t.nav.adminPanel}
                        </LocaleLink>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setAccountOpen(false);
                          router.push(href("/"));
                        }}
                        className="flex w-full items-center gap-2 border-t border-zw-grey-100 px-4 py-2 text-left text-sm text-zw-grey-700 hover:bg-zw-grey-50"
                      >
                        <LogOut size={15} />
                        {t.nav.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <LocaleLink
                        href="/giris"
                        className="block px-4 py-2 text-sm font-semibold hover:bg-zw-grey-50"
                      >
                        {t.nav.login}
                      </LocaleLink>
                      <LocaleLink
                        href="/kayit"
                        className="block px-4 py-2 text-sm hover:bg-zw-grey-50"
                      >
                        {t.nav.register}
                      </LocaleLink>
                    </>
                  )}
                  <div className="mt-1 flex items-center gap-1 border-t border-zw-grey-100 px-4 py-2">
                    {locales.map((l) => (
                      <button
                        key={l}
                        onClick={() => changeLocale(l)}
                        className={`rounded-[3px] px-2 py-1 text-xs font-semibold uppercase ${
                          l === locale
                            ? "bg-zw-ink text-white"
                            : "text-zw-grey-600 hover:bg-zw-grey-100"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                    <span className="ml-1 text-xs text-zw-grey-400">
                      {localeNames[locale]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {(() => {
          const open = menus.find((m) => m.id === openMenu);
          return open ? <MegaMenu menu={open} /> : null;
        })()}
      </header>

      {drawerOpen && <MobileDrawer menus={menus} onClose={() => setDrawerOpen(false)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/**
 * MEGA MENU
 *
 * Uc bolmeli: solda gruplar, ortada o grubun kategorileri (alt alta),
 * sagda secili kategorinin ilk 9 urunu 3x3 kart izgarasinda. Sag ustteki
 * baglanti kategorinin tum urunlerine goturur; urun sayisi 9'u asiyorsa
 * toplam sayi da gosterilir.
 */
function MegaMenu({ menu }: { menu: TopMenu }) {
  const t = useT();
  const [activeColumn, setActiveColumn] = useState(0);
  const [activeLink, setActiveLink] = useState(0);
  const column = menu.columns[activeColumn];
  const link = column?.links[activeLink];
  const hasProducts = Boolean(link?.products);

  // Grup degisince kategori secimi basa doner.
  const selectColumn = (i: number) => {
    setActiveColumn(i);
    setActiveLink(0);
  };

  return (
    <div className="absolute left-0 right-0 top-full hidden border-t border-zw-grey-200 bg-white shadow-xl lg:block">
      <div
        className={`zw-container grid gap-8 py-8 ${
          hasProducts ? "grid-cols-[230px_260px_1fr]" : "grid-cols-[260px_1fr]"
        }`}
      >
        {/* 1. bolme — gruplar */}
        <div className="border-r border-zw-grey-200 pr-4">
          {menu.columns.map((col, i) => (
            <button
              key={col.label}
              onMouseEnter={() => selectColumn(i)}
              onFocus={() => selectColumn(i)}
              className={`flex w-full items-center justify-between rounded-[4px] px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                i === activeColumn
                  ? "bg-zw-grey-100 text-zw-ink"
                  : "text-zw-grey-700 hover:text-zw-ink"
              }`}
            >
              {col.label}
              {i === activeColumn && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        {/* 2. bolme — kategoriler (alt alta) */}
        <div className={hasProducts ? "border-r border-zw-grey-200 pr-4" : "grid grid-cols-3 gap-x-10 gap-y-7 pr-4"}>
          {column?.links.map((item, i) =>
            hasProducts ? (
              <LocaleLink
                key={item.href}
                href={item.href}
                onMouseEnter={() => setActiveLink(i)}
                onFocus={() => setActiveLink(i)}
                className={`flex items-center justify-between gap-2 rounded-[4px] px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  i === activeLink
                    ? "bg-zw-grey-100 text-zw-ink"
                    : "text-zw-grey-700 hover:text-zw-ink"
                }`}
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-1 text-xs font-normal text-zw-grey-400">
                  {item.productCount ?? 0}
                  {i === activeLink && <ChevronRight size={14} />}
                </span>
              </LocaleLink>
            ) : (
              <LocaleLink key={item.href} href={item.href} className="group block">
                <div className="font-display text-lg font-semibold text-zw-ink group-hover:text-zw-red-600">
                  {item.label}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm leading-snug text-zw-grey-500">
                    {item.description}
                  </p>
                )}
              </LocaleLink>
            ),
          )}
          {column && column.links.length === 0 && (
            <p className="px-3 py-2 text-sm text-zw-grey-500">{t.nav.menuEmptyGroup}</p>
          )}
        </div>

        {/* 3. bolme — secili kategorinin urunleri */}
        {hasProducts && link && (
          <div className="min-w-0">
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-zw-grey-200 pb-3">
              <div className="min-w-0">
                <div className="truncate font-display text-lg font-bold uppercase text-zw-ink">
                  {link.label}
                </div>
                {link.description && (
                  <p className="mt-0.5 truncate text-sm text-zw-grey-500">{link.description}</p>
                )}
              </div>
              <LocaleLink
                href={link.href}
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-zw-red-600 hover:underline"
              >
                {(link.productCount ?? 0) > (link.products?.length ?? 0)
                  ? t.nav.seeAllCount.replace("{count}", String(link.productCount))
                  : t.nav.seeAll}
                <ChevronRight size={15} />
              </LocaleLink>
            </div>

            {link.products && link.products.length > 0 ? (
              /* 3 sutun x 2 satir; ozellikler fotografin altinda madde madde */
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                {link.products.map((product) => (
                  <LocaleLink
                    key={product.id}
                    href={product.href}
                    className="group rounded-[4px] p-2.5 transition-colors hover:bg-zw-grey-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-zw-grey-200 bg-white">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          label={product.name}
                          className="max-h-12 max-w-12 object-contain"
                        />
                      </div>
                      <div className="min-w-0 text-sm font-semibold leading-snug text-zw-ink group-hover:text-zw-red-600">
                        {product.name}
                      </div>
                    </div>
                    {product.highlights.length > 0 && (
                      <ul className="mt-2.5 space-y-1">
                        {product.highlights.map((h, i) => (
                          <li key={i} className="flex gap-2 text-xs leading-snug text-zw-grey-600">
                            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-zw-red-600" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </LocaleLink>
                ))}
              </div>
            ) : (
              <p className="py-8 text-sm text-zw-grey-500">{t.nav.menuEmptyCategory}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileDrawer({ menus, onClose }: { menus: TopMenu[]; onClose: () => void }) {
  const t = useT();
  const supportLinks = useSupportMenu();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b border-zw-grey-200 px-4 py-4">
          <ZenweldLogo className="h-7 w-auto" />
          <button onClick={onClose} aria-label={t.common.close} className="p-1">
            <X size={22} />
          </button>
        </div>

        <nav className="py-2">
          {menus.map((menu) => (
            <div key={menu.id} className="border-b border-zw-grey-100">
              <button
                onClick={() => setExpanded(expanded === menu.id ? null : menu.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold"
              >
                {menu.label}
                <ChevronDown
                  size={18}
                  className={`text-zw-grey-500 transition-transform ${expanded === menu.id ? "rotate-180" : ""}`}
                />
              </button>
              {expanded === menu.id && (
                <div className="bg-zw-grey-50 pb-2">
                  {menu.columns.map((col) => (
                    <div key={col.label} className="px-4 py-2">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zw-grey-500">
                        {col.label}
                      </div>
                      {col.links.map((link) => (
                        <LocaleLink
                          key={link.href}
                          href={link.href}
                          onClick={onClose}
                          className="block py-1.5 text-sm text-zw-grey-700"
                        >
                          {link.label}
                        </LocaleLink>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="border-b border-zw-grey-100">
            <button
              onClick={() => setExpanded(expanded === "destek" ? null : "destek")}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold"
            >
              {t.nav.support}
              <ChevronDown
                size={18}
                className={`text-zw-grey-500 transition-transform ${expanded === "destek" ? "rotate-180" : ""}`}
              />
            </button>
            {expanded === "destek" && (
              <div className="bg-zw-grey-50 px-4 pb-3 pt-1">
                {supportLinks.map((item) => (
                  <LocaleLink
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block py-1.5 text-sm text-zw-grey-700"
                  >
                    {item.label}
                  </LocaleLink>
                ))}
              </div>
            )}
          </div>
          <LocaleLink
            href="/teklif-al"
            onClick={onClose}
            className="block border-b border-zw-grey-100 px-4 py-3.5 font-semibold"
          >
            {t.product.requestQuote}
          </LocaleLink>
        </nav>

        <div className="flex gap-2 p-4">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                router.push(switchLocaleInPath(pathname, l));
                onClose();
              }}
              className={`flex-1 rounded-[4px] border px-3 py-2 text-sm font-semibold uppercase ${
                l === locale
                  ? "border-zw-ink bg-zw-ink text-white"
                  : "border-zw-grey-300 text-zw-grey-600"
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
