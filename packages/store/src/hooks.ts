"use client";

import { useSyncExternalStore } from "react";
import type { ZenweldDatabase } from "@zenweld/data";
import { getServerSnapshot, getSnapshot, subscribe } from "./database";

/** Canli veritabani. Admin panelde yapilan degisiklikler aninda yansir. */
export function useDatabase(): ZenweldDatabase {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Hydration tamamlandi mi — localStorage verisine guvenle bakabilir miyiz? */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
