# CLAUDE.md — Bu projede çalışma kuralları

## Proje

Zenweld kaynak makineleri için kurumsal site, online mağaza ve yönetim paneli
(`/yonetim`). Next.js monorepo; bugün **demo**: backend yok, veriler
tarayıcıda tutulur.

İşe başlamadan önce [docs/00-BASLA-BURADAN.md](docs/00-BASLA-BURADAN.md)
okunur; hangi bilginin hangi dosyada olduğu orada yazar.

## Çalışma şekli

- Yanıtlar **Türkçe** ve sade dille verilir.
- Büyük bir değişiklikten önce ne yapılacağı açıklanır ve **onay alınır**.
- İş madde madde ilerler; her adımdan sonra sonuç gösterilir, onay gelince
  sonrakine geçilir.
- Söylenmeyen şey kendiliğinden yapılmaz. Akla gelen bir iyileştirme varsa
  öneri olarak sorulur.
- Bir şey silinmeden önce söylenir. Gereksiz kod bırakılmaz.
- [docs/KARARLAR.md](docs/KARARLAR.md)'deki kararlar bilerek alınmıştır;
  sahibine sorulmadan değiştirilmez, "düzeltilmez".

## Belgeleri güncel tutma

Sitede ya da panelde bir şey eklendiğinde, değiştiğinde ya da kaldırıldığında
ilgili belge **aynı commit'te** güncellenir:

| Değişiklik | Güncellenecek dosya |
|---|---|
| Sitedeki davranış | `docs/WEBSITE-KULLANIM.md` |
| Panel ekranı | `docs/ADMIN-KULLANIM.md` |
| Veri alanı ya da kayıt türü | `docs/VERI-MODELI.md` |
| Veritabanı tablosu ya da kolonu | `docs/VERITABANI.md` |
| Hesap ve kurallar (fiyat, taksit, stok, kod, link…) | `docs/IS-KURALLARI.md` |
| Dış servisler ve ortam değişkenleri | `docs/ENTEGRASYONLAR.md` |
| Sahibin verdiği yeni karar | `docs/KARARLAR.md` (yeni K numarası ve tarihle) |
| Doğrulanabilir yeni davranış | `docs/KABUL-KONTROL-LISTESI.md` |
| Stok dosyası biçimi | `docs/STOK.md` |
| Sonraya kalan iş | `docs/YAPILACAKLAR.md` |
| Kurulum, komutlar, demo hesaplar | `README.md` |

- Belgeler hafızadan değil, **koda bakılarak** yazılır.
- Kodla belge arasında uyuşmazlık görülürse sahibine söylenir.
- Tasarım (renk, yerleşim, yazı tipi) belgelere yazılmaz; davranış yazılır.

## Teknik kurallar

- **Veri sürümü:** Örnek veri (`packages/data/src/seed/`) ya da kayıtların
  şekli değişince `packages/data/src/index.ts` içindeki `DB_VERSION` bir
  artırılır. Artırılmazsa tarayıcılardaki eski veri kalır; artırılınca demo
  tarayıcılarındaki panel değişiklikleri silinir.
- **Veritabanı şeması:** Tablolar `packages/db/src/schema/`'dadır. Şema
  değişince `npm run db:generate` ile yeni geçiş betiği üretilir (çalışmış
  betikler değiştirilmez), `docs/VERITABANI.md` aynı commit'te güncellenir ve
  `npm run test:db` çalıştırılır.
- **Metinler:** Arayüz metinleri `packages/i18n/src/tr.ts`'tedir.
- **Dil:** Site ve panel yalnızca Türkçedir (anasayfadaki "Hot Sale" hariç).
- **"Demo" yazısı:** Sitede ve panelde sitenin demo olduğunu gösteren yazı
  geçmez (ürün tanıtımı anlamındaki "demo" kalır; KARARLAR K-02).
