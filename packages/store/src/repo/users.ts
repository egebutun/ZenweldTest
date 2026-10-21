"use client";

import type { Address, User, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate, uid } from "../database";

/* ------------------------------------------------------------------ */
/* Kullanicilar                                                        */
/* ------------------------------------------------------------------ */

export function listUsers(db: ZenweldDatabase = getSnapshot()): User[] {
  return db.users;
}

export function findUserById(
  id: string,
  db: ZenweldDatabase = getSnapshot(),
): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function addUser(user: User): void {
  mutate((db) => {
    db.users.unshift(user);
  });
}

const isActiveAdmin = (u: User) => u.role === "admin" && u.status === "active";

/**
 * Bu kayit son aktif yonetici mi? Son yoneticinin rolu dusurulur, askiya
 * alinir ya da silinirse panele kimse giremez.
 */
function isLastAdmin(id: string, db: ZenweldDatabase): boolean {
  const stored = db.users.find((u) => u.id === id);
  return Boolean(stored && isActiveAdmin(stored) && !db.users.some((u) => u.id !== id && isActiveAdmin(u)));
}

/** Son aktif yoneticiyi yoneticilikten cikaracaksa kaydedilmez (false). */
export function saveUser(user: User): boolean {
  if (!isActiveAdmin(user) && isLastAdmin(user.id, getSnapshot())) return false;
  return mutate((db) => {
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    else db.users.unshift(user);
  });
}

export function deleteUser(id: string): boolean {
  if (isLastAdmin(id, getSnapshot())) return false;
  return mutate((db) => {
    db.users = db.users.filter((u) => u.id !== id);
  });
}

/* ------------------------------------------------------------------ */
/* Adresler                                                            */
/* ------------------------------------------------------------------ */

export function addressesForUser(userId: string, db: ZenweldDatabase = getSnapshot()): Address[] {
  return db.addresses
    .filter((a) => a.userId === userId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** Yeni adres ekler; kullanicinin ilk adresi varsayilan olur. */
export function addAddress(address: Omit<Address, "id" | "isDefault">): Address {
  const record: Address = {
    ...address,
    id: uid("adr"),
    isDefault: !getSnapshot().addresses.some((a) => a.userId === address.userId),
  };
  mutate((db) => {
    db.addresses.push(record);
  });
  return record;
}

type AddressInput = Omit<Address, "id" | "userId" | "isDefault">;

/** Adresin basligini ve alanlarini gunceller. Yalnizca adresin sahibi degistirebilir. */
export function updateAddress(userId: string, id: string, fields: AddressInput): void {
  mutate((db) => {
    const address = db.addresses.find((a) => a.id === id && a.userId === userId);
    if (address) Object.assign(address, fields);
  });
}

/** Adresi siler; varsayilan adres silinirse kalan ilk adres varsayilan olur. */
export function deleteAddress(userId: string, id: string): void {
  mutate((db) => {
    const target = db.addresses.find((a) => a.id === id && a.userId === userId);
    if (!target) return;
    db.addresses = db.addresses.filter((a) => a !== target);
    if (target.isDefault) {
      const next = db.addresses.find((a) => a.userId === userId);
      if (next) next.isDefault = true;
    }
  });
}

/** Kullanicinin varsayilan adresini degistirir (odeme sayfasinda ilk secili gelen). */
export function setDefaultAddress(userId: string, id: string): void {
  mutate((db) => {
    if (!db.addresses.some((a) => a.id === id && a.userId === userId)) return;
    db.addresses.forEach((a) => {
      if (a.userId === userId) a.isDefault = a.id === id;
    });
  });
}
