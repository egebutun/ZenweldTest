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

export function saveUser(user: User): void {
  mutate((db) => {
    const idx = db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    else db.users.unshift(user);
  });
}

export function deleteUser(id: string): void {
  mutate((db) => {
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
