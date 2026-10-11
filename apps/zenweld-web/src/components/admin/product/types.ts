import type { Product } from "@zenweld/data";

/** Urun formu sekmelerinin ortak girdisi. */
export interface ProductTabProps {
  draft: Product;
  set: <K extends keyof Product>(key: K, value: Product[K]) => void;
  setDraft: (update: (d: Product) => Product) => void;
}
