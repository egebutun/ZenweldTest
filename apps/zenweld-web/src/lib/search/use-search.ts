"use client";

import { useMemo } from "react";
import type MiniSearch from "minisearch";
import type { ZenweldDatabase } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { buildDocuments, createIndex, search, suggest, type SearchDoc, type SearchHit } from "./search-client";

/**
 * Arama dizini veri basina bir kez kurulur: arama penceresi kapanip yeniden
 * acilinca ya da arama sayfasina gecilince ayni veri icin yeniden kurulmaz.
 * Veri degisince (panelde kayit, sayfa yenilenince gelen yeni katalog) yeni
 * veri nesnesi icin yeniden kurulur; eskisi bellekten kendiliginden duser.
 */
const indexCache = new WeakMap<ZenweldDatabase, MiniSearch<SearchDoc>>();

function indexFor(db: ZenweldDatabase): MiniSearch<SearchDoc> {
  let index = indexCache.get(db);
  if (!index) {
    index = createIndex(buildDocuments(db));
    indexCache.set(db, index);
  }
  return index;
}

export function useSearch(query: string, limit = 20): {
  hits: SearchHit[];
  suggestions: string[];
} {
  const db = useDatabase();
  return useMemo(() => {
    if (query.trim().length < 2) return { hits: [], suggestions: [] };
    const index = indexFor(db);
    const hits = search(index, query, { limit });
    return {
      hits,
      suggestions: hits.length === 0 ? suggest(index, query) : [],
    };
  }, [db, query, limit]);
}
