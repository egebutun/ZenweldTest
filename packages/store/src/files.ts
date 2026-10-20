"use client";

/**
 * DOSYA DEPOSU (DEMO)
 *
 * Panelden yuklenen belgeler (PDF vb.) localStorage'a sigmaz; tarayicinin
 * buyuk dosya deposunda (IndexedDB) saklanir. Veritabani kaydinda yalnizca
 * dosyanin anahtari (DocumentFile.fileKey) tutulur.
 *
 * Diger demo verileri gibi dosyalar da yalnizca yuklendigi tarayicida
 * gorunur. Backend geldiginde bu uc fonksiyonun yerini dosya sunucusu
 * (nesne deposu) alir: putFile -> yukleme ucu, getFile -> dosya adresi.
 */

const DB_NAME = "zenweld.files.v1";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Tarayıcı dosya deposu kullanılamıyor."));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Tarayıcı dosya deposu açılamadı."));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = action(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("Dosya işlemi başarısız."));
    });
  } finally {
    db.close();
  }
}

export const putFile = async (key: string, file: Blob): Promise<void> => {
  await run("readwrite", (s) => s.put(file, key));
};

export const getFile = (key: string): Promise<Blob | undefined> => run("readonly", (s) => s.get(key));

export const deleteFile = async (key: string): Promise<void> => {
  await run("readwrite", (s) => s.delete(key));
};
