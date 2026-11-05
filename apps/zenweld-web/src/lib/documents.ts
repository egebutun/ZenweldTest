import { isDocumentAddress, type DocumentFile } from "@zenweld/data";
import { documentBlob } from "@zenweld/store";

/** "PDF", "DOCX" …; uzantisiz dosya adinda (adresi girilen belge) "DOSYA". */
export const fileTypeLabel = (doc: DocumentFile) =>
  doc.fileName.includes(".") ? (doc.fileName.split(".").pop() ?? "").toUpperCase() : "DOSYA";

export const isPdf = (doc: DocumentFile) => doc.mimeType === "application/pdf" || /\.pdf$/i.test(doc.fileName);

/** "350 KB", "1,2 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1_048_576).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Belgeyi acar: PDF yeni sekmede gosterilir, diger dosyalar indirilir.
 * Dosya bu tarayicida yoksa false doner. Adresi girilen belge (veritabani
 * modu, KARARLAR K-104) o adreste yeni sekmede acilir.
 */
export async function openDocument(doc: DocumentFile): Promise<boolean> {
  if (isDocumentAddress(doc.fileKey)) {
    window.open(doc.fileKey, "_blank", "noopener,noreferrer");
    return true;
  }
  // Sekme, tiklamanin hemen ardindan acilmali; yoksa tarayici acilir pencere engeline takilir.
  const tab = isPdf(doc) ? window.open("", "_blank") : null;
  const blob = await documentBlob(doc);
  if (!blob) {
    tab?.close();
    return false;
  }
  const url = URL.createObjectURL(blob);
  if (tab) {
    tab.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
