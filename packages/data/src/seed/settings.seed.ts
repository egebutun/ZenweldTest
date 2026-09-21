import type { SiteSettings } from "../types";

/**
 * Gorunum ayarlarinin fabrika degerleri. Yonetim panelindeki "Varsayilana
 * don" dugmesi bu degerleri geri yukler.
 */
export const defaultSettings: SiteSettings = {
  richText: {
    headingSize: 18,
    headingColor: "#141619",
    headingUppercase: true,
    accentColor: "#b82429",
    accentWidth: 40,
    leadSize: 18,
    bodySize: 15,
    bodyColor: "#3d4348",
    strongColor: "#141619",
  },
};