- **Komutlar:**
  - `npm run dev:web`: geliştirme sunucusu, http://localhost:3000.
  - `npm run build`: üretim derlemesi.
  - `npm run typecheck`: TypeScript kontrolü.
  - `npm run lint`: kod denetimi (ESLint). `npm run build` de çalıştırır;
    hata varsa derleme durur.
  - `npm test`: iş kuralları testleri (`tests/unit`).
  - `npm run test:e2e`: tarayıcı testleri (`tests/e2e`); önce `npm run build`.
  - `npm run test:db`: veritabanı testleri (`tests/db`); çalışan PostgreSQL ve
    `TEST_DATABASE_URL` gerekir (README › Veritabanı).
  - `npm run test:e2e:db`: sitenin veritabanı modunda tarayıcı testleri
    (`tests/e2e-db`); test veritabanını kurar, siteyi `.next-db`'ye derler,
    testleri çalıştırır. `test:db` gibi PostgreSQL ve `TEST_DATABASE_URL`
    gerekir.
  - `npm run db:migrate` / `db:reset` / `db:seed` / `db:generate` / `db:studio`:
    tabloları kurar / bilgisayardaki veritabanını sıfırlar / örnek veriyi
    boş veritabanına yükler / şema değişince yeni geçiş betiği üretir /
    tabloları tarayıcıda gösterir. Hedef sürüm PostgreSQL 18.
  - `npm run db:yukle <canli|deneme> [guncelle]`: bugünkü veriyi canlı ya da
    deneme veritabanına yükler (KARARLAR K-91; varsayılan yalnızca eksik
    kayıtları ekler, `guncelle` paneldeki değişikliklerin üzerine yazar;
    satış hareketleri hiç yüklenmez, hiçbir kayıt silinmez).
  - `npm run yonetici:olustur`: veritabanında yönetici hesabı açar ya da
    yöneticinin şifresini değiştirir (şifre ekranda görünmez).
  - `npm run site:yenile` / `npm run sap:stok` / `npm run sap:siparis`:
    çalışan siteyi beklemeden yeniler / SAP depo stoğunu bir kez okutur /
    sıradaki siparişleri SAP'a gönderir (`REVALIDATE_SECRET` /
    `CRON_SECRET`).
- **Testler:** `tests/unit`, `docs/IS-KURALLARI.md`'deki kuralları ve
  örnekleri dener; `tests/e2e` sitenin ve panelin tarayıcıda çalıştığını
  dener (sayfa taraması, ödeme, seçenekler, filtreler, teklif, belgeler, garanti, hesap, iade, depo stoğu, kupon, ekran genişlikleri). Bir kural ya da
  ekran değişince ilgili test de aynı commit'te güncellenir.
- **Doğrulama:** Her değişiklikten sonra typecheck, lint, test ve build
  çalıştırılır; davranış değiştiyse tarayıcı testleri de. Veritabanından
  okuma ya da yazma değiştiyse `test:db` ve `test:e2e:db` de.
  Davranış değiştiyse kontrol listesindeki ilgili maddeler denenir.
- **Yayın:** Gönderimden (push) sonra Vercel yayınının başarılı olduğu
  kontrol edilir (GitHub'da commit'in yanındaki Vercel durumu). Başarısızsa
  iş bitmiş sayılmaz; neden bulunup düzeltilir.

## Güvenlik

- POS API anahtarı ve şifresi ile e-posta servisinin anahtarı yalnızca
  sunucuda ortam değişkeni olarak durur. Panelde, veride, tarayıcıda ve
  GitHub'da yer almaz.
- Ekran görüntülerindeki gerçek üye işyeri (mağaza) numaraları kullanılmaz.
- Demo hesapların giriş bilgileri ve test kartı **yalnızca README'de** yazar;
  başka dosyaya eklenmez.
- Demo modunda panel ve üyelik girişi gerçek güvenlik sağlamaz. Veritabanı
  modunda giriş, oturum ve panelin bütün işlemleri sunucudadır (Aşama 4 ve
  5): her işlem yönetici oturumuyla denetlenir ve işlem kaydına yazılır.
  Canlıya çıkmadan `docs/YAPILACAKLAR.md`'deki backend maddeleri
  yapılmalıdır.

## Git

- Yalnızca sahibin belirttiği dala gönderilir. İstenmedikçe PR açılmaz.
- Commit mesajı Türkçedir; ne yapıldığını ve nedenini anlatır.
