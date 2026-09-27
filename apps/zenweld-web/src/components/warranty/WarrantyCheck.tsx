"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { findWarranty, useDatabase } from "@zenweld/store";
import type { WarrantyRecord } from "@zenweld/data";
import { Alert, Badge, Button, FormRow, Input } from "@zenweld/ui";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

/**
 * GARANTI SORGULAMA
 *
 * Tek "Garanti" sayfasinin iki secenekinden biri. Onceden ayri bir
 * adresti (/kesfet/garanti-sorgula); ziyaretci kayit ile sorgulama
 * arasinda gidip gelmek zorunda kalmasin diye tek sayfada birlesti.
 */
export function WarrantyCheck({ onRegister }: { onRegister: () => void }) {
  const t = useT();
  const locale = useLocale();
  const db = useDatabase();
  const [serial, setSerial] = useState("");
  const [result, setResult] = useState<WarrantyRecord | null | undefined>(undefined);

  const product = result ? db.products.find((p) => p.id === result.productId) : undefined;
  const expired = result ? new Date(result.expiresAt) < new Date() : false;

  return (
    <div className="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(findWarranty(serial, db) ?? null);
        }}
        className="space-y-4"
      >
        <FormRow
          label={t.warranty.serialNumber}
          required
          hint="Örnek sorgulama için: ZW250-2026-004821"
        >
          <Input
            required
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="ZW250-2026-000000"
          />
        </FormRow>
        <Button type="submit" size="lg">
          {t.warranty.check}
        </Button>
      </form>

      {result === null && (
        <div className="mt-6">
          <Alert tone="warning">
            <span className="flex items-center gap-2">
              <ShieldX size={18} />
              {t.warranty.notFound}
            </span>
          </Alert>
          {/* Kaydi olmayan ziyaretci ayni sayfadan kayit adimina gecer. */}
          <button
            type="button"
            onClick={onRegister}
            className="mt-3 text-sm font-semibold text-zw-red-600 hover:underline"
          >
            {t.explore.registerWarranty} →
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-[4px] border border-zw-grey-200 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-600" />
            <h2 className="font-display text-xl font-bold uppercase">{t.warranty.found}</h2>
            {result.extended && <Badge tone="green">{t.warranty.extended}</Badge>}
            {expired && <Badge tone="outline">Süresi Doldu</Badge>}
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zw-grey-500">{t.warranty.product}</dt>
              <dd className="font-semibold">{product?.name ?? result.productId}</dd>
            </div>
            <div>
              <dt className="text-zw-grey-500">{t.warranty.serialNumber}</dt>
              <dd className="font-semibold">{result.serialNumber}</dd>
            </div>
            <div>
              <dt className="text-zw-grey-500">{t.warranty.owner}</dt>
              <dd className="font-semibold">{result.ownerName}</dd>
            </div>
            <div>
              <dt className="text-zw-grey-500">{t.warranty.dealer}</dt>
              <dd className="font-semibold">{result.dealerName}</dd>
            </div>
            <div>
              <dt className="text-zw-grey-500">{t.warranty.purchaseDate}</dt>
              <dd className="font-semibold">{formatDate(result.purchaseDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-zw-grey-500">{t.warranty.expiresAt}</dt>
              <dd className={`font-semibold ${expired ? "text-zw-grey-500" : "text-emerald-700"}`}>
                {formatDate(result.expiresAt, locale)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
