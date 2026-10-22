"use client";

import type { ZenweldDatabase, ZenweldEvent } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";
import { findMoved, nowIso, withPreviousSlugs } from "./shared";

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

/** Adresi degismis etkinlik: eski adresle gelen ziyaretci yeni adrese yonlenir. */
export function findMovedEvent(slug: string, db: ZenweldDatabase = getSnapshot()): ZenweldEvent | undefined {
  return findMoved(listEvents(db), slug);
}

/** Baslangic tarihine gore yeniden eskiye siralar. */
function sortEvents(list: ZenweldEvent[]): void {
  list.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function saveEvent(event: ZenweldEvent): void {
  mutate((db) => {
    const idx = db.events.findIndex((e) => e.id === event.id);
    const next = withPreviousSlugs(db.events, event);
    if (idx >= 0) db.events[idx] = next;
    else db.events.unshift(next);
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
    active: partial.active ?? true,
    seo: partial.seo,
  };
  mutate((db) => {
    // Yeni link baska bir kaydin eski linkiyse o yonlendirme kalkar.
    db.events.unshift(withPreviousSlugs(db.events, event));
    sortEvents(db.events);
  });
  return event;
}

export function deleteEvent(id: string): void {
  mutate((db) => {
    db.events = db.events.filter((e) => e.id !== id);
  });
}
