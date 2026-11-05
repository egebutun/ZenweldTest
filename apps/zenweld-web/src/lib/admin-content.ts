"use client";

import type { AboutContent, BlogPost, FaqItem, NewsItem, ZenweldEvent } from "@zenweld/data";
import {
  createBlogPost,
  createEvent,
  createNews,
  deleteBlogPost,
  deleteEvent,
  deleteFaq,
  deleteNews,
  moveFaq,
  saveAbout,
  saveBlogPost,
  saveEvent,
  saveFaq,
  saveNews,
} from "@zenweld/store";
import { useUploads } from "./admin-files";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › ICERIK ISLEMLERI: Haberler, Etkinlikler, Blog, Sık Sorulan
 * Sorular, Hakkımızda.
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/icerik; Asama 5,
 * 5. alan, KARARLAR K-99; ortak akis lib/admin-panel.ts). Demo modunda
 * tarayicidaki veriye yazilir (packages/store › repo/news.ts, events.ts,
 * blog.ts, faqs.ts, site.ts).
 *
 * uploadNote: veritabani modunda dosya deposu ayarli degilse gorsel
 * dosyasi yuklenmez, adres girilir (KARARLAR K-101, K-108;
 * lib/admin-files.ts).
 */

/** Sunucuya gonderilmeyen alanlar: kimlik ve son degisiklik ani ayrica, eski linkler sunucuda. */
function fieldsOf<T extends { id: string; updatedAt?: string; previousSlugs?: string[] }>(record: T): Partial<T> {
  const fields: Partial<T> = { ...record };
  delete fields.id;
  delete fields.updatedAt;
  delete fields.previousSlugs;
  return fields;
}

export function useContentActions() {
  const { server, pending, call } = usePanelCall("icerik");
  const { imageNote } = useUploads();

  /** Haber, etkinlik ve blog icin ayni akis. kind: kayit turu (recordRef), area: uc on eki. */
  function article<T extends { id: string; active?: boolean; updatedAt?: string; previousSlugs?: string[] }>(
    kind: string,
    area: string,
    local: { create: (next: T) => T; save: (next: T) => void; remove: (id: string) => void },
  ) {
    return {
      /** Kaydeder; yeni kayitta cevap kaydin kimligini tasir. stored: ekranin gordugu kayit (yeni kayitta yok). */
      save: (next: T, stored?: T): Promise<PanelAnswer> => {
        if (server) {
          const fields = fieldsOf(next);
          return call(area, stored ? { ...fields, ...recordRef(kind, stored) } : fields, kind);
        }
        if (stored) {
          local.save(next);
          return localAnswer(true, next.id);
        }
        return localAnswer(true, local.create(next).id);
      },
      setActive: (record: T, active: boolean): Promise<PanelAnswer> => {
        if (server) return call(`${area}-yayin`, { ...recordRef(kind, record), active }, kind);
        local.save({ ...record, active });
        return localAnswer();
      },
      remove: (record: T): Promise<PanelAnswer> => {
        if (server) return call(`${area}-sil`, recordRef(kind, record));
        local.remove(record.id);
        return localAnswer();
      },
    };
  }

  return {
    server,
    pending,
    uploadNote: imageNote,
    news: article<NewsItem>("news", "haber", { create: createNews, save: saveNews, remove: deleteNews }),
    events: article<ZenweldEvent>("events", "etkinlik", { create: createEvent, save: saveEvent, remove: deleteEvent }),
    blog: article<BlogPost>("blog_posts", "blog", { create: createBlogPost, save: saveBlogPost, remove: deleteBlogPost }),

    /** Soruyu kaydeder (stored yoksa yeni soru, listenin sonuna). */
    saveFaq: (next: FaqItem, stored?: FaqItem): Promise<PanelAnswer> => {
      if (server) {
        const { question, answer, topic } = next;
        return call("sss", stored ? { question, answer, topic, ...recordRef("faqs", stored) } : { question, answer, topic }, "faqs");
      }
      saveFaq(next);
      return localAnswer();
    },
    deleteFaq: (faq: FaqItem): Promise<PanelAnswer> => {
      if (server) return call("sss-sil", recordRef("faqs", faq));
      deleteFaq(faq.id);
      return localAnswer();
    },
    moveFaq: (faq: FaqItem, direction: -1 | 1): Promise<PanelAnswer> => {
      if (server) return call("sss-sira", { id: faq.id, direction });
      moveFaq(faq.id, direction);
      return localAnswer();
    },

    /** Hakkımızda sayfasi (tek kayit). stored: ekranin gordugu kayit. */
    saveAbout: (next: AboutContent, stored: AboutContent): Promise<PanelAnswer> => {
      if (server) {
        const about: Partial<AboutContent> = { ...next };
        delete about.updatedAt;
        return call("hakkimizda", { about, ...recordRef("about", { id: "1", updatedAt: stored.updatedAt }) }, "about");
      }
      return localAnswer(saveAbout(next));
    },
  };
}
