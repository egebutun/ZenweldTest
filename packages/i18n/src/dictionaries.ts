import type { Locale } from "./config";
import { en } from "./en";
import { tr, type Dictionary } from "./tr";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { tr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** "Merhaba {name}" + { name: "Ege" } -> "Merhaba Ege" */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] !== undefined ? String(values[key]) : `{${key}}`,
  );
}
