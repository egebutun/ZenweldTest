# ZENWELD — Kurumsal Site ve Online Mağaza

Zenweld kaynak makineleri ve ekipmanları için kurumsal site, online mağaza ve
yönetim paneli (`/yonetim`). Next.js ile yazılmış tek bir uygulamadır
(`apps/zenweld-web`); ortak kod `packages/` altındadır.

Site iki modda çalışır; ekranlar ve kurallar ikisinde de aynıdır:

- **Demo modu** (varsayılan; yayındaki `vercel.app` adresi bu moddadır):
  veriler tarayıcıda tutulur ve yalnızca o tarayıcıda görünür. Üyelik ve panel
  girişi gerçek güvenlik sağlamaz.
- **Veritabanı modu** (`DATA_SOURCE=database`): bütün veri sunucudaki
  PostgreSQL'dedir; üyelik, sipariş, formlar ve panelin bütün işlemleri
  sunucudadır. Kod hazırdır; canlı sunucu kurulunca site bu modda yayına
  alınır (KARARLAR K-92).

Farkların listesi: [Demo ve veritabanı modu](#demo-ve-veritabanı-modu).

## Yayındaki adresler

| Site | Adres |
|---|---|
| Site | https://zenweld-test-zenweld-web.vercel.app |
| Yönetim paneli | https://zenweld-test-zenweld-web.vercel.app/yonetim |

Her gönderimde (push) Vercel siteyi yeniden derleyip yayınlar; sonuç
GitHub'da commit'in yanında görünür (Vercel ✓ ya da ✗). ✗ ise site önceki
başarılı halinde kalır. Vercel paketleri uygulama klasöründen
(`apps/zenweld-web`) kurar ve kod denetimini (ESLint) çalıştırmaz; denetim
bilgisayarda `npm run build` ile yapılır.

## Belgeler

Sitenin ve panelin bütün özellikleri, kuralları, kararları ve kalan işler
`docs/` klasöründedir. Başlangıç noktası ve belge haritası:
[docs/00-BASLA-BURADAN.md](docs/00-BASLA-BURADAN.md). Bu projede çalışan
Claude oturumlarının kuralları: [CLAUDE.md](CLAUDE.md).

Canlıya çıkmadan yapılacaklar ve kimi beklediği:
[docs/YAPILACAKLAR.md](docs/YAPILACAKLAR.md) › Canlıya giden yol.

---

## Hızlı başlangıç

```bash
# Gereksinim: Node.js 20.9+ (proje Node 22 ile geliştirildi)
npm install

# İsteğe bağlı ayarlar (boşken de çalışır); değişkenler .env.example'da anlatılır
cp apps/zenweld-web/.env.example apps/zenweld-web/.env.local

# Site → http://localhost:3000, panel → http://localhost:3000/yonetim
npm run dev:web
```

Panelin ayrı bir adresi yoktur; kendi giriş ekranı ve siteden ayrı oturumu
vardır. Ortam değişkenlerinin tamamı:
[docs/SUNUCU.md](docs/SUNUCU.md) › 2.

## Komutlar

```bash
npm run dev:web     # geliştirme sunucusu (http://localhost:3000)
npm run build       # üretim derlemesi (kod denetimini de çalıştırır)
npm run typecheck   # TypeScript kontrolü
npm run lint        # kod denetimi (ESLint)
npm test            # iş kuralları testleri (tests/unit)
npm run test:e2e    # tarayıcı testleri (tests/e2e; önce npm run build)
npm run test:db     # veritabanı testleri (tests/db; PostgreSQL gerekir)
npm run test:e2e:db # sitenin veritabanı modunda tarayıcı testleri (tests/e2e-db)
npm run db:migrate  # tabloları kurar / günceller
npm run db:reset    # bilgisayardaki veritabanını silip tabloları baştan kurar
npm run db:seed     # örnek veriyi boş veritabanına yükler (yalnızca bilgisayarda)
npm run db:yukle    # bugünkü veriyi canlı ya da deneme veritabanına yükler
npm run db:generate # şema değişince yeni geçiş betiği üretir
npm run db:studio   # tabloları tarayıcıda gösterir
npm run yonetici:olustur # veritabanında yönetici hesabı açar / şifresini değiştirir
npm run site:yenile # veritabanındaki değişikliği sitede o anda gösterir
npm run sap:stok    # SAP depo stoğunu beklemeden bir kez okutur
npm run sap:siparis # sıradaki siparişleri beklemeden SAP'a gönderir
```

Veritabanı gerektiren komutların kurulumu aşağıda
[Veritabanı](#veritabanı) bölümündedir.

---

## Demo Hesaplar

| Rol | E-posta | Şifre | Neler görebilir |
|---|---|---|---|
| **Yönetici** | `admin@zenweld.com` | `admin123` | Yalnızca yönetim paneli (`/yonetim`) |
| **Bireysel** | `bireysel@demo.com` | `demo123` | Site: online alışveriş, sipariş takibi, teklif talepleri, favoriler, garanti kayıtları |
| **Kurumsal** | `kurumsal@demo.com` | `demo123` | Bireysel ile aynı; ödemede kurumsal fatura önceden seçili gelir |

- Tarayıcı testleri giriş bilgilerini bu tablodan okur; bilgiler başka
  dosyada tutulmaz. Tablonun biçimi değişirse `tests/e2e/yardimci.ts` ›
  `demoAccount` da güncellenmelidir.
- **Test kartı (ödeme ekranı):** `4111 1111 1111 1111`. Son kullanma
  gelecekte bir ay (ör. `12/30`), CVC herhangi 3 hane, kart üzerindeki isim
  herhangi bir ad. Para çekilmez; gerçek kart bilgisi girmeyin.
- Bu hesaplar canlı veritabanına hiç yüklenmez (KARARLAR K-91); canlıda ilk
  yönetici `npm run yonetici:olustur` ile açılır.

---

## Demo ve veritabanı modu

**Demo modunda** uygulama açılınca `packages/data` içindeki örnek veri
tarayıcıya (`localStorage`, belgeler için IndexedDB) yüklenir; panelde ve
sitede yapılan her değişiklik oraya yazılır ve yalnızca o tarayıcıda görünür.
Herkesin göreceği bir değişiklik için örnek veri dosyaları
(`packages/data/src/seed/`) değiştirilir. Örnek veri ya da kayıtların şekli
değişince `packages/data/src/index.ts` › `DB_VERSION` bir artırılır;
artırılınca tarayıcılardaki veri (paneldeki değişiklikler dahil) silinip
yeniden kurulur.

**Veritabanı modunda** kayıtlar sunucudadır; panelde kaydedilen değişikliği
herkes görür, tarayıcıya örnek veri gönderilmez. Tablolar:
[docs/VERITABANI.md](docs/VERITABANI.md); sunucunun işleyişi:
[docs/SUNUCU.md](docs/SUNUCU.md).

| Konu | Demo modu | Veritabanı modu |
|---|---|---|
| Veri | Her tarayıcı örnek veriyle başlar; değişiklik yalnızca o tarayıcıda görünür | Herkes aynı veriyi görür; panelde kaydedilen değişiklik sitede de görünür |
| Üyelik ve panel girişi | Şifre tarayıcıda karşılaştırılır; gerçek güvenlik değildir | Sunucuda: şifre argon2id ile özetlenir, oturum güvenli çerezde (panel 8 saat) |
| Şifremi unuttum | Aynı mesaj çıkar, e-posta gitmez | Hesap varsa 1 saat geçerli bağlantı e-postayla gider |
| Kartla ödeme | Para çekilmez | Para çekilmez (ödeme kuruluşu bağlanana kadar); tutar, stok ve kupon sunucuda yeniden hesaplanır |
| İşlem Kaydı, E-posta Kaydı | Ekranlar menüdedir, tablo boştur ("site veritabanına bağlandığında burada listelenir") | Paneldeki her işlem ve gönderilen her e-posta listelenir |
| Mesajlar, Welders Club, Bayilik Başvuruları | Formu gönderen tarayıcının panelinde görünür (K-109) | Sunucudadır; bütün yöneticiler görür |
| Sipariş detayındaki SAP Aktarımı kutusu | Yoktur | Ödemesi kesinleşen siparişte görünür |
| Aynı kaydı iki yönetici düzenlerse | Her tarayıcının kendi kopyası vardır | Sonra kaydeden uyarı alır ("sayfayı yenileyin"), kayıt değişmez |
| Görsel ve belge yükleme | Görsel kaydın içine, belge tarayıcının dosya deposuna yazılır | `DOSYA_KLASORU` ayarlıysa sunucuya yüklenir (`/dosya/…`); değilse adres girilir |
| Favoriler, adresler | Yalnızca o tarayıcıda (favoriler üyeye değil tarayıcıya bağlı) | Üyeye bağlı; başka cihazda da aynısı görünür |
| SAP depo stoğu okuma | Yoktur; depo stoğu örnek veridir | Zamanlayıcıyla okunur (bugün deneme dosyasından) |

---

## Veritabanı

Bilgisayarda PostgreSQL 18 kurup siteyi veritabanı modunda açmak için:

```bash
# 1. PostgreSQL 18'i başlatın. Docker ile:
docker compose up -d
#    PostgreSQL 18 bilgisayarda zaten kuruluysa (Postgres.app, Homebrew)
#    Docker yerine bir kez:
#    psql -d postgres -c "CREATE ROLE zenweld LOGIN PASSWORD 'zenweld' CREATEDB"
#    psql -d postgres -c "CREATE DATABASE zenweld OWNER zenweld"
#    psql -d postgres -c "CREATE DATABASE zenweld_test OWNER zenweld"

# 2. Bağlantı adreslerini apps/zenweld-web/.env.local'a yazın:
#    DATABASE_URL=postgres://zenweld:zenweld@localhost:5432/zenweld
#    TEST_DATABASE_URL=postgres://zenweld:zenweld@localhost:5432/zenweld_test

# 3. Tabloları kurun, örnek veriyi yükleyin, testleri çalıştırın
npm run db:migrate
npm run db:seed
npm run test:db

# 4. Siteyi veritabanıyla açmak için .env.local'a DATA_SOURCE=database ekleyin
#    (derleme sırasında veritabanı çalışıyor olmalı)
npm run build
npm run start --workspace apps/zenweld-web
```

- **Giriş:** `db:seed` demo hesaplarını da yükler; yukarıdaki tablodaki
  bilgilerle girilir (ilk girişte şifre güçlü özete çevrilir).
- **Tablolara bakmak:** `npm run db:studio` tabloları tarayıcıda Excel gibi
  gösterir (https://local.drizzle.studio; veri bilgisayardan çıkmaz).
  TablePlus, Postico ya da DBeaver ile de bağlanılabilir (`DATABASE_URL`'deki
  bilgilerle).
- **Değişikliği beklemeden görmek:** Panel kaydı sayfaları kendisi yeniler.
  Veritabanında elle (ör. `db:studio`'da) yapılan değişiklik en geç bir
  dakikada görünür. Beklemeden görmek için `.env.local`'a
  `REVALIDATE_SECRET=<uzun bir değer>` yazıp siteyi başlatın, değişiklikten
  sonra `npm run site:yenile` çalıştırın. Yalnızca bir türü yenilemek için:
  `npm run site:yenile -- katalog` (türler: katalog, depo-stogu, stok,
  bayiler, yorumlar, icerik).
- **Baştan yüklemek:** `npm run db:reset`, sonra `npm run db:seed`.
- **Veritabanı modunun tarayıcı testleri:** `npm run test:e2e:db` test
  veritabanını (`TEST_DATABASE_URL`) sıfırlayıp örnek veriyi yükler, siteyi
  ayrı bir klasöre (`.next-db`) derler, 3100 portunda açıp sayfaları, satın
  almayı ve panelin ekranlarını dener. Demo derlemesi (`.next`) etkilenmez.
  `test:db` ile aynı anda çalıştırılmaz.
- **Şema değişince:** tablolar `packages/db/src/schema/`'dadır;
  `npm run db:generate` yeni geçiş betiği üretir
  (`packages/db/migrations/`). Çalışmış betik değiştirilmez.
- **Sürüm:** Hedef PostgreSQL 18 (testler 18'de); 16 ve 17'de de çalışması
  beklenir (KARARLAR K-81).
- `docker-compose.yml`'deki kullanıcı adı ve şifre yalnızca bilgisayardaki
  veritabanı içindir; sunucunun bağlantı adresi yalnızca sunucuda ortam
  değişkeni olarak durur.

### Canlı ve deneme veritabanına veri yükleme

`DATABASE_URL` o veritabanını gösterirken önce `npm run db:migrate`, sonra
`npm run db:yukle canli` (ya da `deneme`). Varsayılan olarak yalnızca eksik
kayıtlar eklenir; `guncelle` eklenirse paneldeki değişikliklerin üzerine
yazılır. Üyeler ve satış hareketleri hiç yüklenmez, hiçbir kayıt silinmez;
bilgisayar dışındaki veritabanına yüklemeden önce adı yazılarak onay verilir.
Neyin nereye yüklendiği: KARARLAR K-91 ve
[docs/SUNUCU.md](docs/SUNUCU.md) › 5.

### Yönetici hesabı

`npm run yonetici:olustur` veritabanında yönetici hesabı açar: e-posta, ad,
soyad, telefon ve şifre sorar (şifre ekranda görünmez, en az 8 karakter).
Aynı komut var olan yöneticinin şifresini değiştirir.

### SAP stok okuma

SAP bağlanana kadar depo stoğu bir CSV dosyasından okunur. `.env.local`'a
`CRON_SECRET=<uzun bir değer>` ve
`SAP_STOK_DOSYASI=../../packages/db/deneme/sap-stok.csv` yazıp siteyi
başlatın; `npm run sap:stok` dosyayı okutur ve kaç kalemin değiştiğini yazar.
Dosyada bir kalemin miktarını 0 yapıp komutu tekrar çalıştırın: o ürün
sayfada hemen STOKTA YOK olur. Dosyada olmayan kalem stoktan çıkar; hatalı
dosyada son stok kalır. Sunucuda bu iş 15 dakikada bir zamanlayıcıyla
çalışır ([docs/SUNUCU.md](docs/SUNUCU.md) › 3).

### SAP sipariş aktarımı

SAP bağlanana kadar SAP'a aktarılan siparişler bir dosyaya yazılır.
`.env.local`'a `CRON_SECRET=<uzun bir değer>` ve
`SAP_SIPARIS_DOSYASI=/tmp/zenweld-sap-siparisler.jsonl` (depo dışında bir
yol) yazıp siteyi başlatın. Kartla bir sipariş verin ya da panelde havale
siparişine **Ödeme Alındı** deyin; `npm run sap:siparis` siparişi dosyaya bir
satır olarak yazar ve panelde sipariş detayındaki SAP Aktarımı kutusu
"Aktarıldı" olur. Sunucuda bu iş birkaç dakikada bir çalışır.

### Panelden dosya yükleme

Veritabanı modunda panelde görsel ve belge yüklemek için `.env.local`'a
`DOSYA_KLASORU=/tmp/zenweld-dosyalar` (depo dışında bir klasör) yazıp siteyi
başlatın. Yüklenen dosyalar o klasöre yazılır ve sitede `/dosya/…`
adresinden açılır. Tanımlı değilse panelde dosya yerine adres girilir
([docs/IS-KURALLARI.md](docs/IS-KURALLARI.md) › 23).

---

## Proje yapısı

```
ZenweldTest/
├── apps/zenweld-web/      Site ve panel (Next.js)
│   ├── src/app/(site)/    Sitenin sayfaları
│   ├── src/app/yonetim/   Yönetim paneli
│   ├── src/app/api/       Sunucu uçları (formlar, sipariş, panel işlemleri, SAP)
│   ├── src/components/    Ekran parçaları
│   ├── src/lib/           Sayfa kodları; lib/server/ yalnızca sunucuda çalışır
│   └── public/images/     Ürün fotoğrafları (products/), kategori ve grup kartları (categories/), logo (brand/)
├── packages/
│   ├── data/              Kayıt tipleri, ortak kurallar (fiyat, kupon, stok…), örnek veri (seed/)
│   ├── db/                Veritabanı: şema, geçiş betikleri, sunucu işlemleri, komutlar
│   ├── store/             Demo modunda tarayıcıdaki veri (localStorage)
│   ├── auth/              Üyelik ve panel girişi (demo: tarayıcı; veritabanı modu: sunucu)
│   ├── i18n/              Arayüz metinleri (tr.ts)
│   ├── utils/             Biçimlendirme, link üretimi, görsel küçültme
│   └── ui/                Ortak düğme, pencere, form parçaları ve tema
├── tests/                 unit · e2e · db · e2e-db
├── scripts/               Komutların betikleri, sayfa ölçümü, ikon üretimi
├── docs/                  Belgeler
└── docker-compose.yml     Bilgisayarda PostgreSQL 18
```

## Diğer araçlar

- **Sayfa boyutu ve hız ölçümü:** site açıkken
  `node scripts/sayfa-olcumu.mjs http://localhost:3000` (birden fazla adres
  yan yana ölçülür). Son sonuçlar: [docs/YAPILACAKLAR.md](docs/YAPILACAKLAR.md)
  › Ölçüm.
- **Marka varlıkları:** logo `apps/zenweld-web/public/images/brand/`; kare
  marka işareti `assets/brand-mark.svg`; favicon ve uygulama ikonları
  `apps/zenweld-web/src/app/` (`favicon.ico`, `icon.png`, `apple-icon.png`)
  ve `public/icons/` (`icon-192.png`, `icon-512.png`); manifest
  `src/app/manifest.ts`; Android tarayıcı çubuğu rengi `viewport.themeColor`
  (`src/app/(site)/layout.tsx`, `src/app/yonetim/layout.tsx`). Marka rengi `#B82429`
  (`packages/ui/src/theme.css` › `--color-zw-red-600`). İkonları yeniden
  üretmek için `assets/brand-mark.svg`'yi değiştirip
  `node scripts/generate-icons.mjs` (favicon 16/32/48 px, `icon.png`,
  `apple-icon.png`).

## Teknoloji

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
PostgreSQL 18 + Drizzle ORM · MiniSearch · Leaflet + OpenStreetMap ·
lucide-react · ESLint · Vitest · Playwright · npm workspaces.
