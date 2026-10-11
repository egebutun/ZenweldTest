"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, MapPin, Menu, Search, User as UserIcon } from "lucide-react";
import { ZenweldLogo } from "@zenweld/ui";
import { locales, localeNames, switchLocaleInPath, type Locale } from "@zenweld/i18n";
import { useAuth } from "@zenweld/auth";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useHref, useLocale, useT } from "@/lib/i18n-client";
import { useMainMenu } from "@/lib/menu";
import { MegaMenu } from "./MegaMenu";
import { MobileDrawer } from "./MobileDrawer";

// Arama penceresi ve arama kutuphanesi yalnizca ilk acilista yuklenir.
const SearchOverlay = dynamic(
  () => import("@/components/search/SearchOverlay").then((m) => m.SearchOverlay),
  { ssr: false },
);

export function Header() {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const pathname = usePathname();
  const router = useRouter();
  const menus = useMainMenu();
  const { user, logout } = useAuth();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [pathname]);

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

          {/* Dar masaustunde (1024-1535px) yer acmak icin ok isareti gizlenir;
              1280px altinda basliklar sikisir, arama kutusu simgeye kuculur. */}
          <nav className="ml-2 hidden items-center lg:flex xl:ml-4 xl:gap-1">
            {menus.map((menu) => (
              <button
                key={menu.id}
                onMouseEnter={() => setOpenMenu(menu.id)}
                onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-2 text-sm xl:px-3 font-semibold transition-colors zw-focus ${
                  openMenu === menu.id
                    ? "bg-zw-grey-100 text-zw-ink"
                    : "text-zw-grey-700 hover:text-zw-ink"
                }`}
              >
                {menu.label}
                <ChevronDown
                  size={16}
                  className={`hidden transition-transform 2xl:block ${openMenu === menu.id ? "rotate-180" : ""}`}
                />
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-[4px] border border-zw-grey-300 px-3 text-sm text-zw-grey-500 transition-colors hover:border-zw-ink md:w-44 lg:w-auto xl:w-44 2xl:w-60 zw-focus"
              aria-label={t.common.search}
            >
              <Search size={18} />
              <span className="hidden truncate md:inline lg:hidden xl:inline">{t.common.search}</span>
              <kbd className="ml-auto hidden rounded border border-zw-grey-300 px-1 text-[10px] text-zw-grey-400 xl:inline">
                ⌘K
              </kbd>
            </button>

            <LocaleLink
              href="/yetkili-bayi-ve-servis-agi"
              className="rounded-[4px] p-2 text-zw-ink transition-colors hover:bg-zw-grey-100"
              aria-label={t.nav.findDealer}
              title={t.nav.findDealer}
            >
              <MapPin size={20} />
            </LocaleLink>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1 rounded-[4px] p-2 text-zw-ink transition-colors hover:bg-zw-grey-100 zw-focus"
                aria-label={t.nav.account}
              >
                <UserIcon size={20} />
                {user && (
                  <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline lg:hidden 2xl:inline">
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
                      {user.role === "business" && (
                        <LocaleLink
                          href="/hesabim/tekliflerim"
                          className="block px-4 py-2 text-sm hover:bg-zw-grey-50"
                        >
                          {t.nav.myQuotes}
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

        {openMenu && (
          // key: menu degisince secili grup/kategori sifirlanir.
          <MegaMenu
            key={openMenu}
            menu={menus.find((m) => m.id === openMenu)!}
            onNavigate={() => setOpenMenu(null)}
          />
        )}
      </header>

      {drawerOpen && <MobileDrawer menus={menus} onClose={() => setDrawerOpen(false)} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
