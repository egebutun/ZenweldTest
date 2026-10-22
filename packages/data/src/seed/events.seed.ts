import type { NewsItem, ZenweldEvent } from "../types";
import { stockPhotos } from "./images";

/**
 * ETKINLIK TAKVIMI
 *
 * Veriler Zenweld'in katildigi gercek fuarlardan derlendi.
 * Logolar: apps/zenweld-web/public/images/events/<slug>.png
 * Fotograflar: apps/zenweld-web/public/images/events/<slug>/1.jpg ...
 *
 * Basliklar, tarihler, mekanlar ve aciklamalar Zenweld tarafindan
 * iletilen resmi metinlerden alinmistir.
 *
 * Aciklama metinlerinde hafif bir isaretleme kullanilir (bkz. RichText):
 *   "## Baslik"  -> ara baslik
 *   "- Madde"    -> madde isaretli liste
 *   "**kalin**"  -> kalin metin
 */

/**
 * Etkinlik logosu. Yuklenen dosyalarin cogu webp'ye cevrildi
 * (scripts/optimize-images.mjs); kucuk olanlar PNG olarak kaldi.
 * Dosya bulunamazsa ProductImage diger uzantilari da dener.
 */
const logo = (slug: string, ext: "webp" | "png" = "webp") =>
  `/images/events/${slug}.${ext}`;

