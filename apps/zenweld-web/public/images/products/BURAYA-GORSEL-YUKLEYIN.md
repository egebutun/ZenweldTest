# Ürün görseli buraya

Sitedeki tüm ürünler bu klasördeki **`zenweld-urun.webp`** dosyasını kullanır.

Dosya yoksa site kırılmaz — markalı Zenweld placeholder görseli gösterilir.

## Yükleme

GitHub üzerinden: bu klasörde **Add file → Upload files** → fotoğrafı sürükle.

Elinizdeki dosya `.png` veya `.jpg` ise ikisinden birini yapın:

- Dosyayı `zenweld-urun.png` adıyla yükleyin, sonra proje kökünde
  `node scripts/optimize-images.mjs` çalıştırın — küçültülmüş `.webp`
  sürümünü sizin için üretir.
- Ya da dosyayı kendiniz WebP'ye çevirip `zenweld-urun.webp` adıyla yükleyin.

Neden WebP: aynı fotoğrafın PNG hali 519 KB, WebP hali 28 KB. Sayfada 40'tan
fazla ürün kartı olduğu için bu fark açılış hızında doğrudan hissediliyor.

## Ürüne özel görsel vermek

Yönetim Paneli → Ürünler → Düzenle → **Görseller** sekmesinden
URL girebilir veya dosya yükleyebilirsiniz.
