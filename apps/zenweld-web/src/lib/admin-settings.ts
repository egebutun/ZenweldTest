"use client";

import type { EmailRecipient, RichTextStyle, ShopSettings } from "@zenweld/data";
import { saveEmailRecipients, saveRichTextStyle, saveShopSettings } from "@zenweld/store";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › AYAR ISLEMLERI: Mağaza Ayarları'nin Genel sekmesi (kargo,
 * taksit, POS, havale) ve E-posta Alicilari sekmesi; Görünüm ekrani.
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/ayarlar; Asama 5,
 * 5. alan, KARARLAR K-99, K-104; ortak akis lib/admin-panel.ts). Demo
 * modunda tarayicidaki veriye yazilir (packages/store › repo/site.ts).
 */
export function useSettingsActions() {
  const { server, pending, call } = usePanelCall("ayarlar");
  return {
    server,
    pending,
    /** shop: denetlenmis ayarlar (parseShopSettings); stored: ekranin gordugu kayit. */
    saveShop: (shop: ShopSettings, stored: ShopSettings): Promise<PanelAnswer> => {
      if (server) {
        const ref = recordRef("settings", { id: "shop", updatedAt: stored.updatedAt });
        return call("magaza", { shop, ...(ref.updatedAt && { updatedAt: ref.updatedAt }), id: "shop" }, "settings");
      }
      return localAnswer(saveShopSettings(shop));
    },
    /** version: ekranin gordugu alici listesinin hali (recipientsVersion). */
    saveEmailRecipients: (items: EmailRecipient[], version: string): Promise<PanelAnswer> =>
      server
        ? call("eposta-alicilari", { items: items.map(({ type, recipients }) => ({ type, recipients })), version })
        : localAnswer(saveEmailRecipients(items)),
    /** Görünüm: bicimli metinlerin punto ve renkleri. stored: ekranin gordugu kayit. */
    saveRichText: (style: RichTextStyle, stored: RichTextStyle): Promise<PanelAnswer> => {
      const value: Partial<RichTextStyle> = { ...style };
      delete value.updatedAt;
      if (server) {
        const ref = recordRef("settings", { id: "rich_text", updatedAt: stored.updatedAt });
        return call("gorunum", { style: value, ...(ref.updatedAt && { updatedAt: ref.updatedAt }), id: "rich_text" }, "settings");
      }
      return localAnswer(saveRichTextStyle(value as RichTextStyle));
    },
  };
}
