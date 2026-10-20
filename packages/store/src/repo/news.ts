"use client";

import { type NewsItem, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

/** Sitede gorunen haberler: yayinda olanlar, yeniden eskiye. */
export function listNews(db: ZenweldDatabase = getSnapshot()): NewsItem[] {
  return db.news
    .filter((n) => n.active)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findNewsById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): NewsItem | undefined {
  return db.news.find((n) => n.id === id);
}

/** Sitedeki haber sayfasi icin: yalnizca yayindaki haber. */
export function findNewsBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): NewsItem | undefined {
  return db.news.find((n) => n.active && n.slug === slug);
}

/** Yayin tarihine gore yeniden eskiye siralar. */
function sortNews(list: NewsItem[]): void {
  list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function saveNews(item: NewsItem): void {
  mutate((db) => {
    const idx = db.news.findIndex((n) => n.id === item.id);
    if (idx >= 0) db.news[idx] = item;
    else db.news.unshift(item);
    sortNews(db.news);
  });
}

export function createNews(partial: Partial<NewsItem>): NewsItem {
  const id = partial.id || uid("n");
  const item: NewsItem = {
    id,
    slug: partial.slug ?? id,
    title: partial.title ?? "",
    summary: partial.summary ?? "",
    body: partial.body ?? "",
    coverUrl: partial.coverUrl ?? "",
    images: partial.images ?? [],
    publishedAt: partial.publishedAt ?? nowIso(),
    active: partial.active ?? true,
  };
  mutate((db) => {
    db.news.unshift(item);
    sortNews(db.news);
  });
  return item;
}

export function deleteNews(id: string): void {
  mutate((db) => {
    db.news = db.news.filter((n) => n.id !== id);
  });
}
