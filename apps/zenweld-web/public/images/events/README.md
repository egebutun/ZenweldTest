# Etkinlik logoları ve fotoğrafları

## Logolar

Kart başlığında görünen etkinlik logosu. Dosya adı etkinliğin `slug`'ı olmalıdır:

| Dosya | Etkinlik |
|---|---|
| `big-5-global-2025.png` | Big 5 Global 2025 |
| `international-hardware-riyad-2025.png` | International Hardware Riyad |
| `win-eurasia-2025.png` | WIN EURASIA 2025 |
| `imatech-2025.png` | İmatech 2025 |
| `istanbul-hirdavat-fuari-2024.png` | 2024 Uluslararası İstanbul Hırdavat Fuarı |
| `win-eurasia-2024.png` | WIN EURASIA 2024 |
| `konya-makine-teknolojileri-fuari-2024.png` | Konya Makine Teknolojileri Fuarı 2024 |
| `imatech-2024.png` | İmatech 2024 |
| `win-eurasia-2027.png` | WIN EURASIA 2027 (yaklaşan) |
| `imatech-2027.png` | İmatech 2027 (yaklaşan) |

- **Şeffaf arka planlı PNG** tercih edilir (SVG de olur, uzantıyı seed dosyasında
  güncellemek gerekir).
- Yatay logolar en iyi sonucu verir; kartta en fazla 190×68 px alana sığar.
- Logo yoksa site kırılmaz, markalı yer tutucu görünür.

## Etkinlik fotoğrafları

Detay sayfasındaki galeri için. Şu an `packages/data/src/seed/events.seed.ts`
içinde geçici stok görseller tanımlı. Gerçek fotoğrafları eklemek için:

1. Fotoğrafları `public/images/events/<slug>/` klasörüne koyun (`1.jpg`, `2.jpg` …)
2. Seed dosyasındaki `images` dizisini güncelleyin:
   `images: ["/images/events/win-eurasia-2025/1.jpg", "..."]`

Yardım isterseniz fotoğrafları yükleyip haber verin, yolları ben bağlarım.
