"use client";

import { useMemo } from "react";
import { useDatabase } from "@zenweld/store";
import { buildDocuments, createIndex, search, suggest, type SearchHit } from "./search-client";

/** Veritabani degistiginde index yeniden kurulur. */
function useSearchIndex() {
  const db = useDatabase();

  return useMemo(() => {
    const docs = buildDocuments(db);
    return createIndex(docs);
  }, [db]);
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
