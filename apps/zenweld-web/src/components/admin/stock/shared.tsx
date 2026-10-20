"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { StockSourceType, ZenweldDatabase } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import type { SourceStatus } from "@zenweld/store";
import { Badge } from "@zenweld/ui";

export const SOURCE_TYPE_LABEL: Record<StockSourceType, string> = {
  dealer: "Bayi",
  retailer: "Online satıcı",
};

/** Kaynak adresi: ?kaynak=dealer:d-ostim-kaynak */
export const sourceParam = (type: StockSourceType, id: string) => `${type}:${id}`;

export function parseSourceParam(value: string | null): { type: StockSourceType; id: string } | null {
  if (!value) return null;
  const [type, ...rest] = value.split(":");
  if ((type !== "dealer" && type !== "retailer") || !rest.length) return null;
  return { type, id: rest.join(":") };
}

/** "2 saat önce", "3 gün önce" */
export function ageText(iso: string | undefined, now: number): string {
  if (!iso) return "hiç yüklenmedi";
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "az önce" : `${minutes} dakika önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

/** Kaynagin sitede gorunup gorunmedigi */
export function FreshnessBadge({ status, staleDays }: { status: SourceStatus; staleDays: number }) {
  if (!status.lastUpdate) return <Badge tone="outline">Stok yüklenmedi</Badge>;
  if (status.fresh) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={14} /> Sitede görünüyor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700" title={`${staleDays} günden eski stok sitede gösterilmez`}>
      <AlertTriangle size={14} /> {status.ageDays} gündür güncellenmedi · sitede gizli
    </span>
  );
}

/** Islemi yapan yoneticinin adi (gecmise yazilir). */
export function useAdminName(): string | undefined {
  const { user } = useAuth();
  return user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
}

/** "MB-25 MIG Torcu (Torç Uzunluğu: 5 m)" */
export function productLabel(db: ZenweldDatabase, productId: string, variantId?: string): string {
  const p = db.products.find((x) => x.id === productId);
  if (!p) return "Silinmiş ürün";
  const group = p.variantGroups?.[0];
  const option = group?.options.find((o) => o.id === variantId);
  return option ? `${p.name} (${group!.label}: ${option.label})` : p.name;
}

/** Elle satir ekleme ve kod eslestirmede secilebilecek urun/secenekler. */
export function productChoices(db: ZenweldDatabase) {
  return db.products
    .filter((p) => p.active)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"))
    .flatMap((p) => {
      const group = p.variantGroups?.[0];
      const base = [{ value: `${p.id}|`, label: `${p.sku} — ${p.name}${group ? " (tüm seçenekler)" : ""}` }];
      return group
        ? [...base, ...group.options.map((o) => ({ value: `${p.id}|${o.id}`, label: `${o.sku ?? p.sku} — ${p.name} (${o.label})` }))]
        : base;
    });
}

/** productChoices() degerini ayirir */
export const splitChoice = (value: string) => {
  const [productId, variantId] = value.split("|");
  return { productId, variantId: variantId || undefined };
};
