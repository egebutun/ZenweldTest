"use client";

import { Alert, Button } from "@zenweld/ui";

const UNSAVED = "Kaydedilmemiş değişiklikler var. Saklamak için Kaydet'e basın.";

/** Kaydet dugmesi ve sonuc mesajlari (her sekmenin ustunde). */
export function SaveBar({
  onSave,
  disabled,
  saved,
  unsaved,
  error,
  savedText,
}: {
  onSave: () => void;
  disabled: boolean;
  saved: boolean;
  unsaved: boolean;
  error: string | null;
  savedText: string;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={disabled}>
          Kaydet
        </Button>
      </div>
      {saved && <Alert tone="success">{savedText}</Alert>}
      {!saved && unsaved && <Alert tone="warning">{UNSAVED}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