export const events: ZenweldEvent[] = [
  {
    id: "e-big5-global-2025",
    slug: "big-5-global-2025",
    title: "Big 5 Global 2025",
    summary: "Big 5 Global, dünyanın en büyük ve en prestijli yapı ve inşaat fuarı.",
    description: `Zenweld, Big 5 Global 2025 Fuarında!

Zenweld olarak, yapı ve inşaat sektörünün en büyük küresel etkinliklerinden biri olan Big 5 Global 2025 fuarında yer almaktan büyük heyecan duyuyoruz! Bu prestijli fuarda, en yeni kaynak çözümlerimizi ve sektöre yön veren ürünlerimizi uluslararası katılımcılarla buluşturacağız.

## Big 5 Global Neden Önemli?

Big 5 Global, yapı ve inşaat sektörünün en büyük buluşma noktalarından biridir. Dünya genelinden 75.000'den fazla ziyaretçi ve 2.000'in üzerinde katılımcı firma ile 45 yılı aşkın süredir sektör profesyonellerine iş geliştirme ve yeni pazar fırsatları sunmaktadır. Orta Doğu, Afrika ve Asya pazarlarına giriş yapmak isteyen firmalar için eşsiz bir platform sunan bu fuar, özellikle büyük altyapı ve mega projelerle dikkat çekmektedir.

Zenweld olarak, bu büyük organizasyonda kaynak teknolojileri ve ekipmanları alanındaki yenilikçi çözümlerimizi sergilemek ve sektördeki profesyonellerle güçlü iş bağlantıları kurmak için sizleri standımıza bekliyoruz.

## Standımızda Sizleri Neler Bekliyor?

- **Yüksek Performanslı Kaynak Makineleri:** Güvenilir, enerji verimli ve zorlu projelerde üstün performans sunan kaynak makinelerimizi yakından inceleyin.
- **İnovatif Kaynak Çözümleri:** Büyük altyapı projeleri ve endüstriyel uygulamalar için geliştirilmiş yenilikçi ürünlerimizi keşfedin.
- **Uygulamalı Demo Gösterileri:** Uzman ekibimiz tarafından gerçekleştirilecek canlı demo gösterileri ile ürünlerimizi iş başında görün.
- **Yeni İş Fırsatları:** Suudi Arabistan, BAE, Afrika ve Asya pazarlarına yönelik yeni iş ortaklıkları ve projeleri için fırsatlar yakalayın.
- **Teknik Danışmanlık:** Kaynak süreçlerinizi daha verimli hale getirmek için uzman ekibimizden teknik destek ve danışmanlık alın.

## Zenweld ile Yapı Sektöründe Geleceği Şekillendirin!

Big 5 Global 2025, sadece bir fuar değil; yeni iş bağlantıları kurmak, sektör trendlerini takip etmek ve markanızı uluslararası arenada güçlendirmek için bir fırsat platformudur. Zenweld olarak, bu fuarda "Geleceğin Kaynak Teknolojilerini" sergileyecek ve sektörün ihtiyaçlarına yönelik çözümler sunacağız.

## Dubai'de Görüşmek Üzere!

Bizi standımızda ziyaret edin ve geleceğin kaynak teknolojilerini birlikte keşfedelim.`,
    startDate: "2025-11-24",
    endDate: "2025-11-27",
    venue: "Dubai World Trade Centre",
    city: "Dubai",
    country: "Birleşik Arap Emirlikleri",
    logoUrl: logo("big-5-global-2025"),
    images: [stockPhotos.factoryLine, stockPhotos.industrialShop],
    active: true,
  },
  {
    id: "e-international-hardware-riyadh-2025",
    slug: "international-hardware-riyadh-2025",
    title: "International Hardware Riyadh",
    summary: "International Hardware Riyadh 2025, Orta Doğu'nun en büyük donanım, el aletleri, yapı malzemeleri ve endüstriyel ekipman fuarlarından biridir.",
    description: `Zenweld olarak, Orta Doğu'nun en prestijli etkinliklerinden biri olan International Hardware Riyadh 2025 fuarında yerimizi alıyoruz!

Suudi Arabistan'ın Vision 2030 hedefleri doğrultusunda hızla büyüyen donanım ve yapı malzemeleri sektöründe, en yenilikçi kaynak çözümlerimizi sergilemek için bu önemli fuarda sizlerle buluşuyoruz.

## Standımızda sizleri neler bekliyor?

- **Yüksek Performanslı Kaynak Makineleri** – Fark yaratan teknolojilerle geliştirilmiş, iş süreçlerinizi daha verimli hale getirecek ürünlerimizi keşfedin.
- **Uygulamalı Demo Gösterileri** – Profesyonel ekibimiz, ürünlerimizi fuar boyunca canlı demo gösterileriyle tanıtacak.
- **Yeni İş Fırsatları** – Bölgedeki büyük altyapı projeleri ve artan pazar talebine yönelik çözümlerimizi değerlendirin.

## Zenweld ile Riyad'da Geleceğin Kaynak Teknolojilerini Keşfedin!

Bölgedeki güçlü bağlantılar kurmak, iş fırsatlarını yakalamak ve sektöre yön veren yenilikçi çözümlerimizi görmek için standımıza bekliyoruz.

Daha fazla bilgi için bizimle iletişime geçin ve fuar boyunca bizi ziyaret etmeyi unutmayın!`,
    startDate: "2025-06-16",
    endDate: "2025-06-18",
    venue: "Riyadh International Convention and Exhibition Center",
    city: "Riyad",
    country: "Suudi Arabistan",
    logoUrl: logo("international-hardware-riyadh-2025"),
    images: [stockPhotos.industrialShop, stockPhotos.teamTalk],
    active: true,
  },
  {
    id: "e-win-eurasia-2025",
    slug: "win-eurasia-2025",
    title: "Win Eurasia 2025 Otomasyon ve Makine Teknolojileri Fuarı",
    summary: "Avrasya Bölgesi'nin lider endüstri fuarı olarak 30 yıldır imalat sanayinin rotasını çizen WIN EURASIA Otomasyon ve Makine Teknolojileri Fuarı.",
    description: `Zenweld, WIN EURASIA 2025 Fuarında Sizi Bekliyor!

Zenweld olarak, kaynak teknolojilerindeki yenilikçi çözümlerimizi ve sektöre yön veren ürünlerimizi WIN EURASIA 2025 fuarında sizlerle buluşturuyoruz!

## Bu yıl fuarda ziyaretçilerimizi birçok yenilik bekliyor!

- **Yeni Nesil Kaynak Makineleri** – Performansı artıran, enerji tasarrufu sağlayan ve endüstriyel standartlara uygun en güncel modellerimizi keşfedin.
- **İnovatif Kaynak Ekipmanları ve Aksesuarlar** – İşlerinizi daha verimli hale getirecek en son teknolojik ekipmanları inceleyin.
- **Uygulamalı Demo Gösterileri** – Uzman ekibimiz, ürünlerimizi fuar boyunca canlı demo gösterileriyle tanıtacak. Kaynak çözümlerimizi bizzat deneyimleyin.
- **Sürpriz Fırsatlar ve Kampanyalar** – Fuar boyunca standımızda ziyaretçilerimize özel kampanya ve avantajlardan yararlanın.

## Zenweld ile Geleceğin Kaynak Teknolojilerini Keşfetmek İçin Bizi Ziyaret Edin!

Fuar boyunca, sektörel iş birlikleri, teknik danışmanlık ve ürün tanıtımları için uzman ekibimiz sizleri ağırlamaktan memnuniyet duyacak.`,
    startDate: "2025-05-28",
    endDate: "2025-05-31",
    venue: "İstanbul Fuar Merkezi (IFM)",
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2025", "png"),
    images: [stockPhotos.factoryLine, stockPhotos.engineer, stockPhotos.teamTalk],
    active: true,
  },
  {
    id: "e-imatech-2025",
    slug: "imatech-2025",
    title: "İmatech 2025 — 3. Endüstriyel Üretim Teknolojileri Fuarı",
    summary: "Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz!",
    description: `Zenweld Olarak İmatech 2025 Fuarındayız!

Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz!

Yeni nesil kaynak çözümlerimizi, inovatif ürünlerimizi ve sektördeki en güncel teknolojik gelişmeleri keşfetmek için standımıza bekliyoruz. Sektör profesyonelleri ile buluşup güçlü iş bağlantıları kurmayı hedeflediğimiz bu fuarda, Zenweld'in farkını yakından deneyimleme fırsatı yakalayın.

## Zenweld ile Kaynakta Geleceği Şekillendirin!

Detaylar ve fuar sonrası haberler için bizi takip edin!`,
    startDate: "2025-02-20",
    endDate: "2025-02-23",
    venue: "Fuar İzmir",
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2025"),
    images: [stockPhotos.engineer, stockPhotos.metalWork],
    active: true,
  },
  {
    id: "e-istanbul-hirdavat-2024",
    slug: "istanbul-hirdavat-fuari-2024",
    title: "2024 Uluslararası İstanbul Hırdavat Fuarı",
    summary: "Yeni ürünlerimizi görmek ve sektördeki en son yenilikleri keşfetmek için standımıza bekliyoruz.",
    description: `Zenweld olarak, 20-23 Kasım 2024 tarihlerinde düzenlenecek olan Uluslararası İstanbul Hırdavat Fuarı'nda yerimizi alıyoruz. Bu prestijli etkinlik, hırdavat sektöründeki en son yeniliklerin sergilendiği, yerel ve uluslararası katılımcıların bir araya geldiği önemli bir platformdur. Standımızda, ileri teknoloji kaynak ekipmanlarımız ve yenilikçi ürünlerimizle fuar katılımcılarıyla buluşacağız.

Fuar süresince teknik ekibimiz, ürünlerimizin özelliklerini tanıtacak, uygulama çözümleri sunacak ve sektördeki en son gelişmeleri sizlerle paylaşacak. Sektördeki uzmanlığımızı ve deneyimimizi birinci elden görmek isteyen tüm profesyonelleri standımıza davet ediyoruz.

İstanbul Hırdavat Fuarı, sektördeki iş ortaklarıyla tanışmak ve yeni iş fırsatları yaratmak için mükemmel bir fırsat sunuyor. Zenweld olarak, bu değerli etkinlikte sizleri ağırlamaktan memnuniyet duyarız.`,
    startDate: "2024-11-20",
    endDate: "2024-11-23",
    venue: "İstanbul Fuar Merkezi (IFM)",
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("istanbul-hirdavat-fuari-2024"),
    images: [stockPhotos.toolsFlatlay, stockPhotos.workshop],
    active: true,
  },
  {
    id: "e-win-eurasia-2024",
    slug: "win-eurasia-2024",
    title: "WIN Eurasia — Endüstri Fuarı",
    summary: "Zenweld Kaynak ve Kesme Makineleri olarak, 2024 yılı 05-08 Haziran tarihleri arasında İstanbul'da düzenlenecek olan Win Eurasia 2024 Endüstri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.",
    description: `Zenweld Win Eurasia 2024 Endüstri Fuarında!

Zenweld Kaynak ve Kesme Makineleri olarak, 2024 yılı 05-08 Haziran tarihleri arasında İstanbul'da düzenlenecek olan Win Eurasia 2024 Endüstri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.

Fuar boyunca, en son teknoloji kaynak ve kesme makinelerimizi siz değerli ziyaretçilerimizle buluşturmaktan mutluluk duyacağız. Deneyimli ekibimiz, ihtiyaçlarınıza en uygun çözümleri sunmak için fuar boyunca standımızda hazır olacak.

## Fuar standımızda sizleri neler bekliyor?

- En son teknoloji kaynak ve kesme makinelerimiz
- Canlı demolar
- Uzman ekibimizden ücretsiz danışmanlık
- Özel fuar indirimleri

## Zenweld standını ziyaret ederek:

- İhtiyaçlarınıza en uygun kaynak ve kesme makinesini bulabilirsiniz.
- Makinelerimiz hakkında detaylı bilgi alabilirsiniz.
- Uzman ekibimize danışabilirsiniz.
- Özel fuar indirimlerinden yararlanabilirsiniz.

Win Eurasia 2024 Endüstri Fuarı'nı ziyaret etmeyi planlıyorsanız, Zenweld standını (Salon 5, Stand C-100) ziyaret etmeyi unutmayın!`,
    startDate: "2024-06-05",
    endDate: "2024-06-08",
    venue: "İstanbul Fuar Merkezi (IFM)",
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2024", "png"),
    images: [stockPhotos.factoryLine],
    active: true,
  },
  {
    id: "e-konya-makine-2024",
    slug: "konya-makine-teknolojileri-fuari-2024",
    title: "Konya Makine Teknolojileri Fuarı",
    summary: "Zenweld Kaynak ve Kesme Makineleri olarak, 2024 yılı 8-11 Mayıs tarihleri arasında Konya'da düzenlenecek olan Konya Makine Teknolojileri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.",
    description: `Fuar boyunca, en son teknoloji kaynak ve kesme makinelerimizi siz değerli ziyaretçilerimizle buluşturmaktan mutluluk duyacağız. Deneyimli ekibimiz, ihtiyaçlarınıza en uygun çözümleri sunmak için fuar boyunca standımızda hazır olacak.

## Fuar standımızda sizleri neler bekliyor?

- En son teknoloji kaynak ve kesme makinelerimiz
- Canlı demolar
- Uzman ekibimizden ücretsiz danışmanlık
- Özel fuar indirimleri

## Zenweld standını ziyaret ederek:

- İhtiyaçlarınıza en uygun kaynak ve kesme makinesini bulabilirsiniz.
- Makinelerimiz hakkında detaylı bilgi alabilirsiniz.
- Uzman ekibimize danışabilirsiniz.
- Özel fuar indirimlerinden yararlanabilirsiniz.
- Konya Makine Teknolojileri Fuarı'nı ziyaret etmeyi planlıyorsanız, Zenweld standını (salon no, stand no) ziyaret etmeyi unutmayın!

## Zenweld Hakkında

Zenweld, 2005 yılından beri kaynak ve kesme teknolojileri alanında faaliyet gösteren bir Türk markasıdır. Zenweld, geniş ürün yelpazesi ve uzman ekibiyle, metal işleme sektörünün farklı ihtiyaçlarına çözümler sunmaktadır. Zenweld, Türkiye'nin önde gelen sanayi kuruluşlarının tedarikçileri arasında yer almaktadır.`,
    startDate: "2024-05-08",
    endDate: "2024-05-11",
    venue: "Konya Fuar Merkezi",
    city: "Konya",
    country: "Türkiye",
    logoUrl: logo("konya-makine-teknolojileri-fuari-2024"),
    images: [stockPhotos.workshop],
    active: true,
  },
  {
    id: "e-imatech-2024",
    slug: "imatech-2024",
    title: "İmatech 2024 — 2. Endüstriyel Üretim Teknolojileri Fuarı",
    summary: "Zenweld ve Önder Kaynak Makina ve Malzemeleri'nin birlikte katıldığı 2. Endüstriyel Üretim Teknolojileri Fuarı, sektördeki önemli bir etkinlik olarak dikkat çekti.",
    description: `Zenweld İmatech 2024'te Endüstriyel Üretim Teknolojilerini Tanıttı

22-25 Şubat 2024 tarihleri arasında İzmir Fuar İzmir'de düzenlenen İmatech 2024 — 2. Endüstriyel Üretim Teknolojileri Fuarı'nda Zenweld markası da yerini aldı. Fuarın ana teması "Geleceğin Fabrikaları" olarak belirlenirken, Zenweld standında da bu temaya uygun en son kaynak ve kesme teknolojileri sergilendi.

Zenweld standında ziyaretçilere sunulan ürünler ve hizmetler arasında şunlar yer aldı:

- **Kaynak Makineleri:** MIG/MAG, TIG, Plazma ve Lazer kaynak makineleri
- **Kesme Makineleri:** Plazma ve Lazer kesme makineleri
- **Otomasyon Sistemleri:** Kaynak ve kesme işlemleri için otomasyon çözümleri
- **Sarf Malzemeleri:** Kaynak ve kesme işlemleri için elektrotlar, teller, gazlar ve diğer sarf malzemeleri

Zenweld standında ayrıca uzman mühendisler tarafından ziyaretçilere teknik danışmanlık hizmeti de sunuldu. Ziyaretçiler, Zenweld'in sunduğu yenilikçi çözümler hakkında bilgi alarak, kendi üretim ihtiyaçlarına en uygun çözümleri belirleme imkanı buldu.

Zenweld Genel Müdürü Murat Zengin yaptığı açıklamada, İmatech 2024 fuarının Zenweld için oldukça verimli geçtiğini ve fuardan çok sayıda yeni iş bağlantısı kurduklarını ifade etti. Murat Zengin ayrıca, Zenweld'in önümüzdeki dönemde de inovasyona ve Ar-Ge'ye yatırım yapmaya devam ederek, Türkiye'nin ve dünyanın önde gelen kaynak ve kesme teknolojileri üreticilerinden biri olmayı hedeflediğini sözlerine ekledi.

## Zenweld Hakkında

Zenweld, 2005 yılından beri kaynak ve kesme teknolojileri alanında faaliyet gösteren bir Türk markasıdır. Zenweld, geniş ürün yelpazesi ve uzman ekibiyle, metal işleme sektörünün farklı ihtiyaçlarına çözümler sunmaktadır. Zenweld, Türkiye'nin önde gelen sanayi kuruluşlarının tedarikçileri arasında yer almaktadır.

## İmatech 2024 Hakkında

İmatech 2024, Türkiye'nin en büyük endüstriyel üretim teknolojileri fuarıdır. Fuar, 22-25 Şubat 2024 tarihleri arasında İzmir Fuar İzmir'de düzenlenmiştir. Fuar, 4 gün boyunca 1000'den fazla katılımcı ve 50.000'den fazla ziyaretçiyi ağırlamıştır.`,
    startDate: "2024-02-22",
    endDate: "2024-02-25",
    venue: "Fuar İzmir",
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2024"),
    images: [stockPhotos.metalWork, stockPhotos.teamTalk],
    active: true,
  },
];

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

