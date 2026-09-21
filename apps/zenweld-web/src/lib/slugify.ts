/**
 * Turkce karakterleri sadelestirerek URL'ye uygun bir slug uretir.
 * "İmatech 2026 Fuarı" -> "imatech-2026-fuari"
 */
export function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Yonetim panelindeki gorsel yuklemeleri icin tarayici deposu siniri. */
export const MAX_UPLOAD_BYTES = 1_500_000;

/**
 * Secilen dosyalari data URL'e cevirir. Tarayici deposu sinirli oldugu icin
 * buyuk dosyalar atlanir ve adlari onError ile geri bildirilir.
 */
export function readImageFiles(
  files: FileList | null,
  onImage: (dataUrl: string) => void,
  onError: (message: string) => void,
): void {
  if (!files) return;
  Array.from(files).forEach((file) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      onError(
        `${file.name} çok büyük (>1.5 MB). Tarayıcı deposu sınırlı olduğu için küçük dosya kullanın veya URL girin.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onImage(String(reader.result));
    reader.readAsDataURL(file);
  });
}
