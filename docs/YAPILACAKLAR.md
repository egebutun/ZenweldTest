# Sonraya Bırakılanlar

Kararlaştırılıp ileri bir tarihe bırakılan işler. Bir iş yapıldığında
buradan silinir.

## Ürün seçenekleri (3 m / 5 m gibi) — backend

Panel ve site hazır: Seçenek Tanımları, kategorinin Seçenekler sekmesi, ürünün
Seçenekler sekmesi, ürün sayfası, sepet, sipariş ve Teklif Al. Veri şimdilik
tarayıcıda. Örnek olarak MB-25 ve MB-36 MIG torçlarında (Hortum Uzunluğu) ve
Gaz Nozulu Seti'nde (Paket) var. Gerçek ürünler ve hangilerinin seçenekli
olduğu belirlenince panelden girilecek.

1. **Tablolar:**
   - `option_definitions`: seçenek adı ("Hortum Uzunluğu"); ad benzersiz.
   - `option_values`: tanım, ad ("4 m"), sıra; tanım içinde ad benzersiz.
   - `category_options`: kategori ↔ tanım; yalnızca bağlantı (bu kategorideki
     ürüne seçenek eklenirken hangi tanımlar listelenir). Kategori ya da tanım
     silinince bağlantı da silinir (CASCADE).
   - `products.option_definition_id`: ürünün tek seçeneği; boşsa seçeneksiz.
   - `product_variants`: ürün, değer, ürün kodu, fiyat farkı (KDV hariç) ve
     yalnızca farklı olanlar: teknik özellik satırları, kutu içeriği, fotoğraf.
     (ürün, değer) benzersiz; ürün silinince satırlar da silinir (CASCADE).
2. **Kurallar (veritabanında da sağlanmalı; bugün panel kontrol ediyor):**
   - Ürünün değerleri yalnızca kendi tanımından olur
     (`product_variants` değerinin tanımı = `products.option_definition_id`).
   - Üründe kullanılan değer ve tanım silinemez (RESTRICT); panel kaç üründe
     kullanıldığını yazar.
   - Ürün kodları tek havuzda benzersiz: ürün kodu ve seçenek kodu başka hiçbir
     ürün ya da seçenek koduyla aynı olamaz. İki tabloya yayıldığı için ortak
     bir kod tablosu (kod UNIQUE, ürün, seçenek) ya da tetikleyici gerekir.
     Bayi ve satıcı stok dosyaları bu kodla eşleşir (`buildCodeIndex`).
   - Değer üründen kaldırılınca o değerin stok satırları (`dealer_stock`,
     `retailer_stock`) ve kod eşleştirmeleri (`sku_aliases`) aynı işlemde
     (transaction) silinir (bugün: `saveProduct`). Stok tablolarında
     `variant_id = ''` ürünün tüm seçenekleri demektir ([STOK.md](STOK.md)).
3. **Eski linkler:** Ayrı bir ürün seçeneğe dönüştürülünce eski linki
   `/urun/<ürün>?secenek=<değer>` adresine 301 ile yönlenmeli (örnek:
   `/urun/mig-torcu-mb25-4m` → `/urun/mig-torcu-mb25?secenek=4-m`). Bunun için
   SEO bölümündeki `previous_paths` tablosuna seçenek (değer) sütunu eklenir.
   Demoda tarayıcı yönlendiriyor (`movedProductPath`). Panelde ayrı ürünü
   seçeneğe dönüştürme ekranı yok; gerekirse eklenecek.
4. **Sipariş ve teklif:** `order_items` ve `quote_items` o anki ürün adını,
   seçenek adını ("Hortum Uzunluğu: 5 m") ve kodunu kopya olarak saklar;
   sonradan ad değişse ya da seçenek silinse de geçmiş kayıt değişmez. Sepet ve
   teklif listesi ürün ve değer kimliğini tutar.
5. **Yorumlar** ürüne bağlıdır (`reviews.product_id`); tüm seçenekler aynı
   yorumları gösterir.
6. **Sayfa adresi:** `?secenek=` sayfayı yalnızca o seçenekle açar. Canonical
   adres parametresizdir; site haritasında ürün tek satırdır.

`packages/store/src/repo/products.ts` içindeki `createProduct` yeni ürün
oluştururken `stockQuantity` alanını kopyalamıyor. Panele bu alan eklendiğinde
bu fonksiyon da güncellenmeli; yoksa yeni ürünlerde sessizce kaybolur.

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

## Blog yazıları — yayına girmeden önce

