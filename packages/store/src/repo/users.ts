"use client";

import type { User, ZenweldDatabase } from "@zenweld/data";
import { getSnapshot, mutate } from "../database";

/* ------------------------------------------------------------------ */
/* Kullanicilar                                                        */
/* ------------------------------------------------------------------ */

export function listUsers(db: ZenweldDatabase = getSnapshot()): User[] {
  return db.users;
}

export function findUserByEmail(
  email: string,
  db: ZenweldDatabase = getSnapshot(),
): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
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
