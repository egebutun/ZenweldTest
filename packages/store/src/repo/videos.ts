"use client";

import type { SiteVideo } from "@zenweld/data";
import { mutate, uid } from "../database";

/* ------------------------------------------------------------------ */
/* Video kutuphanesi (KARARLAR K-125) — sitede listedeki sirayla        */
/* ------------------------------------------------------------------ */

/** Eski bir localStorage kaydinda kutuphane yoksa bos liste. */
export const listVideos = (db: { videos?: SiteVideo[] }): SiteVideo[] => db.videos ?? [];

/** Ekler veya gunceller (id bos ise yeni video, listenin sonuna). */
export function saveVideo(video: SiteVideo): string {
  const record = { ...video, id: video.id || uid("v") };
  mutate((db) => {
    db.videos = db.videos ?? [];
    const idx = db.videos.findIndex((v) => v.id === record.id);
    if (idx >= 0) db.videos[idx] = record;
    else db.videos.push(record);
  });
  return record.id;
}

export function deleteVideo(id: string): void {
  mutate((db) => {
    db.videos = (db.videos ?? []).filter((v) => v.id !== id);
  });
}

/** Videoyu bir yukari (-1) veya asagi (+1) tasir. */
export function moveVideo(id: string, direction: -1 | 1): void {
  mutate((db) => {
    const list = db.videos ?? [];
    const i = list.findIndex((v) => v.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  });
}
