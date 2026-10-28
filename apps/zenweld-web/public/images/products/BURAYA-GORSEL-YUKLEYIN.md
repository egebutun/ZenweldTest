# Ürün fotoğrafları buraya

## Ekipmanlar (sahibinin fotoğrafları)

Dosyanın adı ürünün linkidir (sitedeki `/urun/<link>` adresindeki kısım):

- Tek fotoğraflı ürün: `<link>.jpg` (ör. `ultimate-251-thp.jpg`)
- Hava ve su soğutma seçeneği olan ürün: `<link>-hava-sogutmali.jpg` ve
  `<link>-su-sogutmali.jpg` (ör. `ultimate-405-mts-su-sogutmali.jpg`)

Eksik fotoğrafların listesi ve yüklenecek adları:
`docs/YAPILACAKLAR.md` › Ürün fotoğrafları.

Yüklenen fotoğrafın sitede görünmesi için:

1. Yanına küçültülmüş `.webp` hali üretilir (800 px; sitede bu kullanılır,
   orijinal `.jpg` eski tarayıcılar için yedek kalır).
2. Dosyanın adı (uzantısız) `packages/data/src/seed/products.seed.ts`
   içindeki `MACHINE_PHOTOS` listesine eklenir ve veri sürümü artırılır.

Fotoğrafı olmayan ürün ve soğutma hali, alt kategorinin kart çizimini
gösterir (`public/images/categories/`). Force serisinin 9 ürünü gerçek
fotoğrafları gelene kadar **`force-serisi-gecici.webp`** dosyasını gösterir
(`products.seed.ts` › `FORCE_TEMP`); gerçek fotoğraf yüklenip
`MACHINE_PHOTOS`'a eklenince o kullanılır.

## Diğer bölümler

Güvenlik, Aksesuarlar ve Dolgu Metalleri'ndeki ürünler bu klasördeki
**`zenweld-urun.webp`** dosyasını kullanır (eski tarayıcılar için yanında
`.png` hali var). Dosya yoksa site kırılmaz; markalı Zenweld yer tutucu
görseli gösterilir.

## WebP'ye çevirme

Proje kökünde `node scripts/optimize-images.mjs` bu klasördeki büyük
`.png` / `.jpg` dosyalarının yanına `.webp` hallerini üretir.

Neden WebP: aynı fotoğrafın JPG hali 300–900 KB, WebP hali 20–40 KB.
Sayfada 40'tan fazla ürün kartı olduğu için bu fark açılış hızında doğrudan
hissediliyor.

## Ürüne panelden fotoğraf vermek

Yönetim Paneli → Ürünler → Düzenle → **Görseller** sekmesinden URL
girilebilir veya dosya yüklenebilir. Seçenekli üründe her kombinasyonun
fotoğrafı **Seçenekler** sekmesinden seçilir.
