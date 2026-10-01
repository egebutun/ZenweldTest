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

## Stokta Azalanlar — SAP bağlantısı

Anasayfadaki "Stokta Azalanlar" bölümündeki adetler şu an demo veriden
geliyor. İleride stok bilgisi SAP'tan çekilecek ve stoğu azalan ürünler
bölüme otomatik girecek.

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
