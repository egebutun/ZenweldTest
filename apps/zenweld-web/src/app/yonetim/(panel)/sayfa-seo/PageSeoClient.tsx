"use client";

import { Fragment, useState } from "react";
import { Lock, Pencil } from "lucide-react";
import type { PageSeoFields } from "@zenweld/data";
import { getPageSeo, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, FormRow, Input, Modal, Textarea } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Counter, DESCRIPTION_MAX, GooglePreview, TITLE_MAX } from "@/components/admin/SeoPanel";
import { usePagesActions } from "@/lib/admin-pages";
import { INDEXABLE_PAGES, PAGE_GROUPS, staticPageSeo, type StaticPagePath } from "@/lib/page-meta";

type Page = (typeof INDEXABLE_PAGES)[number];

/**
 * SAYFA SEO
 *
 * Sabit sayfalarin (ana sayfa, urun bolumleri, kurumsal, destek ve garanti)
 * Google'da ve tarayici sekmesinde gorunen basligi ve aciklamasi. Bos alanda
 * varsayilan metin kullanilir (lib/page-meta.ts). Bu sayfalarin linkleri
 * menuye bagli oldugu icin degistirilmez. Veritabani modunda kayit sunucuya
 * yazilir (lib/admin-pages.ts).
 */
export function PageSeoClient() {
  const db = useDatabase();
  const actions = usePagesActions();
  const [editing, setEditing] = useState<Page | null>(null);

  return (
    <>
      <AdminPageHeader
        title="Sayfa SEO"
        description="Sabit sayfaların Google'da ve tarayıcı sekmesinde görünen başlığı ve açıklaması. Boş bırakılan alanda varsayılan metin kullanılır. Bu sayfaların linkleri menüye bağlı olduğu için değiştirilmez."
      />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Sayfa</th>
              <th className="px-4 py-3">Sayfa Başlığı</th>
              <th className="px-4 py-3">Açıklama</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {PAGE_GROUPS.map((group) => (
              <Fragment key={group}>
                <tr>
                  <td
                    colSpan={5}
                    className="bg-zw-grey-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-zw-grey-600"
                  >
                    {group}
                  </td>
                </tr>
                {INDEXABLE_PAGES.filter((page) => page.group === group).map((page) => {
                  const override = getPageSeo(page.path, db);
                  const seo = staticPageSeo(page.path, override);
                  return (
                    <tr key={page.path} className="align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold">{page.name}</div>
                        <div className="text-xs text-zw-grey-500">{page.path}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-[#1a0dab]">{seo.title}</div>
                        <div className={`text-xs ${seo.title.length > TITLE_MAX ? "font-semibold text-zw-red-600" : "text-zw-grey-500"}`}>
                          {seo.title.length}/{TITLE_MAX}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="line-clamp-2 text-zw-grey-600">{seo.description}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        {override ? <Badge tone="green">Değiştirildi</Badge> : <Badge>Varsayılan</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          title="Düzenle"
                          aria-label={`${page.name} düzenle`}
                          disabled={actions.pending}
                          onClick={() => setEditing(page)}
                          className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`Sayfa SEO: ${editing?.name ?? ""}`}>
        {editing && (
          <PageSeoForm
            key={editing.path}
            path={editing.path}
            stored={getPageSeo(editing.path, db)}
            actions={actions}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function PageSeoForm({
  path,
  stored,
  actions,
  onDone,
}: {
  path: StaticPagePath;
  /** Kayitli deger; yoksa varsayilan kullaniliyor. */
  stored: PageSeoFields | undefined;
  actions: ReturnType<typeof usePagesActions>;
  onDone: () => void;
}) {
  const [fields, setFields] = useState<PageSeoFields>(() => ({ title: stored?.title, description: stored?.description }));
  const [error, setError] = useState<string | null>(null);
  const defaults = staticPageSeo(path);
  const seo = staticPageSeo(path, fields);
  const titleLength = (fields.title ?? "").length;
  const descriptionLength = (fields.description ?? "").length;

  return (
    <div className="space-y-4">
      <FormRow label="Sayfa Linki" hint="Link sabittir; menüye ve sayfalar arasındaki bağlantılara bağlı.">
        <div className="flex items-center gap-2 rounded-[4px] border border-zw-grey-200 bg-zw-grey-100 px-3 py-2.5 text-sm text-zw-grey-600">
          <Lock size={14} className="shrink-0" />
          {path}
        </div>
      </FormRow>

      <FormRow
        label="Sayfa Başlığı"
        hint={
          <Counter length={titleLength} max={TITLE_MAX}>
            Boş bırakılırsa: {defaults.title}
          </Counter>
        }
      >
        <Input
          value={fields.title ?? ""}
          placeholder={defaults.title}
          onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
        />
      </FormRow>

      <FormRow
        label="Açıklama"
        hint={
          <Counter length={descriptionLength} max={DESCRIPTION_MAX}>
            Boş bırakılırsa varsayılan açıklama kullanılır (gri yazı).
          </Counter>
        }
      >
        <Textarea
          className="min-h-20"
          value={fields.description ?? ""}
          placeholder={defaults.description}
          onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
        />
      </FormRow>

      <div className="space-y-2 rounded-[4px] border border-zw-grey-200 p-4">
        <GooglePreview path={path} title={seo.title} description={seo.description} />
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          disabled={actions.pending}
          onClick={async () => {
            setError(null);
            const answer = await actions.savePageSeo(path, fields, stored);
            if (answer.ok) onDone();
            else setError(answer.error);
          }}
        >
          Kaydet
        </Button>
        <Button variant="outline" onClick={onDone}>
          Vazgeç
        </Button>
        <button
          type="button"
          onClick={() => setFields({})}
          className="ml-auto text-sm font-semibold text-zw-red-600 hover:underline"
        >
          Varsayılana dön
        </button>
      </div>
    </div>
  );
}
