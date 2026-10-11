import type { UserRole } from "@zenweld/data";

export const ROLE_LABELS: Record<UserRole, { tr: string; en: string }> = {
  individual: { tr: "Bireysel", en: "Individual" },
  business: { tr: "Kurumsal", en: "Business" },
  admin: { tr: "Yönetici", en: "Admin" },
};

