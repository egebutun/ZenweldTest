"use client";

import { useMemo } from "react";
import { useDatabase } from "@zenweld/store";
import { useLocale } from "../i18n-client";
import { buildDocuments, createIndex, search, suggest, type SearchHit } from "./search-client";

/** Veritabani veya dil degistiginde index yeniden kurulur. */
export function useSearchIndex() {
  const db = useDatabase();
  const locale = useLocale();

  return useMemo(() => {
    const docs = buildDocuments(db, locale);
    return createIndex(docs);
  }, [db, locale]);
}

export function useSearch(query: string, limit = 20): {
  hits: SearchHit[];
  suggestions: string[];
} {
  const index = useSearchIndex();
  return useMemo(() => {
    if (query.trim().length < 2) return { hits: [], suggestions: [] };
    const hits = search(index, query, { limit });
    return {
      hits,
      suggestions: hits.length === 0 ? suggest(index, query) : [],
    };
  }, [index, query, limit]);
}
