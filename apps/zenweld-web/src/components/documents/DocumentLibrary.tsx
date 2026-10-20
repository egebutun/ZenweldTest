"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import type { DocumentSection } from "@zenweld/data";
import { documentPage, listDocuments, useDatabase } from "@zenweld/store";
import { Alert, Button, EmptyState, Input } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import Link from "next/link";
import { PageHero } from "@/components/common/PageShell";
import { fileTypeLabel, formatBytes, isPdf, openDocument } from "@/lib/documents";

/** Arama: Turkce kucuk harf, "ı" ve "i" ayni (kod "WIRE" -> "wire" ile de bulunur). */
const normalize = (value: string) => value.toLocaleLowerCase("tr").replace(/ı/g, "i");

/**
 * Kesfet > Diger belge sayfalari (MSDS, Ultimate Kaynak Rehberi, Parti
 * Sertifikalari). Baslik, aciklama ve belgeler panelden (/yonetim/belgeler)
 * yonetilir; liste paneldeki sirayla gosterilir.
 */
export function DocumentLibrary({ section }: { section: DocumentSection }) {
  const db = useDatabase();
  const page = documentPage(section, db);
  const withLot = section === "parti-sertifikalari";
  const [query, setQuery] = useState("");
  const [missing, setMissing] = useState(false);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return listDocuments(section, db)
      .map((doc) => ({ doc, product: db.products.find((p) => p.id === doc.productId) }))
      .filter(({ doc, product }) =>
        !q ||
        [doc.title, product?.name, product?.sku, doc.lotNumber].some((v) => v && normalize(v).includes(q)),
      );
  }, [db, section, query]);
  const total = listDocuments(section, db).length;

  return (
    <>
      <PageHero title={page.title} subtitle={page.subtitle} />

      <div className="zw-container py-12">
        {total === 0 ? (
          <EmptyState icon={<FileText size={40} />} title="Henüz belge eklenmedi." />
        ) : (
          <>
            <div className="relative mb-5 sm:w-96">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={withLot ? "Belge, ürün veya parti no ara…" : "Belge veya ürün ara…"}
                className="pl-10"
              />
            </div>

            {missing && (
              <div className="mb-4">
                <Alert tone="danger">Dosya açılamadı. Lütfen daha sonra tekrar deneyin.</Alert>
              </div>
            )}

            <ul className="divide-y divide-zw-grey-200 rounded-[4px] border border-zw-grey-200">
              {rows.map(({ doc, product }) => (
                <li key={doc.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-zw-red-50 text-[10px] font-bold text-zw-red-700">
                      {fileTypeLabel(doc)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-zw-ink">{doc.title}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zw-grey-500">
                        {product && (
                          <Link href={`/urun/${product.slug}`} className="hover:text-zw-red-600">
                            {product.name} · {product.sku}
                          </Link>
                        )}
                        {doc.lotNumber && <span>Parti No: {doc.lotNumber}</span>}
                        <span>{formatBytes(doc.size)}</span>
                        <span>{formatDate(doc.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 self-start sm:self-auto"
                    leftIcon={isPdf(doc) ? <ExternalLink size={15} /> : <Download size={15} />}
                    onClick={async () => setMissing(!(await openDocument(doc)))}
                  >
                    {isPdf(doc) ? "Görüntüle" : "İndir"}
                  </Button>
                </li>
              ))}
              {rows.length === 0 && <li className="p-6 text-center text-sm text-zw-grey-500">Aramaya uyan belge yok.</li>}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
