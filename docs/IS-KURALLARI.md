# İş Kuralları — Hesaplar ve Kurallar

Bu dosya sitenin ve panelin hesaplarını ve kurallarını anlatır: fiyat ve
KDV, kampanya, seçenekli ürün, sepet ve kargo, kartla ödeme ve taksit,
havale süresi, sipariş ve teklif durumları, iade talebi, garanti, stok,
ürün kodları, linkler, yorumlar, üyelik, form e-postaları, kategori
filtreleri, Zenweld depo stoğu, kuponlar, panelde kayıt düzenleme ve
yüklenen dosyalar. Ekranların tarifi bu dosyada yoktur; yalnızca kurallar
vardır.

İlgili dosyalar:

- Ekranlar: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md),
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md)
- Kayıtlar, alanlar ve tablolar: [VERITABANI.md](VERITABANI.md)
- Bayi ve satıcı stok dosyasının biçimi: [STOK.md](STOK.md)
- Sunucu, ödeme kuruluşu, e-posta ve harita servisleri:
  [SUNUCU.md](SUNUCU.md)

Her bölüm bir **Kısaca** özetiyle başlar; ayrıntı ve örnekler altındadır.
Kuralların koddaki yeri her bölümün sonunda yazar. Bir kural değişirse
yalnızca o yer değişmeli; site, panel ve sipariş kaydı aynı yeri kullanır.

Fiyat, kampanya, seçenek, sepet, kart ve taksit, havale süresi, garanti,
stok, ürün kodu, kategori filtresi ve kupon kuralları ile bu dosyadaki örnekler `tests/unit`
altında otomatik denenir (`npm test`). Kural değişince test de değişir.

---

## İçindekiler

1. [Fiyat ve KDV](#1-fiyat-ve-kdv)
2. [Kampanya (indirim)](#2-kampanya-indirim)
3. [Seçenekli ürün](#3-seçenekli-ürün)
4. [Sepet ve kargo](#4-sepet-ve-kargo)
5. [Kartla ödeme, taksit ve banka komisyonu](#5-kartla-ödeme-taksit-ve-banka-komisyonu)
6. [Havale / EFT](#6-havale--eft)
7. [Sipariş durumları](#7-sipariş-durumları)
8. [Teklif](#8-teklif)
9. [Servis talebi](#9-servis-talebi)
10. [Garanti](#10-garanti)
11. [Bayi ve online satıcı stoğu](#11-bayi-ve-online-satıcı-stoğu)
12. [Ürün kodları](#12-ürün-kodları)
13. [Linkler, yönlendirme ve arama motorları](#13-linkler-yönlendirme-ve-arama-motorları)
14. [Yayında olma](#14-yayında-olma)
15. [Ürün yorumları](#15-ürün-yorumları)
16. [Üyelik ve oturum](#16-üyelik-ve-oturum)
17. [Kayıt numaraları](#17-kayıt-numaraları)
18. [Form e-postaları](#18-form-e-postaları)
19. [Kategori filtreleri](#19-kategori-filtreleri)
20. [Zenweld depo stoğu](#20-zenweld-depo-stoğu)
21. [Kuponlar](#21-kuponlar)
22. [Panelde kayıt düzenleme](#22-panelde-kayıt-düzenleme)
23. [Yüklenen dosyalar](#23-yüklenen-dosyalar)
24. [Panel listeleri: sayfalama ve arama](#24-panel-listeleri-sayfalama-ve-arama)

---

## 1. Fiyat ve KDV

**Kısaca:** Fiyat KDV hariç saklanır; müşteriye KDV dahil, tam liraya
yuvarlanmış gösterilir.

- Üründe **normal fiyat KDV hariç** saklanır (`priceExVat`). Panelde girilen
  budur.
- KDV oranı ürün başınadır (`vatRate`, ör. %20).
- **KDV dahil fiyat** = KDV hariç × (1 + KDV oranı / 100), **tam liraya
  yuvarlanır.**
- Müşteriye gösterilen her fiyat, kampanya uygulanmış KDV hariç fiyattan
  hesaplanır (bkz. [2](#2-kampanya-indirim)). Normal fiyat doğrudan
  gösterilirse kampanya gözden kaçar.
- Sitede fiyatlar KDV dahil gösterilir; ürün sayfasında altında "<tutar> KDV
  Hariç · KDV %<oran>" da yazar.
- Bütün tutarlar Türk lirasıdır.

**Örnek:** KDV hariç 1.000 ₺, KDV %20 → KDV dahil 1.200 ₺.

Kod: `packages/utils/src/format.ts` › `priceWithVat`.

---

## 2. Kampanya (indirim)

**Kısaca:** Üründe bir indirim oranı ve isteğe bağlı başlangıç/bitiş olur;
zamanı gelince fiyat kendiliğinden değişir. %25 ve üzeri "Flaş İndirim"dir.

**Kayıt:** Üründe bir kampanya olur: oran (%), isteğe bağlı başlangıç ve
bitiş.

**Kurallar:**

- Oran **1 ile 90 arasında tam sayı** olmalıdır.
- Bitiş, başlangıçtan sonra olmalıdır.
- Başlangıç boşsa kampanya hemen başlar; bitiş boşsa süresizdir.
- Normal fiyat üründe kalır; indirim yalnızca kampanya süresi içinde
  uygulanır. Başlangıç ve bitiş saati gelince fiyat **kendiliğinden**
  değişir, ürünü elle düzenlemeye gerek yoktur.

**Kampanyanın durumu:**

| Durum | Ne zaman |
|---|---|
| Yok | Kampanya kaydı yok ya da oran 0 |
| Planlandı | Başlangıç henüz gelmedi |
| Geçerli | Başlangıç geçti (ya da yok) ve bitiş gelmedi (ya da yok) |
| Bitti | Bitiş geçti |

**Hesap:**

- Kampanya fiyatı (KDV hariç) = normal fiyat × (1 − oran / 100), **tam
  liraya yuvarlanır.**
- Sonra KDV eklenir ve yine tam liraya yuvarlanır.

**Örnek:** Normal 1.000 ₺ + KDV, kampanya %15 → 850 ₺ + KDV → KDV dahil
1.020 ₺ (normal KDV dahil 1.200 ₺ üstü çizili gösterilir).

**Görünüm kuralları:**

- **Flaş İndirim:** Oran **%25 ve üzerindeyse** "Flaş İndirim" olarak
  gösterilir (eşik `FLASH_DISCOUNT_THRESHOLD`).
- **Anasayfadaki indirimli ürünler bölümü:** Kampanyası geçerli olan ürünler
  kendiliğinden girer, kampanya bitince çıkar. Ayrıca işaretlemeye gerek
  yoktur.
- **Google'a giden fiyat:** Ürün sayfasının yapısal verisinde kampanyalı
  KDV dahil fiyat yazar; kampanyanın bitişi varsa "şu tarihe kadar geçerli"
  olarak bildirilir.

Kod: `packages/data/src/discount.ts`.

---

## 3. Seçenekli ürün

**Kısaca:** Bir ürün en fazla 3 seçenekle satılır. Seçilen kombinasyon
(varyant) fiyatı, kodu, fotoğrafı ve stoktaki satıcıları değiştirir;
yorumlar değişmez.

Bir ürün tek sayfada seçenekleriyle satılabilir (ör. Soğutma: Hava / Su ve
Torç Uzunluğu: 4 m / 8 m). Satılan her kombinasyon (ör. Su Soğutmalı · 8 m)
bir **varyanttır** (KARARLAR K-70).

**Kurallar:**

- Bir üründe **en fazla 3 seçenek** olur.
- Seçenek adları ve değerleri ortak [Seçenek Tanımları](ADMIN-KULLANIM.md#9-seçenek-tanımları)'ndan
  gelir; adların ve değerlerin sırası tanımdan, seçeneklerin sayfadaki sırası
  üründen okunur.
- Varyantın her seçenekten bir değeri olur; aynı kombinasyon bir üründe iki
  kez olamaz. Satılmayan kombinasyonun varyantı yoktur.
- Her varyantın kodu zorunludur (bkz. [12](#12-ürün-kodları)).
- Ürüne ancak ürünün kategorisinde işaretli tanımlar eklenebilir. Kategoride
  işaretin kaldırılması o kategorideki ürünlerin mevcut seçeneklerini
  değiştirmez.
- Bir üründe kullanılan tanım ya da değer silinemez.

**Seçim yapılınca değişenler:**

| Bilgi | Kural |
|---|---|
| Fiyat | Normal fiyat = ürünün fiyatı + varyantın fiyat farkı (KDV hariç; eksi olabilir, toplam eksiye düşemez). Kampanya varsa **aynı oran** bu fiyata uygulanır |
| Ürün kodu | Varyantın kodu |
| Teknik özellikler | Ürünün koduyla yazılmış satır varyantın koduna döner; her seçenek için "<Seçenek>: <değer>" satırı eklenir; varyantın farklı satırları aynı adlı satırın yerine geçer, yoksa sona eklenir |
| Kutu içeriği | Varyantın ayrı listesi varsa o, yoksa ürününki |
| Fotoğraf | Varyantın fotoğrafı varsa o, yoksa ürünün fotoğrafları |
| Stoktaki bayiler ve online satıcılar | Yalnızca o varyantı stokta tutanlar (bkz. [11](#11-bayi-ve-online-satıcı-stoğu)) |
| Yorumlar | **Değişmez**; bütün varyantlar aynı yorumları paylaşır |

**Örnek:** Ürün 1.000 ₺ + KDV, 5 m seçeneği +200 ₺, kampanya %15 → 1.200 ×
0,85 = 1.020 ₺ + KDV → KDV dahil 1.224 ₺.

**Seçim:**

- Bir seçenekte değer seçilince diğer seçeneklerdeki seçim korunur. O
  kombinasyon satılmıyorsa o değeri içeren ilk varyanta geçilir (diğer
  seçenekler ona göre değişir).
- Diğer seçeneklerdeki seçimle satılmayan değer soluk görünür ama seçilebilir.
- Varyantlar önce birinci seçeneğin, sonra ikincisinin tanımdaki değer
  sırasıyla dizilir; "ilk varyant" bu sıradaki ilktir.
- Kombinasyonun **kısa adı** (Teklif Al listesi, Stoktaki Bayileri Gör
  başlığı, panelde kombinasyon kartı, stok ekranları ve stok şablonu)
  değerlerden oluşur: "Su Soğutmalı · 8 m". Aynı birimle biten değerlerin
  (iki uzunluk) önüne seçenek adı yazılır: "Hava Soğutmalı · Torç Uzunluğu
  3 m · Ara Paket Uzunluğu 5 m". Sepette ve siparişte uzun ad yazar
  ("Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m").

**Örnek:** Soğutma × Torç Uzunluğu'nda Hava · 4 m, Hava · 8 m ve Su · 8 m
satılıyor (Su · 4 m yok). Hava · 4 m seçiliyken Su seçilince Su · 8 m'ye
geçilir; bu sırada 4 m soluk görünür.

**Adres:**

- Seçim adrese yazılır: `/urun/<ürün>?secenek=<varyant>` (ör.
  `?secenek=su-sogutmali_8-m`; tek seçenekte değerin kimliği, `?secenek=5-m`).
  Bu adres sayfayı o varyantla açar.
- Seçim yoksa ya da adresteki varyant artık yoksa ilk varyant seçili gelir.
- Arama motoruna sayfa tek adresle (seçeneksiz) bildirilir.

**Sepet ve teklif listesi:**

- Aynı ürünün farklı varyantları ayrı satırdır; satırda bütün seçenekler
  yazar ("Soğutma: Su Soğutmalı · Torç Uzunluğu: 8 m").
- Sepette ya da teklif listesinde duran varyant üründen kaldırılırsa o satır
  **gösterilmez** (başka bir varyant yerine sessizce satılmasın diye).

Kod: `apps/zenweld-web/src/lib/variants.ts`, `packages/data/src/variants.ts`.

---

## 4. Sepet ve kargo

**Kısaca:** Toplam = ürünler − kupon + kargo. Kupon düşüldükten sonraki
tutar ücretsiz kargo sınırına ulaşırsa kargo ücretsizdir. Veritabanı modunda
sunucu tutarı siparişte yeniden hesaplar.

**Satır:**

- Birim fiyat (KDV hariç) = kampanya uygulanmış fiyat ([1](#1-fiyat-ve-kdv),
  [2](#2-kampanya-indirim), [3](#3-seçenekli-ürün)).
- Birim fiyat (KDV dahil) = birim KDV hariç + KDV, tam liraya yuvarlanmış.
- Satır tutarı = birim × adet (KDV dahil ve hariç ayrı ayrı).
- Adet **1 ile 99** arasındadır; dışındaki değer bu sınıra çekilir. Aynı ürün
  ve seçenek tekrar eklenirse adet artar.
- Sepette fiyat saklanmaz; her açılışta ürünün güncel fiyatından
  hesaplanır. Bu yüzden kampanya sepette beklerken başlar ya da biterse
  fiyat da değişir.
- Yayından kalkan ürünün satırı gösterilmez.

**Toplamlar (hepsi KDV dahil):**

- **Ara toplam** = satır tutarlarının toplamı.
- **İçindeki KDV** = her satırda (KDV dahil − KDV hariç) toplamı; bilgi
  amaçlıdır.
- **Kupon** (varsa): ara toplamdan düşülür ([21](#21-kuponlar)). KDV,
  kupondan sonraki tutarın KDV'sidir.
- **Kargo:**
  - Ara toplam − kupon, **ücretsiz kargo sınırına** eşit ya da büyükse 0.
  - Sepet boşsa 0.
  - Aksi halde Mağaza Ayarları'ndaki kargo ücreti. Kupon kargo ücretine
    uygulanmaz.
- **Ücretsiz kargoya kalan** = sınır − (ara toplam − kupon) (sınır aşıldıysa 0).
- **Toplam** = ara toplam − kupon + kargo.
- Kartla taksitte vade farkı bu toplamın üstüne eklenir (bkz.
  [5](#5-kartla-ödeme-taksit-ve-banka-komisyonu)).

**Örnek:** Sınır 5.000 ₺, kargo 250 ₺. Ara toplam 4.800 ₺ → toplam 5.050 ₺,
"ücretsiz kargoya 200 ₺ kaldı". Ara toplam 5.000 ₺ → kargo ücretsiz.

Aynı hesap sepet sayfası, ödeme sayfası ve sipariş kaydında kullanılır;
müşterinin gördüğü tutar ile kaydedilen tutar hep aynıdır.

**Sipariş anında sunucuda yeniden hesap** (veritabanı modu,
KARARLAR K-97):

- Tarayıcı yalnızca sepetteki ürün, seçenek ve adedi, kupon kodunu, adres
  ve fatura bilgisini, ödeme yöntemini ve taksit sayısını gönderir. Satır
  fiyatları, kupon, kargo, vade farkı ve toplam sunucuda, veritabanındaki
  güncel ürün, ayar ve POS bilgisiyle aynı kurallardan yeniden hesaplanır.
- Müşterinin ödeme sayfasında gördüğü tutar sunucunun hesabıyla tutmazsa
  sipariş alınmaz: "Fiyatlar güncellendi; ödenecek tutar artık <tutar>.
  Sepetinizi kontrol edip yeniden deneyin."
  - **Örnek:** Müşteri sayfayı 2.650 ₺ ile açtı; bu arada ürünün fiyatı
    arttı. "Öde"ye basınca sipariş alınmaz ve yeni tutar söylenir.
- Sepetteki bir ürün satıştan kalktıysa ya da seçeneği silindiyse:
  "Sepetinizdeki bazı ürünler değişti ya da artık satışta değil." Stoğu
  bittiyse stokta olmayan ürün mesajı ([20](#20-zenweld-depo-stoğu)).
- Sayfadaki fiyatlar önbellekten gelir (en geç 30+30 sn eski olabilir,
  K-88); sunucu siparişte her zaman güncel fiyatı kullanır.

Kod: `packages/data/src/cart.ts` (`priceCartLines`),
`packages/data/src/checkout.ts` › `cartTotals`,
`apps/zenweld-web/src/lib/cart.tsx`; sunucu: `packages/db/src/orders.ts`
(`placeOrder`).

---

## 5. Kartla ödeme, taksit ve banka komisyonu

**Kısaca:** Kart, programı eşleşen bankanın POS'undan onun taksitleriyle
çekilir; eşleşmeyen kart tek çekim ödenir. Vade farkı toplamın üstüne
eklenir. Kart bilgisi saklanmaz; bugün ödeme temsilidir.

**Kart kontrolleri** (ödeme sayfasında):

- Kart numarası 15–19 hane ve Luhn kontrolünden geçmeli.
- Son kullanma AA/YY; kart son kullanma **ayının sonuna kadar** geçerlidir.
- CVC 3 ya da 4 hane.
- Kart markası numaranın başından anlaşılır: 4 → Visa; 51–55 ya da 22–27 →
  Mastercard; 9792 → Troy; 34 ya da 37 → American Express.

**Kart programı:**

- Taksit, kartın **programına** (Bonus, World, Maximum, Axess, CardFinans,
  Paraf, Advantage, BankkartCombo) göre yapılır.
- **Not (iki modda da):** Program bugün kartın ilk 6 hanesinden sabit bir
  kuralla seçilir; ödeme kuruluşu bağlanınca onun kart (BIN) sorgusundan
  gelecek.
- **Ödeme sağlayıcısı (veritabanı modu, KARARLAR K-108):** Sunucuda kartın
  programını ve tahsilatı ödeme sağlayıcısı verir. Bugünkü sağlayıcı
  temsilidir (yukarıdaki sabit kural; para çekilmez, K-97). Sağlayıcı
  tahsilatı reddederse sipariş alınmaz, sipariş numarası verilmez ve
  sağlayıcının nedeni ödeme sayfasında gösterilir (ör. "Kart limiti
  yetersiz.").

**Kartın çekileceği POS (banka):**

1. Programı kartın programıyla eşleşen **ilk aktif** POS. Listedeki sıra
   önceliktir; aynı programda alttaki POS kullanılmaz.
2. Eşleşen yoksa (ya da program bilinmiyorsa) **varsayılan** aktif POS;
   bu durumda yalnızca **tek çekim** yapılır.
3. Varsayılan aktif POS da yoksa kartla ödeme alınamaz: "Bu kartla şu an
   ödeme alınamıyor. Havale / EFT ile ödeyebilirsiniz."

**Sunulan taksitler:**

- **Tek çekim** her zaman ilk seçenektir.
- Eşleşen POS'ta "sunulsun" işaretli taksitler (2, 3, 6, 9, 12) küçükten
  büyüğe eklenir.
- Toplam, **taksit için en düşük tutarın** altındaysa yalnızca tek çekim
  sunulur.

**Vade farkı:**

- Vade farkı = toplam (kupon düşülmüş, kargo dahil) × taksitin vade farkı
  oranı / 100, **tam liraya yuvarlanır.**
- Ödenecek tutar = toplam + vade farkı.
- Aylık taksit = ödenecek tutar / taksit sayısı (yalnızca gösterim).
- Oran %0 ise müşteri peşin fiyatına taksit yapar; komisyonu Zenweld öder.

**Örnek:** Toplam 10.000 ₺, 6 taksit, vade farkı %4,5 → vade farkı 450 ₺,
ödenecek 10.450 ₺, ayda 1.741,67 ₺.

**Banka komisyonu (yalnızca panelde):**

- POS'un "firma taksit oranları", bankanın her çekimde Zenweld'den kestiği
  komisyondur (tek çekim dahil). Müşteriye gösterilmez.
- Siparişe, **sipariş anındaki** oran kopyalanır.
- Panelde tahmini komisyon = siparişin toplamı (vade farkı dahil) × oran /
  100 (tam liraya yuvarlanır); tahmini net tahsilat = toplam − komisyon.
  Kesin tutar banka ekstresindedir.

**Saklanan kart bilgisi:** Yalnızca marka, program, son 4 hane, taksit
sayısı, POS adı ve komisyon oranı. Tam kart numarası, son kullanma ve CVC
**hiçbir yerde saklanmaz**, e-postaya yazılmaz. Veritabanı modunda sunucuya
kartın yalnızca **ilk 6 ve son 4 hanesi** gider; program, marka, POS ve
taksit sunucuda yeniden bulunur. Seçilen taksit artık sunulmuyorsa sipariş
alınmaz: "Seçtiğiniz taksit artık sunulmuyor."

**Temsili ödeme (K-97):** Kartla ödemede 1,5 saniyelik "3D Secure
doğrulanıyor…" beklemesinden sonra ödeme onaylanmış sayılır; para çekilmez.
Veritabanı modunda da gerçek POS bağlanana kadar böyledir: sipariş
"Hazırlanıyor" ve ödeme anıyla kaydedilir. Canlıya gerçek ödeme
bağlanmadan çıkılmaz.

Kod: `packages/data/src/checkout.ts` (`posForCard`, `cardInstallments`,
`installmentQuote`), `packages/data/src/payment.ts` (`cardBrand`,
`cardProgram`), `apps/zenweld-web/src/lib/payment.ts`.

---

## 6. Havale / EFT

**Kısaca:** Havale siparişi ödeme bekler; süre son ödeme gününün 23:59'unda
(Türkiye saati) dolar, dolunca sipariş iptal olur.

- Havaleyle verilen sipariş **Ödeme Bekleniyor** durumunda açılır.
- **Son ödeme** = sipariş anı + Mağaza Ayarları'ndaki gün sayısı (örnek
  değer 3 gün).
- Süre son ödeme **gününün sonunda** (Türkiye saatiyle 23:59:59) dolar.
  Sunucu UTC'de çalışsa da gün sonu Türkiye saatine göredir.
  - **Örnek:** Pazartesi 15:00'te verilen siparişte, süre 3 gün ise son
    ödeme Perşembe'dir; sipariş Perşembe 23:59'a kadar onaylanabilir.
- Süresi dolan sipariş "Ödeme süresi doldu" notuyla **İptal** edilir ve
  artık onaylanamaz.
- Ödeme hesaba geçince panelde **Ödeme Alındı** denir; sipariş
  Hazırlanıyor'a geçer ve ödeme tarihi yazılır.
- Müşteri ödeme açıklamasına sipariş numarasını yazar.
- **Süre kontrolü:** Demo modunda sipariş sayfaları (müşterinin
  Siparişlerim sayfası ve panel) açılınca yapılır. Veritabanı modunda üyenin
  siparişleri sunucudan okunurken sunucu yapar ve kupon hakkını geri verir
  (K-97); canlıda ayrıca her gün çalışan zamanlanmış bir iş yapmalıdır
  ([YAPILACAKLAR.md](YAPILACAKLAR.md)).

Kod: `packages/data/src/orders.ts` (`isTransferExpired`),
`packages/store/src/repo/commerce.ts` (`cancelExpiredTransfers`,
`markOrderPaid`); sunucu: `packages/db/src/orders.ts`
(`cancelExpiredTransfers`).

---

## 7. Sipariş durumları

**Kısaca:** Ödeme Bekleniyor → Hazırlanıyor → Kargoda → Teslim Edildi (ya da
İptal). Ödemesi kesinleşen sipariş SAP'a aktarılmak üzere sıraya girer.
Bireysel üye teslimden sonra 14 gün içinde iade talebi açar.

Siparişi yalnızca **üye** verir.

| Durum | Nasıl girilir | Sonraki |
|---|---|---|
| **Ödeme Bekleniyor** | Havaleyle sipariş | Hazırlanıyor (Ödeme Alındı), İptal |
| **Hazırlanıyor** | Kartla sipariş (ödeme anında alınmış sayılır) ya da havale onayı | Kargoda (Kargoya Ver), İptal |
| **Kargoda** | Panelde kargo firması + takip numarası girilir | Teslim Edildi, İptal |
| **Teslim Edildi** | Panelde Teslim Edildi | — (son) |
| **İptal** | Panelde iptal ya da havale süresinin dolması | — (son) |

- Her durum değişikliği sipariş geçmişine tarih-saat ve varsa notla yazılır;
  müşteri bu geçmişi Hesabım › Siparişlerim'de görür.
- Kargo firması ve takip numarası zorunludur. Kargodaki siparişte takip
  numarası düzeltilebilir; ilk kargoya verilme tarihi değişmez.
- **Takip bağlantısı (KARARLAR K-105):** Mağaza Ayarları'nda her kargo
  firmasına takip sayfasının adresi girilebilir; adresteki `{takip}` yerine
  gönderinin takip numarası (boşlukları atılarak) yazılır. Müşteri sipariş
  detayında "Kargoyu takip et", panel sipariş detayında "<firma> takip
  sayfasını aç" bağlantısını görür. Firma gönderideki adıyla bulunur
  (büyük/küçük harf fark etmez); takip adresi yoksa ya da firma listeden
  çıkarıldıysa bağlantı gösterilmez. Takip adresi `https://` ile başlar,
  `{takip}` içerir, boşluk içermez.
  - **Örnek:** Adres `https://kargo.ornek/sorgula?no={takip}`, takip
    numarası "YK 1029 3847 56" → `https://kargo.ornek/sorgula?no=YK1029384756`.
  - Kargo firmasının API'si (etiket, durum ve teslim bilgisi) ileride
    bağlanırsa bağlantı bu tek kuraldan değişir (`packages/data/src/shipping.ts`).
- Teslim edilmiş ya da iptal edilmiş sipariş iptal edilemez.
- İptal edilen siparişte (havale süresinin dolması dahil) kupon kullanımı
  geri sayılır ([21](#21-kuponlar)).
- İptal nedenini müşteri görür. Ödemesi alınmış siparişin iadesi banka ya da
  ödeme kuruluşu üzerinden **ayrıca** yapılır; sistem iade yapmaz.
- Müşteri sitede siparişini iptal edemez (bugün düğme yok; ileride
  düşünülecek, [YAPILACAKLAR.md](YAPILACAKLAR.md)).
- Sipariş kaydı ürün adı, kodu, seçenek adı, birim fiyat ve KDV oranını
  sipariş anındaki haliyle saklar ([VERITABANI.md](VERITABANI.md)).
- Durum değişince müşteriye e-posta **gitmez**.
- **Nerede çalışır:** Veritabanı modunda sipariş sunucuda kaydedilir ve
  üyenin siparişleri sunucudan okunur (K-97); başka üyenin
  siparişi görünmez. Panelin Siparişler ekranı da veritabanından okur ve
  yazar (K-99); panel işlemleri [22](#22-panelde-kayıt-düzenleme)'deki
  kurallarla kaydedilir.

Kod: `packages/store/src/repo/commerce.ts`; sunucu: `packages/db/src/orders.ts`,
panel: `packages/db/src/admin-sales.ts`.

**SAP'a aktarım (veritabanı modu, KARARLAR K-84, K-108):**

- Ödemesi kesinleşen sipariş SAP'a satış siparişi olarak aktarılmak üzere
  sıraya girer: kartla verilen sipariş verildiği anda, havale siparişi
  panelde **Ödeme Alındı** denince. Ödeme bekleyen sipariş sıraya girmez;
  süresi dolup iptal edilen havale siparişi hiç girmez.
- Zamanlanmış iş sıradaki siparişleri gönderir. Gönderilemeyen sipariş
  artan aralarla yeniden denenir: n. başarısız denemeden sonra
  5 × 2<sup>n−1</sup> dakika, en fazla 6 saat.
  - **Örnek:** 1. deneme 10:00'da olmadı → 10:05; o da olmadı → 10:15;
    sonra 10:35, 11:15, 12:35, 15:15, 20:35.
- 8. denemede de olmazsa ya da SAP hatanın geçici olmadığını söylerse
  (ör. cari bulunamadı) sipariş "Aktarılamadı" olur; panelden yeniden
  sıraya alınır (deneme sayısı sıfırdan, hemen).
- Gönderilmeden iptal edilen sipariş aktarılmaz ("Aktarılmadı"). SAP'a
  aktarılmış siparişin iptali ve iadesi SAP'ta ayrıca yapılır (bugün
  sistem SAP'a iptal göndermez).
- Siparişin SAP'ta nasıl yazılacağı (cari, KDV, kargo, kupon, vade farkı)
  SAP danışmanıyla kesinleşir; aktarıcıya siparişin bütün bilgisi gider.

Kod: `packages/db/src/sap-orders.ts`.

**İade (cayma) talebi:**

- Yalnızca **bireysel üye**, yalnızca **Teslim Edildi** durumundaki siparişi
  için açar; kurumsal üyede yoktur ([KARARLAR.md](KARARLAR.md) K-65).
- **Süre:** Teslim gününden itibaren **14 gün**; son gün 23:59'a kadar
  (Türkiye saati).
  Teslim anı kargo kaydındaki teslim tarihidir (yoksa durum geçmişindeki
  Teslim Edildi anı).
  - **Örnek:** 10 Mart 15:00'te teslim edilen siparişte son gün 24 Mart;
    24 Mart 23:59'a kadar talep açılır, 25 Mart'ta açılmaz.
- Müşteri ürünleri ve adetlerini seçer (en az bir ürün), nedeni seçer
  (Vazgeçtim, Kusurlu ürün, Yanlış ürün gönderildi, Diğer) ve isterse
  açıklama yazar.
- **İade edilebilecek adet** = siparişteki adet − reddedilmemiş taleplerdeki
  adet.
- Açık talep (Yeni ya da İnceleniyor) varken aynı siparişe yeni talep
  açılamaz. Talep onaylanır ya da reddedilirse, kalan ürünler için süre
  içinde yeni talep açılabilir.
- **Durumlar:** Yeni → İnceleniyor → Onaylandı ya da Reddedildi; panelde
  istenen duruma geçilir. Müşteri durumu sipariş detayında görür; e-posta
  gitmez.
- Para iadesi panelden yapılmaz; banka ya da ödeme kuruluşu üzerinden
  ayrıca yapılır (K-27).
- Numara `IAD-<yıl>-<4 hane>` ([17](#17-kayıt-numaraları)).
- Veritabanı modunda talep sunucuda açılır (K-97): siparişin sahibi, süre,
  açık talep ve adetler sunucuda denetlenir; sipariş satırı kilitlenir, aynı
  anda iki talep açılamaz. Kurala uymayan talep: "Talep oluşturulamadı.
  Sayfayı yenileyip tekrar deneyin."

Kod: `packages/data/src/returns.ts`, `packages/store/src/repo/returns.ts`;
sunucu: `packages/db/src/orders.ts` (`createReturnRequest`).

---

## 8. Teklif

**Kısaca:** Herkes, yalnızca Ekipmanlar'daki ürünler için teklif
isteyebilir. Teklifte fiyat sistemde hesaplanmaz; satış ekibi ayrıca
gönderir.

**Kim:** Herkes (üye ya da ziyaretçi) teklif isteyebilir. Üye gönderirse
teklif Hesabım › Tekliflerim'de görünür.

**Ürünler:**

- Yalnızca **Ekipmanlar**'daki yayındaki ürünler seçilebilir; hepsi
  listededir (ürün bazında işaret yoktur). Güvenlik, Aksesuarlar ve Dolgu
  Metalleri'ndeki ürünler teklife giremez (KARARLAR K-79).
- Tarayıcıda saklanan teklif listesindeki ürün yayından kalkar ya da
  Ekipmanlar dışına taşınırsa listede görünmez ve teklife eklenmez.
- Seçenekli üründe önce model, sonra seçenekler seçilir; teklif listesinde
  her seçenek kombinasyonu ayrı satırdır. Aynı kombinasyon tekrar eklenirse
  adet artar.
- En az bir ürün olmalı; adet en az 1.
- Ürün sayfasında teklife ekleme düğmesi yoktur ve olmayacaktır (karar,
  [KARARLAR.md](KARARLAR.md)); ürünler yalnızca Teklif Al sayfasındaki
  listeden seçilir.

**Zorunlu bilgiler:**

- Yetkili kişi, geçerli e-posta, telefon.
- Firma ünvanı: ziyaretçide ve kurumsal üyede zorunlu, bireysel üyede
  isteğe bağlı.

**Ödeme tercihi:** Vadeli (30 / 45 / 60 / 90 / 120 gün; varsayılan 60), Çek,
Havale/EFT, Görüşelim.

**Durumlar:** Yeni → İnceleniyor → Teklif Gönderildi → Kazanıldı ya da
Kapandı.

- Durumlar arasında sabit bir sıra zorunlu değildir; panelde istenen duruma
  geçilir.
- Panel ana sayfasındaki teklif hunisi bu durumları sayar: incelenen = Yeni
  olmayan; teklif verilen = Gönderildi + Kazanıldı + Kapandı; kazanma oranı
  = kazanılan ÷ (kazanılan + kapanan).

**Fiyat:** Teklifte fiyat sistemde hesaplanmaz; satış ekibi teklifi ayrıca
hazırlayıp e-postayla gönderir.

**Veritabanı modunda** teklifi sunucu kaydeder ve numarasını
verir. Kurallar sunucuda yeniden denetlenir; ürün adı, kodu ve seçenek adı
tarayıcıdan değil katalogdan alınır. Listedeki bir ürün ya da seçenek artık
yoksa ya da Ekipmanlar dışındaysa teklif alınmaz: "Teklif listenizdeki bazı
ürünler değişti ya da artık listelenmiyor. Listenizi kontrol edin." Adet
1–9.999.

Kod: `apps/zenweld-web/src/app/(site)/teklif-al/page.tsx`,
`packages/store/src/repo/commerce.ts`, `packages/data/src/forms.ts`;
sunucu: `packages/db/src/forms.ts` (`createQuote`).

---

## 9. Servis talebi

**Kısaca:** Herkes servis talebi açabilir; bütün alanlar zorunludur. Durum
panelde izlenir; müşteriye e-posta gitmez.

- Herkes servis talebi oluşturabilir; üyede bilgiler hesaptan gelir.
- Talep nedeni en az bir tanedir: Kurulum, Bakım, Onarım, Kullanım/Bakım
  Eğitimi.
- Durumlar: Yeni → İşlemde → Tamamlandı; panelde istenen duruma geçilir.
- Servis talebi müşterinin Hesabım sayfasında görünmez; müşteriye e-posta
  gitmez.
- Bütün alanlar zorunludur; model, seçilen kategorideki yayındaki bir ürün
  olmalıdır; açıklama en fazla 400 karakter; gizlilik sözleşmesi onayı
  zorunludur.
- Veritabanı modunda talebi sunucu kaydeder, kuralları yeniden denetler ve
  numarasını (`SRV-…`) verir. Model adı katalogdan alınır.

Kod: `apps/zenweld-web/src/app/(site)/servis-talebi/page.tsx`,
`packages/store/src/repo/service.ts`; sunucu: `packages/db/src/forms.ts`
(`createServiceRequest`).

---

## 10. Garanti

**Kısaca:** Aynı seri numarası bir kez kaydedilir. Garanti kayıt gününden
başlar: ürünün garanti süresi + istenirse 12 ay uzatma.

**Kayıt:**

- Seri numarası büyük harfe çevrilir, baştaki/sondaki boşluklar silinir.
- **Aynı seri numarası ikinci kez kaydedilemez.**
- E-posta küçük harfle saklanır. Üyenin Garantilerim sayfası kayıtlara
  **e-postayla** eşleşir (büyük/küçük harf farkı gözetilmez); garanti kaydı
  üye olmadan da yapılabilir.

**Bitiş tarihi:**

- Satın alma tarihi sorulmadığı için garanti **kayıt tarihinden** başlar.
- Bitiş = kayıt tarihi + ürünün garanti süresi (ay; ürün bulunamazsa 24) +
  uzatma istendiyse 12 ay.
- Bitiş yalnızca tarihtir (saat yok) ve kayıt gününün **Türkiye saatine**
  göre tarihinden hesaplanır (sunucu UTC'de çalışsa da gece 00:00–03:00
  arasındaki kayıtta gün kaymaz).
- **Bitiş günü dahil** garanti geçerlidir; ertesi gün "Süresi Doldu".

**Örnek:** 15.03.2026'da kayıt, garanti 24 ay, uzatma istendi → bitiş
15.03.2029.

**Panelde değişiklik:**

- Bitiş tarihi elle değiştirilebilir.
- "+12 ay" işaretlenince bitiş tarihine 12 ay eklenir, kaldırılınca 12 ay
  çıkarılır; elle girilmiş tarih bu şekilde korunur.
- **29 Şubat (karar):** Bitiş 29 Şubat ise +12 ay 1 Mart olur (ertesi yıl 29
  Şubat yoktur); işaret kaldırılınca 1 Mart'tan 12 ay çıkar. Böylece tarih bir
  gün kayar. Bu nadir durum bilinçli olarak olduğu gibi bırakıldı
  ([KARARLAR.md](KARARLAR.md)).
- Değişiklik müşterinin Garantilerim sayfasına ve garanti sorgulamaya anında
  yansır.
- Veritabanı modunda değişiklik sunucuda yapılır: "+12 ay" kayıttaki güncel
  bitiş tarihinden hesaplanır; elle girilen tarih geçerli bir gün olmalıdır
  ("Geçerli bir tarih girin."). Kural: `packages/data/src/forms.ts`
  (`toggledWarrantyExpiry`, `isValidDateKey`).

**Veritabanı modunda:**

- Kaydı sunucu yapar; posta kodu (5 hane), satıcı VKN (10 ya da 11 hane) ve
  zorunlu alanlar sunucuda yeniden denetlenir. Aynı seri numarası aynı anda
  iki kez gelse de veritabanındaki tekillik kuralı ikincisini reddeder.
- **Garanti sorgulama** sunucuya sorulur ve yalnızca sorgulama kartında
  görünen bilgiler döner: seri no, model, sahibi, kayıt ve bitiş tarihi,
  uzatma. E-posta, telefon ve adres dönmez.
- Garantilerim sunucudan okunur (üyenin e-postasıyla).

Kod: `packages/store/src/repo/warranties.ts`, `packages/data/src/forms.ts`
(`warrantyExpiryDate`, `normalizeSerial`),
`packages/utils/src/format.ts` › `addMonthsToDate`; sunucu:
`packages/db/src/forms.ts` (`registerWarranty`, `findWarranty`).

---

## 11. Bayi ve online satıcı stoğu

**Kısaca:** Bayi ve satıcı listeleri panelden dosyayla yüklenir. Adedi 0'dan
büyük ve süresi geçmemiş satır "stokta" sayılır. Sitede adet ve fiyat
gösterilmez.

Ayrıntı: [STOK.md](STOK.md). Özet:

**Stokta sayılmak:**

- Bir stok satırı sitede "stokta" sayılır: **adet > 0** ve satır, **stok
  geçerlilik süresinden** eski değil (Stok Matrisi'nde ayarlanır; örnek değer
  3 gün; 0 = süre sınırı yok).
- Zenweld'in kendi deposu bu hesapta yoktur; onun stoğu SAP'tan gelir ve
  stokta olmayan ürün sepete eklenmez ([20](#20-zenweld-depo-stoğu)).

**Ürün sayfasında:**

- **Stoktaki bayiler** (harita): ürünü stokta tutan aktif bayiler.
- **Online satıcılar:** ürünü stokta tutan, **ürün linki olan** aktif
  online satıcılar. Online mağazası olan bayi, bayinin dosyasından gelir.
  Zenweld'in kendi mağazası en başta, diğerleri ada göre.
- Bir satıcı birden çok satırda olsa da bir kez gösterilir.
- **Seçenekli üründe:** Yalnızca seçilen varyantı (kombinasyonu) stokta
  tutanlar. Varyantı belirtilmemiş (ürünün ana koduyla gelen) satır bütün
  varyantlar için geçerli sayılır. Varyantın kendi satırı varsa kart onun
  linkine gider.
- Satıcının adedi ve fiyatı **sitede gösterilmez**.

**Stok dosyası:**

- Her dosya o kaynağın **tam listesidir**; dosyada olmayan ürün stoktan
  çıkar.
- Önceki listede en az 10 stoklu ürün varken yeni dosya bunun yarısından
  azını içeriyorsa uygulamadan önce onay istenir.
- Aynı ürün dosyada birden çok kez geçerse son satır geçerlidir.
- Eksi adet 0 sayılır.
- Tanınmayan kod bir kez ürüne eşleştirilir; sonraki dosyalarda
  kendiliğinden tanınır.

Kod: `packages/data/src/stock.ts`, `packages/store/src/repo/stock.ts`.

---

## 12. Ürün kodları

**Kısaca:** Ürün ve varyant kodları tek havuzdadır ve hepsi birbirinden
farklıdır; boşluk ve büyük/küçük harf fark etmez.

- Ürün kodu ve varyant (kombinasyon) kodları **tek havuzdadır** ve hepsi
  birbirinden farklı olmalıdır:
  - Ürün kodu başka bir ürünün ya da herhangi bir varyantın koduyla aynı
    olamaz.
  - Varyant kodu ürünün kendi koduyla, aynı ürünün başka varyantıyla ya da
    başka bir ürün/varyant koduyla aynı olamaz.
- Karşılaştırmada **boşluklar atılır ve büyük harfe çevrilir**
  (`zw-trc mb25` = `ZW-TRCMB25`).
- Seçenekli üründe her varyantın kodu zorunludur.
- **Neden:** Bayi ve satıcı stok dosyaları ürünleri bu kodla eşleştirir; aynı
  kod iki yerde olursa stok yanlış ürüne yazılır.
- Dosyadaki kod bu havuzda yoksa ve daha önce eşleştirilmemişse "tanınmayan
  kod" olur.

Kod: `packages/data/src/stock.ts` › `normalizeCode`,
`packages/data/src/catalog-rules.ts` (`productCodeError`, `optionsError`;
panel ve sunucu ortak). Veritabanında kod havuzu `sku_codes` tablosudur.

---

## 13. Linkler, yönlendirme ve arama motorları

**Kısaca:** Link addan üretilir; link değişince eski adres yenisine
yönlenir. Site yalnızca zenweld.com'da arama motorlarına açıktır.

**Link (slug) üretimi:**

- Link addan/başlıktan üretilir: Türkçe harfler sadeleşir (ğ→g, ı→i, ş→s,
  ö→o, ü→u, ç→c), küçük harf, harf ve rakam dışındaki her şey tek tireye
  döner, baştaki ve sondaki tire silinir.
  **Örnek:** "İmatech 2026 Fuarı" → `imatech-2026-fuari`.
- Adda hiç Latin harf ya da rakam yoksa link üretilemez; kayıt yapılmaz.

**Adresler:**

| Sayfa | Adres |
|---|---|
| Ürün | `/urun/<ürün>` (seçenekle: `?secenek=<varyant>`) |
| Bölüm | `/<bölüm>` (ör. `/ekipmanlar`) |
| Grup | `/<bölüm>/<grup>` |
| Kategori | `/<bölüm>/<grup>/<kategori>` |
| Blog yazısı | `/blog/<yazı>` |
| Haber | `/haberler/<haber>` |
| Etkinlik | `/etkinlikler/<etkinlik>` |

**Benzersizlik:** Ürün linki ürünler arasında, kategori linki bütün sitede,
grup linki kendi bölümünde, blog/haber/etkinlik linki kendi türünde
benzersizdir.

**Eski link yönlendirmesi:**

- Linki değişen kaydın eski adresi yeni adrese yönlenir; paylaşılmış
  bağlantılar ve Google'daki eski sonuç çalışmaya devam eder.
- Grubun linki değişince gruptaki bütün kategorilerin eski adresleri de
  yönlenir.
- Kategorinin linki ya da grubu değişince ürünleri kategoriye bağlı kalır;
  ürün adresleri değişmez.
- Bir ürünün seçeneğine dönüştürülmüş eski ürünün adresi o seçenekle açılır
  (`/urun/<eski ürün>` → `/urun/<ürün>?secenek=4-m`).
- Yeni link başka bir kaydın eski linkiyse eski yönlendirme kalkar; link yeni
  kaydı açar.
- Ürün, blog, haber ve etkinlikte yalnızca **yayındaki** kayda yönlendirilir.
- Yönlendirme bugün iki modda da tarayıcıda yapılıyor (sunucu 404 kodu
  döndürür, sayfa tarayıcıda açılır). Canlıda sunucuda **301 (kalıcı)**
  yönlendirme olmalı ([YAPILACAKLAR.md](YAPILACAKLAR.md) › SEO alanları ve
  link yönlendirme).

**Sayfa başlığı ve açıklaması:**

| Sayfa | Başlık boşsa | Açıklama boşsa |
|---|---|---|
| Ürün | "<Ürün adı> \| ZENWELD" (kategori eklenmez; ad model ve türü içerir, KARARLAR K-71) | Kısa açıklama |
| Kategori | "<Kategori> \| ZENWELD" | Kısa açıklama |
| Grup | "<Grup> \| ZENWELD" | Grubun kısa açıklaması (boşsa kategori adlarından) |
| Blog yazısı | "<Başlık> \| ZENWELD" | Özet |
| Haber | "<Başlık> \| ZENWELD" | Özet |
| Etkinlik | "<Etkinlik> \| ZENWELD" | Kısa açıklama |
| Sabit sayfalar | Sayfa SEO ekranındaki varsayılan | Varsayılan |

- Panelde başlık yazılırsa **olduğu gibi** kullanılır ("| ZENWELD"
  eklenmez).
- Önerilen uzunluk: başlık 60, açıklama 160 karakter (aşınca uyarı, engel
  yok).
- Anahtar kelimeler site içi aramada ve `keywords` etiketinde kullanılır.
- Arama motorlarına giden ürün bilgisinde (yapısal veri ve `product:brand`)
  marka, ürünün **Marka** alanıdır; boşsa Zenweld (KARARLAR K-08).

**Arama motorlarına açıklık:**

- Site yalnızca **zenweld.com** ve **www.zenweld.com** adresinde yayındayken
  arama motorlarına açıktır. Başka her adreste (demo adresi, önizleme
  sürümleri, yerel bilgisayar) her sayfa "noindex" alır ve site haritası
  bildirilmez.
- Gerçek alan adı farklıysa `apps/zenweld-web/src/lib/seo.ts` ›
  `INDEXABLE_HOSTS` listesine eklenmeli.
- Yönetim paneli, Giriş, Üye Ol, Şifremi Unuttum, Çıkış, Sepet, Ödeme,
  Arama, Hesabım ve yasal metinler (taslak oldukları için) her zaman aramaya
  kapalıdır ve site haritasına girmez.
- `robots.txt` yalnızca `/api/` adreslerini kapatır; kapalı sayfalar bilerek
  engellenmez, çünkü Google sayfayı okuyamazsa "noindex" etiketini de göremez
  ([KARARLAR.md](KARARLAR.md)).
- Site haritasında aramaya açık sabit sayfalar, bölüm/grup/kategori
  sayfaları, yayındaki ürünler (seçeneksiz tek adres), blog, haber ve
  etkinlikler yer alır.

Kod: `packages/utils/src/images.ts` › `slugify`,
`apps/zenweld-web/src/lib/seo.ts`, `apps/zenweld-web/src/lib/page-meta.ts`,
`packages/store/src/repo/shared.ts` › `withPreviousSlugs`.

---

## 14. Yayında olma

**Kısaca:** Yayında olmayan kayıt sitede görünmez (adresi 404 verir) ama
silinmez. Zamanlanmış yayın yoktur.

- Panelde "yayında değil" yapılan ürün, blog yazısı, haber, etkinlik, belge,
  bayi, online satıcı ve satış temsilcisi sitede görünmez; adresi açılırsa
  404 çıkar. Kayıt silinmez.
- Yayından kalkan ürün; listelerde, aramada, sepette, favorilerde, teklif
  listesinde ve anasayfa yorum şeridinde görünmez.
- Haber, blog ve etkinlikte yayın tarihi yalnızca sıralama ve gösterim
  içindir. "Yayında" işaretli kayıt **kaydedildiği anda** görünür;
  zamanlanmış yayın yoktur (karar, [KARARLAR.md](KARARLAR.md)).
- Etkinlik, bitiş tarihi bugün ya da sonraysa "Yaklaşan", değilse "Geçmiş"
  sayılır.

---

## 15. Ürün yorumları

**Kısaca:** Yorumu herkes yazar; panelde onaylanmadan görünmez. Ortalama
puan yalnızca onaylı yorumlardan hesaplanır; anasayfada en fazla 10 yorum.

- Yorumu herkes yazabilir; puan (1–5), ad ve yorum zorunludur.
- Yeni yorum **onay bekler**; panelde onaylanmadan sitede görünmez.
- Yorumlar ürüne bağlıdır; seçenekli üründe bütün seçenekler aynı yorumları
  gösterir.
- **Ortalama puan:** Onaylı yorumların ortalaması, bir ondalığa yuvarlanır.
- **Anasayfa şeridi:** Panelde "Anasayfada göster" denen, onaylı ve ürünü
  yayında olan yorumlar; en yeniden eskiye, **en fazla 10**. Sınır dolunca
  yenisi eklenemez. Yayından kaldırılan yorum şeritten de çıkar.
- Video en fazla 2 MB; fotoğraflar otomatik küçültülür.
- **Not (iki modda da):** Giriş yapmış üyenin yorumu "Doğrulanmış alıcı"
  sayılır; üyenin o ürünü satın almasıyla eşleştirilmesi sonraya kaldı.
- **Veritabanı modunda** yorumu sunucu kaydeder; ürün yayında olmalı, puan
  1–5 tam sayı, ad ve yorum zorunlu, en fazla 10 dosya. Fotoğraf ve videolar
  yorumun içinde veri olarak saklanır (dosya deposuna taşınması sonraya,
  [YAPILACAKLAR.md](YAPILACAKLAR.md) › Görseller ve yüklenen dosyalar); bir
  dosya en fazla ~3 MB (2 MB video).

- **Panelde (veritabanı modu):** Onay, yayından kaldırma, anasayfa ve silme
  sunucuda yapılır; sitedeki yorumlar hemen yenilenir. Anasayfa sınırı
  sunucuda da denetlenir ([22](#22-panelde-kayıt-düzenleme)).

Kod: `packages/store/src/repo/reviews.ts`, sınır `packages/data/src/forms.ts`
(`FEATURED_REVIEW_LIMIT`); sunucu: `packages/db/src/forms.ts` (`createReview`),
panel `packages/db/src/admin-requests.ts`.

---

## 16. Üyelik ve oturum

**Kısaca:** E-posta benzersiz, şifre en az 8 karakter, yeni üye hemen aktif.
Girişte tek hata mesajı; veritabanı modunda 15 dakikada 10 yanlış denemede
hesap 15 dakika kilitlenir. Site oturumu 30 gün, panel oturumu 8 saat.

- **Roller:** Bireysel, Kurumsal, Yönetici.
  - Bireysel ve kurumsal üye sitede aynı işlemleri yapar; kurumsal üyede
    kayıtta firma bilgisi istenir, ödemede fatura türü kurumsal gelir, Teklif
    Al'da firma ünvanı zorunludur.
  - Yönetici yalnızca panele girer; sitede giriş yapamaz (yanlış şifreyle
    aynı mesaj, yönetici e-postaları ele verilmez).
  - Bayiler sitenin üyesi değildir (karar, [KARARLAR.md](KARARLAR.md)).
- **Kayıt:** E-posta benzersizdir (büyük/küçük harf duyarsız), şifre en az 8
  karakter (KARARLAR K-94; var olan şifreler etkilenmez). Yeni üye **hemen
  aktiftir**; panelden onay gerekmez (karar).
- **Giriş (K-94):** Hesap yoksa, bu bölüme ait değilse ya da şifre yanlışsa
  tek mesaj: "E-posta ya da şifre hatalı." Veritabanı modunda bir hesaba 15
  dakikada 10 yanlış şifre girilirse o hesaba 15 dakika giriş yapılamaz
  (doğru şifreyle de): "Çok fazla deneme yapıldı. 15 dakika sonra tekrar
  deneyin." 15 dakikalık pencere ilk yanlış denemeyle başlar; doğru girişte
  sayaç sıfırlanır.
  - **Örnek:** 09:00–09:09 arası 9 yanlış, 09:10'da 10. yanlış → 09:25'e
    kadar giriş yok. 09:00–09:08 arası 9 yanlış, 09:15'te yanlış → sayaç
    baştan (1).
- **Oturumlar:** Site ve panelin oturumu ayrıdır; birinden çıkmak diğerini
  etkilemez. Veritabanı modunda site oturumu 30 gün sürer ve kullanıldıkça
  uzar (K-94).
- **Askıya alma:** Askıdaki üye giriş yapamaz ("Hesabınız askıya alınmış.
  Lütfen bizimle iletişime geçin."); açık oturumu hemen kapanır.
- **Son yönetici:** Son aktif yöneticinin rolü düşürülemez, askıya alınamaz
  ve silinemez. Yönetici kendi rolünü değiştiremez ve kendini askıya alamaz.
  Panelde yönetici hesabı silinmez (önce rolü değişir). Veritabanı modunda
  bu kurallar sunucuda denetlenir; iki yönetici aynı anda birbirini askıya
  almaya çalışırsa ikincisi kaydedilmez ("Son aktif yöneticinin rolü
  değiştirilemez, askıya alınamaz.").
- **Şifre değiştirme (Hesabım › Profil):** Mevcut şifre doğru olmalı; yeni
  şifre en az 8 karakter ve tekrarıyla aynı olmalı. Oturum açık kalır;
  veritabanı modunda üyenin diğer oturumları kapanır.
- **Şifre sıfırlama (veritabanı modu, KARARLAR K-95):** "Şifremi unuttum"da
  hesap olsa da olmasa da aynı mesaj. Hesap aktif bir bireysel ya da
  kurumsal üyeyse e-postasına tek kullanımlık bağlantı gider; bağlantı 1 saat
  geçerlidir. Aynı hesap için 15 dakikada en fazla bir bağlantı; yeni bağlantı
  eskisini geçersiz kılar. Yeni şifre en az 8 karakter; değişince üyenin
  bütün oturumları kapanır, yanlış şifre sayacı ve kilit sıfırlanır.
  Yöneticinin şifresi `npm run yonetici:olustur` ile değişir.
  - **Örnek:** 09:00'da istenen bağlantı 10:00'a kadar geçerli; 09:10'daki
    ikinci istek bağlantı üretmez, 09:15'teki üretir ve 09:00'daki
    bağlantıyı geçersiz kılar.
- **Üye silinince:** Kayıtlı adresleri (veritabanı modunda favorileri de)
  silinir; siparişleri, teklifleri,
  servis talepleri, iade talepleri, garanti kayıtları ve yorumları kalır.
  - Yönetici panelden siler ya da üye kendi hesabını Hesabım › Profil ›
    **Hesabımı Sil**'den siler (şifresiyle onaylar); sonuç aynıdır.
  - Kendi hesabını silen üyenin oturumu kapanır. Aynı e-postayla yeniden üye
    olunabilir.
- **Sipariş:** Yalnızca üye verebilir. Teklif, servis talebi, garanti kaydı
  ve yorum için üyelik gerekmez.
- **Adres:** Üyenin ilk adresi varsayılandır; varsayılan silinince kalan ilk
  eklenen adres varsayılan olur. Bir adres yalnızca sahibince değiştirilir ya
  da silinir.
  - Zorunlu alanlar: başlık, ad soyad, telefon, il, ilçe, açık adres.
  - Üye başına en fazla **20 adres** (K-96): "En fazla 20 adres
    kaydedebilirsiniz." Ödemede "adreslerime kaydet" işaretliyken sınır
    doluysa adres kaydedilmez; sipariş yine tamamlanır.
- **Favoriler** (K-96):
  - Giriş yapmamış ziyaretçinin favorileri tarayıcıdadır.
  - Veritabanı modunda giriş yapmış üyenin favorileri hesabındadır. Girişte
    tarayıcıdaki favoriler hesaba eklenir (zaten olanlar ve artık olmayan
    ürünler atlanır) ve tarayıcıdan silinir. Çıkışta favoriler hesapta
    kalır; kalpler boş görünür.
  - Üye başına en fazla **500 favori**: "En fazla 500 favori
    ekleyebilirsiniz." Girişteki eklemede yalnızca sığan kadarı eklenir.
  - Silinen ürün favorilerden de çıkar; yayından kalkan ürün görünmez.
  - **Örnek:** Hesabında 499 favori olan üye, tarayıcıda 3 favoriyle giriş
    yapar: 1'i hesaba eklenir, 2'si eklenmez; tarayıcıdaki liste boşalır.
- **Nerede çalışır:** Veritabanı modunda sitenin üyeliği sunucudadır: şifre güçlü özetle (argon2id) saklanır, oturum sunucuda tutulur.
  Panelin girişi de sunucudadır: panel oturumu girişten 8 saat
  sonra biter, uzamaz (K-94); geçerli yönetici oturumu olmadan panel
  sayfaları gönderilmez.
- **Demo notu:** Demo modunda şifreler tarayıcıda basit bir özetle
  karşılaştırılır; deneme sınırı yoktur.

Kod: `packages/auth/src/auth-context.tsx`, `packages/store/src/repo/users.ts`,
`apps/zenweld-web/src/lib/addresses.ts`, `apps/zenweld-web/src/lib/favourites.tsx`;
sunucu: `packages/auth/src/rules.ts`, `packages/auth/src/server/` (adres ve
favoriler: `account-data.ts`).

---

## 17. Kayıt numaraları

**Kısaca:** Numara önek + yıl + sıradır (SIP-, TKL-, SRV-, IAD-); her yıl
1'den başlar ve hiçbir numara tekrar verilmez.

| Kayıt | Biçim | Örnek |
|---|---|---|
| Sipariş | `SIP-<yıl>-<5 hane>` | SIP-2026-00003 |
| Teklif | `TKL-<yıl>-<4 hane>` | TKL-2026-0004 |
| Servis talebi | `SRV-<yıl>-<4 hane>` | SRV-2026-0034 |
| İade talebi | `IAD-<yıl>-<4 hane>` | IAD-2026-0001 |

- Numara, o yıl şimdiye kadar verilmiş en büyük numaranın bir fazlasıdır;
  her yıl 1'den başlar.
- Silinen kaydın numarası yeniden verilmez; **en son kayıt silinse de**
  numarası bir sonraki kayda verilmez ([KARARLAR.md](KARARLAR.md) K-64).
- Yıl, Türkiye saatine göredir.
- Veritabanı modunda sipariş, iade talebi, teklif ve servis talebi
  numarasını sunucu verir: önek başına sayaç (`record_counters`) tek
  işlemde bir artar; aynı anda gelen iki kayıt aynı numarayı alamaz. Sayaç yoksa ya da tablodaki en
  büyük numaranın gerisindeyse (ör. örnek veriyle yüklenmiş siparişler) o
  numaradan devam eder.
  - **Örnek:** Tabloda SIP-2026-00133 varken sayaç boşsa yeni sipariş
    SIP-2026-00134 olur.

Kod: `packages/store/src/repo/shared.ts` › `nextCode` (sipariş, teklif,
servis talebi ve iade talebi aynı yeri kullanır); sunucu:
`packages/db/src/codes.ts` › `nextRecordCode` (veritabanı modunda dördü de
sunucuda).

---

## 18. Form e-postaları

**Kısaca:** Formlar Zenweld'e e-posta gönderir (varsayılan info@zenweld.com;
veritabanı modunda tür başına alıcı panelden). Bugün e-posta servisi kurulu
olmadığı için hiçbir e-posta gitmez.

Sitedeki formlar Zenweld'e e-posta gönderir. Servisin kurulumu ve demo
davranışı: [SUNUCU.md](SUNUCU.md) › 9. Bugün servis kurulu
olmadığı için hiçbir e-posta gitmez.

**Alıcılar (KARARLAR K-104):**

- Varsayılan alıcı sunucudaki `SUPPORT_EMAIL`'dir (yoksa
  `info@zenweld.com`).
- Veritabanı modunda her türün (sipariş, iade talebi, teklif, servis
  talebi, garanti kaydı, yorum, üyelik, iletişim, ürün destek, bayilik,
  Welders Club) alıcıları panelde Mağaza Ayarları › E-posta Alıcıları'ndan
  yazılır: tür başına en fazla 10 adres; adresler küçük harfe çevrilir,
  aynı adres bir kez alınır. Alıcısı yazılmayan türün e-postası varsayılan
  adrese gider. Değişiklik bir sonraki e-postada geçerlidir.
  - **Örnek:** Teklif talebi alıcıları "satis@zenweld.com,
    bolge@zenweld.com" yazılırsa yeni teklif e-postası iki adrese gider;
    servis talebi boşsa servis e-postası info@zenweld.com'a gider.
- Alıcılar okunamazsa (veritabanı hatası) e-posta varsayılan adrese gider.
- Demo modunda e-postaların hepsi varsayılan adrese gider.
- Müşteriye giden e-postalar (şifre sıfırlama) bu listeden etkilenmez.

**Genel kurallar:**

- Konu satırı ve alan adları sunucuda belirlenir; formdan yalnızca tanımlı
  alanlar kabul edilir. Her alan en fazla 5.000 karakterdir (fazlası
  kesilir); konu en fazla 200 karakter.
- E-postada **Yanıtla** denince yanıt formu dolduran kişiye gider (yorum
  e-postası hariç).
- Her formda botlar için görünmez bir tuzak alanı vardır; onu dolduran
  gönderim e-posta olarak gelmez ama bota başarılı gibi yanıt verilir.
- **Kaydı panelde olan formlar** (sipariş, teklif, servis, garanti, yorum,
  üyelik, iade talebi) e-postanın sonucunu beklemez; e-posta gitmese de
  kayıt yapılır.
- **Yalnızca e-postayla giden formlar** (iletişim, bayilik başvurusu,
  Welders Club, ürün destek sorusu) e-posta gidemezse ziyaretçiye hata
  gösterir; ziyaretçi tekrar deneyebilir. Veritabanı modunda bu formlar da
  kendi tablolarına kaydedilir (KARARLAR K-81); kayıt yapıldıysa
  e-posta gitmese de form ulaşmış sayılır ve hata gösterilmez. Demo
  modunda form ulaşınca kayıt tarayıcıya da yazılır ve aynı tarayıcıda
  panelde (Mesajlar, Welders Club, Bayilik Başvuruları) görünür (KARARLAR
  K-109); bot tuzağına takılan gönderim kaydedilmez.
- **Bayilik başvurusunun kaydı** (iki modda aynı kural,
  `packages/data/src/forms.ts` › `dealerApplicationFields`): boş alan
  kaydedilmez; "Sektördeki yıl" yalnızca 0-2, 3-5, 6-10, 10+ seçeneklerinden
  biriyse alınır; Showroom ve Servis "evet" / "hayır" ise evet / hayır,
  seçilmediyse boş kalır.
- **Veritabanı modunda** teklif, servis talebi, garanti kaydı, yorum,
  sipariş ve iade talebinin kaydını ve bildirimini sunucu yapar; bildirim kayıttan sonra gider.
- **E-posta kaydı** (veritabanı modu, K-81): gönderilen ya da
  gönderilemeyen her e-posta `email_log`'a yazılır: türü, formun sayfası,
  bağlı kayıt, alıcı, konu ve sonucu (gitti / hata / gönderilmedi). E-posta
  servisi tanımlı değilse ya da bot tuzağına takıldıysa "gönderilmedi"
  yazılır. E-postanın metni saklanmaz. Müşteriye giden şifre sıfırlama
  e-postası da yazılır (bağlantı yazılmaz).
- Sipariş e-postasına T.C. kimlik no ve kart bilgisi yazılmaz.
- Panelden müşteriye hiçbir e-posta gitmez; bülten kaydı hiçbir yere
  gitmez. "Şifremi Unuttum" e-postası veritabanı modunda gider (K-95).

**Formlar:**

| Form | Konu | Alanlar | Panelde kaydı |
|---|---|---|---|
| İletişim | "İletişim formu — <konu ya da ad>" | Ad Soyad, E-posta, Telefon, Konu; Mesaj | Mesajlar (demo modunda tarayıcıda; veritabanı modunda `support_messages`) |
| Teklif Al | "Yeni teklif talebi — <no> — <firma ya da yetkili>" | Teklif no, Firma, Yetkili, E-posta, Telefon, Vergi no, Şehir, Ürünler ("adet × ad (seçenek) · kod"), Ödeme tercihi; Not | Teklifler |
| Servis Talebi | "Yeni servis talebi — <no> — <makine>" | Talep no, Makine, Talep konusu, Firma / Ad Soyad, Yetkili, E-posta, Telefon, Yetkili GSM, Adres, İlçe, Şehir; Şikayet / açıklama | Servis Talepleri |
| Garanti Kaydı | "Yeni garanti kaydı — <model> (<seri no>)" | Model, Seri no, Ad Soyad, E-posta, Telefon, Şehir, Posta kodu, Adres, Satıcı VKN, 12 ay uzatma isteği | Garantiler |
| Ürün yorumu | "Yeni ürün yorumu — <ürün>" | Ürün, Yazan, Puan, Başlık, Fotoğraf / video; Yorum | Yorumlar (onay bekler) |
| Üye Ol | "Yeni üye — <ad> (<tür>)" | Ad Soyad, E-posta, Telefon, Şehir, Üyelik, Firma, Bülten izni | Üyeler |
| Sipariş | "Yeni sipariş — <no> — <toplam>" | Sipariş no, Müşteri, E-posta, Telefon, Ürünler (adet × ad (seçenek) — tutar), Kupon (varsa: kod (−indirim)), Toplam, Ödeme, Teslimat adresi, Fatura (kurumsalda firma, vergi dairesi, VKN; bireyselde ad); Müşteri notu | Siparişler |
| İade talebi | "Yeni iade talebi — <talep no> — <sipariş no>" | Talep no, Sipariş no, Müşteri, E-posta, Telefon, Ürünler (adet × ad (seçenek) — kod), Neden; Açıklama | İade Talepleri |
| Welders Club | "Welders Club katılım — <ad>" | Ad, E-posta, Şehir | Welders Club (demo modunda tarayıcıda; veritabanı modunda `welders_club_signups`) |
| Bayilik Başvurusu | "Bayilik başvurusu — <firma>" | Firma unvanı, Vergi dairesi / no, Şehir, Faaliyet alanı, Sektördeki yıl, Çalıştığı markalar, Showroom var mı, Servis kabiliyeti, Yetkili kişi, E-posta, Telefon, Not. Sunucu firma ve e-posta olmadan kabul etmez | Bayilik Başvuruları (demo modunda tarayıcıda; veritabanı modunda `dealer_applications`) |
| Ürün destek sorusu | "Ürün destek talebi — <ürün> (<kod>)" | Ürün, Ürün kodu, Ürün sayfası, Ad Soyad, E-posta, Telefon, Üye mi; Soru. Sunucu soru ve (e-posta ya da telefon) olmadan kabul etmez | Mesajlar (demo modunda tarayıcıda; veritabanı modunda `support_messages`) |

(";" sonrası, e-postada tablonun altında uzun metin olarak gösterilen alan.)

Kod: `apps/zenweld-web/src/app/api/bildirim/route.ts`,
`apps/zenweld-web/src/app/api/bayilik/route.ts`,
`apps/zenweld-web/src/app/api/destek/route.ts`,
`apps/zenweld-web/src/app/api/formlar/[tur]/route.ts`,
`apps/zenweld-web/src/lib/notify.ts`, `apps/zenweld-web/src/lib/server/mail.ts`,
`apps/zenweld-web/src/lib/server/notify.ts` (şablonlar),
`apps/zenweld-web/src/lib/form-text.ts`, `apps/zenweld-web/src/lib/order-text.ts`.

---

## 19. Kategori filtreleri

**Kısaca:** Aynı filtrede seçilen değerlerden biri yeter; farklı filtreler
birlikte uygulanır. Hiçbir ürüne eşlenmemiş filtre sonucu daraltmaz.

Alt kategori sayfasındaki filtreler (ör. MIG'de Model Serisi, Çalışma Modu,
Fiziki Yapı). Filtreler ve değerleri kategoriye özeldir; ürünün değerleri
üründe durur (KARARLAR K-76).

**Kurallar:**

- Aynı filtrede birden çok değer seçilirse **"ya o ya bu"**: ürün seçilen
  değerlerden en az birini taşıyorsa listede kalır.
- Farklı filtreler **birlikte** uygulanır: ürün her filtrenin seçimine
  uymalıdır.
- Bir ürün bir filtrede birden çok değer taşıyabilir; her değerin
  seçiminde listede çıkar.
- **Eşlenmemiş filtre:** Kategorinin ürünlerinden hiçbirinde değeri işaretli
  olmayan filtre seçilebilir ama **sonucu daraltmaz**; değerlerinin yanında
  sayı yazmaz. Bir ürüne değer işaretlenince filtre normal çalışır; o zaman
  değeri girilmemiş ürün o filtrenin seçiminde elenir.
- **Değeri olmayan filtre** (ör. bugün Şebeke Voltajı, Amper) sitede
  gösterilmez.
- **Sayı:** Bir değerin yanındaki sayı, o değer seçilirse listede kalacak
  ürün sayısıdır; diğer filtrelerdeki seçim hesaba katılır, filtrenin kendi
  seçimi katılmaz. Sayısı 0 olan seçili olmayan değer soluk görünür ve
  seçilemez.
- Sayılar ve sonuç yalnızca kategorinin yayındaki ürünleriyle hesaplanır.
- Seçenekli üründe değer ürüne bağlıdır, seçeneğe değil.
- **Kayıt:** Üründe yalnızca kendi kategorisinin filtrelerine ait değerler
  tutulur. Ürün başka kategoriye taşınınca eski kategorinin değerleri, bir
  filtre ya da değer kategoriden silinince ürünlerdeki karşılığı silinir.

**Örnek:** MIG'de Ultimate 250 MTC (Standart), Ultimate 405 MTS (Standart ve
Puls), Evomig 405 P (Puls). Model Serisi: Ultimate seçilince 2 ürün kalır; o
sırada Çalışma Modu'nda Standart (2) ve Puls (1) yazar. Puls da seçilince
yalnızca Ultimate 405 MTS kalır. Fiziki Yapı hiçbir ürüne eşlenmemişse
Kompakt seçilse de liste değişmez.

**Adres:**

- Seçim adrese yazılır: `?<filtre>=<değer>,<değer>` (ör.
  `?calisma-modu=puls&fiziki-yapi=kompakt,cantali`). Filtre ve değer
  kimlikleri ilk addan üretilir ve değişmez; ad düzeltilince adres bozulmaz.
- Adresteki bilinmeyen filtre ve değer yok sayılır.
- Arama motoruna sayfa filtresiz adresle bildirilir (standart adres).

Kod: `packages/data/src/filters.ts`; sayfada
`apps/zenweld-web/src/components/product/CategoryListing.tsx`.

---

## 20. Zenweld depo stoğu

**Kısaca:** Depo stoğu SAP'tan 15 dakikada bir okunur. Seçili seçeneğin SAP
kaleminde stok yoksa STOKTA YOK yazar ve ürün sepete eklenmez. Bozuk ya da
yarım okuma uygulanmaz.

Sahibinin kararı (KARARLAR K-82, K-84). Kod: `packages/data/src/warehouse.ts`.

**Kaynak:** Zenweld deposunun stoğu SAP'tan gelir. SAP ekibinin hazırladığı
"kullanılabilir stok" görünümü SAP kalem kodu başına miktar verir; sunucu
bunu 15 dakikada bir okuyup kendi veritabanına yazar (`warehouse_stock`).
Sayfa açılırken SAP'a gidilmez. Panelden değiştirilmez. Bugün demo
verisinde örnek stok vardır (Demo notu); SAP bağlanana kadar okuma işi bir
deneme dosyasını okur ([SUNUCU.md](SUNUCU.md) › 11 › SAP stok
okuma).

**SAP okuması** (`readSapStock`, `diffWarehouseStock`):

- Her okuma SAP'taki kullanılabilir stoğun **tam listesidir**: okumada
  olmayan kalem stoktan çıkar (o kalemin ürünü STOKTA YOK olur).
- Kalem kodu boşlukları atılıp büyük harfe çevrilir.
- Aynı kalem birden fazla satırda gelirse (ör. depo başına) miktarlar
  toplanır. Toplam eksiyse (siparişe ayrılan eldekini aşmış) 0 sayılır.
- Miktar ondalıklı olabilir (kg ile satılan kalemler); en fazla 3 basamak.
  "12", "12,5", "1.250" (bin iki yüz elli) gibi yazımlar okunur.
- Okuma bütün olarak kabul ya da reddedilir. Hiç satır gelmezse, bir
  satırın kodu boşsa ya da miktarı okunamıyorsa okuma geçersizdir ve
  **son iyi stok olduğu gibi kalır**; hata okuma kaydına yazılır. SAP'a
  ulaşılamazsa da aynısı olur.
  - **Örnek:** `;;5` satırı → "1. satırda kalem kodu boş."; `ZW1;;yok` →
    "ZW1: miktar okunamadı (yok)."
- **Yarım okuma koruması (KARARLAR K-93):** Önceki okumada en az 10 kalem
  stoktayken yeni okumada stoktaki kalem sayısı bunun yarısının altına
  düşerse okuma uygulanmaz, son stok kalır (`looksLikePartialSapRead`).
  Okuma doğruysa elle zorla uygulanır (`npm run sap:stok zorla`).
  - **Örnek:** Önceki okumada 47 kalem stokta; yeni okumada 20 kalem
    stokta → uygulanmaz ("Yarım okuma olabilir: … 47 …, bu okumada 20").
    Yeni okumada 24 kalem stokta → uygulanır.
  - Önceki okumada 10'dan az kalem stoktaysa (ilk okuma, deneme) koruma
    çalışmaz.
- Okumadan sonra yeni gelen, çıkan ya da miktarı değişen kalem varsa
  sayfalar o anda yenilenir; yoksa yenilenmez.

**Ürünün SAP kalemi:**

- Seçeneksiz ürün: ürün kodu SAP kodudur.
- Seçenekli ürün: seçeneğin kodundan torç uzunluğu (`-3M`) ve ara paket
  uzunluğu (`-AP5M`) ekleri atılınca SAP kodu kalır (KARARLAR K-72).
  - **Örnek:** `ZW30100000027-3M-AP5M` → `ZW30100000027`.
  - SAP'ta torç ve ara paket uzunluğuna göre ayrı stok kalemi yoktur
    (K-84). Yalnızca bu uzunlukları farklı olan seçenekler aynı SAP
    kalemini paylaşır ve aynı stoğu gösterir.
  - Kendi SAP kodu olan seçenek (ör. soğutma ya da güç) kendi stoğunu
    gösterir.
- Kodlar boşlukları atılıp büyük harfe çevrilerek eşleştirilir.
- SAP'ta karşılığı olmayan kod (ör. geçici kod, K-75) stokta sayılmaz.

**Stokta mı:**

- Seçili seçeneğin SAP kalemindeki miktar 0'dan büyükse stoktadır.
- Ürün kartında ve panelde ürün, seçeneklerinden en az biri stoktaysa
  stokta sayılır. Toplam stok, ürünün SAP kalemlerinin toplamıdır (paylaşılan
  kalem bir kez sayılır).
- **Örnek:** Ultimate 405 MTS'nin hava soğutmalı kalemi 2, su soğutmalı
  kalemi 0 ise: kartta STOKTA YOK yazmaz, panelde "2 adet" ve "1/2 SAP
  kalemi stoksuz" yazar; ürün sayfasında Su Soğutmalı seçilince STOKTA YOK.

**Sepet ve sipariş:**

- Stokta olmayan ürün ya da seçenek sepete eklenmez.
- Arama motorlarına giden ürün bilgisinde (yapısal veri) stok durumu aynı
  kurala göre bildirilir: ürün stoktaysa "stokta", değilse "stokta yok".
  Kod: `apps/zenweld-web/src/lib/seo.ts` › `productJsonLd`.
- Sepete eklendikten sonra stoğu biten satırla ödemeye geçilmez ve sipariş
  verilmez; satır sepetten çıkarılınca ya da stok gelince devam edilir.
- Stok, sepetteki adetle karşılaştırılmaz: stok 0'dan büyükse istenen adet
  sepete eklenebilir.
- Teklif Al stoktan bağımsızdır; stokta olmayan ürün için de teklif
  istenebilir.
- Bayi ve online satıcı stokları ayrıdır ([11](#11-bayi-ve-online-satıcı-stoğu));
  Zenweld deposunda olmayan ürünün stoktaki bayileri gösterilmeye devam eder.

---

## 21. Kuponlar

**Kısaca:** Siparişte tek kupon kullanılır; kampanyalı fiyatın üstüne
uygulanır, kargoya uygulanmaz, KDV indirimli tutardan hesaplanır. Kişiye
özel kupon e-postaya bağlıdır.

Sahibinin kararları (KARARLAR K-85, K-86). Kod: `packages/data/src/coupon.ts`,
`packages/data/src/checkout.ts` › `cartTotals`,
`packages/store/src/repo/coupons.ts`; sunucu: `packages/db/src/orders.ts`.

**Veritabanı modunda** kupon sepette ve ödemede sunucuda
değerlendirilir (`/api/siparis/kupon`); kuponlar ve kullanımları tarayıcıya
gelmez, tarayıcıya yalnızca sonuç (indirim ya da neden) gider. Sipariş
anında kupon yeniden denetlenir ve kupon kaydı kilitlenir: aynı kuponla aynı
anda verilen iki sipariş toplam ya da kişi başı sınırı aşamaz; ikincisi
"Kupon uygulanamıyor: <neden>" ile alınmaz.

**Kupon kaydı** (Panel › Satış › Kuponlar):

- **Kod:** 3–30 karakter; harf (Türkçe karakter olmadan), rakam ve tire.
  Büyük harfle saklanır ve başka kuponda kullanılamaz. Müşterinin yazdığı
  kodda boşluklar atılır, harfler büyütülür; Türkçe klavyedeki "İ" ve "ı"
  da "I" sayılır.
- **Tür ve değer:** Yüzde (1–100) ya da sabit TL (en az 1, KDV dahil);
  ikisi de tam sayı.
- **En az sepet tutarı** (isteğe bağlı), **başlangıç ve bitiş** (isteğe
  bağlı; bitiş başlangıçtan sonra), **toplam kullanım sınırı** ve **kişi
  başı kullanım sınırı** (isteğe bağlı, en az 1).
- **Kapsam:** Bütün ürünler ya da seçilen ürün ve kategoriler (en az bir
  seçim). Kategori seçilince kategorideki bütün ürünler kapsama girer.
- **Kimler kullanabilir:** Herkes ya da yalnızca belirli e-posta adresleri
  (kişiye özel, KARARLAR K-86; en az bir geçerli e-posta). E-postalar küçük
  harfle saklanır; kişi henüz üye olmasa da eklenir.
- **Aktif / pasif.** Kullanılmış kupon silinmez, pasife alınır.

**Kuponun durumu** (sırayla bakılır):

| Durum | Ne zaman |
|---|---|
| Pasif | Pasife alınmış |
| Süresi doldu | Bitiş geçti |
| Planlandı | Başlangıç gelmedi |
| Sınır doldu | Geçerli kullanım sayısı toplam sınıra ulaştı |
| Geçerli | Diğerlerinin hiçbiri değil |

**Kullanım sayısı:** Kupon, sipariş verilince kullanılmış sayılır (havale
siparişi de). Sipariş iptal edilirse (havale süresinin dolması dahil)
kullanım geri sayılır ve sınırlarda sayılmaz. İade (cayma) kullanımı geri
saymaz.

**Sepete uygulanması:**

1. Kod yoksa ya da kupon pasifse: "geçerli değil". Süresi dolmuş,
   başlamamış ya da sınırı dolmuşsa nedeni söylenir.
2. **Kişiye özel kupon:** Giriş yapan üyenin e-postası (büyük/küçük harf
   fark etmez) kuponun e-postalarından biri değilse uygulanmaz: "Bu kupon
   hesabınıza tanımlı değil. Kuponun verildiği e-posta adresiyle giriş
   yapın."
3. **Kişi başı sınır:** Üyenin geçerli kullanım sayısı sınıra ulaştıysa
   kupon uygulanmaz.
   - 2 ve 3 sepette ziyaretçiyken denetlenmez (kupon uygulanır; kişiye
     özel kuponda "ödeme adımında e-posta adresi kontrol edilir" notu
     çıkar). Ödeme sayfasında üye bellidir ve yeniden denetlenir.
4. **En az sepet tutarı:** Sepetteki bütün ürünlerin kampanyalı, KDV dahil
   toplamına bakılır (kargo ve kupon hariç; kupon belirli ürünler için
   olsa da).
5. **Uyan ürünler:** Bütün ürünler ya da kapsamdaki ürünler ve
   kategorilerindeki ürünler. Sepette uyan ürün yoksa kupon kabul edilmez.
6. **İndirim:**
   - Yüzde: uyan ürünlerin toplamı × oran / 100, **tam liraya
     yuvarlanır**.
   - Sabit TL: siparişte bir kez düşülür; uyan ürünlerin toplamını
     geçemez.
   - Kupon, kampanya gibi başka indirimlerle birleşir: kampanyalı fiyatın
     üstüne uygulanır.
7. **Satırlara dağıtım:** İndirim uyan satırlara tutarlarıyla orantılı
   dağıtılır (kuruşa yuvarlanır; yuvarlama farkı son uyan satıra yazılır,
   toplam indirime eşit kalır). Bu pay siparişin her satırında saklanır.

- Siparişte tek kupon kullanılır. Teklifte kupon yoktur.
- Kupon kargo ücretine uygulanmaz. Ücretsiz kargo sınırı, kupon
  düşüldükten sonraki tutara bakar ([4](#4-sepet-ve-kargo)).
- Vade farkı, kupon düşülmüş toplamdan hesaplanır
  ([5](#5-kartla-ödeme-taksit-ve-banka-komisyonu)).
- **KDV:** Kupon KDV matrahını düşürür. Her satırın KDV'si, indirimli
  tutarına oranla azalır (kuruşa yuvarlanır).
- Uygulanmış kupon sonradan uygulanamaz hale gelirse (süresi doldu, pasife
  alındı, sınır doldu, sepet değişti) indirim düşülmez ve kupon
  kaldırılana ya da sorun gidene kadar sipariş verilmez.
- **İade:** İade edilen ürün için müşteriye ödenecek tutar, satır tutarından
  o satıra düşen kupon payı çıkarılarak bulunur (para iadesi panelden
  yapılmaz, K-27).

**Örnekler:**

- %10, bütün ürünler; sepette 6.000 ₺ ve 4.000 ₺'lik iki ürün → indirim
  1.000 ₺; satırlara 600 ₺ ve 400 ₺.
- 500 ₺ kupon yalnızca bir kategoride; sepette o kategoriden 300 ₺'lik,
  başka kategoriden 5.000 ₺'lik ürün → indirim 300 ₺ (uyan tutarı geçemez).
- Ücretsiz kargo sınırı 5.000 ₺, kargo 250 ₺; sepet 5.200 ₺, kupon 300 ₺ →
  4.900 ₺ + kargo 250 ₺ = toplam 5.150 ₺.
- KDV dahil 6.000 ₺'lik ürün (içinde 1.000 ₺ KDV), %10 kupon → indirim
  600 ₺, KDV 900 ₺.
- Toplam 5.150 ₺, 6 taksit, vade farkı %4,5 → vade farkı 232 ₺, ödenecek
  5.382 ₺.

Canlıdan önce kalanlar (yanlış kod denemesine sınır, e-posta değişince
doğrulama): [YAPILACAKLAR.md](YAPILACAKLAR.md) › Kuponlar.

---

## 22. Panelde kayıt düzenleme

**Kısaca:** Veritabanı modunda biri açtıktan sonra değişen kayıt kaydedilmez
("sayfayı yenileyin"); her değişiklik işlem kaydına yazılır; kurallar demo
moduyla aynıdır ve sunucuda da denetlenir.

Veritabanı modunda panel kayıtları sunucuda değiştirir (KARARLAR K-99).
Aşağıdaki kurallar panelin bütün ekranlarında geçerlidir.

- **Aynı kaydı iki kişi düzenlerse:** Ekran açıldığında kaydın son
  değiştirilme anı alınır. Kaydederken kayıt bu andan sonra değişmişse
  (başka yönetici, müşteri ya da sistem değiştirdiyse) kaydedilmez:
  "Bu kayıt siz açtıktan sonra değişti; sayfayı yenileyin." Sayfa
  yenilenince kaydın güncel hali gelir; değişiklik yeniden yapılır.
  - **Örnek:** Ayşe ve Mehmet aynı siparişi açar. Ayşe kargoya verir.
    Mehmet sayfayı yenilemeden iç not kaydeder → kaydedilmez, uyarı çıkar.
    Mehmet sayfayı yeniler (sipariş artık Kargoda) ve notu yeniden yazar.
  - Aynı anda basılırsa biri önce kaydedilir, diğeri onu bekler ve uyarıyı
    alır; ikisi birden kaydedilmez.
  - Değişiklik yapmayan kayıt (aynı not, aynı durum) hiçbir şey yazmaz.
  - Yöneticinin kendi kaydı "değişiklik" sayılmaz: sayfa yenilenmeden aynı
    kaydı yeniden kaydederse (ör. önce teklifin durumu, hemen ardından iç
    notu) ikisi de kaydedilir.
- **İşlem kaydı:** Her değişiklik, değişiklikle aynı anda işlem kaydına
  (`audit_log`) yazılır: kim (yönetici, IP adresi), ne zaman, hangi kayıt
  (sipariş no, iade no, kupon kodu), hangi alan eskiden neydi ve yeni ne
  oldu. Oluşturmada kaydın ilk hali, silmede son hali yazılır. Panele giriş
  ve çıkış da yazılır. Sistemin kendiliğinden yaptığı değişiklik (süresi
  dolan havalenin iptali) yönetici işlemi değildir, yazılmaz. Kayıtlar
  değiştirilemez, 2 yıl saklanır (K-81).
- **Sipariş geçmişi:** Panelde yapılan her durum değişikliğinde işlemi yapan
  yönetici de saklanır (müşteriye gösterilmez).
- **Silinmeyen kayıtlar:** Bayilik başvurusu, mesaj ve Welders Club kaydı
  panelden silinmez; Welders Club'dan ayrılmak isteyen pasife alınır
  (KARARLAR K-100). Kullanılmış kupon da silinmez ([21](#21-kuponlar)).
- **Anasayfa yorum sınırı:** En fazla 10 yorum ([15](#15-ürün-yorumları));
  iki yönetici aynı anda işaretlese de sınır aşılmaz. Onaylanan ya da
  kaldırılan yorum sitede hemen değişir.
- **Katalog:** Link ve yönlendirme ([13](#13-linkler-yönlendirme-ve-arama-motorları)),
  filtre ([19](#19-kategori-filtreleri)) ve seçenek ([3](#3-seçenekli-ürün))
  kuralları demo moduyla aynıdır ve sunucuda da denetlenir. Ek olarak:
  - Kategorinin eşleme tablosunda değiştirilen ürünler de "aynı kaydı iki
    kişi düzenlerse" kuralına girer: ürün form açıldıktan sonra
    değişmişse kategori kaydedilmez.
  - Kategoriden kaldırılan filtre ya da değer ürünlerden kalkınca o
    ürünler, silinen seçenek tanımını listeleyen kategoriler değişmiş
    sayılır (açık form eski hali geri yazamaz).
  - Sıra değişikliği (oklar) kaydı eskitmez.
  - Aynı link ya da ürün kodu iki yönetici aynı anda kaydetse de iki kayda
    verilmez ([12](#12-ürün-kodları)). Ürünün kodu ile kombinasyonunun kodu
    tek kayıtta yer değiştirebilir.
  - Üründen kaldırılan kombinasyonun (seçenek listesi değiştiyse bütün
    kombinasyonların) bayi ve satıcı stok satırları ile kod eşleştirmeleri
    silinir; bütün kombinasyonlar için girilmiş satırlar kalır (demo ile
    aynı).
  - Değişmeyen ürün değişmiş sayılmaz (ürünün filtre değerlerinin sırası
    önemli değildir).
  - Silinen kategori ya da grubun eski adres yönlendirmeleri de silinir.
- **Bayi ağı:** Bir online mağaza yalnızca bir bayiye bağlanır; iki
  yönetici aynı anda bağlasa da iki bayiye verilmez. Bayi ya da satıcı
  silinince stok satırları, stok geçmişi ve kod eşleştirmeleri de silinir;
  satıcı silinince bağlı bayinin bağlantısı kalkar ve bayi değişmiş sayılır.
- **Stok Matrisi (elle düzeltme):** "Aynı kaydı iki kişi düzenlerse"
  kuralı stok satırı başınadır: satır ekran açıldıktan sonra değişmişse
  (başka yönetici düzeltti, dosya yüklendi) düzeltme kaydedilmez. Yeni
  satır eklenirken o ürün bu arada listeye girmişse eklenmez. Her düzeltme
  stok geçmişine "Elle" kaydı ve işlem kaydına yazılır; geçmiş kayıtları
  silinmez (KARARLAR K-103).
- **Stok Matrisi (dosya ve geri alma):** Dosya kuralları
  ([11](#11-bayi-ve-online-satıcı-stoğu)) demo moduyla aynıdır ve sunucuda yeniden
  denetlenir: tarayıcının okuduğu tablo sunucuda aynı kurallarla
  veritabanındaki ürün kodları ve kod eşleştirmeleriyle yeniden eşleşir.
  - "Aynı kaydı iki kişi düzenlerse" kuralı kaynak başınadır: önizleme
    açıldıktan sonra kaynağın stoğu değiştiyse (dosya, elle düzeltme,
    geri alma) dosya uygulanmaz. Aynı kaynağa iki dosya aynı anda gelirse
    biri uygulanır, diğeri uyarıyı alır.
  - Dosya en fazla 20.000 satır olabilir.
  - Yalnızca kaynağın en son işlemi olan dosya yüklemesi geri alınır; bu
    arada başka işlem yapıldıysa geri alınmaz.
  - Geri alma için önceki hal yalnızca son 5 dosya yüklemesinde saklanır;
    daha eski yüklemeler geri alınamaz (KARARLAR K-103).
- **Mağaza Ayarları:** Kargo ve Ödeme sekmesi tek kayıttır: ekran
  açıldıktan sonra başka bir yönetici kaydettiyse kaydedilmez. Kurallar
  demo moduyla aynıdır ve sunucuda da denetlenir: tutarlar 0 ya da artı,
  ödeme süresi en az 1 tam gün, en az bir kargo firması, her hesapta banka
  adı ve IBAN, her POS'ta etiket ve ad, en fazla bir varsayılan POS;
  metinler kırpılır, IBAN büyük harfe çevrilir, aynı kargo firması bir kez
  alınır. Kayıt sitede (sepet, ödeme) hemen geçerli olur. Listeden çıkan
  POS ya da kargo firması silinir; eski siparişler onların adını kendi
  kopyasında tutar. E-posta alıcıları için [18](#18-form-e-postaları).
- **Şirket ve İletişim (KARARLAR K-105):** Tek kayıttır. Ticari unvan,
  telefon ve geçerli e-posta zorunlu; MERSİS no 16 rakam ya da boş
  (boşluklar atılır; boşsa sözleşmede "[—]"); en az bir, en fazla 10 ofis,
  her ofiste şehir ve en az bir adres satırı (en çok 5 satır, 5 telefon);
  sosyal medya adresleri `https://` ile başlar ya da boştur (boş olan
  sitede gösterilmez). İlk ofis merkezdir: alt bilgide ve sözleşmelerin
  Satıcı bölümünde onun adresi yazar. Kayıt sitede hemen görünür. Kural
  demo modunda da geçerlidir.
  - **Örnek:** MERSİS kutusuna "0123 4567 8901 2345" yazılırsa
    "0123456789012345" kaydedilir; "123" yazılırsa kaydedilmez: "MERSİS
    numarası 16 rakamdan oluşur (boş bırakılabilir)."
- **İçerik:** Link ([13](#13-linkler-yönlendirme-ve-arama-motorları)) ve
  yayında olma ([14](#14-yayında-olma)) kuralları demo moduyla aynıdır ve
  sunucuda da denetlenir. Aynı link iki yönetici aynı anda kaydetse de iki
  haberde (etkinlikte, yazıda) kullanılmaz. Silinen kaydın eski adres
  yönlendirmeleri de silinir. SSS'te sıra değişikliği kaydı eskitmez.
  Kayıt sitede (anasayfa dahil) hemen görünür.
  - **Yasal metin:** başlık ve metin zorunlu; liste ve adresler sabittir.
  - **Sayfa SEO:** yalnızca Sayfa SEO ekranındaki sayfalar kaydedilir; iki
    alan da boş kalırsa kayıt silinir, sayfa varsayılan metne döner.
  - **Belge sayfası:** başlık zorunlu.
  - **Belge:** başlık zorunlu; seçilen ürün katalogda olmalı; parti
    numarası yalnızca parti sertifikalarında tutulur; sıra okları yalnızca
    aynı sayfadaki belgeler arasında çalışır ve kaydı eskitmez.
- **Görünüm:** Tek kayıttır. Renkler #RRGGBB biçiminde (ör. #141619);
  ara başlık puntosu 14–32, giriş paragrafı 14–26, gövde 12–22, başlık
  altı çizgi 0–160 px (tam sayı). Kural demo modunda da geçerlidir.
  Kayıt sitedeki biçimli metinlerde hemen geçerli olur.
  - **Örnek:** Gövde rengi kutusuna "#fff" yazılırsa kaydedilmez: "Gövde
    rengi #RRGGBB biçiminde olmalı (örnek: #141619)."
- **Görsel yükleme:** Veritabanı modunda dosya deposu ayarlıysa görsel
  dosyası sunucunun deposuna yüklenir ve kayda sitedeki adresi yazılır
  ([23](#23-yüklenen-dosyalar), KARARLAR K-108). Depo ayarlı değilse
  görsel dosyası yüklenmez, görsel adresi girilir (K-101). İki durumda da
  sunucu tarayıcıda tutulan dosya (`data:`) içeren kaydı reddeder. Ürün
  görsellerinde, kategori/grup kart görsellerinde, satış temsilcisi
  fotoğrafında, haber, etkinlik ve blog görsellerinde ve Hakkımızda
  görsellerinde geçerlidir.
- **Belge dosyası:** Veritabanı modunda dosya deposu ayarlıysa belge
  dosyası depoya yüklenir ([23](#23-yüklenen-dosyalar)); dosya adı,
  türü ve boyutu yüklenen dosyadan alınır. Depo ayarlı değilse dosyanın
  adresi girilir (KARARLAR K-104): adres `https://` (ya da sitedeki bir
  yol için `/`) ile başlar ve boşluk içermez; dosya adı ve türü adresin
  son parçasından alınır; boyut bilinmez, gösterilmez. Düzenlemede dosya
  seçilmezse (adres boş bırakılırsa) mevcut dosya kalır. Sitede belge o
  adreste yeni sekmede açılır.
  - **Örnek:** `https://dosya.zenweld.com/msds/ER70S-6%20Tel.pdf` → dosya
    adı "ER70S-6 Tel.pdf", türü PDF (sitede **Görüntüle**).
- Panel işlemleri yalnızca geçerli yönetici oturumuyla yapılır
  ([16](#16-üyelik-ve-oturum)); oturum bitmişse: "Panel oturumunuz kapanmış.
  Lütfen yeniden giriş yapın."

Kod: `packages/db/src/panel.ts` (ortak kurallar), `admin-sales.ts`,
`admin-requests.ts`, `admin-catalog.ts`, `admin-network.ts`,
`admin-stock.ts`, `admin-settings.ts`, `admin-content.ts`, `links.ts`,
`admin-pages.ts`, `audit.ts`; formların ortak kuralları `packages/data/src/catalog-rules.ts`,
`network-rules.ts`, `settings-rules.ts`, `content-rules.ts`; tarayıcı:
`apps/zenweld-web/src/lib/admin-panel.ts`, `admin-sales.ts`,
`admin-requests.ts`, `admin-catalog.ts`, `admin-network.ts`,
`admin-stock.ts`, `admin-settings.ts`, `admin-content.ts`, `admin-pages.ts`.

---

## 23. Yüklenen dosyalar

**Kısaca:** Veritabanı modunda dosya deposu ayarlıysa görsel (en fazla 5 MB)
ve belge (en fazla 25 MB) depoya yüklenir; tür dosyanın içeriğinden bulunur,
SVG ve HTML yüklenmez.

Veritabanı modunda panelde yüklenen görsel ve belgeler sunucunun **dosya
deposuna** yazılır (KARARLAR K-108). Depo bugün sunucunun diskidir
(`DOSYA_KLASORU`); BT başka bir depo seçerse yalnızca depo parçası
değişir. Depo ayarlı değilse panelde dosya yüklenmez, adres girilir
([22](#22-panelde-kayıt-düzenleme)). Demo modunda dosyalar tarayıcıda
tutulur; bu kurallar uygulanmaz.

- **Kim yükler:** Yalnızca geçerli panel oturumu olan yönetici. Her
  yükleme işlem kaydına yazılır (kim, ne zaman, dosyanın adı ve boyutu).
- **Türler ve boyut:**

  | Yükleme | Kabul edilen | En fazla |
  |---|---|---|
  | Görsel | JPG, PNG, WebP, GIF, AVIF | 5 MB |
  | Belge | PDF, Word (doc, docx), Excel (xls, xlsx), JPG, PNG, ZIP | 25 MB |

  Görsel önce tarayıcıda küçültülür (demo modundaki gibi), sonra yüklenir.
- **Tür dosyanın içeriğinden bulunur:** Dosyanın adı ya da tarayıcının
  bildirdiği tür yetmez. İçeriği kabul edilen türlerden biri olmayan
  dosya yüklenmez: "Bu dosya türü yüklenemez. Yüklenebilenler: …" SVG ve
  HTML hiçbir zaman yüklenmez (içlerinde kod çalışabilir).
  - **Örnek:** Adı `resim.png` olan ama içi HTML olan dosya yüklenmez.
    Adı `foto.jpg` olan ama içi PNG olan dosya PNG olarak kaydedilir.
  - Word, Excel ve ZIP aynı kabuktadır; dosyanın adı `.docx`/`.xlsx` ise o
    tür, değilse ZIP sayılır. Eski Word/Excel (`.doc`/`.xls`) yalnızca adı
    öyleyse kabul edilir.
- Boş dosya: "Dosya boş." Sınırı aşan: "Dosya çok büyük; en fazla 5 MB."
  (belgede 25 MB).
- **Adres:** Dosya `/dosya/…` adresinden sunulur; her yükleme yeni bir
  adres alır (eski dosyanın üzerine yazılmaz).
  - Görsel: `/dosya/gorsel/<yıl>/<ay>/<16 hane>.<tür>`.
  - Belge: `/dosya/belge/<yıl>/<ay>/<16 hane>/<dosya adı>`; dosya adı
    sadeleşir (Türkçe harfler, boşluk ve işaretler; en fazla 80 karakter;
    uzantı gerçek tür).
  - **Örnek:** "MSDS ER70S-6 (2026).PDF" →
    `/dosya/belge/2026/11/0123456789abcdef/MSDS-ER70S-6-2026.pdf`.
- **Sunma:** Görsel, PDF, JPG ve PNG tarayıcıda açılır; Word, Excel ve ZIP
  indirilir. Adres değişmediği için tarayıcı dosyayı bir yıl saklayabilir.
  Depoda olmayan ya da biçimi geçersiz adres "bulunamadı" (404) döner;
  depo klasörünün dışındaki bir dosya okunamaz.
- **Belge kaydı:** Belgenin dosyası depoya yüklenen dosyaysa sunucu
  dosyanın depoda olduğunu denetler ve boyutunu depodan okur; dosya
  yoksa: "Yüklenen dosya bulunamadı; dosyayı yeniden seçin."
- Kayıttan kaldırılan ya da değiştirilen görselin eski dosyası depoda
  kalır (temizliği sonraya; [YAPILACAKLAR.md](YAPILACAKLAR.md)).

Kod: `packages/data/src/file-rules.ts` (türler, boyut, adres),
`packages/db/src/file-storage.ts` (depo), yükleme ucu
`apps/zenweld-web/src/app/api/yonetim/dosya/route.ts`, sunma
`apps/zenweld-web/src/app/dosya/[...yol]/route.ts`, panel
`apps/zenweld-web/src/lib/admin-files.ts`.

---

## 24. Panel listeleri: sayfalama ve arama

Uzun panel listeleri (bugün Siparişler ve İade Talepleri) iki modda aynı
kurallarla sayfalanır. Veritabanı modunda sunucu yalnızca istenen sayfanın
kayıtlarını okur ve gönderir; demo modunda aynı hesap tarayıcıda yapılır.

- **Sayfa:** Sayfa başına 50 kayıt. Sayfa numarası adreste durur
  (`?sayfa=2`). Son sayfadan büyük bir numara son sayfayı açar.
- **Sıra:** Yeniden eskiye; aynı anda oluşanlar kayıt numarasına göre
  (büyük numara önce).
- **Süzgeç ve arama adreste:** Durum `?durum=`, arama `?ara=`. Süzgeç ya
  da arama değişince 1. sayfaya dönülür. Arama en çok 100 karakterdir.
- **Türkçe arama:** Büyük-küçük harf fark etmez; I, İ, ı ve i aynı harf
  sayılır. Diğer Türkçe harfler kendisidir (ş ile s farklıdır). `%` ve `_`
  harfiyen aranır.
  - **Örnek:** "ışık", "IŞIK" ve "işık" aramaları müşterisi "IŞIK Kaynak"
    olan siparişi bulur; "isik" bulmaz. "isparta" ve "ısparta" fatura firması
    "Isparta Ltd" olan siparişi bulur.
- **Siparişler:** Arama sipariş no, müşteri adı, e-posta ve fatura firma
  adında yapılır. Sekmelerdeki durum sayıları aramadan bağımsızdır (bütün
  siparişler).
- **İade Talepleri:** Başlıktaki "<n> talep · <n> yeni" bütün talepleri sayar.
- Testler: `tests/unit/panel-listeleri.test.ts` (demo modu) ve
  `tests/db/panel-satis.test.ts` (veritabanı) aynı örneği dener.
