"use client";

import { DEALER_STORE_TAKEN, type Dealer, type Retailer, type SalesRep } from "@zenweld/data";
import { deleteDealer, deleteRetailer, deleteSalesRep, saveDealer, saveRetailer, saveSalesRep } from "@zenweld/store";
import { useUploads } from "./admin-files";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › BAYI AGI ISLEMLERI (Bayiler, Online Satıcılar, Satış Temsilcileri)
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/bayi-agi; Asama 5,
 * 4. alan, KARARLAR K-99, K-103; ortak akis lib/admin-panel.ts). Demo
 * modunda tarayicidaki veriye yazilir (packages/store).
 *
 * uploadNote: veritabani modunda dosya deposu ayarli degilse dosya
 * yukleme kapalidir (KARARLAR K-101, K-108); temsilci fotografi adresle
 * girilir.
 */
export function useNetworkActions() {
  const { server, pending, call } = usePanelCall("bayi-agi");
  const { imageNote } = useUploads();
  const dealer = (d: Dealer) => recordRef("dealers", d);
  const retailer = (r: Retailer) => recordRef("retailers", r);
  const rep = (r: SalesRep) => recordRef("sales_reps", r);

  return {
    server,
    pending,
    uploadNote: imageNote,

    /** Bayi: yeni (stored yok) ya da duzenleme. */
    saveDealer: (next: Dealer, stored?: Dealer): Promise<PanelAnswer> => {
      if (server) {
        const fields = {
          name: next.name,
          city: next.city,
          district: next.district,
          address: next.address,
          phone: next.phone,
          whatsapp: next.whatsapp,
          lat: next.lat,
          lng: next.lng,
          badges: next.badges,
          workingHours: next.workingHours,
          retailerId: next.retailerId,
          forceDealer: next.forceDealer,
          active: next.active,
        };
        return call("bayi", stored ? { ...fields, ...dealer(stored) } : fields, "dealers");
      }
      const record = { ...next, id: next.id || `d-${Date.now().toString(36)}` };
      return Promise.resolve(saveDealer(record) ? { ok: true, id: record.id } : { ok: false, error: DEALER_STORE_TAKEN });
    },
    deleteDealer: (d: Dealer) => (server ? call("bayi-sil", dealer(d)) : (deleteDealer(d.id), localAnswer())),

    /** Online satici: yeni (stored yok) ya da duzenleme. */
    saveRetailer: (next: Retailer, stored?: Retailer): Promise<PanelAnswer> => {
      if (server) {
        const fields = {
          name: next.name,
          websiteUrl: next.websiteUrl,
          logoText: next.logoText,
          isOwnStore: next.isOwnStore,
          city: next.city,
          active: next.active,
        };
        return call("satici", stored ? { ...fields, ...retailer(stored) } : fields, "retailers");
      }
      const record = { ...next, id: next.id || `r-${Date.now().toString(36)}` };
      saveRetailer(record);
      return localAnswer(true, record.id);
    },
    deleteRetailer: (r: Retailer) => (server ? call("satici-sil", retailer(r)) : (deleteRetailer(r.id), localAnswer())),

    /** Temsilci: yeni (stored yok; listenin sonuna) ya da duzenleme. */
    saveSalesRep: (next: SalesRep, stored?: SalesRep): Promise<PanelAnswer> => {
      if (server) {
        const fields = {
          name: next.name,
          region: next.region,
          phone: next.phone,
          email: next.email,
          photoUrl: next.photoUrl,
          active: next.active,
        };
        return call("temsilci", stored ? { ...fields, ...rep(stored) } : fields, "sales_reps");
      }
      return localAnswer(true, saveSalesRep(next).id);
    },
    setSalesRepActive: (r: SalesRep, active: boolean) =>
      server ? call("temsilci-durum", { ...rep(r), active }, "sales_reps") : (saveSalesRep({ ...r, active }), localAnswer()),
    /** reps: ekrandaki sirali liste. Demo modunda siralar 1, 2, 3... olarak yeniden yazilir. */
    moveSalesRep: (reps: SalesRep[], index: number, direction: -1 | 1): Promise<PanelAnswer> => {
      if (server) return call("temsilci-sira", { id: reps[index].id, direction });
      const next = [...reps];
      const [item] = next.splice(index, 1);
      next.splice(index + direction, 0, item);
      next.forEach((r, i) => {
        if (r.order !== i + 1) saveSalesRep({ ...r, order: i + 1 });
      });
      return localAnswer();
    },
    deleteSalesRep: (r: SalesRep) => (server ? call("temsilci-sil", rep(r)) : (deleteSalesRep(r.id), localAnswer())),
  };
}
