"use client";

import type { DocumentFile, DocumentPage, DocumentSection, LegalPage, PageSeoFields } from "@zenweld/data";
import {
  DocumentError,
  addDocument,
  deleteDocument,
  moveDocument,
  saveDocumentPage,
  saveLegalPage,
  savePageSeo,
  setDocumentActive,
  updateDocument,
  type DocumentInput,
} from "@zenweld/store";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › YASAL METINLER, BELGELER VE SAYFA SEO ISLEMLERI
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/icerik; Asama 5,
 * 5. alan, adim 5.3, KARARLAR K-99; ortak akis lib/admin-panel.ts). Demo
 * modunda tarayicidaki veriye yazilir (packages/store › repo/legal.ts,
 * documents.ts, site.ts).
 *
 * Belgeler: veritabani modunda dosya yuklenmez, dosyanin adresi girilir
 * (dosya deposu gelene kadar; KARARLAR K-104).
 */
export function usePagesActions() {
  const { server, pending, call } = usePanelCall("icerik");

  return {
    server,
    pending,

    /** Yasal metin. stored: ekranin gordugu kayit. */
    saveLegal: (next: LegalPage, stored: LegalPage): Promise<PanelAnswer> => {
      if (server) return call("yasal-metin", { title: next.title, body: next.body, ...recordRef("legal_pages", stored) }, "legal_pages");
      saveLegalPage(next);
      return localAnswer();
    },

    /**
     * Sabit sayfanin arama basligi ve aciklamasi; iki alan da bossa sayfa
     * varsayilana doner. stored: ekranin gordugu deger (yoksa varsayilan
     * kullaniliyordu). Satir silinebildigi icin kendi kaydinin ani
     * saklanmaz; ekran yenilenene kadar dugmeler kapalidir (pending).
     */
    savePageSeo: (path: string, fields: PageSeoFields, stored?: PageSeoFields): Promise<PanelAnswer> => {
      if (server) {
        return call("sayfa-seo", {
          path,
          title: fields.title ?? "",
          description: fields.description ?? "",
          updatedAt: stored?.updatedAt ?? "",
        });
      }
      savePageSeo(path, fields);
      return localAnswer();
    },

    /** Belge sayfasinin basligi ve aciklamasi. stored: ekranin gordugu hal. */
    saveDocumentPage: (page: DocumentPage, stored: DocumentPage): Promise<PanelAnswer> => {
      if (server) {
        const ref = recordRef("document_pages", { id: page.section, updatedAt: stored.updatedAt });
        return call("belge-sayfasi", { section: page.section, title: page.title, subtitle: page.subtitle, ...ref, id: page.section }, "document_pages");
      }
      const { section, title, subtitle } = page;
      return localAnswer(saveDocumentPage({ section, title, subtitle }));
    },

    /**
     * Belge ekler (stored yoksa) ya da gunceller. Demo modunda dosya
     * tarayiciya yuklenir (file); veritabani modunda dosyanin adresi
     * gonderilir (address; duzenlemede bossa eski dosya kalir).
     */
    saveDocument: async (
      section: DocumentSection,
      input: DocumentInput,
      upload: { file?: File; address?: string },
      stored?: DocumentFile,
    ): Promise<PanelAnswer> => {
      if (server) {
        const body = { section, ...input, address: upload.address ?? "" };
        return call("belge", stored ? { ...body, ...recordRef("documents", stored) } : body, "documents");
      }
      try {
        if (stored) await updateDocument(stored.id, input, upload.file);
        else await addDocument(section, input, upload.file!);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof DocumentError ? err.message : "Belge kaydedilemedi." };
      }
    },

    setDocumentActive: (doc: DocumentFile, active: boolean): Promise<PanelAnswer> => {
      if (server) return call("belge-yayin", { ...recordRef("documents", doc), active }, "documents");
      setDocumentActive(doc.id, active);
      return localAnswer();
    },

    deleteDocument: async (doc: DocumentFile): Promise<PanelAnswer> => {
      if (server) return call("belge-sil", recordRef("documents", doc));
      return localAnswer(await deleteDocument(doc.id));
    },

    moveDocument: (doc: DocumentFile, direction: -1 | 1): Promise<PanelAnswer> => {
      if (server) return call("belge-sira", { id: doc.id, direction });
      moveDocument(doc.id, direction);
      return localAnswer();
    },
  };
}
