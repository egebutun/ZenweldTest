"use client";

import type { ZenweldDatabase, ZenweldEvent } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { nowIso } from "./shared";

/* ------------------------------------------------------------------ */
/* Etkinlikler                                                         */
/* ------------------------------------------------------------------ */

/** Sitede gorunen etkinlikler (yayinda olanlar). */
export function listEvents(db: ZenweldDatabase = getSnapshot()): ZenweldEvent[] {
  return db.events.filter((e) => e.active);
}

export function findEventById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): ZenweldEvent | undefined {
  return db.events.find((e) => e.id === id);
}

/** Sitedeki etkinlik sayfasi icin: yalnizca yayindaki etkinlik. */
export function findEventBySlug(
  slug: string,
  db: ZenweldDatabase = getSnapshot(),
): ZenweldEvent | undefined {
  return db.events.find((e) => e.active && e.slug === slug);
}

/** Baslangic tarihine gore yeniden eskiye siralar. */
function sortEvents(list: ZenweldEvent[]): void {
  list.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function saveEvent(event: ZenweldEvent): void {
  mutate((db) => {
    const idx = db.events.findIndex((e) => e.id === event.id);
    if (idx >= 0) db.events[idx] = event;
    else db.events.unshift(event);
    sortEvents(db.events);
  });
}

export function createEvent(partial: Partial<ZenweldEvent>): ZenweldEvent {
  const id = partial.id || uid("e");
  const today = nowIso().slice(0, 10);
  const event: ZenweldEvent = {
    id,
    slug: partial.slug ?? id,
    title: partial.title ?? "",
    summary: partial.summary ?? "",
    description: partial.description ?? "",
    startDate: partial.startDate ?? today,
    endDate: partial.endDate ?? partial.startDate ?? today,
    venue: partial.venue ?? "",
    city: partial.city ?? "",
    country: partial.country ?? "Türkiye",
    logoUrl: partial.logoUrl ?? "",
    images: partial.images ?? [],
    websiteUrl: partial.websiteUrl,
    featured: partial.featured ?? false,
    active: partial.active ?? true,
  };
  mutate((db) => {
    db.events.unshift(event);
    sortEvents(db.events);
  });
  return event;
}

export function deleteEvent(id: string): void {
  mutate((db) => {
    db.events = db.events.filter((e) => e.id !== id);
  });
}