Blog yazıları arama motorlarına açık ve site haritasında. Örnek yazıların
gövdesi ve özeti hâlâ yer tutucu metin (Lorem ipsum,
`packages/data/src/seed/content.seed.ts`). Site zenweld.com'da yayına girmeden
önce bu yazılar gerçek metinlerle değiştirilmeli ya da panelden yayından
kaldırılmalı; yoksa Google bu metni Zenweld'in içeriği olarak listeler.

## Online satış — canlıya çıkmadan önce

Sitedeki sepet, ödeme ve sipariş akışı şu an demo (tarayıcıda). Canlı için:

1. **Ödeme kuruluşu** (iyzico, PayTR veya bankanın sanal POS'u): 3D Secure,
   kartın BIN'ine göre gerçek taksit oranları, iade/iptal. Kart bilgisi hiçbir
   zaman bizim sunucumuza gelmemeli (kuruluşun ödeme formu kullanılmalı).
   Mağaza Ayarları → Kartla Taksit'teki banka POS'ları gerçek sanal POS'larla
   eşleştirilmeli; POS'ların API anahtarları ve şifreleri yalnızca sunucuda
   saklanmalı, panelde/tarayıcıda tutulmamalı.
2. **Fiyat ve tutarlar sunucuda yeniden hesaplanmalı**; tarayıcıdan gelen
   tutara güvenilmez. Sipariş numarası sunucuda üretilmeli.
3. **Hukuk metinleri**: Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi,
   İade/Cayma koşulları — şu anki metinler taslak, hukuk danışmanı yazmalı.
   Kurumsal (ticari) alıcılara cayma hakkının uygulanıp uygulanmayacağı netleşmeli.
4. **ETBİS kaydı** (Ticaret Bakanlığı e-ticaret bilgi sistemi) ve satıcının
   MERSİS numarası sözleşmelere eklenmeli.
5. **e-Arşiv / e-Fatura** entegrasyonu (muhasebe yazılımı veya entegratör).
6. **Müşteriye e-posta bildirimleri**: sipariş onayı + sözleşme kopyası
   (zorunlu), havale hatırlatması, kargoya verildi, teslim edildi. (Zenweld'e
   "yeni sipariş" e-postası bugün de gidiyor.)
7. **Form e-postaları için Resend kurulumu**: Vercel'de `RESEND_API_KEY` ve
   doğrulanmış gönderici adresi `SUPPORT_FROM` tanımlanmalı. Tanımlı değilse
   canlıda yalnızca e-postayla giden formlar (iletişim, bayilik, Welders Club)
   ziyaretçiye hata gösterir.
8. **Zamanlanmış iş**: süresi dolan havale siparişlerini iptal eden günlük iş
   (demoda sipariş sayfaları açılınca yapılıyor).
9. **Kargo entegrasyonu** (isteğe bağlı): takip numarasından takip bağlantısı,
   kargo etiketinin panelden oluşturulması.
10. **Gerçek kargo ücreti, vade farkı oranları ve IBAN'lar** Mağaza Ayarları'na
   girilmeli (şu an örnek değerler).
11. **Örnek satış hareketleri silinmeli**: panel grafikleri için üretilen örnek
    üye, sipariş, teklif, servis talebi ve garanti kayıtları
    (`packages/data/src/seed/sample-activity.seed.ts` ve `index.ts`'teki çağrısı).
12. **Ziyaretçi verileri** (ziyaret sayısı, ziyaretten siparişe dönüşüm, sepette
    bırakılan ürünler) için Google Analytics vb. kurulmalı; çerez onayına bağlı yüklenmeli.

## Bayi ve satıcı stokları — backend

Panel akışı hazır; veri şimdilik tarayıcıda. Tablolar, API uçları ve
ayrıntılar: [STOK.md](STOK.md) › "Backend'e geçiş".

1. `dealer_stock`, `retailer_stock`, `stock_imports`, `sku_aliases` tabloları; dosya yükleme tek
   işlemde (transaction) uygulanmalı, dosya sunucuda yeniden doğrulanmalı.
2. Yüklenen orijinal dosyalar denetim için saklanmalı.
3. Ürün sayfaları önbellekte tutulmalı; yükleme uygulanınca yalnızca etkilenen
   ürünlerin sayfaları yenilenmeli, ayrıca günde en az bir kez.

## SEO alanları (ürün, blog, haber, etkinlik, sabit sayfalar) ve link yönlendirme — backend

Panelde SEO sekmesi (ürün, blog yazısı, haber, etkinlik, grup, kategori) ve Sayfa SEO ekranı hazır; veri şimdilik
tarayıcıda. Sunucu bugün bu sayfaların başlığını, açıklamasını ve `keywords`
etiketini koddaki örnek veriden üretiyor (`generateMetadata`), paneldeki
değişikliği göremiyor. Eski linkten yeni linke yönlendirme de demoda tarayıcıda
yapılıyor (`lib/page-seo-client.ts`).

1. `products`, `blog_posts`, `news`, `events`, `categories`, `category_groups`
   tablolarına `seo_title`, `seo_description`, `seo_keywords` alanları
   (kategori ve gruplarda ayrıca `about_text`, gruplarda `description`); eski
   linkler için tek bir `previous_paths` (tür, kayıt, eski adres) tablosu.
   Kategori adresi grubun linkine bağlı olduğu için eski adres tam yol olarak
   tutulur (`/ekipmanlar/kaynak-makineleri/mma-…`).
2. Sayfaların başlığı, açıklaması ve `keywords` etiketi veritabanından
   okunmalı (`lib/seo.ts` → `productSeo`, `blogPostSeo`, `newsSeo`, `eventSeo`,
   `categorySeo`, `groupSeo`).
   Sabit sayfalar (Sayfa SEO ekranı) için `page_seo` (sayfa adresi, başlık,
   açıklama) tablosu; `lib/page-meta.ts` → `pageMetadataFor` panelde girilen
   metni bu tablodan okumalı. Ana sayfanın başlığı site düzeninde
   (`app/(site)/layout.tsx`).
3. Eski link sunucuda **301 (kalıcı)** ile yeni linke yönlendirilmeli; Google eski
   sonucu yeni linkle değiştirir. Panelde değiştirilen yeni link sunucuda da
   bulunmalı (bugün yalnızca tarayıcı biliyor; sunucu 404 kodu döndürüyor, sayfa
   tarayıcıda açılıyor).
4. Kayıt kaydedilince o sayfa ve site haritası yenilenmeli. Site
   haritası veritabanından üretilmeli: panelde eklenen ürünler ve blog yazıları
   girmeli, linki değişen üründe yalnızca yeni link yer almalı.
5. **Kampanya başlangıç ve bitişinde ürün sayfası yenilenmeli.** Google'a
   giden fiyat (yapısal veri) sayfa üretilirken yazılır. Kampanya belirlenen
   saatte kendiliğinden başlayıp bittiği için o anda kimse kayıt yapmaz;
   sayfa ya kampanyanın başlangıç/bitiş saatinde zamanlanmış bir işle ya da
   saatte bir yenilenmeli. Yoksa Google bir sonraki yenilemeye kadar eski
   fiyatı görür.

## Belgeler (MSDS, Kaynak Rehberi, Parti Sertifikaları) — backend

Panel ve site sayfaları hazır; dosyalar şimdilik yükleyen tarayıcıda
(`packages/store/src/files.ts`, kayıtlar `packages/store/src/repo/documents.ts`).

1. `documents` tablosu (bölüm, başlık, ürün, parti no, dosya adı/türü/boyutu,
   dosya yolu, sıra, yayında) ve `document_pages` (sayfa başlığı ve açıklaması).
2. Dosyalar bir dosya sunucusuna (nesne deposu) yüklenmeli; site belgeleri bu
   adresten açar. Yükleme sunucuda tür ve boyut (25 MB) kontrolünden geçmeli.
3. Belge sayfalarının arama motoru başlığı şu an sabit
   (`apps/zenweld-web/src/lib/page-meta.ts`); panelde değiştirilen başlık
   sunucu tarafında okunabilir hale gelince oraya bağlanmalı.

## Formlar — güvenlik (backend)

Formlar info@zenweld.com'a e-posta gönderir (`app/api/bildirim`,
`/api/bayilik`, `/api/destek`; liste: ADMIN-KULLANIM.md › "Form e-postaları").
Bugün gelen veri sunucuda kontrol ediliyor (alan türü, uzunluk) ve her
formda botlar için görünmez bir tuzak alanı var
(`components/common/BotTrap.tsx`). Canlıdan önce:

1. **İstek sınırı:** aynı IP adresinden dakikada birkaç form gönderilebilmeli;
   aşınca "çok fazla deneme" yanıtı. Vercel'de her istek ayrı bir sunucuda
   çalıştığı için sayaç bellekte tutulamaz: Upstash Redis / Vercel KV gibi
   bir depo ya da Vercel Firewall kuralı kullanılmalı.
2. **Bot koruması:** Cloudflare Turnstile veya görünmez reCAPTCHA; doğrulama
   sunucuda yapılmalı. Tuzak alanı yalnızca formu dolduran basit botları
   durdurur, uca doğrudan istek atan betikleri durdurmaz.
3. **Kayıt tutan formlar** (teklif, servis talebi, garanti, yorum, üyelik,
   sipariş) önce sunucuda veritabanına yazılmalı, e-posta bu kayıttan
   gönderilmeli. Bugün tarayıcı kaydı kendisi oluşturup e-posta ucuna haber
   veriyor; bu uca sahte bir bildirim (ör. "yeni sipariş") de gönderilebilir.
   Sipariş e-postası ödeme kuruluşunun onayından sonra gönderilmeli.

## Kod incelemesi bulguları

Ayrıntılı inceleme sohbette yapıldı; düzeltme zamanı ayrıca
kararlaştırılacak. Başlıklar:

1. Giriş/yetki yalnızca tarayıcıda (demo) — canlıdan önce sunucu tarafı
   kimlik doğrulama şart
2. Form uçlarında istek sınırı ve bot koruması yok → "Formlar — güvenlik
   (backend)"
3. KVKK onay kutusu üyelik (`/kayit`) formunda yok
4. Yayından kaldırılan ürün, haber ve etkinliğin sayfası doğrudan
   adresle hâlâ açılıyor
5. `createProduct` bazı alanları kopyalamıyor (yukarıdaki not)
6. Tarayıcı deposu dolunca değişiklik uygulanmıyor; yönetim paneli ve yorum
   formu uyarıyor, sitedeki diğer formlar (teklif, servis, garanti, üyelik) uyarmıyor
7. Arama dizini her sayfa açılışında kuruluyor
8. Her değişiklikte tüm veritabanı (≈545 KB) yeniden yazılıyor
9. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
10. 17 dosyada hâlâ Lorem ipsum var
11. ESLint kurulu değil, test ve CI yok
12. İki sitede aynı yardımcı dosyaların ayrı kopyaları var
13. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil

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
5. Servis talepleri info@zenweld.com'a gidiyor; servis ekibinin ayrı bir
   adresi olacaksa form türüne göre alıcı eklenmeli (`app/api/bildirim`).

## Teklif Al metinleri — herkese hitap edecek şekilde güncellenecek

Teklif Al artık bireysel üyelere de açık, ama bazı metinler hâlâ yalnızca
kurumsal müşterilere hitap ediyor. **Karar bekliyor (müdüre danışılacak).**
Güncellenecek yerler ve önerilen metinler:

1. **Teklif Al sayfasının açıklaması** (`packages/i18n/src/tr.ts` → `quote.subtitle`)
   - Şimdi: "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri
     sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin."
   - Öneri: "İhtiyacınız olan ürünler için size özel fiyat teklifi hazırlayalım.
     Formu doldurun, satış ekibimiz sizinle iletişime geçsin. Firmalara vadeli
     ödeme ve çek ile ödeme seçenekleri de sunuyoruz."
2. **Google'da görünen açıklama** (`lib/page-meta.ts` → `/teklif-al`; panelde
   Sayfa SEO'dan da değiştirilebilir)
   - Şimdi: 1. maddedeki cümlenin aynısı
   - Öneri: "Bireysel ve kurumsal alımlarınız için Zenweld'den fiyat teklifi alın.
     Firmalara vadeli ödeme ve çek seçenekleri." (160 karakterin altında)
3. **Ana sayfadaki kırmızı kutu** (`home.quoteBannerTitle`, `home.quoteBannerText`)
   - Şimdi: "Kurumsal alım mı yapacaksınız?" / "Vadeli ödeme ve çek ile ödeme
     seçenekleri için satış ekibimizden teklif alın."
   - Öneri: "Size özel fiyat teklifi alın" / "Tekli ya da toplu alımlarınız için
     satış ekibimizden teklif isteyin. Firmalara vadeli ödeme ve çek ile ödeme
     seçenekleri de sunuyoruz."
4. **Site aramasındaki gizli kelimeler** (`lib/search/search-client.ts`)
   - Şimdi: "kurumsal vadeli çek ödeme"
   - Öneri: "fiyat teklifi toplu alım bireysel kurumsal vadeli çek ödeme"
5. **İsteğe bağlı: formun 1. adım başlığı** (`quote.step1`)
   - Şimdi: "Firma Bilgileri" — Öneri: "İletişim Bilgileri" (bireysel üyede firma
     adı zaten isteğe bağlı)

Açık soru: vadeli ödeme ve çek bireysel müşterilere de açık mı? Formda bu iki
seçenek bugün herkese görünüyor. Yalnızca firmalar içinse formda yalnızca
kurumsal üyelere gösterilmeli; herkese açıksa metinlerdeki "Firmalara"
ifadesi çıkarılmalı.

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
   gerçek ürün/uygulama fotoğrafları gelince panelden (Ürünler → Kategoriler →
   Kart Görseli) değiştirilmeli. Kaynak Makineleri kartı ilk ürünün fotoğrafını
   kullanıyor.
2. Grup ve kategorilerin tanıtım metinleri (sayfanın altındaki "… Hakkında")
   ve SEO alanları panelden yazılmalı; şu an hepsi boş.

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
