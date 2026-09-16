import type { UserRole } from "@zenweld/data";

export const ROLE_LABELS: Record<UserRole, { tr: string; en: string }> = {
  individual: { tr: "Bireysel", en: "Individual" },
  business: { tr: "Kurumsal", en: "Business" },
  dealer: { tr: "Bayi", en: "Dealer" },
  admin: { tr: "Yönetici", en: "Admin" },
};

/** Hangi rol hangi hesap sekmelerini gorur. */
export const ACCOUNT_TABS: Record<UserRole, string[]> = {
  individual: ["profil", "favorilerim", "garantilerim", "siparislerim", "adreslerim"],
  business: ["profil", "tekliflerim", "favorilerim", "garantilerim", "adreslerim"],
  dealer: ["profil", "stok-bildirimi", "tekliflerim", "siparislerim", "adreslerim"],
  admin: ["profil"],
};

export function canAccessAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}

export function canRequestQuote(role: UserRole | undefined): boolean {
  return role === "business" || role === "dealer" || role === "admin" || role === undefined;
}

export function canManageStock(role: UserRole | undefined): boolean {
  return role === "dealer" || role === "admin";
}
