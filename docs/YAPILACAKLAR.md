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

Bu iş yapılırken: `packages/store/src/repo/products.ts` içindeki
`createProduct` fonksiyonu yeni ürün oluştururken `variantGroups` ve
`stockQuantity` alanlarını kopyalamıyor. Panele bu alanlar eklendiğinde
bu fonksiyon da güncellenmeli; yoksa yeni ürünlerde sessizce kaybolurlar.

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
  Site bu alan adında kendiliğinden arama motorlarına açılır; alan adı
  `zenweld.com` değilse `src/lib/seo.ts` içindeki `INDEXABLE_HOSTS` güncellenmeli.
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

## Online satış — canlıya çıkmadan önce

Sitedeki sepet, ödeme ve sipariş akışı şu an demo (tarayıcıda). Canlı için:

1. **Ödeme kuruluşu** (iyzico, PayTR veya bankanın sanal POS'u): 3D Secure,
   kartın BIN'ine göre gerçek taksit oranları, iade/iptal. Kart bilgisi hiçbir
   zaman bizim sunucumuza gelmemeli (kuruluşun ödeme formu kullanılmalı).
2. **Fiyat ve tutarlar sunucuda yeniden hesaplanmalı**; tarayıcıdan gelen
   tutara güvenilmez. Sipariş numarası sunucuda üretilmeli.
3. **Hukuk metinleri**: Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi,
   İade/Cayma koşulları — şu anki metinler taslak, hukuk danışmanı yazmalı.
   Kurumsal (ticari) alıcılara cayma hakkının uygulanıp uygulanmayacağı netleşmeli.
4. **ETBİS kaydı** (Ticaret Bakanlığı e-ticaret bilgi sistemi) ve satıcının
   MERSİS numarası sözleşmelere eklenmeli.
5. **e-Arşiv / e-Fatura** entegrasyonu (muhasebe yazılımı veya entegratör).
6. **E-posta bildirimleri**: sipariş onayı + sözleşme kopyası (zorunlu), havale
   hatırlatması, kargoya verildi, teslim edildi.
7. **Zamanlanmış iş**: süresi dolan havale siparişlerini iptal eden günlük iş
   (demoda sipariş sayfaları açılınca yapılıyor).
8. **Kargo entegrasyonu** (isteğe bağlı): takip numarasından takip bağlantısı,
   kargo etiketinin panelden oluşturulması.
9. **Gerçek kargo ücreti, vade farkı oranları ve IBAN'lar** Mağaza Ayarları'na
   girilmeli (şu an örnek değerler).

## Kod incelemesi bulguları

Ayrıntılı inceleme sohbette yapıldı; düzeltme zamanı ayrıca
kararlaştırılacak. Başlıklar:

1. Giriş/yetki yalnızca tarayıcıda (demo) — canlıdan önce sunucu tarafı
   kimlik doğrulama şart
2. `/api/destek` ve `/api/bayilik` için istek sınırı, uzunluk sınırı ve
   e-posta doğrulaması yok
3. KVKK onay kutusu üyelik (`/kayit`) formunda yok
4. Yayından kaldırılan ürün, haber ve etkinliğin sayfası doğrudan
   adresle hâlâ açılıyor
5. `createProduct` bazı alanları kopyalamıyor (yukarıdaki not)
6. Tarayıcı deposu dolunca kayıt başarısız oluyor ama kullanıcıya
   uyarı gösterilmiyor
7. Arama dizini her sayfa açılışında kuruluyor
8. Her değişiklikte tüm veritabanı (≈545 KB) yeniden yazılıyor
9. Yorumlara yüklenen foto/videoda boyut sınırı ve sıkıştırma yok
10. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
11. `/yetkili-bayi-ve-servis-agi` sayfa başlığı eski adı taşıyor
12. İngilizce sayfalar Türkçe yolla da açılıyor (`/en/urun/...`)
13. 17 dosyada hâlâ Lorem ipsum var
14. ESLint kurulu değil, test ve CI yok
15. İki sitede aynı yardımcı dosyaların ayrı kopyaları var
16. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil

## Ürün Seçici ve arama — yeniden tasarlanacak

Kaynak yöntemi etiketleri (MIG, TIG, MMA…) ürün formundan, ürün kartından ve
kategori filtresinden kaldırıldı. Ürün Seçici soruları ve aramadaki yöntem
eşleşmesi hâlâ ürünlerdeki eski `processes` verisine bakıyor; panelden eklenen
yeni ürünlerde bu alan boş kalır. Ürün Seçici'nin soruları ve eşleştirme mantığı
yeniden kurulunca `processes` alanı tamamen kaldırılmalı.
