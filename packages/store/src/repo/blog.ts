"use client";

import { type BlogPost, type ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Blog                                                               */
/*                                                                    */
/* Yazilar yonetim panelinden yonetilir.                              */
/* ------------------------------------------------------------------ */

/** Sitede gorunen yazilar: yayinda olanlar, yeniden eskiye. */
export function listBlogPosts(db: ZenweldDatabase = getSnapshot()): BlogPost[] {
  return db.blogPosts
    .filter((p) => p.active !== false)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Yonetim panelindeki tam liste (yayinda olmayanlar dahil). */
export function listAllBlogPosts(db: ZenweldDatabase = getSnapshot()): BlogPost[] {
  return [...db.blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findBlogPostById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): BlogPost | undefined {
  return db.blogPosts.find((p) => p.id === id);
}

/** Sitedeki yazi sayfasi icin: yalnizca yayindaki yazi. */
export function findBlogPostBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): BlogPost | undefined {
  return db.blogPosts.find((p) => p.active !== false && p.slug === slug);
}

function sortBlogPosts(list: BlogPost[]): void {
  list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function saveBlogPost(item: BlogPost): void {
  mutate((db) => {
    const idx = db.blogPosts.findIndex((p) => p.id === item.id);
    if (idx >= 0) db.blogPosts[idx] = item;
    else db.blogPosts.unshift(item);
    sortBlogPosts(db.blogPosts);
  });
}

export function createBlogPost(partial: Partial<BlogPost>): BlogPost {
  const id = partial.id || uid("b");
  const item: BlogPost = {
    id,
    slug: partial.slug ?? id,
    title: partial.title ?? "",
    excerpt: partial.excerpt ?? "",
    body: partial.body ?? "",
    coverUrl: partial.coverUrl ?? "",
    category: partial.category ?? "",
    author: partial.author ?? "Zenweld",
    publishedAt: partial.publishedAt ?? nowIso(),
    active: partial.active ?? true,
  };
  mutate((db) => {
    db.blogPosts.unshift(item);
    sortBlogPosts(db.blogPosts);
  });
  return item;
}

export function deleteBlogPost(id: string): void {
  mutate((db) => {
    db.blogPosts = db.blogPosts.filter((p) => p.id !== id);
  });
}