export const news: NewsItem[] = [
  {
    id: "n1",
    slug: "kaynak-ve-kesme-teknolojileri-tanitim-gunu-van",
    title: "Kaynak ve Kesme Teknolojileri Tanıtım Günü",
    summary: "Van'daki iş ortaklarımızla 29 Temmuz 2026 Çarşamba günü Ebinç Makina ev sahipliğinde buluşuyoruz.",
    body: `Zenweld olarak, Van bölgesindeki iş ortaklarımız ve sektör profesyonelleriyle 29 Temmuz 2026 Çarşamba günü Ebinç Makina ev sahipliğinde düzenlenecek Kaynak ve Kesme Teknolojileri Tanıtım Günü'nde bir araya geliyoruz.

Etkinlik boyunca yeni nesil MIG/MAG, TIG, MMA, Plazma Kesim ve Lazer Kaynak çözümlerimizi yakından inceleyebilir, makinelerimizin canlı performansını deneyimleyebilir ve uzman ekibimizden uygulamaya yönelik teknik bilgiler alabilirsiniz.

Kaynak ve kesme teknolojilerindeki en yeni çözümleri keşfetmek, üretim süreçlerinize değer katacak ekipmanları yakından görmek ve Zenweld uzmanlarıyla birebir görüşmek için sizleri etkinliğimize bekliyoruz.`,
    coverUrl: "/images/news/kaynak-kesme-tanitim-gunu-van-2026.webp",
    images: [],
    publishedAt: "2026-07-27T09:00:00+03:00",
    active: true,
  },
  {
    id: "n2",
    slug: "zenweld-kaynak-akademi",
    title: "Zenweld Kaynak Akademi",
    summary: "Çınarlı Mesleki ve Teknik Eğitim Lisesi ile imzalanan protokolle öğrencilere kaynaklı metal imalat eğitimi veren Kaynak Akademisi kuruldu.",
    body: `Konak İlçe Milli Eğitim Müdürlüğü, Çınarlı Mesleki ve Teknik Eğitim Lisesi ve Zenweld Kaynak ve Kesme Ekipmanları Sanayi Ticaret Anonim Şirketi arasında yapılan 'Mesleki Eğitim İşbirliği' protokolüyle öğrencilerin kaynaklı metal imalat alanında yeteneklerini geliştirecekleri 'Kaynak Akademisi' kuruldu.

## Öğrencilere son teknolojiyle eğitim!

Akademiyle, öğrencilerin sektördeki çalışma olanaklarını okullarında görmesi ve donanım kazanması amaçlanıyor. Açılış töreninde konuşan Konak İlçe Milli Eğitim Müdürü Serdar Şimşek, "Akademinin kurulması, meslek öğrencileri için son teknolojiyle alanlarında çalışma şartlarını en yakından çalışma hayatıyla bire bir görmesi için önemli. Çünkü onlar ara eleman değil, ana elemanlardır." dedi.`,
    coverUrl: "/images/news/zenweld-kaynak-akademi-2023.webp",
    images: [],
    publishedAt: "2023-09-12T09:00:00+03:00",
    active: true,
  },
];
