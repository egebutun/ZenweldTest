"use client";

import { createContext, useContext } from "react";

/**
 * PANELIN SUNUCU AYARINA BAGLI OZELLIKLERI
 *
 * Panel kabugu (app/yonetim/(panel)/layout.tsx) sunucuda bakar ve buraya
 * yazar. uploads: veritabani modunda dosya deposu ayarli (DOSYA_KLASORU;
 * KARARLAR K-108); panelde gorsel ve belge sunucuya yuklenir. Demo modunda
 * anlamsizdir (dosyalar tarayicida tutulur).
 */
const Features = createContext({ uploads: false });

export function PanelFeatures({ uploads, children }: { uploads: boolean; children: React.ReactNode }) {
  return <Features.Provider value={{ uploads }}>{children}</Features.Provider>;
}

export const usePanelFeatures = () => useContext(Features);
