# Etkinlik logoları ve fotoğrafları

## Logolar

Kart başlığında görünen etkinlik logosu. Dosya adı etkinliğin `slug`'ı olmalıdır:

| Dosya | Etkinlik |
|---|---|
| `big-5-global-2025.png` | Big 5 Global 2025 |
| `international-hardware-riyadh-2025.png` | International Hardware Riyadh |
| `win-eurasia-2025.png` | WIN EURASIA 2025 |
| `imatech-2025.png` | İmatech 2025 |
| `istanbul-hirdavat-fuari-2024.png` | 2024 Uluslararası İstanbul Hırdavat Fuarı |
| `win-eurasia-2024.png` | WIN EURASIA 2024 |
| `konya-makine-teknolojileri-fuari-2024.png` | Konya Makine Teknolojileri Fuarı 2024 |
| `imatech-2024.png` | İmatech 2024 |

- **Uzantı fark etmez:** `.svg`, `.png`, `.jpg` veya `.webp` yükleyebilirsiniz.
  Site dosyayı sırayla dener, hangisi varsa onu gösterir. Tablodaki adlar `.png`
  yazsa da dosya adının gövdesi (slug) doğru olduğu sürece `.svg` de çalışır.
- **SVG varsa SVG tercih edin** — vektörel olduğu için her ekranda net görünür ve
  dosya boyutu küçüktür. Ancak elinizde yalnızca PNG/JPG varsa onu çevirmeyin:
  dönüştürücüler rastere bakarak iz sürer, sonuç genelde orijinal PNG'den kötü olur.
  Gerçek vektör kaynak (AI / EPS / PDF) varsa ondan SVG çıkarın.
- Şeffaf arka plan tercih edilir.
- Yatay logolar en iyi sonucu verir; kartta en fazla 190×68 px alana sığar.
- Logo yoksa site kırılmaz, markalı yer tutucu görünür.

## Etkinlik fotoğrafları (detay sayfasındaki galeri)

Etkinlik detay sayfasının alt kısmında bir fotoğraf galerisi var. **Şu an orada
gerçek fotoğraflar değil, geçici stok görseller duruyor.**

Gerçek fotoğrafları eklemek için tek yapmanız gereken: dosyaları bu klasörde
etkinliğin adını taşıyan bir alt klasöre yükleyin. Örnek:

```
public/images/events/win-eurasia-2025/1.jpg
public/images/events/win-eurasia-2025/2.jpg
public/images/events/big-5-global-2025/1.jpg
```

Yükledikten sonra haber verin, kalan bağlantı işini ben yaparım. (Dilerseniz
yönetim panelinden de ekleyebilirsiniz: Etkinlikler → Düzenle → Logo &
Fotoğraflar. Ancak panelden eklenenler yalnızca sizin tarayıcınızda görünür.)
