import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { tr } from "@zenweld/i18n";
import type { Crumb } from "@/lib/catalog";

/**
 * Sayfa ustundeki konum satiri: Zenweld › Ekipmanlar › Kaynak Makineleri › …
 * Son halka bulunulan sayfadir; baglanti degildir.
 */
export function Breadcrumbs({ trail, current }: { trail: Crumb[]; current: string }) {
  const items = [{ label: tr.common.brand, href: "/" }, ...trail];
  return (
    <nav
      aria-label="Konum"
      className="flex items-center gap-1.5 overflow-x-auto text-xs text-zw-grey-500"
    >
      {items.map((item) => (
        <Fragment key={item.href}>
          <Link href={item.href} className="shrink-0 hover:text-zw-ink">
            {item.label}
          </Link>
          <ChevronRight size={13} className="shrink-0" />
        </Fragment>
      ))}
      <span className="shrink-0 font-semibold text-zw-ink">{current}</span>
    </nav>
  );
}
