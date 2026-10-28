# Sonraya Bırakılanlar

Kararlaştırılıp ileri bir tarihe bırakılan işler. Bir iş yapıldığında
buradan silinir.

## Karar bekleyen frontend işleri (özet)

Backend gerektirmeyen ama bir karara ya da bilgiye bağlı olduğu için
bekleyen site işleri. Ayrıntısı olanlar ilgili bölüme bağlanmıştır.

| İş | Neyi bekliyor | Ayrıntı |
|---|---|---|
| Çerez ayarları penceresi (analiz ve pazarlama çerezlerini ayrı açıp kapama) ve analiz kodlarının kurulması | Hangi analiz aracının kullanılacağı | [Çerezler ve yasal metinler](#çerezler-ve-yasal-metinler) 1–3, [Online satış](#online-satış--canlıya-çıkmadan-önce) 12 |
| Kategori filtrelerinin değerleri ve ürünlere eşlenmesi | Ürünlerin kesinleşmesi; Şebeke Voltajı, Amper ve Güç değerleri | [Kategori filtreleri](#kategori-filtreleri) |
| Ürün Seçici'nin yeniden kurulması | Bütün ürünlerin kesinleşmesi; en son ele alınacak (KARARLAR K-69) | [Ürün Seçici ve arama](#ürün-seçici-ve-arama--en-son-yeniden-tasarlanacak) |
| "İlgili Ürünler" öneri mantığı | Bölümdeki kararlar | "Ürün önerileri" bölümü |
| Teklif Al metinleri | Müdür kararı | [Teklif Al metinleri](#teklif-al-metinleri--herkese-hitap-edecek-şekilde-güncellenecek) |
| Ayrı ürünü seçeneğe dönüştürme ekranı | Gerçek ürünler girilmeye başlanınca karar | [Ürün seçenekleri](#ürün-seçenekleri-3-m--5-m-gibi--backend) 3 |
| Satıcı bilgilerinin sitede gösterilmesi (ETBİS, unvan, MERSİS) | ETBİS kaydı ve şirket bilgileri | "Satıcı bilgileri sitede" bölümü |
| Kargo takip bağlantısı | Kargo firması ve entegrasyon kararı | [Online satış](#online-satış--canlıya-çıkmadan-önce) 9 |
| Müşterinin siparişini sitede iptal etmesi | İleride düşünülecek | "Müşterinin siparişi iptal etmesi" bölümü |
| Kurumsal üyelerde iade talebi | Kurumsal alıcılara cayma hakkının uygulanıp uygulanmayacağı sorulup öğrenilecek | "İade talebi" bölümü |
| KVKK başvuru formu (2b) | İleride düşünülecek; hesap silme için 2a (Hesabımı Sil) seçildi | "Hesap silme — açık konular" 10 |
| Erişilebilirlik (A4) | Sahibin sıralaması; zorunlu değil | "Erişilebilirlik" bölümü |
| Görsel optimizasyonu ve sayfalama (A5) | Sahibin sıralaması; zorunlu değil | "Görseller ve uzun listeler" bölümü |
| Ekipmanların eksik fotoğrafları (19 ürün ve 4 soğutma hali) ve diğer bölümlerin ürün fotoğrafları | Sahibinin bulup göndermesi | [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler) |
| Ekipmanların gerçek içeriği (açıklama, teknik özellikler, kutu içeriği, öne çıkanlar, kılavuz) | Sahibinin göndermesi (Force serisi 9 ürün geldi) | "Ürün içeriği" 2 |
| Geçici ürün kodlarının (`ZW-GECICI-…`) SAP kodlarıyla değiştirilmesi | SAP kodlarının açılması | "Ürün içeriği" 6 |
| Ekipmanların gerçek fiyatları ve seçenek fiyat farkları | Sahibinin göndermesi | "Ürün içeriği" 3 |
| Ara paket uzunluklarının gerçek değerleri | Sahibinin göndermesi | "Ürün içeriği" 4 |
| Jasic lazer kaynak ürünleri (2026-10-27 listesindeki 6 model; belki çok sonra) | Sahibinin seçenekleri ayrıntılı açıklaması | "Jasic lazer kaynak ürünleri" bölümü |
| Sitenin tasarımı | Sahibi yapacak | "Sitenin tasarımı" bölümü |

## Müşterinin siparişi iptal etmesi — ileride düşünülecek

Bugün müşteri siparişini sitede iptal edemez; iptali yönetici panelden
yapar (KARARLAR K-27'deki eski cümle 2026-10-22'de çıkarıldı). Yapılırsa
karar verilecekler:

- Hangi durumlarda iptal edilebilir (ör. yalnızca Ödeme Bekleniyor ve
  Hazırlanıyor; kargoya verilen sipariş iptal edilemez).
- Kartla ödenmiş siparişte para iadesi K-27'ye göre banka ya da ödeme
  kuruluşu üzerinden ayrıca yapılır; müşteriye bunun söylenmesi.
- Zenweld'e bildirim (e-posta) ve panelde iptal nedeninin görünmesi.

## Erişilebilirlik (A4) — önerilen, zorunlu değil

Türkiye'de özel e-ticaret siteleri için genel bir erişilebilirlik
zorunluluğu bilinmiyor; AB'ye satış yapılırsa durum değişebilir (hukukçuyla
teyit edilmeli). Yapılacaklar:

1. **"İçeriğe atla" bağlantısı:** Sayfanın en başında, Tab'a basınca
   görünen bir bağlantı; klavyeyle gezen ziyaretçi menüyü atlayıp doğrudan
   sayfa içeriğine geçer. Bugün yok.
2. **Klavye odağı her yerde görünsün:** Tab ile gezinirken seçili düğme ya
   da bağlantı belirgin bir çerçeveyle görünmeli; bütün sayfalarda
   denetlenmeli.
3. **Dokunma alanları:** Telefonda düğme ve bağlantılar en az 44 × 44 piksel
   olmalı; küçük simge düğmeler (sepetten çıkar, adet artır/azalt vb.)
   denetlenmeli.
4. **Form etiketleri alanlara bağlansın:** Birçok formda etiket alanla
   bağlı değil (Üye Ol, Teklif Al, panelde ürün formu — "Kod incelemesi
   bulguları" 9); ekran okuyucu alanın adını okuyamaz. Tarayıcı testleri
   de bu yüzden bazı alanları sırasıyla seçiyor.
5. Renk karşıtlığı tasarım aşamasında ele alınacak.

## Görseller ve uzun listeler (A5) — önerilen, zorunlu değil

1. **Görsel optimizasyonu (`next/image`):** Bugün görseller olduğu gibi
   yükleniyor (`ProductImage`, `<img loading="lazy">`). Next.js'in görsel
   bileşeni ekran boyuna uygun küçük sürüm ve WebP/AVIF üretir; sayfa daha
   hızlı açılır, görselin ölçüsü önceden bilindiği için sayfa kayması olmaz
   ("Kod incelemesi bulguları" 6).
   - Panelden yüklenen görseller bugün tarayıcıda (`data:`) durduğu için bu
     yoldan ancak dosya deposu gelince geçebilir ("Görseller ve yüklenen
     dosyalar — backend").
   - `next.config.mjs` içindeki `images.remotePatterns` ve güvenlik
     politikasındaki görsel izni birlikte güncellenmeli.
2. **Sayfalama:** Sitede ve panelde hiçbir liste sayfalanmıyor; kategori
   ürün listesi, arama sonuçları, blog, haberler, etkinlikler ve panelde
   siparişler, üyeler, teklifler, yorumlar tek sayfada. Kayıt sayısı artınca sayfa sayfa
   gösterilmeli. Sitede sayfa adresi (ör. `?sayfa=2`) arama motorları için
   canonical ve site haritasıyla birlikte düşünülmeli.

## Kategori filtreleri

Ekipmanların 8 alt kategorisinin sayfasında filtreler var; filtreler ve
ürünlerin değerleri panelden yönetilir (KARARLAR K-76, IS-KURALLARI › 19).
Kalanlar:

1. **Değerlerin girilmesi:** Şebeke Voltajı, Amper ve Güç (W) filtrelerinin
   değerleri yok; ürünler kesinleşince sahibinden gelecek. Değeri olmayan
   filtre sitede görünmez.
2. **Ürünlere eşleme:** Bugün yalnızca Model Serisi eşli. Çalışma Modu,
   Fiziki Yapı, Lazer Tipi ve değeri girilecek filtreler ürünlere
   işaretlenecek (kategorinin Filtreler sekmesindeki tabloda toplu
   yapılabilir). Eşlenmemiş filtre sitede sonucu daraltmaz; bir ürüne değer
   işaretlenince o filtre değeri girilmemiş ürünleri eler, bu yüzden bir
   filtrenin eşlemesi bütün ürünlerde birlikte tamamlanmalı.
3. Diğer bölümlerin (Güvenlik, Aksesuarlar, Dolgu Metalleri) alt
   kategorilerine filtre isteniyorsa sahibinden değişkenler gelmeli; panelden
   eklenebilir.

## Satıcı bilgileri sitede (ETBİS, unvan, MERSİS)

Alt bilgide bugün adres, telefon ve e-posta var; ticari unvan, MERSİS
numarası ve ETBİS bilgisi yok. Sözleşmelerdeki MERSİS alanı da boş ("[—]").

- ETBİS kaydından sonra Bakanlığın verdiği doğrulama kodu (QR/logo) sitede
  gösterilmeli.
- Satıcının ticari unvanı ve MERSİS numarası sitede kolayca bulunabilmeli
  (alt bilgi ya da İletişim sayfası) ve Ön Bilgilendirme Formu ile Mesafeli
  Satış Sözleşmesi'ne yazılmalı.
- Hangi bilgilerin zorunlu olduğu hukuk danışmanıyla teyit edilmeli
  (bkz. [Online satış](#online-satış--canlıya-çıkmadan-önce) 4).

## Ürün seçenekleri (3 m / 5 m gibi) — backend

Panel ve site hazır: Seçenek Tanımları, kategorinin Seçenekler sekmesi, ürünün
Seçenekler sekmesi (en fazla 3 seçenek, kombinasyonlar), ürün sayfası, sepet,
sipariş ve Teklif Al. Veri şimdilik tarayıcıda. Örnek olarak MB-25 ve MB-36
MIG torçlarında (Hortum Uzunluğu) ve Gaz Nozulu Seti'nde (Paket) var.
Önerilen tablo yapısı: [VERI-MODELI.md](VERI-MODELI.md) › Ürünler ›
Seçenekler (KARARLAR K-70).

1. **Tablolar:**
   - `option_definitions`: seçenek adı ("Torç Uzunluğu"); ad benzersiz.
   - `option_values`: tanım, ad ("4 m"), sıra; tanım içinde ad benzersiz.
   - `category_options`: kategori ↔ tanım; yalnızca bağlantı (bu kategorideki
     ürüne seçenek eklenirken hangi tanımlar listelenir). Kategori ya da tanım
     silinince bağlantı da silinir (CASCADE).
   - `product_options`: ürün, tanım, sıra (ürün başına en fazla 3; (ürün,
     tanım) benzersiz).
   - `product_variants`: ürün, ürün kodu, fiyat farkı (KDV hariç) ve yalnızca
     farklı olanlar: teknik özellik satırları, kutu içeriği, fotoğraf. Ürün
     silinince satırlar da silinir (CASCADE).
   - `variant_values`: varyant, tanım, değer. (varyant, tanım) benzersiz;
     aynı üründe aynı kombinasyon tek.
   - Seçeneksiz ürün de tek varyantlı tutulmalı (varsayılan varyant); bugün
     demoda kodu ve fiyatı ürünün üstünde.
2. **Kurallar (veritabanında da sağlanmalı; bugün panel kontrol ediyor):**
   - Varyantın her seçenekten tam bir değeri olur; değer o seçeneğin
     tanımından olur.
   - Üründe kullanılan değer ve tanım silinemez (RESTRICT); panel kaç üründe
     kullanıldığını yazar.
   - Ürün kodları tek havuzda benzersiz: ürün kodu ve varyant kodu başka hiçbir
     ürün ya da varyant koduyla aynı olamaz. İki tabloya yayıldığı için ortak
     bir kod tablosu (kod UNIQUE, ürün, varyant) ya da tetikleyici gerekir.
     Bayi ve satıcı stok dosyaları bu kodla eşleşir (`buildCodeIndex`).
   - Varyant üründen kaldırılınca stok satırları (`dealer_stock`,
     `retailer_stock`) ve kod eşleştirmeleri (`sku_aliases`) aynı işlemde
     (transaction) silinir (bugün: `saveProduct`). Ürünün seçenek listesi
     değişince bütün varyantlı stok satırları silinir. Stok tablolarında
     `variant_id = ''` ürünün tüm varyantları demektir ([STOK.md](STOK.md)).
3. **Eski linkler:** Ayrı bir ürün seçeneğe dönüştürülünce eski linki
   `/urun/<ürün>?secenek=<varyant>` adresine 301 ile yönlenmeli (örnek:
   `/urun/mig-torcu-mb25-4m` → `/urun/mig-torcu-mb25?secenek=4-m`). Bunun için
   SEO bölümündeki `previous_paths` tablosuna seçenek (değer) sütunu eklenir.
   Demoda tarayıcı yönlendiriyor (`movedProductPath`). Panelde ayrı ürünü
   seçeneğe dönüştürme ekranı yok. Eklenip eklenmeyeceğine gerçek ürünler
   girilmeye başlanınca karar verilecek. Ekran yapılırsa tek adımda:
   seçeneği eski ürünün koduyla kurar, eski linki seçeneğe yönlendirir,
   stok satırlarını, kod eşleştirmelerini ve yorumları taşır, ayrı ürünü
   kaldırır. Bugün elle yapılırsa eski link 404 verir, yorumlar görünmez olur
   ve stoklar bir sonraki stok dosyasına kadar boş kalır.
4. **Sipariş ve teklif:** `order_items` ve `quote_items` o anki ürün adını,
   seçenekleri ("Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m") ve kodunu kopya
   olarak saklar; sonradan ad değişse ya da varyant silinse de geçmiş kayıt
   değişmez. Sepet ve teklif listesi ürün ve varyant kimliğini tutar.
5. **Yorumlar** ürüne bağlıdır (`reviews.product_id`); tüm varyantlar aynı
   yorumları gösterir.
6. **Sayfa adresi:** `?secenek=` sayfayı yalnızca o varyantla açar. Canonical
   adres parametresizdir; site haritasında ürün tek satırdır.
7. **SAP ve bayi kodları (stok ve sipariş tasarımında karar verilecek):**
   - SAP Business One'da her satılabilir kalem ayrı bir kalemdir; doğal eşleşme
     "varyant kodu = SAP kalem kodu"dur.
   - Bazı kombinasyonların kodu sitede türetilir (ör. SAP'taki makine kodunun
     sonuna torç uzunluğu: `-4M`, `-8M`). Bu kodların SAP'ta da açılıp
     açılmayacağına karar verilecek.
   - Bayilerin stok dosyasında yalnızca SAP kodu (torç uzunluğu belirtilmeden)
     gelirse bugün ya ürünün ana koduyla eşleşir (bütün kombinasyonlarda
     stokta görünür) ya da tanınmayan kod olarak elle tek bir kombinasyona
     eşleştirilir. Bir SAP kodunun birden çok kombinasyona (ör. Hava · 4 m ve
     Hava · 8 m) sayılması istenirse eşleştirme buna göre genişletilmeli.

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

## Next.js 16'ya geçiş (güvenlik)

22 Ekim 2026'da `npm audit fix` ile yama sürümlerine geçildi (next 15.5.28,
sharp 0.35.5, source-map-js 1.2.2); kritik açık dahil 4 açıktan 2'si kapandı.

- **Kalan:** `npm audit` 7 açık gösterir:
  - **2 tanesi** Next 15'in kendi içine sabitlediği eski postcss (8.4.31)
    yüzündendir; yalnızca Next 16'ya geçince kapanır. Bu açıklar saldırganın
    hazırladığı bir CSS dosyası işlenince ortaya çıkar. postcss yalnızca
    derleme sırasında projenin kendi CSS dosyalarını işler; ziyaretçiden CSS
    alınmaz.
  - **5 tanesi** kod denetimi aracının (ESLint, `eslint-config-next`)
    kullandığı `braces` paketinden gelir (çok iç içe dosya kalıbıyla
    yavaşlatma). Araç yalnızca geliştirirken ve derlemede projenin kendi
    dosyalarını denetler; siteye girmez, dışarıdan veri almaz. 22 Ekim 2026
    itibarıyla düzeltilmiş sürümü yok; çıkınca `npm update` ile alınır.
- **Risk düşük:** Yedi açığın hiçbiri ziyaretçinin gönderdiği veriyle
  tetiklenemez.
- **Karar:** Geçiş ertelendi; canlı sunucu kararıyla birlikte planlı yapılacak.
- **Nasıl:** Next'in 16 sürüm geçiş kılavuzu adım adım uygulanır (ana sürüm
  değişikliği; bazı dosya ve ayar adları değişir). Sonra typecheck, build ve
  [KABUL-KONTROL-LISTESI.md](KABUL-KONTROL-LISTESI.md) baştan uygulanır;
  `npm audit` temiz çıkmalı.

## Güvenlik başlıkları — canlıya çıkarken

Başlıklar `apps/zenweld-web/next.config.mjs`'de; ne yaptıkları
[ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9. Barındırma ve ortam
değişkenleri › Güvenlik başlıkları'nda.

**Bilerek gevşek bırakılanlar** (bugünkü yapıda başka yolu yok; canlıya
çıkarken sıkılaştırılmalı):

1. **Alt alan adları (HSTS):** Bugün yalnızca sitenin kendi adresi her zaman
   https ile açılır. `zenweld.com`'un bütün alt alan adlarının (ör. posta,
   eski uygulamalar) https çalıştığı BT ile doğrulanırsa `includeSubDomains`
   eklenir; tarayıcıların hazır listesine (`preload`) girmek ayrı bir karardır
   ve geri alınması aylar sürer.
2. **Satır içi kod izni:** Politika satır içi kodlara izin veriyor
   (`'unsafe-inline'`), çünkü sayfalar önceden üretiliyor ve Next.js sayfa
   verisini satır içi yazıyor. Kaldırmak için her isteğe özel anahtar (nonce)
   gerekir; bu da sayfaların her istekte sunucuda üretilmesi demektir. Backend
   ve barındırma kararıyla birlikte değerlendirilmeli.
3. **Görsel adresleri:** Politika her `https` adresinden görsel yüklemeye
   izin veriyor, çünkü panelde herhangi bir görsel adresi girilebiliyor.
   Görseller kendi dosya deposuna taşınınca ("Görseller ve yüklenen
   dosyalar — backend") izin yalnızca o depoya ve gerçekten kullanılan dış
   adreslere (harita döşemeleri vb.) daraltılmalı; panelde dış görsel adresi
   girme kaldırılmalı ya da yalnızca bu adreslere izin vermeli.

**Dikkat edilecekler:**

4. **Yeni dış servisler:** Ödeme kuruluşu (3D Secure sayfası), analiz kodu,
   canlı destek gibi her yeni servisin adresi politikaya eklenmeli; yoksa
   tarayıcı engeller.
5. **Vercel araç çubuğu (yorumlar):** Vercel, önizleme adreslerinde Vercel
   hesabıyla giriş yapmış ekip üyelerine sayfanın altında küçük bir araç
   çubuğu gösterir. Bununla sayfanın bir noktasına iğne gibi yorum
   bırakılabilir ve ekip yorumlara yanıt verebilir (tasarım ve metin geri
   bildirimi için). Ziyaretçiler bu çubuğu görmez. Bugün kullanılmıyor.
   Güvenlik politikası bu çubuğu engelleyebilir; site bundan etkilenmez.
   Kullanılmak istenirse Vercel'in belgesindeki adresler (`vercel.live`
   vb.) politikaya eklenir. Vercel'den ayrılınca konu kalkar.

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

## Ürün içeriği — gerçek fotoğraflar ve teknik değerler

Ekipmanlar'daki 35 ürün sahibinin listesinden (2026-10-27) girildi: ad, ürün
kodu (SAP kodu), alt grup, garanti ve seçenekler gerçektir (KARARLAR K-71,
K-72). Aşağıdakiler gerçekleri gelince değiştirilmeli: panelde Ürünler ›
ürün; örnek veride `packages/data/src/seed/products.seed.ts` ("ORNEK" ve
"TEMSILI" notları) (KARARLAR K-73).

1. **Fotoğraflar:** Bkz. [Ürün fotoğrafları](#ürün-fotoğrafları--eksikler).
2. **Ekipmanların içeriği (örnek):** Force serisi 9 üründe (ForceArc 200 /
   250 / 280, ForceMIG 125 / 185 MP / 200 / 205 DP, ForceTIG 200, ForceCut 45)
   teknik özellikler, açıklama, kutu içeriği ve öne çıkan özellikler
   sahibinin ikinci listesinden gelir (`machine-content.seed.ts`); kısa
   açıklama açıklamanın ilk cümlesidir. Bunlardan 4'ünün kısa açıklaması 160
   karakteri aşıyor (ForceMIG 125, 185 MP, 200 ve ForceCut 45); Google'da
   sonu kesilebilir, panelin SEO sekmesinden kısa bir açıklama yazılabilir
   (öneri). Diğer ekipmanlarda kısa ve uzun açıklama (seçeneklerden
   üretilen bir cümle ve lorem ipsum), teknik özellikler (yalnızca Marka,
   Ürün Kodu, Ürün Türü), kutu içeriği (ana ünite, torç, kullanım kılavuzu),
   öne çıkan özellikler (seçenekler ve garanti) ve kullanım kılavuzu
   bağlantısı (`#`, hiçbir yere gitmiyor). Amper, devrede kalma, ağırlık gibi
   teknik değerler bilerek uydurulmadı; gerçekleri girilmeli.
3. **Fiyatlar (temsili):** Ekipmanların hepsi 999.999 ₺ + KDV (KDV dahil
   1.199.998,80 ₺); seçenekler arasında fiyat farkı yok. Örnek siparişler,
   panel grafikleri, kampanyalı ürünler ve bayi stok fiyatları da bu
   fiyattan hesaplanıyor. Gerçek fiyatlar ve seçenek farkları (ör. su
   soğutma, 8 m torç) gelince girilmeli.
4. **Ara paket uzunlukları (temsili):** MIG makinelerinde 5 m ve 10 m.
   Gerçek değerler gelince Seçenek Tanımları › Ara Paket Uzunluğu ve dört
   makinenin (Ultimate 405 MTS, Ultimate 505 MTS, Evomig 405 P, Evomig 555 P)
   kombinasyonları düzeltilmeli; kodların `-AP5M`, `-AP10M` kısmı da değişir.
5. **Diğer bölümler:** Aksesuar, güvenlik ve dolgu metali ürünleri,
   kampanyalar ve örnek yorumlar hâlâ örnek veridir.
6. **Geçici kodlar:** SAP kodu verilmeyen 5 ürünün kodu geçicidir (KARARLAR
   K-75): ForceArc 250 (`ZW-GECICI-FORCEARC250`), ForceArc 280, ForceMIG 125,
   ForceMIG 185 MP, ForceMIG 205 DP. SAP kodları açılınca panelden (Ürünler ›
   ürün › Ürün Kodu) değiştirilmeli; bayi ve satıcı stok dosyaları kodla
   eşleştiği için bundan önce stok dosyalarında bu ürünler eşleşmez.

## Ürün fotoğrafları — eksikler

Ekipmanların gerçek fotoğrafları sahibinden gelir (KARARLAR K-77). Fotoğraf
`apps/zenweld-web/public/images/products/` klasörüne aşağıdaki adla yüklenir;
sonra `.webp` hali üretilir ve ürün örnek veriye bağlanır
(`packages/data/src/seed/products.seed.ts` › `MACHINE_PHOTOS`; bkz.
klasördeki `BURAYA-GORSEL-YUKLEYIN.md`). Fotoğrafı olmayan ürün ve soğutma
hali, alt kategorinin kart çizimini gösterir.

**Çeşit:** 2 = hava ve su soğutmalı hali ayrı fotoğraf; 1 = tek fotoğraf.
Ekipmanların 40 ürününden 17'sinin fotoğrafı tam; 19 üründe hiç fotoğraf yok,
4 üründe bir soğutma hali eksik. Sahibi bu fotoğrafları bulamadı; bulununca
yüklenecek (2026-10-28):

| Kategori | Model | Çeşit | Eksik | Yüklenecek dosya adı |
|---|---|:-:|---|---|
| MMA | Ultimate 255 MMA | 1 | Fotoğraf | `ultimate-255-mma.jpg` |
| MMA | ForceArc 200 MMA | 1 | Fotoğraf | `forcearc-200-mma.jpg` |
| MMA | ForceArc 250 MMA | 1 | Fotoğraf | `forcearc-250-mma.jpg` |
| MMA | ForceArc 280 MMA | 1 | Fotoğraf | `forcearc-280-mma.jpg` |
| MMA | ForceArc 400 CEL MMA | 1 | Fotoğraf | `forcearc-400-cel-mma.jpg` |
| TIG | Ultimate 405 THP | 2 | Hava | `ultimate-405-thp-hava-sogutmali.jpg` |
| TIG | ForceTIG 200 | 1 | Fotoğraf | `forcetig-200.jpg` |
| MIG | Ultimate 505 MTS | 2 | Hava | `ultimate-505-mts-hava-sogutmali.jpg` |
| MIG | Evomig 405 P | 2 | Hava | `evomig-405-p-hava-sogutmali.jpg` |
| MIG | Evomig 555 P | 2 | Hava | `evomig-555-p-hava-sogutmali.jpg` |
| MIG | Evomig 255 P | 1 | Fotoğraf | `evomig-255-p.jpg` |
| Çok Fonksiyonlu | ForceMIG 125 | 1 | Fotoğraf | `forcemig-125.jpg` |
| Çok Fonksiyonlu | ForceMIG 185 MP | 1 | Fotoğraf | `forcemig-185-mp.jpg` |
| Çok Fonksiyonlu | ForceMIG 200 | 1 | Fotoğraf | `forcemig-200.jpg` |
| Çok Fonksiyonlu | ForceMIG 205 DP | 1 | Fotoğraf | `forcemig-205-dp.jpg` |
| Plazma | ForceCut 45 | 1 | Fotoğraf | `forcecut-45.jpg` |
| Lazer Kaynak | Y300 QCW | 1 | Fotoğraf | `y300-qcw.jpg` |
| Lazer Temizleme | Jasic LS-20000F | 1 | Fotoğraf | `jasic-ls-20000f-lazer-temizleme.jpg` |
| Lazer Temizleme | Jasic LS-30000D | 1 | Fotoğraf | `jasic-ls-30000d-lazer-temizleme.jpg` |
| Lazer Temizleme | Jasic 300 W Puls | 1 | Fotoğraf | `jasic-300-w-puls-lazer-temizleme.jpg` |
| Lazer Markalama | FC-50 | 1 | Fotoğraf | `fc-50.jpg` |
| Lazer Markalama | UV-5 | 1 | Fotoğraf | `uv-5.jpg` |
| Lazer Markalama | Jasic 30 W Fiber | 1 | Fotoğraf | `jasic-30-w-fiber-lazer-markalama.jpg` |

Jasic LS-20000F için yüklenen fotoğraf yanlış çıktı (makinenin üzerinde
"LS-15000F" yazıyordu) ve sahibinin isteğiyle silindi.

Diğer bölümlerdeki (Güvenlik, Aksesuarlar, Dolgu Metalleri) 48 ürün hâlâ aynı
genel Zenweld fotoğrafını kullanıyor (`zenweld-urun.webp`).

## Jasic lazer kaynak ürünleri — sahibi ayrıntılı açıklayacak

Sahibinin 2026-10-27 listesinde (ilk ürün listesi Excel'i) Lazer Kaynak alt
grubundaki 15 Jasic satırı (6 model) henüz girilmedi (KARARLAR K-74): LS-15000F
(5 satır), LS-20000F (5), LS-30000D (2), ALS-40, LS-20000IV, LS-15000IV.
Sahibinin kararıyla sonra girilecek; belki çok sonra. Girerken netleşecekler:

1. **Seçenekler:** Listede "Tel sürme ünitesi (tel sürmesiz / dahili / harici
   tek tel / harici çift tel / harici üç tel / otomasyon)" ve "Torç tipi
   (SUP23T / SUP27S / SUP32T / SUP26AS)" yazıyor; satırlar bunların karışımı
   (ör. "tek tel sürmeli", "27S kafalı", "SUP26A otomasyon"). Hangi model
   hangi kombinasyonlarla satılıyor ve kodları ne?
2. "LS-20000F 25A Otomasyon Kafalı" satırındaki 25A, torç tipleri listesinde
   yok.
3. ALS-40, LS-20000IV ve LS-15000IV'ün tek satırı var ama seçenek yazısı da
   var; seçenekleri var mı?
4. Ad ve link: "Jasic LS-15000F Lazer Kaynak Makinesi" gibi (KARARLAR K-08
   eki, K-71). Lazer Temizleme'deki Jasic LS-20000F / LS-30000D ile
   karışmasın diye link `jasic-ls-20000f-lazer-kaynak` gibi olmalı.
5. **Fotoğraf:** 2026-10-28'de Lazer Temizleme'deki LS-20000F için yüklenip
   silinen fotoğrafta "LS-15000F" yazıyordu; LS-15000F lazer kaynak
   makinesinin fotoğrafı olabilir. Ürün girilirken sahibinden yeniden
   istenmeli.

## Sitenin tasarımı — sahibi yapacak

Tasarım (renk, yerleşim, yazı tipi, efektler) sahibi tarafından sonra
yapılacak; bugünkü görünüm geçicidir. Tasarım yapılırken:

1. Bütün özellikler, sayfa adresleri ve metinler korunmalı; yalnızca görünüm
   değişmeli (davranış: WEBSITE-KULLANIM ve ADMIN-KULLANIM).
2. Tasarımdan sonra tarayıcı testleri (`npm run test:e2e`) ve kabul kontrol
   listesi çalıştırılmalı. Testler bazı form alanlarını ekrandaki sırasıyla
   seçiyor (Üye Ol, Teklif Al); formların yapısı değişirse testler de
   güncellenmeli.
3. Renk karşıtlığı bu aşamada ele alınacak ("Erişilebilirlik (A4)" 5).
4. Tasarım öncesi kodun yedeği GitHub'da `yedek/2026-10-22-tasarim-oncesi`
   dalında.

## Online satış — canlıya çıkmadan önce

Sitedeki sepet, ödeme ve sipariş akışı şu an demo (tarayıcıda). Canlı için:

1. **Ödeme kuruluşu** (iyzico, PayTR veya bankanın sanal POS'u): 3D Secure,
   kartın BIN'ine göre gerçek taksit oranları, iade/iptal. Kart bilgisi hiçbir
   zaman bizim sunucumuza gelmemeli (kuruluşun ödeme formu kullanılmalı).
   Mağaza Ayarları → Kartla Taksit'teki banka POS'ları gerçek sanal POS'larla
   eşleştirilmeli; POS'ların API anahtarları ve şifreleri yalnızca sunucuda
   saklanmalı, panelde/tarayıcıda tutulmamalı. Kuruluşun ödeme/3D Secure
   sayfasının adresi sitenin güvenlik politikasına (CSP) eklenmeli
   (`frame-src` ya da `form-action`).
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

## İade talebi — kurumsal üyeler ve backend

1. **Kurumsal üyeler için sor, öğren:** İade talebi düğmesi bugün yalnızca
   bireysel üyede (KARARLAR K-65). Kurumsal (ticari) alıcılara cayma
   hakkının uygulanıp uygulanmayacağı hukukçuya ve müdüre sorulup
   öğrenilmeli ("Online satış" 3'teki açık soruyla aynı konu). Uygulanacaksa
   `packages/data/src/returns.ts` › `canRequestReturn` içindeki rol kontrolü
   kaldırılır.
2. **Sunucu:** Talep sunucuda açılmalı; süre, adet ve siparişin sahibi
   sunucuda denetlenmeli. Bugün tarayıcıda.
3. **Ürünün geri gönderilmesi:** Müşteriye kargo kodu ya da gönderim adresi
   verilmesi, ürün depoya ulaşınca kontrol edilmesi süreci tanımlanmalı.
4. **Para iadesi:** Ödeme kuruluşunun iade işlemi bağlanırsa onaylanan
   talepten iade başlatılabilir ([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) ›
   Kartla ödeme 7).

## Veritabanı — bütün kayıtlar (backend)

Bugün bütün kayıtlar (ürünler, siparişler, üyeler, teklifler, ayarlar…)
ziyaretçinin tarayıcısında duruyor (`zenweld.db.v1`). Her tarayıcı kendi
kopyasını görür; panelde yapılan değişiklik müşteriye ulaşmaz.

1. Bütün kayıt türleri sunucu veritabanına taşınmalı. Kayıt türleri, alanlar,
   ilişkiler ve silme kuralları: [VERI-MODELI.md](VERI-MODELI.md).
2. Okuma ve yazma tek yerde toplanmış (`packages/store/src/database.ts`); bu
   katman ve `packages/store/src/repo/` fonksiyonları sunucu API'sine
   bağlanmalı.
3. `DB_VERSION` ile tarayıcı verisini sıfırlama yerine veritabanı geçişleri
   (migration) kullanılmalı.
4. Örnek veri (`packages/data/src/seed/`) yalnızca ilk kurulumda yüklenmeli;
   örnek satış hareketleri hiç yüklenmemeli (bkz. "Online satış" 11).
5. Tarayıcıda yalnızca ziyaretçiye ait küçük veriler kalır (sepet, teklif
   listesi, çerez tercihi); hangisinin nereye taşınacağı:
   [VERI-MODELI.md](VERI-MODELI.md) › Tarayıcıda tutulanlar.

## Üyelik, oturum ve şifre — backend

1. **Kimlik doğrulama ve yetki sunucuda yapılmalı.** Bugün şifre tarayıcıda
   basit bir özetle karşılaştırılıyor (`packages/auth/src/hash.ts`) ve
   oturum tarayıcıda tutuluyor. Şifreler güçlü bir özetle (bcrypt, argon2)
   saklanmalı; oturum sunucuda tutulmalı (ör. httpOnly çerez); yönetim
   paneli sayfaları ve panel işlemleri sunucuda yönetici rolüyle korunmalı.
2. **Şifre sıfırlama:** "Şifremi unuttum" bugün yalnızca mesaj gösteriyor,
   e-posta gitmiyor. Tek kullanımlık ve süreli bir bağlantı e-postayla
   gönderilmeli.
3. **Favoriler üyeye bağlanmalı:** Bugün tarayıcıda (`zenweld.favourites.v1`);
   üye başka cihazda giriş yapınca favorilerini görmüyor.
4. **Şifre değiştirme ve hesap silme sunucuda yapılmalı:** Bugün tarayıcıda
   (`changePassword`, `deleteAccount`). Şifre değişince üyenin diğer
   cihazlardaki oturumları kapanmalı.
5. **Hesap silinince kalan veriler:** "Hesap silme — açık konular" bölümü.

## Hesap silme — açık konular (KVKK ve yasal saklama)

Bugün üye Hesabım › Profil › **Hesabımı Sil**'den hesabını silebiliyor
(seçenek 2a, KARARLAR K-68): hesap ve adresleri siliniyor, diğer kayıtları
kalıyor (panelden silmeyle aynı). Önerilen diğer yol (2b) aşağıda 10'da. Bu kural
demoda yeterli; canlıya çıkmadan şunlar hukukçu ve mali müşavirle
netleşmeli:

1. **Yasal saklama süresi:** Sipariş ve fatura kayıtları vergi ve ticaret
   mevzuatı gereği yıllarca saklanmalı (süreler mali müşavirle
   netleşmeli). KVKK'ya göre bu süre boyunca yalnızca gereken bilgi tutulur;
   süre dolunca silinir ya da anonimleştirilir. Sitedeki "Kişisel Veri
   Saklama ve İmha Politikası" metni buna göre yazılmalı.
2. **Diğer kayıtlardaki kişisel veriler:** Teklif, servis talebi, iade
   talebi, garanti kaydı ve yorumdaki ad, e-posta ve telefon silinsin mi,
   anonimleştirilsin mi, kalsın mı?
3. **Yorumlar:** Sitede yazarın adıyla görünüyor. Hesap silinince ad
   gizlensin mi (ör. "Silinmiş üye")?
4. **Garanti:** Kayıt e-postaya ve seri numarasına bağlı; hesap silinse de
   ürünün garantisi sürer. Garanti verisi silinirse müşteri garanti hakkını
   kanıtlamakta zorlanabilir.
5. **Açık işler varken silme:** Hazırlanan ya da kargodaki sipariş, açık
   iade talebi varken de hesap silinebiliyor; müşteri bunları artık
   göremez. Silme engellensin mi, uyarı mı verilsin?
6. **Aynı e-postayla yeniden üye olma:** Bugün mümkün. Eski siparişler,
   teklifler ve iade talepleri yeni hesaba bağlanmıyor (üye kimliğine
   bağlılar); garanti kayıtları ise e-postayla eşleştiği için yeniden
   görünüyor. Hangisinin doğru olduğu kararlaştırılmalı.
7. **Bülten izni ve İYS:** Hesapla birlikte bülten izni de siliniyor; İYS
   bağlanınca ret kaydı gönderilmeli ("Bülten ve İYS").
8. **Başka yerlerdeki kopyalar:** Sunucu yedekleri, info@zenweld.com'a gelen
   form e-postaları, muhasebe ve e-arşiv yazılımı için de imha süreci
   tanımlanmalı.
9. **İz kaydı ve bildirim:** Silmenin kim tarafından ve ne zaman yapıldığı
   bugün hiçbir yerde kalmıyor; Zenweld'e de bildirim gitmiyor. KVKK
   başvurularına yanıt verebilmek için kayıt tutulmalı.
10. **KVKK başvuru formu (2b) — ileride düşünülecek:** 2a (Hesabımı Sil)
    seçildi; 2b ileride düşünülecek (sahibin kararı, 2026-10-27).
    - **Nedir:** Hesabım'da "Verilerimle ilgili başvuru" formu. Üye başvuru
      gönderir, başvuru info@zenweld.com'a gider, gereğini yönetici yapar.
    - **2a'dan farkı:** Silmenin yanında KVKK'daki diğer hakları da (verilerini
      öğrenme, düzeltme, itiraz) kapsar; neyin silinip neyin saklanacağına
      (1–8) bir insan başvuru başvuru karar verir. 2a ile birlikte
      kullanılabilir; birbirinin yerine geçmez.
    - **Dikkat:** Başvurulara en geç 30 gün içinde yanıt verilmeli. Form
      yapılana kadar başvuru yolu (e-posta ya da yazılı) KVKK Aydınlatma
      Metni'nde yazmalı.

## Müşteriye e-posta bildirimleri (sipariş dışı) — backend

Bugün müşteriye hiç e-posta gitmiyor; formlar yalnızca info@zenweld.com'a
e-posta gönderiyor. Sipariş bildirimleri "Online satış" 6'da. Ayrıca:

1. Teklif talebinin durumu panelde değişince (İnceleniyor, Teklif Gönderildi…).
2. Servis talebinin durumu değişince.
3. Garanti kaydı alındığında ve panelde bitiş tarihi değişince.
4. İade talebinin durumu panelde değişince (İnceleniyor, Onaylandı,
   Reddedildi).

Hangi bildirimlerin gönderileceği ve metinleri kararlaştırılmalı.

## Görseller ve yüklenen dosyalar — backend

Panelden yüklenen görseller (ürün, kategori ve grup kartı, haber, blog,
etkinlik, Hakkımızda, satış temsilcisi) ve yorumlardaki fotoğraf ve videolar
bugün veritabanının içine metin olarak (`data:` ile başlayan) yazılıyor.

1. Dosyalar bir nesne deposuna (S3 uyumlu) yüklenmeli; kayıtta yalnızca
   adres kalmalı.
2. Yükleme sunucuda tür ve boyut kontrolünden geçmeli.
3. Belgeler (MSDS, sertifikalar) için ayrı bölüm: "Belgeler — backend".

## Bülten ve İYS

Alt bilgideki bülten kaydı bugün hiçbir yere gönderilmiyor ve saklanmıyor.
Üye olurken işaretlenen "haber ve kampanya e-postaları" izni yalnızca üye
kaydında duruyor (`newsletter` alanı). Hangi bülten servisinin kullanılacağı
karar bekliyor ([KARARLAR.md](KARARLAR.md) › Henüz karar verilmemiş konular).

1. Servis seçilince bülten kayıtları ve üyelerin izinleri bu servise
   gönderilmeli.
2. Ticari ileti izinleri İYS'ye (İleti Yönetim Sistemi) bildirilmeli.
3. Her e-postada abonelikten çıkma bağlantısı olmalı; çıkış İYS'ye de
   yansımalı.

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
`/api/bayilik`, `/api/destek`; liste: ADMIN-KULLANIM.md › "Siteden panele gelenler").
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
3. Tarayıcı deposu dolunca değişiklik uygulanmıyor; yönetim paneli ve yorum
   formu uyarıyor, sitedeki diğer formlar (teklif, servis, garanti, üyelik) uyarmıyor
4. Arama dizini her sayfa açılışında kuruluyor
5. Her değişiklikte tüm veritabanı (≈545 KB) yeniden yazılıyor
6. Görsellerde `width`/`height` yok (sayfa kayması — CLS)
7. 8 dosyada hâlâ Lorem ipsum yer tutucu metin var: anasayfa, ürün sayfası,
   Welders Club, Teklif Al formu, Adreslerim, `tr.ts` ve örnek veriler
8. Otomatik kontrol (CI) yok; iş kuralları testleri (`npm test`) ve
   tarayıcı testleri (`npm run test:e2e`) var, elle çalıştırılıyor
9. Ürün formunda `isNew` ad karışıklığı; form etiketleri alanlara bağlı değil

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
6. **Boş teklif listesi mesajı** (`quote.emptyList`)
   - Şimdi: "Teklif listeniz boş. Ürün sayfalarından ürün ekleyebilirsiniz."
   - Ürün sayfasında teklif düğmesi olmayacak (karar verildi); ürünler yalnızca
     Teklif Al sayfasındaki listeden eklenir. Bu yüzden metin değişmeli.
   - Öneri: "Teklif listeniz boş. Aşağıdaki listeden ürün ekleyebilirsiniz."

Açık soru: vadeli ödeme ve çek bireysel müşterilere de açık mı? Formda bu iki
seçenek bugün herkese görünüyor. Yalnızca firmalar içinse formda yalnızca
kurumsal üyelere gösterilmeli; herkese açıksa metinlerdeki "Firmalara"
ifadesi çıkarılmalı.

## Ürün Seçici ve arama — en son yeniden tasarlanacak

**Sahibin kararı (2026-10-27, KARARLAR K-69):** Ürün Seçici bütün ürünler
kesinleşince, en son ele alınacak. Bugün ürünlerin tamamı kesin olmadığı için
sağlıklı sonuç vermiyor; şu anki sonuçları önemli değil, ona göre ayar
yapılmaz. O zaman karar verilecekler:

1. Hangi soruların sorulacağı ve her sorunun seçenekleri.
2. Süzme (eşleştirme) mantığı: hangi cevabın hangi ürünleri getireceği.
3. Lazer makinelerinin (lazer kaynak, temizleme, markalama) Ürün Seçici'de
   nasıl yer alacağı; bugünkü sorular (çelik, paslanmaz, alüminyum, kesim)
   lazer makinelerine uymuyor.
4. Bu bilgilerin ürünlere panelden mi girileceği.

**Kaynak yöntemi ve elektrik bilgisi:** Ürün Seçici bugün bu iki bilgiye
bakıyor (1. adım malzeme → ürünün kaynak yöntemleri, 3. adım elektrik →
teknik özelliklerde "3 faz"). 2026-10-28'de girilen gerçek ekipmanlara bu
bilgiler bilerek girilmedi (KARARLAR K-73); bu yüzden Ürün Seçici şu an
sonuç vermiyor. Ürün Seçici kurulurken ürünlere eklenecek. Force serisi 9
üründe bu bilgiler teknik özelliklerde yazılı ("Kaynak yöntemi", "Giriş
gerilimi"); oradan alınabilir.

Bugünkü durum: Kaynak yöntemi etiketleri (MIG, TIG, MMA…) ürün formundan, ürün kartından ve
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
   Kart Görseli) değiştirilmeli. Lazer Aksesuarları grubunun ve 5
   kategorisinin kart görseli yok (markalı yer tutucu görünür).
3. **Lazer Aksesuarları** (Aksesuarlar'ın ilk grubu, KARARLAR K-05 eki): 5
   kategorinin ürünleri sahibinden gelince girilecek; bugün kategoriler
   boş ("Bu kategoriye henüz ürün eklenmedi.").
2. Grup ve kategorilerin tanıtım metinleri (sayfanın altındaki "… Hakkında")
   ve SEO alanları panelden yazılmalı; şu an hepsi boş.

## Ürün önerileri — ürün sayfasındaki "İlgili Ürünler" yeniden kurgulanacak

Şu anki durum: aynı kategorideki ilk 4 ürün gösteriliyor, sıralama yok. Tek
ürünlü kategoride bölüm hiç çıkmıyor (ör. Y300 QCW Lazer Kaynak Makinesi, Pro
Kaynak Eldiveni).
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
