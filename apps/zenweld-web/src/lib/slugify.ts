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

/** Tarayici deposuna yazilabilecek en buyuk gorsel boyutu. */
export const MAX_UPLOAD_BYTES = 1_500_000;

/** Bu boyutun altindaki dosyalara dokunulmaz (yeniden kodlamak buyutebilir). */
const KEEP_ORIGINAL_UNDER = 300_000;

/** Uzun kenar icin sirayla denenecek olculer. */
const WIDTHS = [1600, 1200, 900, 700];

/** Her olcude sirayla denenecek kaliteler. */
const QUALITIES = [0.85, 0.75, 0.62];

/** data URL'in yaklasik bayt boyutu. */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("okunamadi"));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("gorsel cozulemedi"));
    };
    img.src = url;
  });
}

/** Tarayici WebP yazabiliyor mu? (Safari 14+ dahil hepsi yazabiliyor.) */
function pickOutputType(canvas: HTMLCanvasElement): "image/webp" | "image/png" {
  return canvas.toDataURL("image/webp", 0.5).startsWith("data:image/webp")
    ? "image/webp"
    : "image/png";
}


/**
 * Gorselin cevresindeki BOS kenari (beyaz ya da seffaf) keser.
 *
 * scripts/prepare-images.mjs ile ayni kurali uygular: yalnizca dort
 * kosesi de beyaz/seffaf olan gorseller kesilir. Kosesi renkli olan
 * logolarda (WIN Eurasia kirmizi, Riyadh koyu gri) markanin kendi zemini
 * kirpilmasin diye hicbir sey yapilmaz.
 *
 * Boylece yonetim panelinden yuklenen logo da, depoya elle eklenen logo
 * da ayni sekilde hazirlanmis olur.
 */
function trimBlankEdges(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const { width, height } = canvas;
  let pixels: ImageData;
  try {
    pixels = ctx.getImageData(0, 0, width, height);
  } catch {
    return canvas; // baska kaynakli gorsel: okunamaz
  }
  const d = pixels.data;

  const at = (x: number, y: number) => (y * width + x) * 4;
  const isBlank = (i: number) =>
    d[i + 3] < 10 || (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240);

  // Dort kose de bos degilse dokunma.
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
  if (!corners.every(isBlank)) return canvas;

  let top = 0, bottom = height - 1, left = 0, right = width - 1;
  const rowBlank = (y: number) => {
    for (let x = 0; x < width; x++) if (!isBlank(at(x, y))) return false;
    return true;
  };
  const colBlank = (x: number) => {
    for (let y = top; y <= bottom; y++) if (!isBlank(at(x, y))) return false;
    return true;
  };

  while (top < bottom && rowBlank(top)) top++;
  while (bottom > top && rowBlank(bottom)) bottom--;
  while (left < right && colBlank(left)) left++;
  while (right > left && colBlank(right)) right--;

  const w = right - left + 1;
  const h = bottom - top + 1;
  if (w < 8 || h < 8) return canvas;                    // tamami bos: birak
  if (w * h > width * height * 0.98) return canvas;     // kesilecek bosluk yok

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  return out;
}

/**
 * Secilen gorseli tarayicida kucultur ve WebP'ye cevirir.
 *
 * Amac: yonetim panelinden bir sey eklerken kullanicinin dosyayi elle
 * kucultmesi, bicim cevirmesi veya bir betik calistirmasi gerekmesin.
 * Telefonla cekilmis 6 MB'lik bir fotograf da dogrudan yuklenebilsin.
 *
 * Kurallar:
 *  - SVG vektoreldir, oldugu gibi birakilir.
 *  - Zaten kucuk (<300 KB) ve olcusu makul dosyalara dokunulmaz; kucuk
 *    logolari WebP'ye cevirmek dosyayi BUYUTUYOR.
 *  - Aksi halde uzun kenar sirayla 1600/1200/900/700 px denenir, her
 *    olcude kalite dusurulur; sinirin altina inen ilk sonuc kullanilir.
 *  - Sonuc orijinalden buyuk cikarsa orijinal korunur.
 *  - trimEdges verilirse once bos kenarlar kesilir (etkinlik logolari).
 */
export async function optimizeImageFile(
  file: File,
  options: { trimEdges?: boolean } = {},
): Promise<string> {
  if (file.type === "image/svg+xml") return readAsDataUrl(file);

  const original = await readAsDataUrl(file);

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return original; // cozulemediyse oldugu gibi birak
  }

  const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
  if (!options.trimEdges && file.size <= KEEP_ORIGINAL_UNDER && longEdge <= WIDTHS[0]) {
    return original;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;

  let best: string | null = null;

  for (const maxEdge of WIDTHS) {
    const scale = Math.min(1, maxEdge / longEdge);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const surface = options.trimEdges ? trimBlankEdges(canvas) : canvas;
    const type = pickOutputType(surface);
    for (const quality of QUALITIES) {
      const candidate = surface.toDataURL(type, quality);
      if (!best || dataUrlBytes(candidate) < dataUrlBytes(best)) best = candidate;
      if (dataUrlBytes(candidate) <= MAX_UPLOAD_BYTES) {
        // Kirpma yapildiysa sonuc her halukarda kullanilir; yalnizca
        // boyut kucultmede kazanc yoksa orijinale donulur.
        if (options.trimEdges) return candidate;
        return dataUrlBytes(candidate) < file.size ? candidate : original;
      }
    }
  }

  return best ?? original;
}

/**
 * Secilen dosyalari otomatik kucultup data URL olarak geri verir.
 *
 * Cagiran taraf degismedi: onImage her dosya icin bir kez cagrilir.
 * Yalnizca en kucuk halinde bile sinira sigmayan dosyalar reddedilir.
 */
export function readImageFiles(
  files: FileList | null,
  onImage: (dataUrl: string) => void,
  onError: (message: string) => void,
  options: { trimEdges?: boolean } = {},
): void {
  if (!files) return;

  Array.from(files).forEach(async (file) => {
    try {
      const dataUrl = await optimizeImageFile(file, options);
      if (dataUrlBytes(dataUrl) > MAX_UPLOAD_BYTES) {
        onError(
          `${file.name} küçültüldükten sonra bile çok büyük. Lütfen daha düşük çözünürlüklü bir görsel seçin veya URL girin.`,
        );
        return;
      }
      onImage(dataUrl);
    } catch {
      onError(`${file.name} okunamadı. Farklı bir dosya deneyin.`);
    }
  });
}
