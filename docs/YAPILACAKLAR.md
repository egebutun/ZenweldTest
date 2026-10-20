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
10. **Örnek satış hareketleri silinmeli**: panel grafikleri için üretilen örnek
    üye, sipariş, teklif, servis talebi ve garanti kayıtları
    (`packages/data/src/seed/sample-activity.seed.ts` ve `index.ts`'teki çağrısı).
11. **Ziyaretçi verileri** (ziyaret sayısı, ziyaretten siparişe dönüşüm, sepette
    bırakılan ürünler) için Google Analytics vb. kurulmalı; çerez onayına bağlı yüklenmeli.

## Bayi ve satıcı stokları — backend

Panel akışı hazır; veri şimdilik tarayıcıda. Tablolar, API uçları ve
ayrıntılar: [STOK.md](STOK.md) › "Backend'e geçiş".

1. `dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases` tabloları; dosya yükleme tek
   işlemde (transaction) uygulanmalı, dosya sunucuda yeniden doğrulanmalı.
2. Yüklenen orijinal dosyalar denetim için saklanmalı.
3. Ürün sayfaları önbellekte tutulmalı; yükleme uygulanınca yalnızca etkilenen
   ürünlerin sayfaları yenilenmeli, ayrıca günde en az bir kez.

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
12. 17 dosyada hâlâ Lorem ipsum var
13. ESLint kurulu değil, test ve CI yok
14. İki sitede aynı yardımcı dosyaların ayrı kopyaları var
15. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil

## Çerezler ve yasal metinler

1. **Tanımlama Bilgisi Ayarları** penceresi şimdilik boş; analiz ve pazarlama
   çerezleri için ayrı açma/kapama seçenekleri eklenecek.
2. Google Analytics, Meta Pixel gibi kodlar eklendiğinde **yalnızca ziyaretçi
   "Tümünü Kabul Et" dediyse** yüklenmeli (`getCookieConsent()`,
   `components/layout/CookieBanner.tsx`).
3. Çerez bandındaki açıklama metni, sitede gerçekten kullanılan çerezlere göre
   güncellenmeli (şu an "reklam ve sosyal medya ortaklarıyla paylaşıyoruz" yazıyor;
   böyle bir paylaşım henüz yok).
4. 11 yasal metnin tamamı taslak; hukuk danışmanının metinleri panelden
   (İçerik › Yasal Metinler) girilmeli.
5. Servis talebi gelince servis ekibine e-posta bildirimi (backend ile).

## Teklif Al metinleri — herkese hitap edecek şekilde güncellenecek

Teklif Al artık bireysel üyelere de açık, ama bazı metinler hâlâ yalnızca
kurumsal müşterilere hitap ediyor. Şimdilik bırakıldı; güncellenecek yerler:

1. Teklif Al sayfasının açıklaması: "Kurumsal müşterilerimize vadeli ödeme ve
   çek ile ödeme seçenekleri sunuyoruz…" (`quote.subtitle`)
2. Aynı cümlenin arama motoru açıklaması (`lib/page-meta.ts` → `/teklif-al`)
3. Ana sayfadaki kutu: "Kurumsal alım mı yapacaksınız?" ve altındaki metin
   (`home.quoteBannerTitle`, `home.quoteBannerText`)
4. Site aramasındaki Teklif Al anahtar kelimeleri: "kurumsal vadeli çek"
   (`lib/search/search-client.ts`)

## Ürün Seçici ve arama — yeniden tasarlanacak

Kaynak yöntemi etiketleri (MIG, TIG, MMA…) ürün formundan, ürün kartından ve
kategori filtresinden kaldırıldı. Ürün Seçici soruları ve aramadaki yöntem
eşleşmesi hâlâ ürünlerdeki eski `processes` verisine bakıyor; panelden eklenen
yeni ürünlerde bu alan boş kalır. Ürün Seçici'nin soruları ve eşleştirme mantığı
yeniden kurulunca `processes` alanı tamamen kaldırılmalı.

Not: Bu alan silinmeden önce, aşağıdaki "Ürün önerileri" bölümündeki uyumlu
aksesuar kurallarında (MIG makinesi → MIG aksesuarları gibi) kullanılıp
kullanılamayacağı değerlendirilsin.

## Ürün grupları (Kaynak Makineleri, Lazer Makineleri …)

1. Grup ve kategori kartlarındaki görseller şimdilik çizim (illüstrasyon);
   gerçek ürün/uygulama fotoğrafları gelince `apps/zenweld-web/public/images/categories/`
   içindeki aynı adlı dosyalarla değiştirilmeli (ör. `mig-torclari.svg` yerine
   `mig-torclari.webp` konup `categories.seed.ts`'teki yol güncellenir).
   Kaynak Makineleri kartı ilk ürünün fotoğrafını kullanıyor.
2. Grup sayfasının açıklaması kategorilerin adlarından otomatik üretiliyor;
   arama motoru için gruba özel bir tanıtım metni yazılabilsin.
3. Grup ve kategoriler panelden yönetilemiyor (ekleme, ad, sıra); şu an
   `packages/data/src/seed/categories.seed.ts` dosyasında.

## Ürün önerileri — ürün sayfasındaki "İlgili Ürünler" yeniden kurgulanacak

Şu anki durum: aynı kategorideki ilk 4 ürün gösteriliyor, sıralama yok. Tek
ürünlü kategoride bölüm hiç çıkmıyor (ör. Ultimate 250 MTC, Kaynak Eldiveni).
Makine sayfasında aksesuar önerilmiyor
(`apps/zenweld-web/src/app/(site)/urun/[slug]/ProductPageClient.tsx`).

1. **İki ayrı satır:** "Tamamlayıcı ürünler" (birlikte alınanlar ve uyumlu
   aksesuarlar) ile "Bu kategoride çok satanlar". *Karar bekliyor: tek satır mı,
   iki satır mı.*
2. **Sepet birliktelik analizi (ML):**
   - Geçmiş siparişlerden "A alanlar B'yi de aldı" ilişkileri çıkarılır, lift
     ölçüsüyle sıralanır.
   - Belli sayıda siparişte birlikte görülmeyen çiftler gösterilmez.
   - Hesaplama sunucuda, gece çalışan bir işle yapılır; her ürün için hazır bir
     öneri listesi saklanır. *Backend gerekli.*
3. **Teklif talepleri** birliktelik analizine daha düşük ağırlıkla dahil edilsin
   mi? *Karar bekliyor.*
4. **Uyumlu aksesuarlar:**
   - Kural: MIG makinesi → MIG Aksesuarları ve MIG Telleri; TIG → TIG
     Aksesuarları, Tungsten ve TIG Telleri; MMA → MMA Aksesuarları; Plazma →
     Plazma Aksesuarları.
   - Elle eşleştirme: panelde her makineye uyumlu aksesuar listesi. Torç, kontak
     meme, sürme makarası gibi ölçüsü uymazsa iade sebebi olan parçalar için
     gerekli. Listeleri Zenweld ekibi doldurur.
   - *Karar bekliyor: başlangıçta yalnızca kural mı, kural ve elle eşleştirme
     birlikte mi.*
5. **Kategorinin çok satanları:**
   - 2-3 ürün gösterilir. *Karar bekliyor: adet mi ciro mu, son kaç gün
     (ör. 90).*
   - Satışı olmayan kategoride yeni ve öne çıkan ürünler gösterilir; bölüm hiç
     boş kalmaz.
6. **Birleştirme kuralları:**
   - Önce birlikte alınanlar, sonra uyumlu aksesuarlar.
   - Sayfadaki ürün, sepette olan ürünler ve satıştan kaldırılanlar çıkarılır.
   - Aynı ürün iki satırda görünmez; aynı kategoriden en fazla 2 ürün.
7. **Ters yön:** aksesuar sayfasında "Uyumlu makineler" olsun mu? *Karar bekliyor.*
8. **Ölçüm:** önerilerden tıklama ve sepete ekleme, makine siparişlerinde
   aksesuar ekleme oranı. Panelde grafik olarak da gösterilebilir.
9. **Demo verisi:** örnek siparişler şu an rastgele. Demoda gösterilecekse
   "MIG makinesi + torç + tel" gibi gerçekçi birliktelik kalıpları eklenmeli.
