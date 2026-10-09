# Sonraya Bırakılanlar

Kararlaştırılıp ileri bir tarihe bırakılan işler. Bir iş yapıldığında
buradan silinir.

## Ürün sıralaması — "Sıra" numarası

Kategori sayfalarında varsayılan sıralama ("Önerilen") şu an ürünlerin
veri dosyasındaki kayıt sırasını kullanıyor. Panelden yeni eklenen ürün
listenin en başına geçiyor ve sıra panelden değiştirilemiyor.

Yapılacak: ürünlere bir "Sıra" numarası alanı eklenip yönetim panelinden
düzenlenebilir hale getirilmesi; "Önerilen" sıralamanın bu numarayı
kullanması.

## Ürün seçenekleri (3 m / 5 m gibi) yönetimi

Şu an yalnızca örnek olarak MB-25 MIG Torcu'nda var ve koddan geliyor.
Gerçek ürünler (SKU, teknik özellikler, açıklama) ve hangi ürünlerin
seçenekli olduğu belirlendikten sonra panele seçenek yönetimi eklenecek.

Bu iş yapılırken: `packages/store/src/repository.ts` içindeki
`createProduct` fonksiyonu yeni ürün oluştururken `variantGroups` ve
`stockQuantity` alanlarını kopyalamıyor. Panele bu alanlar eklendiğinde
bu fonksiyon da güncellenmeli; yoksa yeni ürünlerde sessizce kaybolurlar.

## Bayi sitesinden kalanlar — karar bekliyor

Bayi e-ticaret sitesi (`apps/bayi-shop`) ve mağaza paneli kaldırıldı. Ana
sitede o sisteme ait şu parçalar duruyor; ne yapılacağına karar verilecek:

1. **ZENWELD-BAYİ-A online satıcı kaydı** (`retailers.seed.ts`): ürün
   sayfasındaki online satıcılar listesinde kırmızı "kendi mağazamız"
   rozetiyle görünüyor ve kapatılan bayi sitesine bağlantı veriyor.
   Yönetim panelindeki **Online Satıcılar → "Kendi bayi mağazası"**
   işareti de bunun için vardı.
   - Bu kayıt kaldırılınca Vercel'deki ana site projesinden
     **`NEXT_PUBLIC_BAYI_SHOP_URL`** ortam değişkeni de silinmeli
     (yalnızca bu kaydın adresi için okunuyor).
2. **Örnek veriler:** 2 bayi giriş hesabı, 3 mağaza üyesi, 4 mağaza
   siparişi, 3 mağaza yorumu — artık hiçbir yerde görünmüyor.
3. **Veri yapısındaki bayi sitesi alanları:** üyelerde `storeId`,
   siparişlerde `bayi-shop` kanalı ve `retailerId`, yorumlarda `bayi`
   sitesi, girişte mağazaya göre ayırma (`storeId`). "Bayi" rolü ileride
   B2B uygulaması için gerekebilir.

## Canlı sunucu (hosting) kararı ve Vercel temizliği

Demo şu an Vercel'de yayında; derleme sunucusu ABD'de (Washington, D.C.).
Canlıya çıkmadan önce sitenin nerede barındırılacağına BT ekibiyle
birlikte karar verilmeli.

- **KVKK:** Şu an müşteri verisi sunucuda tutulmuyor (her şey ziyaretçinin
  tarayıcısında). Backend geldiğinde Türk kullanıcıların kişisel verisinin
  yurt dışında tutulması KVKK kapsamında değerlendirilmeli; hukuk/BT ile
  konuşulmalı. Bu karar sunucu yerini belirleyebilir.
- **Vercel'de kalınırsa:** Kod olduğu gibi kalır. Gerçek alan adı
  bağlanır, `NEXT_PUBLIC_SITE_URL` = `https://zenweld.com` tanımlanır.
- **Başka sunucuya geçilirse** (kendi sunucu, Türk barındırma firması,
  Azure, AWS…): Vercel'e özel parçalar kaldırılır (yaklaşık 10 dakika):
  - `apps/zenweld-web/vercel.json`
  - `apps/zenweld-web/src/lib/seo.ts` dosyasındaki `getSiteUrl()` içinde
    `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` yedeği
  - README ve kod yorumlarındaki Vercel anlatımları
  - Yeni sunucuda `NEXT_PUBLIC_SITE_URL` tanımlanır.

Proje standart bir Next.js projesidir; Vercel'e bağımlı değildir ve her
Node.js sunucusunda `npm run build` + `npm start` ile çalışır.

## Zenweld – bayi B2B uygulaması

Zenweld ile bayiler arasındaki teklif ve siparişler (bayinin Zenweld'den mal
alması) ana siteden çıkarıldı. Bunlar için ayrı bir B2B uygulaması
geliştirilecek. Bayi hesaplarını kimin açıp yöneteceği de bu uygulamayla
birlikte netleşecek.

## Kod incelemesi bulguları

Ayrıntılı inceleme sohbette yapıldı; düzeltme zamanı ayrıca
kararlaştırılacak. Başlıklar:

1. Giriş/yetki yalnızca tarayıcıda (demo) — canlıdan önce sunucu tarafı
   kimlik doğrulama şart
2. `/api/destek` ve `/api/bayilik` için istek sınırı, uzunluk sınırı ve
   e-posta doğrulaması yok
3. KVKK onay kutusu üyelik (`/kayit`) ve bayi ödeme (`/odeme`)
   formlarında yok
4. Yayından kaldırılan ürün, haber ve etkinliğin sayfası doğrudan
   adresle hâlâ açılıyor
5. Bayi ödemesinde KDV sabit `1.2` ile hesaplanıyor
6. Sepetteki fiyat eklendiği anda sabitleniyor; stok sınırı yok
7. `createProduct` bazı alanları kopyalamıyor (yukarıdaki not)
8. Tarayıcı deposu dolunca kayıt başarısız oluyor ama kullanıcıya
   uyarı gösterilmiyor
9. Arama dizini her sayfa açılışında kuruluyor
10. Her değişiklikte tüm veritabanı (≈545 KB) yeniden yazılıyor
11. Yorumlara yüklenen foto/videoda boyut sınırı ve sıkıştırma yok
12. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
13. `/yetkili-bayi-ve-servis-agi` sayfa başlığı eski adı taşıyor
14. İngilizce sayfalar Türkçe yolla da açılıyor (`/en/urun/...`)
15. 17 dosyada hâlâ Lorem ipsum var
16. ESLint kurulu değil, test ve CI yok
17. İki sitede aynı yardımcı dosyaların ayrı kopyaları var
18. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil
