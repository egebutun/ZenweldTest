# İş Kuralları — Hesaplar ve Kurallar

Bu dosya sitenin ve panelin hesaplarını ve kurallarını anlatır: fiyat ve
KDV, kampanya, seçenekli ürün, sepet ve kargo, kartla ödeme ve taksit,
havale süresi, sipariş ve teklif durumları, iade talebi, garanti, stok, ürün kodları,
linkler, yorumlar, üyelik ve form e-postaları. Ekranların tarifi bu dosyada
yoktur; yalnızca kurallar vardır.

İlgili dosyalar:

- Ekranlar: [WEBSITE-KULLANIM.md](WEBSITE-KULLANIM.md),
  [ADMIN-KULLANIM.md](ADMIN-KULLANIM.md)
- Kayıtlar ve alanlar: [VERI-MODELI.md](VERI-MODELI.md)
- Stok dosyası ve stok kurallarının ayrıntısı: [STOK.md](STOK.md)
- Ödeme kuruluşu, e-posta ve harita servisleri:
  [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md)

Kuralların koddaki yeri her bölümün sonunda yazar. Bir kural değişirse
yalnızca o yer değişmeli; site, panel ve sipariş kaydı aynı yeri kullanır.

Fiyat, kampanya, seçenek, sepet, kart ve taksit, havale süresi, garanti,
stok ve ürün kodu kuralları ile bu dosyadaki örnekler `tests/unit`
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

---

## 1. Fiyat ve KDV

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
- **Kargo:**
  - Ara toplam **ücretsiz kargo sınırına** eşit ya da büyükse 0.
  - Sepet boşsa 0.
  - Aksi halde Mağaza Ayarları'ndaki kargo ücreti.
- **Ücretsiz kargoya kalan** = sınır − ara toplam (sınır aşıldıysa 0).
- **Toplam** = ara toplam + kargo.
- Kartla taksitte vade farkı bu toplamın üstüne eklenir (bkz.
  [5](#5-kartla-ödeme-taksit-ve-banka-komisyonu)).

**Örnek:** Sınır 5.000 ₺, kargo 250 ₺. Ara toplam 4.800 ₺ → toplam 5.050 ₺,
"ücretsiz kargoya 200 ₺ kaldı". Ara toplam 5.000 ₺ → kargo ücretsiz.

Aynı hesap sepet sayfası, ödeme sayfası ve sipariş kaydında kullanılır;
müşterinin gördüğü tutar ile kaydedilen tutar hep aynıdır.

Kod: `packages/data/src/checkout.ts` › `cartTotals`,
`apps/zenweld-web/src/lib/cart.tsx`.

---

## 5. Kartla ödeme, taksit ve banka komisyonu

**Kart kontrolleri** (ödeme sayfasında):

- Kart numarası 15–19 hane ve Luhn kontrolünden geçmeli.
- Son kullanma AA/YY; kart son kullanma **ayının sonuna kadar** geçerlidir.
- CVC 3 ya da 4 hane.
- Kart markası numaranın başından anlaşılır: 4 → Visa; 51–55 ya da 22–27 →
  Mastercard; 9792 → Troy; 34 ya da 37 → American Express.

**Kart programı:**

- Taksit, kartın **programına** (Bonus, World, Maximum, Axess, CardFinans,
  Paraf, Advantage, BankkartCombo) göre yapılır.
- **Demo notu:** Program bugün kartın ilk 6 hanesinden sabit bir kuralla
  seçilir; gerçekte ödeme kuruluşunun kart (BIN) sorgusundan gelecek.

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

- Vade farkı = toplam (kargo dahil) × taksitin vade farkı oranı / 100, **tam
  liraya yuvarlanır.**
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
**hiçbir yerde saklanmaz**, e-postaya yazılmaz.

**Demo notu:** Kartla ödemede 1,5 saniyelik "3D Secure doğrulanıyor…"
beklemesinden sonra ödeme onaylanmış sayılır; para çekilmez.

Kod: `packages/data/src/checkout.ts` (`posForCard`, `cardInstallments`,
`installmentQuote`), `apps/zenweld-web/src/lib/payment.ts`.

---

## 6. Havale / EFT

- Havaleyle verilen sipariş **Ödeme Bekleniyor** durumunda açılır.
- **Son ödeme** = sipariş anı + Mağaza Ayarları'ndaki gün sayısı (örnek
  değer 3 gün).
- Süre son ödeme **gününün sonunda** (23:59:59) dolar.
  - **Örnek:** Pazartesi 15:00'te verilen siparişte, süre 3 gün ise son
    ödeme Perşembe'dir; sipariş Perşembe 23:59'a kadar onaylanabilir.
- Süresi dolan sipariş "Ödeme süresi doldu" notuyla **İptal** edilir ve
  artık onaylanamaz.
- Ödeme hesaba geçince panelde **Ödeme Alındı** denir; sipariş
  Hazırlanıyor'a geçer ve ödeme tarihi yazılır.
- Müşteri ödeme açıklamasına sipariş numarasını yazar.
- **Demo notu:** Süre kontrolü sipariş sayfaları (müşterinin Siparişlerim
  sayfası ve panel) açılınca yapılır. Gerçek sistemde her gün çalışan
  zamanlanmış bir görev yapmalıdır.

Kod: `packages/store/src/repo/commerce.ts` (`isTransferExpired`,
`cancelExpiredTransfers`, `markOrderPaid`).

---

## 7. Sipariş durumları

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
- Teslim edilmiş ya da iptal edilmiş sipariş iptal edilemez.
- İptal nedenini müşteri görür. Ödemesi alınmış siparişin iadesi banka ya da
  ödeme kuruluşu üzerinden **ayrıca** yapılır; sistem iade yapmaz.
- Müşteri sitede siparişini iptal edemez (bugün düğme yok; ileride
  düşünülecek, [YAPILACAKLAR.md](YAPILACAKLAR.md)).
- Sipariş kaydı ürün adı, kodu, seçenek adı, birim fiyat ve KDV oranını
  sipariş anındaki haliyle saklar ([VERI-MODELI.md](VERI-MODELI.md)).
- Durum değişince müşteriye e-posta **gitmez**.

Kod: `packages/store/src/repo/commerce.ts`.

**İade (cayma) talebi:**

- Yalnızca **bireysel üye**, yalnızca **Teslim Edildi** durumundaki siparişi
  için açar; kurumsal üyede yoktur ([KARARLAR.md](KARARLAR.md) K-65).
- **Süre:** Teslim gününden itibaren **14 gün**; son gün 23:59'a kadar.
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

Kod: `packages/data/src/returns.ts`, `packages/store/src/repo/returns.ts`.

---

## 8. Teklif

**Kim:** Herkes (üye ya da ziyaretçi) teklif isteyebilir. Üye gönderirse
teklif Hesabım › Tekliflerim'de görünür.

**Ürünler:**

- Yalnızca yayında ve "Teklife açık" işaretli ürünler seçilebilir.
- Seçenekli ürün her seçeneğiyle ayrı satırdır.
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

Kod: `apps/zenweld-web/src/app/(site)/teklif-al/page.tsx`,
`packages/store/src/repo/commerce.ts`.

---

## 9. Servis talebi

- Herkes servis talebi oluşturabilir; üyede bilgiler hesaptan gelir.
- Talep nedeni en az bir tanedir: Kurulum, Bakım, Onarım, Kullanım/Bakım
  Eğitimi.
- Durumlar: Yeni → İşlemde → Tamamlandı; panelde istenen duruma geçilir.
- Servis talebi müşterinin Hesabım sayfasında görünmez; müşteriye e-posta
  gitmez.

---

## 10. Garanti

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
- Bitiş yalnızca tarihtir (saat yok) ve yerel tarihe göre hesaplanır.
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

Kod: `packages/store/src/repo/warranties.ts`,
`packages/utils/src/format.ts` › `addMonthsToDate`.

---

## 11. Bayi ve online satıcı stoğu

Ayrıntı: [STOK.md](STOK.md). Özet:

**Stokta sayılmak:**

- Bir stok satırı sitede "stokta" sayılır: **adet > 0** ve satır, **stok
  geçerlilik süresinden** eski değil (Stok Matrisi'nde ayarlanır; örnek değer
  3 gün; 0 = süre sınırı yok).
- Zenweld'in kendi deposu bu hesapta yoktur; sitede **her ürün her zaman
  satıştadır** (stok sepete eklemeyi etkilemez).

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
`apps/zenweld-web/src/components/admin/product/OptionsTab.tsx`
(`productCodeError`, `optionsError`).

---

## 13. Linkler, yönlendirme ve arama motorları

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
  (`/urun/mig-torcu-mb25-4m` → `/urun/mig-torcu-mb25?secenek=4-m`).
- Yeni link başka bir kaydın eski linkiyse eski yönlendirme kalkar; link yeni
  kaydı açar.
- Ürün, blog, haber ve etkinlikte yalnızca **yayındaki** kayda yönlendirilir.
- **Demo notu:** Yönlendirme bugün tarayıcıda yapılıyor; gerçek sistemde
  sunucuda **301 (kalıcı)** yönlendirme olmalı
  ([YAPILACAKLAR.md](YAPILACAKLAR.md)).

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

- Yorumu herkes yazabilir; puan (1–5), ad ve yorum zorunludur.
- Yeni yorum **onay bekler**; panelde onaylanmadan sitede görünmez.
- Yorumlar ürüne bağlıdır; seçenekli üründe bütün seçenekler aynı yorumları
  gösterir.
- **Ortalama puan:** Onaylı yorumların ortalaması, bir ondalığa yuvarlanır.
- **Anasayfa şeridi:** Panelde "Anasayfada göster" denen, onaylı ve ürünü
  yayında olan yorumlar; en yeniden eskiye, **en fazla 10**. Sınır dolunca
  yenisi eklenemez. Yayından kaldırılan yorum şeritten de çıkar.
- Video en fazla 2 MB; fotoğraflar otomatik küçültülür.
- **Demo notu:** Giriş yapmış üyenin yorumu "Doğrulanmış alıcı" sayılır;
  gerçekte üyenin o ürünü satın almasıyla eşleşmeli.

Kod: `packages/store/src/repo/reviews.ts`.

---

## 16. Üyelik ve oturum

- **Roller:** Bireysel, Kurumsal, Yönetici.
  - Bireysel ve kurumsal üye sitede aynı işlemleri yapar; kurumsal üyede
    kayıtta firma bilgisi istenir, ödemede fatura türü kurumsal gelir, Teklif
    Al'da firma ünvanı zorunludur.
  - Yönetici yalnızca panele girer; sitede giriş yapamaz ("hesap bulunamadı"
    denir, yönetici e-postaları ele verilmez).
  - Bayiler sitenin üyesi değildir (karar, [KARARLAR.md](KARARLAR.md)).
- **Kayıt:** E-posta benzersizdir (büyük/küçük harf duyarsız), şifre en az 6
  karakter. Yeni üye **hemen aktiftir**; panelden onay gerekmez (karar).
- **Oturumlar:** Site ve panelin oturumu ayrıdır; birinden çıkmak diğerini
  etkilemez.
- **Askıya alma:** Askıdaki üye giriş yapamaz ("Hesabınız askıya alınmış.
  Lütfen bizimle iletişime geçin."); açık oturumu hemen kapanır.
- **Son yönetici:** Son aktif yöneticinin rolü düşürülemez, askıya alınamaz
  ve silinemez. Yönetici kendi rolünü değiştiremez ve kendini askıya alamaz.
- **Şifre değiştirme (Hesabım › Profil):** Mevcut şifre doğru olmalı; yeni
  şifre en az 6 karakter ve tekrarıyla aynı olmalı. Oturum açık kalır.
- **Üye silinince:** Kayıtlı adresleri de silinir; siparişleri, teklifleri,
  servis talepleri, iade talepleri, garanti kayıtları ve yorumları kalır.
  - Yönetici panelden siler ya da üye kendi hesabını Hesabım › Profil ›
    **Hesabımı Sil**'den siler (şifresiyle onaylar); sonuç aynıdır.
  - Kendi hesabını silen üyenin oturumu kapanır. Aynı e-postayla yeniden üye
    olunabilir.
- **Sipariş:** Yalnızca üye verebilir. Teklif, servis talebi, garanti kaydı
  ve yorum için üyelik gerekmez.
- **Adres:** Üyenin ilk adresi varsayılandır; varsayılan silinince kalan ilk
  adres varsayılan olur.
- **Demo notu:** Şifreler tarayıcıda basit bir özetle karşılaştırılır; gerçek
  sistemde kimlik doğrulama ve şifre özeti sunucuda olmalı.

Kod: `packages/auth/src/auth-context.tsx`, `packages/store/src/repo/users.ts`.

---

## 17. Kayıt numaraları

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

Kod: `packages/store/src/repo/shared.ts` › `nextCode` (sipariş, teklif,
servis talebi ve iade talebi aynı yeri kullanır).

---

## 18. Form e-postaları

Sitedeki formlar `info@zenweld.com` adresine e-posta gönderir. Servisin
kurulumu ve demo davranışı: [ENTEGRASYONLAR.md](ENTEGRASYONLAR.md).

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
  gösterir; ziyaretçi tekrar deneyebilir.
- Sipariş e-postasına T.C. kimlik no ve kart bilgisi yazılmaz.
- Panelden müşteriye hiçbir e-posta gitmez; bülten kaydı ve "Şifremi
  Unuttum" bugün hiçbir yere gitmez.

**Formlar:**

| Form | Konu | Alanlar | Panelde kaydı |
|---|---|---|---|
| İletişim | "İletişim formu — <konu ya da ad>" | Ad Soyad, E-posta, Telefon, Konu; Mesaj | — |
| Teklif Al | "Yeni teklif talebi — <no> — <firma ya da yetkili>" | Teklif no, Firma, Yetkili, E-posta, Telefon, Vergi no, Şehir, Ürünler ("adet × ad (seçenek) · kod"), Ödeme tercihi; Not | Teklifler |
| Servis Talebi | "Yeni servis talebi — <no> — <makine>" | Talep no, Makine, Talep konusu, Firma / Ad Soyad, Yetkili, E-posta, Telefon, Yetkili GSM, Adres, İlçe, Şehir; Şikayet / açıklama | Servis Talepleri |
| Garanti Kaydı | "Yeni garanti kaydı — <model> (<seri no>)" | Model, Seri no, Ad Soyad, E-posta, Telefon, Şehir, Posta kodu, Adres, Satıcı VKN, 12 ay uzatma isteği | Garantiler |
| Ürün yorumu | "Yeni ürün yorumu — <ürün>" | Ürün, Yazan, Puan, Başlık, Fotoğraf / video; Yorum | Yorumlar (onay bekler) |
| Üye Ol | "Yeni üye — <ad> (<tür>)" | Ad Soyad, E-posta, Telefon, Şehir, Üyelik, Firma, Bülten izni | Üyeler |
| Sipariş | "Yeni sipariş — <no> — <toplam>" | Sipariş no, Müşteri, E-posta, Telefon, Ürünler (adet × ad (seçenek) — tutar), Toplam, Ödeme, Teslimat adresi, Fatura (kurumsalda firma, vergi dairesi, VKN; bireyselde ad); Müşteri notu | Siparişler |
| İade talebi | "Yeni iade talebi — <talep no> — <sipariş no>" | Talep no, Sipariş no, Müşteri, E-posta, Telefon, Ürünler (adet × ad (seçenek) — kod), Neden; Açıklama | İade Talepleri |
| Welders Club | "Welders Club katılım — <ad>" | Ad, E-posta, Şehir | — |
| Bayilik Başvurusu | "Bayilik başvurusu — <firma>" | Firma unvanı, Vergi dairesi / no, Şehir, Faaliyet alanı, Sektördeki yıl, Çalıştığı markalar, Showroom var mı, Servis kabiliyeti, Yetkili kişi, E-posta, Telefon, Not. Sunucu firma ve e-posta olmadan kabul etmez | — |
| Ürün destek sorusu | "Ürün destek talebi — <ürün> (<kod>)" | Ürün, Ürün kodu, Ürün sayfası, Ad Soyad, E-posta, Telefon, Üye mi; Soru. Sunucu soru ve (e-posta ya da telefon) olmadan kabul etmez | — |

(";" sonrası, e-postada tablonun altında uzun metin olarak gösterilen alan.)

Kod: `apps/zenweld-web/src/app/api/bildirim/route.ts`,
`apps/zenweld-web/src/app/api/bayilik/route.ts`,
`apps/zenweld-web/src/app/api/destek/route.ts`,
`apps/zenweld-web/src/lib/notify.ts`, `apps/zenweld-web/src/lib/server/mail.ts`.
