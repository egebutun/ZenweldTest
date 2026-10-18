"use client";

import { findLegalPage, useDatabase } from "@zenweld/store";
import { RichText } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { PageHero } from "@/components/common/PageShell";
import { LegalDocument, type LegalDocumentKind } from "@/components/shop/LegalDocument";
import { useLocale, useT, useText } from "@/lib/i18n-client";

/** Siparise ozel tablolari olan belgeler; burada bos sablon gosterilir. */
const ORDER_DOCUMENTS: Record<string, LegalDocumentKind> = {
  "on-bilgilendirme-formu": "preInfo",
  "mesafeli-satis-sozlesmesi": "contract",
};

/** Yasal metin sayfasi. Baslik ve metin yonetim panelinden duzenlenir. */
export function LegalPageView({ id }: { id: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const page = findLegalPage(id, useDatabase());
  if (!page) return null;

  return (
    <>
      <PageHero title={text(page.title)} />
      <div className="zw-container max-w-4xl py-10">
        <p className="mb-6 text-xs text-zw-grey-500">
          {t.footer.lastUpdated.replace("{date}", formatDate(page.updatedAt, locale))}
        </p>
        {ORDER_DOCUMENTS[id] ? (
          <LegalDocument kind={ORDER_DOCUMENTS[id]} />
        ) : (
          <RichText source={text(page.body)} />
        )}
      </div>
    </>
  );
}
