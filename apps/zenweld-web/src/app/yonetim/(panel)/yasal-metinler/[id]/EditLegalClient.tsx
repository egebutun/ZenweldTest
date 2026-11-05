"use client";

import { TITLE_REQUIRED, legalDraftError, legalPath, type LegalPage, type LegalPageId } from "@zenweld/data";
import { findLegalPage, useDatabase } from "@zenweld/store";
import { Alert, FormRow, Input } from "@zenweld/ui";
import {
  ContentFormShell,
  EditPageFrame,
  FormPanel,
  ContentTextFields,
  useContentForm,
} from "@/components/admin/content-form";
import { usePagesActions } from "@/lib/admin-pages";

/** Ön Bilgilendirme ve Mesafeli Satış'ta metnin üstünde otomatik tablolar var. */
const ORDER_DOCUMENTS = new Set(["on-bilgilendirme-formu", "mesafeli-satis-sozlesmesi"]);

export function EditLegalClient({ id }: { id: string }) {
  const page = findLegalPage(id, useDatabase());
  if (!page) return <Alert tone="danger">Metin bulunamadı.</Alert>;

  return (
    <EditPageFrame
      title={page.title}
      description="Yasal metin"
      sitePath={legalPath(page.id as LegalPageId)}
      siteLinkLabel="Sayfayı gör"
    >
      <LegalForm page={page} />
    </EditPageFrame>
  );
}

/** Sunucu ve tarayici ayni kurali kullanir; baslik hatasi Başlık sekmesinde gosterilir. */
const errorTab = (error: string) => (error === TITLE_REQUIRED ? "baslik" : "metin");

function LegalForm({ page }: { page: LegalPage }) {
  const form = useContentForm<LegalPage>(page, "metin");
  const actions = usePagesActions();
  const { draft, set } = form;

  const submit = async () => {
    form.setError(null);
    const problem = legalDraftError(draft);
    if (problem) return form.fail(problem, errorTab(problem));
    const answer = await actions.saveLegal(draft, page);
    if (!answer.ok) return form.fail(answer.error, errorTab(answer.error));
    form.flashSaved();
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={() => void submit()}
      pending={actions.pending}
      savedText="Metin kaydedildi."
      submitLabel="Değişiklikleri Kaydet"
      tabs={[
        { id: "metin", label: "Metin" },
        { id: "baslik", label: "Başlık" },
      ]}
    >
      {form.tab === "metin" && (
        <ContentTextFields
          intro={
            ORDER_DOCUMENTS.has(page.id)
              ? "Satıcı, alıcı ve ürün tabloları siparişten otomatik doldurulur; bu metin tabloların altında görünür."
              : "Metin sayfada başlığın altında görünür."
          }
          fields={[{ key: "body", label: "Metin", tall: true }]}
          values={draft}
          onChange={set}
        />
      )}
      {form.tab === "baslik" && (
        <FormPanel>
          <p className="text-sm text-zw-grey-600">
            Başlık sayfada ve alt bilgideki Politikalar & Yasal listesinde görünür. Sayfanın adresi
            değişmez.
          </p>
          <FormRow label="Başlık" required>
            <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </FormRow>
        </FormPanel>
      )}
    </ContentFormShell>
  );
}
