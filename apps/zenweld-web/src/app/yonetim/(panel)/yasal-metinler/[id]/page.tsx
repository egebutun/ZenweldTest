"use client";

import { use } from "react";
import { legalPath, type LegalPage, type LegalPageId } from "@zenweld/data";
import { findLegalPage, saveLegalPage, useDatabase } from "@zenweld/store";
import { Alert, FormRow, Input } from "@zenweld/ui";
import {
  ContentFormShell,
  EditPageFrame,
  FormPanel,
  LocalizedTextFields,
  useContentForm,
  withTrFallback,
} from "@/components/admin/content-form";

/** Ön Bilgilendirme ve Mesafeli Satış'ta metnin üstünde otomatik tablolar var. */
const ORDER_DOCUMENTS = new Set(["on-bilgilendirme-formu", "mesafeli-satis-sozlesmesi"]);

export default function EditLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const page = findLegalPage(id, useDatabase());
  if (!page) return <Alert tone="danger">Metin bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={page.title.tr}
      description="Yasal metin"
      sitePath={legalPath(page.id as LegalPageId)}
      siteLinkLabel="Sayfayı gör"
    >
      <LegalForm page={page} />
    </EditPageFrame>
  );
}

function LegalForm({ page }: { page: LegalPage }) {
  const form = useContentForm<LegalPage>(page, "metin");
  const { draft, setI18n } = form;

  const submit = () => {
    form.setError(null);
    if (!draft.title.tr.trim()) return form.fail("Başlık (TR) zorunludur.", "baslik");
    if (!draft.body.tr.trim()) return form.fail("Metin (TR) zorunludur.");
    saveLegalPage({ ...draft, title: withTrFallback(draft.title), body: withTrFallback(draft.body) });
    form.flashSaved();
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Metin kaydedildi."
      submitLabel="Değişiklikleri Kaydet"
      tabs={[
        { id: "metin", label: "Metin" },
        { id: "baslik", label: "Başlık" },
      ]}
    >
      {form.tab === "metin" && (
        <LocalizedTextFields
          intro={
            ORDER_DOCUMENTS.has(page.id)
              ? "Satıcı, alıcı ve ürün tabloları siparişten otomatik doldurulur; bu metin tabloların altında görünür."
              : "Metin sayfada başlığın altında görünür."
          }
          fields={[{ key: "body", label: "Metin", tall: true }]}
          values={draft}
          onChange={setI18n}
        />
      )}
      {form.tab === "baslik" && (
        <FormPanel>
          <p className="text-sm text-zw-grey-600">
            Başlık sayfada ve alt bilgideki Politikalar & Yasal listesinde görünür. Sayfanın adresi
            değişmez.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Başlık (TR)" required>
              <Input value={draft.title.tr} onChange={(e) => setI18n("title", "tr", e.target.value)} />
            </FormRow>
            <FormRow label="Başlık (EN)" hint="Boş bırakılırsa Türkçe başlık kullanılır">
              <Input value={draft.title.en} onChange={(e) => setI18n("title", "en", e.target.value)} />
            </FormRow>
          </div>
        </FormPanel>
      )}
    </ContentFormShell>
  );
}
