"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { ProductImage } from "@zenweld/ui";
import Link from "next/link";
import { SupportIcon } from "@/components/support/SupportIcons";
import { useT } from "@/lib/i18n-client";
import type { TopMenu } from "@/lib/menu";

/**
 * MENU PANELI (butun ust menuler)
 *
 * Acilinca panel basliklarin altindan asagi dogru acilir, icerik hafif
 * gecikmeyle belirir; menu degisince panelin yuksekligi yumusakca degisir
 * ve icerik yeniden belirir. Kapanirken yukari toplanir. Arkadaki sayfa
 * buzlu cam gibi bulaniklasir (MegaBackdrop). Efektler globals.css ›
 * zw-mega; hareket azaltma tercihinde aninda acilir.
 *
 * closing: kapanma efekti suruyor; bitince onClosed cagrilir.
 */
export function MegaPanel({
  menu,
  closing,
  onClosed,
  onNavigate,
}: {
  menu: TopMenu;
  closing: boolean;
  onClosed: () => void;
  onNavigate: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = content.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="zw-mega absolute left-0 right-0 top-full hidden overflow-hidden border-t border-zw-grey-200 bg-white shadow-xl lg:block"
      data-state={closing ? "closing" : "open"}
      style={{ height }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && closing) onClosed();
      }}
    >
      <div ref={content}>
        {/* key: menu degisince secili grup/kategori sifirlanir ve icerik yeniden belirir. */}
        <MegaMenu key={menu.id} menu={menu} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/** Menu acikken sayfanin uzerindeki buzlu cam; tiklayinca menu kapanir. */
export function MegaBackdrop({ closing, onClose }: { closing: boolean; onClose: () => void }) {
  return (
    <div
      aria-hidden="true"
      className="zw-mega-backdrop fixed inset-0 z-[90] hidden lg:block"
      data-state={closing ? "closing" : "open"}
      onClick={onClose}
    />
  );
}

/**
 * MEGA MENU
 *
 * Uc bolmeli: solda gruplar (tiklaninca grup sayfasi), ortada o grubun kategorileri (alt alta),
 * sagda secili kategorinin ilk 9 urunu 3x3 kart izgarasinda. Sag ustteki
 * baglanti kategorinin tum urunlerine goturur; urun sayisi 9'u asiyorsa
 * toplam sayi da gosterilir.
 *
 * Alt basligi olmayan menulerde (tek, basliksiz kolon) sol bolme gosterilmez.
 */
function MegaMenu({ menu, onNavigate }: { menu: TopMenu; onNavigate: () => void }) {
  const t = useT();
  const [activeColumn, setActiveColumn] = useState(0);
  const [activeLink, setActiveLink] = useState(0);
  const column = menu.columns[activeColumn];
  const link = column?.links[activeLink];
  const hasProducts = Boolean(link?.products);
  const hasGroups = menu.columns.some((col) => col.label);

  // Grup degisince kategori secimi basa doner.
  const selectColumn = (i: number) => {
    setActiveColumn(i);
    setActiveLink(0);
  };

  if (menu.intro) return <SupportMenu menu={menu} onNavigate={onNavigate} />;

  return (
    <div className="zw-mega-content">
      <div
        className={`zw-container grid gap-8 py-8 ${
          hasProducts
            ? "grid-cols-[230px_260px_1fr]"
            : hasGroups
              ? "grid-cols-[260px_1fr]"
              : "grid-cols-1"
        }`}
      >
        {/* 1. bolme — gruplar */}
        {hasGroups && (
          <div className="border-r border-zw-grey-200 pr-4">
            {menu.columns.map((col, i) => {
              const className = `flex w-full items-center justify-between rounded-[4px] px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                i === activeColumn
                  ? "bg-zw-grey-100 text-zw-ink"
                  : "text-zw-grey-700 hover:text-zw-ink"
              }`;
              const content = (
                <>
                  {col.label}
                  {i === activeColumn && <ChevronRight size={16} />}
                </>
              );
              return col.href ? (
                <Link
                  key={col.label}
                  href={col.href}
                  onClick={onNavigate}
                  onMouseEnter={() => selectColumn(i)}
                  onFocus={() => selectColumn(i)}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={col.label}
                  onMouseEnter={() => selectColumn(i)}
                  onFocus={() => selectColumn(i)}
                  className={className}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. bolme — kategoriler (alt alta) */}
        <div className={hasProducts ? "border-r border-zw-grey-200 pr-4" : "grid grid-cols-3 gap-x-10 gap-y-7 pr-4"}>
          {column?.links.map((item, i) =>
            hasProducts ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
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
              </Link>
            ) : (
              <Link key={item.href} href={item.href} onClick={onNavigate} className="group block">
                <div className="font-display text-lg font-semibold text-zw-ink group-hover:text-zw-red-600">
                  {item.label}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm leading-snug text-zw-grey-500">
                    {item.description}
                  </p>
                )}
              </Link>
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
              <Link
                href={link.href}
                onClick={onNavigate}
                className="flex shrink-0 items-center gap-1 text-sm font-semibold text-zw-red-600 hover:underline"
              >
                {(link.productCount ?? 0) > (link.products?.length ?? 0)
                  ? t.nav.seeAllCount.replace("{count}", String(link.productCount))
                  : t.nav.seeAll}
                <ChevronRight size={15} />
              </Link>
            </div>

            {link.products && link.products.length > 0 ? (
              /* 3 sutun x 2 satir; ozellikler fotografin altinda madde madde */
              <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                {link.products.map((product) => (
                  <Link
                    key={product.id}
                    href={product.href}
                    onClick={onNavigate}
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
                  </Link>
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

/**
 * DESTEK VE GARANTI MENUSU
 *
 * Solda baslik, kisa aciklama ve "Tumunu Gor" (/destek); sagda iki kolonda
 * sembollu baglantilar (Destek, Garanti).
 */
function SupportMenu({ menu, onNavigate }: { menu: TopMenu; onNavigate: () => void }) {
  const t = useT();
  return (
    <div className="zw-mega-content">
      <div className="zw-container grid grid-cols-[minmax(220px,300px)_1fr] gap-12 py-10 xl:gap-20">
        <div>
          <div className="font-display text-[34px] font-bold leading-none text-zw-ink">{menu.label}</div>
          <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-zw-grey-600">{menu.intro}</p>
          {menu.href && (
            <Link
              href={menu.href}
              onClick={onNavigate}
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-ink hover:text-zw-red-600"
            >
              {t.nav.seeAll}
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-10 xl:gap-x-14">
          {menu.columns.map((col) => (
            <ul key={col.label}>
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className="group flex items-center gap-4 border-b border-zw-grey-200 py-3.5"
                  >
                    {link.icon && (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] bg-zw-grey-100 text-zw-red-600 transition-colors group-hover:bg-zw-red-600 group-hover:text-white">
                        <SupportIcon name={link.icon} size={22} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-zw-ink">{link.label}</span>
                      {link.description && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-zw-grey-500">{link.description}</span>
                      )}
                    </span>
                    <ChevronRight
                      size={17}
                      className="shrink-0 text-zw-grey-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zw-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
