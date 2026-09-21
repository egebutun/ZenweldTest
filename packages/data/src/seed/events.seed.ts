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
 */

const logo = (slug: string) => `/images/events/${slug}.png`;

export const events: ZenweldEvent[] = [
  {
    id: "e-big5-global-2025",
    slug: "big-5-global-2025",
    title: { tr: "Big 5 Global 2025", en: "Big 5 Global 2025" },
    summary: {
      tr: "Big 5 Global, dünyanın en büyük ve en prestijli yapı ve inşaat fuarı.",
      en: "Big 5 Global is the world's largest and most prestigious construction industry event.",
    },
    description: {
      tr: `Zenweld, Big 5 Global 2025 Fuarında!

Zenweld olarak, yapı ve inşaat sektörünün en büyük küresel etkinliklerinden biri olan Big 5 Global 2025 fuarında yer almaktan büyük heyecan duyuyoruz! Bu prestijli fuarda, en yeni kaynak çözümlerimizi ve sektöre yön veren ürünlerimizi uluslararası katılımcılarla buluşturacağız.

Big 5 Global Neden Önemli?

Big 5 Global, yapı ve inşaat sektörünün en büyük buluşma noktalarından biridir. Dünya genelinden 75.000'den fazla ziyaretçi ve 2.000'in üzerinde katılımcı firma ile 45 yılı aşkın süredir sektör profesyonellerine iş geliştirme ve yeni pazar fırsatları sunmaktadır. Orta Doğu, Afrika ve Asya pazarlarına giriş yapmak isteyen firmalar için eşsiz bir platform sunan bu fuar, özellikle büyük altyapı ve mega projelerle dikkat çekmektedir.

Zenweld olarak, bu büyük organizasyonda kaynak teknolojileri ve ekipmanları alanındaki yenilikçi çözümlerimizi sergilemek ve sektördeki profesyonellerle güçlü iş bağlantıları kurmak için sizleri standımıza bekliyoruz.

Standımızda Sizleri Neler Bekliyor?

Yüksek Performanslı Kaynak Makineleri: Güvenilir, enerji verimli ve zorlu projelerde üstün performans sunan kaynak makinelerimizi yakından inceleyin.
İnovatif Kaynak Çözümleri: Büyük altyapı projeleri ve endüstriyel uygulamalar için geliştirilmiş yenilikçi ürünlerimizi keşfedin.
Uygulamalı Demo Gösterileri: Uzman ekibimiz tarafından gerçekleştirilecek canlı demo gösterileri ile ürünlerimizi iş başında görün.
Yeni İş Fırsatları: Suudi Arabistan, BAE, Afrika ve Asya pazarlarına yönelik yeni iş ortaklıkları ve projeleri için fırsatlar yakalayın.
Teknik Danışmanlık: Kaynak süreçlerinizi daha verimli hale getirmek için uzman ekibimizden teknik destek ve danışmanlık alın.

Zenweld ile Yapı Sektöründe Geleceği Şekillendirin!

Big 5 Global 2025, sadece bir fuar değil; yeni iş bağlantıları kurmak, sektör trendlerini takip etmek ve markanızı uluslararası arenada güçlendirmek için bir fırsat platformudur. Zenweld olarak, bu fuarda "Geleceğin Kaynak Teknolojilerini" sergileyecek ve sektörün ihtiyaçlarına yönelik çözümler sunacağız.

Dubai'de Görüşmek Üzere!

Bizi standımızda ziyaret edin ve geleceğin kaynak teknolojilerini birlikte keşfedelim.`,
      en: `Zenweld at Big 5 Global 2025!

As Zenweld, we are excited to take part in Big 5 Global 2025, one of the largest global events of the construction industry. At this prestigious fair we will present our latest welding solutions and our industry-leading products to international visitors.

Why Big 5 Global Matters

Big 5 Global is one of the biggest meeting points of the construction sector. With more than 75,000 visitors and over 2,000 exhibiting companies from around the world, it has been offering business development and new market opportunities to industry professionals for over 45 years. Providing a unique platform for companies looking to enter the Middle East, Africa and Asia markets, the fair stands out especially with large infrastructure and mega projects.

At this major event, we invite you to our stand to see our innovative solutions in welding technologies and equipment, and to build strong business connections.

What Awaits You at Our Stand?

High-Performance Welding Machines: Take a close look at our reliable, energy-efficient machines that deliver superior performance on demanding projects.
Innovative Welding Solutions: Discover our products developed for large infrastructure projects and industrial applications.
Hands-On Demonstrations: See our products in action with live demos by our expert team.
New Business Opportunities: Explore partnerships and projects for the Saudi Arabian, UAE, African and Asian markets.
Technical Consultancy: Get technical support and advice from our expert team to make your welding processes more efficient.

Shape the Future of the Construction Industry with Zenweld!

Big 5 Global 2025 is not just a fair; it is a platform for building new business connections, following industry trends and strengthening your brand on the international stage. At this event Zenweld will showcase "the welding technologies of the future" and offer solutions for the needs of the industry.

See You in Dubai!

Visit us at our stand and let us discover the future of welding technologies together.`,
    },
    startDate: "2025-11-24",
    endDate: "2025-11-27",
    venue: { tr: "Dubai World Trade Centre", en: "Dubai World Trade Centre" },
    city: "Dubai",
    country: "Birleşik Arap Emirlikleri",
    logoUrl: logo("big-5-global-2025"),
    images: [stockPhotos.factoryLine, stockPhotos.industrialShop],
    featured: true,
    active: true,
  },
  {
    id: "e-international-hardware-riyad-2025",
    slug: "international-hardware-riyad-2025",
    title: {
      tr: "International Hardware Riyad",
      en: "International Hardware Riyadh",
    },
    summary: {
      tr: "International Hardware Riyadh 2025, Orta Doğu'nun en büyük donanım, el aletleri, yapı malzemeleri ve endüstriyel ekipman fuarlarından biridir.",
      en: "International Hardware Riyadh 2025 is one of the largest hardware, hand tools, building materials and industrial equipment fairs in the Middle East.",
    },
    description: {
      tr: `Zenweld olarak, Orta Doğu'nun en prestijli etkinliklerinden biri olan International Hardware Riyadh 2025 fuarında yerimizi alıyoruz!

Suudi Arabistan'ın Vision 2030 hedefleri doğrultusunda hızla büyüyen donanım ve yapı malzemeleri sektöründe, en yenilikçi kaynak çözümlerimizi sergilemek için bu önemli fuarda sizlerle buluşuyoruz.

Standımızda sizleri neler bekliyor?

Yüksek Performanslı Kaynak Makineleri – Fark yaratan teknolojilerle geliştirilmiş, iş süreçlerinizi daha verimli hale getirecek ürünlerimizi keşfedin.
Uygulamalı Demo Gösterileri – Profesyonel ekibimiz, ürünlerimizi fuar boyunca canlı demo gösterileriyle tanıtacak.
Yeni İş Fırsatları – Bölgedeki büyük altyapı projeleri ve artan pazar talebine yönelik çözümlerimizi değerlendirin.

Zenweld ile Riyad'da Geleceğin Kaynak Teknolojilerini Keşfedin!

Bölgedeki güçlü bağlantılar kurmak, iş fırsatlarını yakalamak ve sektöre yön veren yenilikçi çözümlerimizi görmek için standımıza bekliyoruz.

Daha fazla bilgi için bizimle iletişime geçin ve fuar boyunca bizi ziyaret etmeyi unutmayın!`,
      en: `Zenweld is taking its place at International Hardware Riyadh 2025, one of the most prestigious events in the Middle East!

In the hardware and building materials sector, which is growing rapidly in line with Saudi Arabia's Vision 2030 goals, we are meeting you at this important fair to showcase our most innovative welding solutions.

What awaits you at our stand?

High-Performance Welding Machines – Discover our products, developed with technologies that make a difference and designed to make your operations more efficient.
Hands-On Demonstrations – Our professional team will present our products with live demos throughout the fair.
New Business Opportunities – Evaluate our solutions for the region's large infrastructure projects and growing market demand.

Discover the Welding Technologies of the Future with Zenweld in Riyadh!

We look forward to welcoming you at our stand to build strong regional connections, capture business opportunities and see our industry-leading innovative solutions.

Contact us for more information, and do not forget to visit us during the fair!`,
    },
    startDate: "2025-06-16",
    endDate: "2025-06-18",
    venue: {
      tr: "Riyadh International Convention and Exhibition Center",
      en: "Riyadh International Convention and Exhibition Center",
    },
    city: "Riyad",
    country: "Suudi Arabistan",
    logoUrl: logo("international-hardware-riyad-2025"),
    images: [stockPhotos.industrialShop, stockPhotos.teamTalk],
    featured: false,
    active: true,
  },
  {
    id: "e-win-eurasia-2025",
    slug: "win-eurasia-2025",
    title: {
      tr: "Win Eurasia 2025 Otomasyon ve Makine Teknolojileri Fuarı",
      en: "Win Eurasia 2025 Automation and Machine Technologies Fair",
    },
    summary: {
      tr: "Avrasya Bölgesi'nin lider endüstri fuarı olarak 30 yıldır imalat sanayinin rotasını çizen WIN EURASIA Otomasyon ve Makine Teknolojileri Fuarı.",
      en: "WIN EURASIA Automation and Machine Technologies Fair, the leading industrial fair of the Eurasia region, has been setting the course of the manufacturing industry for 30 years.",
    },
    description: {
      tr: `Zenweld, WIN EURASIA 2025 Fuarında Sizi Bekliyor!

Zenweld olarak, kaynak teknolojilerindeki yenilikçi çözümlerimizi ve sektöre yön veren ürünlerimizi WIN EURASIA 2025 fuarında sizlerle buluşturuyoruz!

Bu yıl fuarda ziyaretçilerimizi birçok yenilik bekliyor!

Yeni Nesil Kaynak Makineleri – Performansı artıran, enerji tasarrufu sağlayan ve endüstriyel standartlara uygun en güncel modellerimizi keşfedin.
İnovatif Kaynak Ekipmanları ve Aksesuarlar – İşlerinizi daha verimli hale getirecek en son teknolojik ekipmanları inceleyin.
Uygulamalı Demo Gösterileri – Uzman ekibimiz, ürünlerimizi fuar boyunca canlı demo gösterileriyle tanıtacak. Kaynak çözümlerimizi bizzat deneyimleyin.
Sürpriz Fırsatlar ve Kampanyalar – Fuar boyunca standımızda ziyaretçilerimize özel kampanya ve avantajlardan yararlanın.

Zenweld ile Geleceğin Kaynak Teknolojilerini Keşfetmek İçin Bizi Ziyaret Edin!

Fuar boyunca, sektörel iş birlikleri, teknik danışmanlık ve ürün tanıtımları için uzman ekibimiz sizleri ağırlamaktan memnuniyet duyacak.`,
      en: `Zenweld Awaits You at WIN EURASIA 2025!

At WIN EURASIA 2025 we bring you our innovative welding technology solutions and our industry-leading products!

Many innovations await our visitors at the fair this year!

Next-Generation Welding Machines – Discover our latest models that increase performance, save energy and comply with industrial standards.
Innovative Welding Equipment and Accessories – Explore the latest technological equipment that will make your work more efficient.
Hands-On Demonstrations – Our expert team will present our products with live demos throughout the fair. Experience our welding solutions first hand.
Special Offers and Campaigns – Benefit from campaigns and advantages exclusive to our stand visitors during the fair.

Visit Us to Discover the Welding Technologies of the Future with Zenweld!

Throughout the fair, our expert team will be delighted to host you for industry collaborations, technical consultancy and product presentations.`,
    },
    startDate: "2025-05-28",
    endDate: "2025-05-31",
    venue: { tr: "İstanbul Fuar Merkezi", en: "Istanbul Expo Center" },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2025"),
    images: [stockPhotos.factoryLine, stockPhotos.engineer, stockPhotos.teamTalk],
    featured: false,
    active: true,
  },
  {
    id: "e-imatech-2025",
    slug: "imatech-2025",
    title: {
      tr: "İmatech 2025 — 3. Endüstriyel Üretim Teknolojileri Fuarı",
      en: "İmatech 2025 — 3rd Industrial Production Technologies Fair",
    },
    summary: {
      tr: "Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz!",
      en: "Zenweld takes part in İmatech 2025, one of the industry's most prestigious industrial production and welding technology events!",
    },
    description: {
      tr: `Zenweld Olarak İmatech 2025 Fuarındayız!

Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz!

Yeni nesil kaynak çözümlerimizi, inovatif ürünlerimizi ve sektördeki en güncel teknolojik gelişmeleri keşfetmek için standımıza bekliyoruz. Sektör profesyonelleri ile buluşup güçlü iş bağlantıları kurmayı hedeflediğimiz bu fuarda, Zenweld'in farkını yakından deneyimleme fırsatı yakalayın.

Zenweld ile Kaynakta Geleceği Şekillendirin!

Detaylar ve fuar sonrası haberler için bizi takip edin!`,
      en: `Zenweld at İmatech 2025!

Zenweld takes part in İmatech 2025, one of the industry's most prestigious industrial production and welding technology events!

We look forward to welcoming you at our stand to discover our next-generation welding solutions, our innovative products and the latest technological developments in the sector. At this fair, where we aim to meet industry professionals and build strong business connections, seize the opportunity to experience the Zenweld difference first hand.

Shape the Future of Welding with Zenweld!

Follow us for details and post-fair news!`,
    },
    startDate: "2025-02-20",
    endDate: "2025-02-23",
    venue: { tr: "Fuar İzmir", en: "Fuar İzmir" },
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2025"),
    images: [stockPhotos.engineer, stockPhotos.metalWork],
    featured: false,
    active: true,
  },
  {
    id: "e-istanbul-hirdavat-2024",
    slug: "istanbul-hirdavat-fuari-2024",
    title: {
      tr: "2024 Uluslararası İstanbul Hırdavat Fuarı",
      en: "2024 International Istanbul Hardware Fair",
    },
    summary: {
      tr: "Yeni ürünlerimizi görmek ve sektördeki en son yenilikleri keşfetmek için standımıza bekliyoruz.",
      en: "We look forward to welcoming you at our stand to see our new products and discover the latest innovations in the sector.",
    },
    description: {
      tr: `Zenweld olarak, 20-23 Kasım 2024 tarihlerinde düzenlenecek olan Uluslararası İstanbul Hırdavat Fuarı'nda yerimizi alıyoruz. Bu prestijli etkinlik, hırdavat sektöründeki en son yeniliklerin sergilendiği, yerel ve uluslararası katılımcıların bir araya geldiği önemli bir platformdur. Standımızda, ileri teknoloji kaynak ekipmanlarımız ve yenilikçi ürünlerimizle fuar katılımcılarıyla buluşacağız.

Fuar süresince teknik ekibimiz, ürünlerimizin özelliklerini tanıtacak, uygulama çözümleri sunacak ve sektördeki en son gelişmeleri sizlerle paylaşacak. Sektördeki uzmanlığımızı ve deneyimimizi birinci elden görmek isteyen tüm profesyonelleri standımıza davet ediyoruz.

İstanbul Hırdavat Fuarı, sektördeki iş ortaklarıyla tanışmak ve yeni iş fırsatları yaratmak için mükemmel bir fırsat sunuyor. Zenweld olarak, bu değerli etkinlikte sizleri ağırlamaktan memnuniyet duyarız.`,
      en: `Zenweld is taking its place at the International Istanbul Hardware Fair, held on 20–23 November 2024. This prestigious event is an important platform where the latest innovations in the hardware sector are exhibited and local and international participants come together. At our stand we will meet fair visitors with our advanced welding equipment and innovative products.

Throughout the fair our technical team will present the features of our products, offer application solutions and share the latest developments in the sector with you. We invite all professionals who would like to see our expertise and experience first hand to visit our stand.

The Istanbul Hardware Fair offers an excellent opportunity to meet business partners and create new business opportunities. We would be delighted to host you at this valuable event.`,
    },
    startDate: "2024-11-20",
    endDate: "2024-11-23",
    venue: {
      tr: "İstanbul Fuar Merkezi (IFM) — Yeşilköy",
      en: "Istanbul Expo Center (IFM) — Yeşilköy",
    },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("istanbul-hirdavat-fuari-2024"),
    images: [stockPhotos.toolsFlatlay, stockPhotos.workshop],
    featured: false,
    active: true,
  },
  {
    id: "e-win-eurasia-2024",
    slug: "win-eurasia-2024",
    title: {
      tr: "WIN Eurasia — Endüstri Fuarı",
      en: "WIN Eurasia — Industry Fair",
    },
    summary: {
      tr: "Zenweld Kaynak ve Kesme Makinaları olarak, 2024 yılı 05-08 Haziran tarihleri arasında İstanbul'da düzenlenecek olan Win Eurasia 2024 Endüstri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.",
      en: "As Zenweld Welding and Cutting Machines, we are excited to announce our participation in the Win Eurasia 2024 Industry Fair, held in Istanbul on 05–08 June 2024.",
    },
    description: {
      tr: `Zenweld Win Eurasia 2024 Endüstri Fuarında!

Zenweld Kaynak ve Kesme Makinaları olarak, 2024 yılı 05-08 Haziran tarihleri arasında İstanbul'da düzenlenecek olan Win Eurasia 2024 Endüstri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.

Fuar boyunca, en son teknoloji kaynak ve kesme makinelerimizi siz değerli ziyaretçilerimizle buluşturmaktan mutluluk duyacağız. Deneyimli ekibimiz, ihtiyaçlarınıza en uygun çözümleri sunmak için fuar boyunca standımızda hazır olacak.

Fuar standımızda sizleri neler bekliyor?

En son teknoloji kaynak ve kesme makinelerimiz
Canlı demolar
Uzman ekibimizden ücretsiz danışmanlık
Özel fuar indirimleri

Zenweld standını ziyaret ederek:

İhtiyaçlarınıza en uygun kaynak ve kesme makinesini bulabilirsiniz.
Makinelerimiz hakkında detaylı bilgi alabilirsiniz.
Uzman ekibimize danışabilirsiniz.
Özel fuar indirimlerinden yararlanabilirsiniz.

Win Eurasia 2024 Endüstri Fuarı'nı ziyaret etmeyi planlıyorsanız, Zenweld standını (Salon 5, Stand C-100) ziyaret etmeyi unutmayın!`,
      en: `Zenweld at the Win Eurasia 2024 Industry Fair!

As Zenweld Welding and Cutting Machines, we are excited to announce our participation in the Win Eurasia 2024 Industry Fair, held in Istanbul on 05–08 June 2024.

Throughout the fair we will be delighted to present our latest welding and cutting machines to you, our valued visitors. Our experienced team will be at our stand during the fair to offer the solutions that best fit your needs.

What awaits you at our stand?

Our latest welding and cutting machines
Live demonstrations
Free consultancy from our expert team
Special fair discounts

By visiting the Zenweld stand you can:

Find the welding and cutting machine that best suits your needs.
Get detailed information about our machines.
Consult our expert team.
Benefit from special fair discounts.

If you are planning to visit the Win Eurasia 2024 Industry Fair, do not forget to stop by the Zenweld stand (Hall 5, Stand C-100)!`,
    },
    startDate: "2024-06-05",
    endDate: "2024-06-08",
    venue: {
      tr: "İstanbul Fuar Merkezi, Yeşilköy",
      en: "Istanbul Expo Center, Yeşilköy",
    },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2024"),
    images: [stockPhotos.factoryLine],
    booth: "Salon 5 / C-100",
    featured: false,
    active: true,
  },
  {
    id: "e-konya-makine-2024",
    slug: "konya-makine-teknolojileri-fuari-2024",
    title: {
      tr: "Konya Makine Teknolojileri Fuarı",
      en: "Konya Machine Technologies Fair",
    },
    summary: {
      tr: "Zenweld Kaynak ve Kesme Makinaları olarak, 2024 yılı 8-11 Mayıs tarihleri arasında Konya'da düzenlenecek olan Konya Makine Teknolojileri Fuarı'na katılımımızı büyük bir heyecanla duyuruyoruz.",
      en: "As Zenweld Welding and Cutting Machines, we are excited to announce our participation in the Konya Machine Technologies Fair, held in Konya on 8–11 May 2024.",
    },
    description: {
      tr: `Fuar boyunca, en son teknoloji kaynak ve kesme makinelerimizi siz değerli ziyaretçilerimizle buluşturmaktan mutluluk duyacağız. Deneyimli ekibimiz, ihtiyaçlarınıza en uygun çözümleri sunmak için fuar boyunca standımızda hazır olacak.

Fuar standımızda sizleri neler bekliyor?

En son teknoloji kaynak ve kesme makinelerimiz
Canlı demolar
Uzman ekibimizden ücretsiz danışmanlık
Özel fuar indirimleri

Zenweld standını ziyaret ederek:

İhtiyaçlarınıza en uygun kaynak ve kesme makinesini bulabilirsiniz.
Makinelerimiz hakkında detaylı bilgi alabilirsiniz.
Uzman ekibimize danışabilirsiniz.
Özel fuar indirimlerinden yararlanabilirsiniz.

Zenweld Hakkında

Zenweld, 2005 yılından beri kaynak ve kesme teknolojileri alanında faaliyet gösteren bir Türk markasıdır. Zenweld, geniş ürün yelpazesi ve uzman ekibiyle, metal işleme sektörünün farklı ihtiyaçlarına çözümler sunmaktadır. Zenweld, Türkiye'nin önde gelen sanayi kuruluşlarının tedarikçileri arasında yer almaktadır.`,
      en: `Throughout the fair we will be delighted to present our latest welding and cutting machines to you, our valued visitors. Our experienced team will be at our stand during the fair to offer the solutions that best fit your needs.

What awaits you at our stand?

Our latest welding and cutting machines
Live demonstrations
Free consultancy from our expert team
Special fair discounts

By visiting the Zenweld stand you can:

Find the welding and cutting machine that best suits your needs.
Get detailed information about our machines.
Consult our expert team.
Benefit from special fair discounts.

About Zenweld

Zenweld is a Turkish brand that has been operating in welding and cutting technologies since 2005. With a wide product range and an expert team, Zenweld offers solutions for the varied needs of the metalworking industry and is among the suppliers of Türkiye's leading industrial companies.`,
    },
    startDate: "2024-05-08",
    endDate: "2024-05-11",
    venue: { tr: "Konya Fuar Merkezi", en: "Konya Fair Center" },
    city: "Konya",
    country: "Türkiye",
    logoUrl: logo("konya-makine-teknolojileri-fuari-2024"),
    images: [stockPhotos.workshop],
    featured: false,
    active: true,
  },
  {
    id: "e-imatech-2024",
    slug: "imatech-2024",
    title: {
      tr: "İmatech 2024 — 2. Endüstriyel Üretim Teknolojileri Fuarı",
      en: "İmatech 2024 — 2nd Industrial Production Technologies Fair",
    },
    summary: {
      tr: "Zenweld ve Önder Kaynak Makina ve Malzemeleri'nin birlikte katıldığı 2. Endüstriyel Üretim Teknolojileri Fuarı, sektördeki önemli bir etkinlik olarak dikkat çekti.",
      en: "The 2nd Industrial Production Technologies Fair, attended jointly by Zenweld and Önder Kaynak Makina ve Malzemeleri, stood out as an important event in the sector.",
    },
    description: {
      tr: `Zenweld İmatech 2024'te Endüstriyel Üretim Teknolojilerini Tanıttı

22-25 Şubat 2024 tarihleri arasında İzmir Fuar İzmir'de düzenlenen İmatech 2024 — 2. Endüstriyel Üretim Teknolojileri Fuarı'nda Zenweld markası da yerini aldı. Fuarın ana teması "Geleceğin Fabrikaları" olarak belirlenirken, Zenweld standında da bu temaya uygun en son kaynak ve kesme teknolojileri sergilendi.

Zenweld standında ziyaretçilere sunulan ürünler ve hizmetler arasında şunlar yer aldı:

Kaynak Makineleri: MIG/MAG, TIG, Plazma ve Lazer kaynak makineleri
Kesme Makineleri: Plazma ve Lazer kesme makineleri
Otomasyon Sistemleri: Kaynak ve kesme işlemleri için otomasyon çözümleri
Sarf Malzemeleri: Kaynak ve kesme işlemleri için elektrotlar, teller, gazlar ve diğer sarf malzemeleri

Zenweld standında ayrıca uzman mühendisler tarafından ziyaretçilere teknik danışmanlık hizmeti de sunuldu. Ziyaretçiler, Zenweld'in sunduğu yenilikçi çözümler hakkında bilgi alarak, kendi üretim ihtiyaçlarına en uygun çözümleri belirleme imkanı buldu.

Zenweld Genel Müdürü Murat Zengin yaptığı açıklamada, İmatech 2024 fuarının Zenweld için oldukça verimli geçtiğini ve fuardan çok sayıda yeni iş bağlantısı kurduklarını ifade etti. Murat Zengin ayrıca, Zenweld'in önümüzdeki dönemde de inovasyona ve Ar-Ge'ye yatırım yapmaya devam ederek, Türkiye'nin ve dünyanın önde gelen kaynak ve kesme teknolojileri üreticilerinden biri olmayı hedeflediğini sözlerine ekledi.

Zenweld Hakkında

Zenweld, 2005 yılından beri kaynak ve kesme teknolojileri alanında faaliyet gösteren bir Türk markasıdır. Zenweld, geniş ürün yelpazesi ve uzman ekibiyle, metal işleme sektörünün farklı ihtiyaçlarına çözümler sunmaktadır. Zenweld, Türkiye'nin önde gelen sanayi kuruluşlarının tedarikçileri arasında yer almaktadır.

İmatech 2024 Hakkında

İmatech 2024, Türkiye'nin en büyük endüstriyel üretim teknolojileri fuarıdır. Fuar, 22-25 Şubat 2024 tarihleri arasında İzmir Fuar İzmir'de düzenlenmiştir. Fuar, 4 gün boyunca 1000'den fazla katılımcı ve 50.000'den fazla ziyaretçiyi ağırlamıştır.`,
      en: `Zenweld Presented Industrial Production Technologies at İmatech 2024

The Zenweld brand took its place at İmatech 2024 — the 2nd Industrial Production Technologies Fair, held at Fuar İzmir on 22–25 February 2024. While the main theme of the fair was "Factories of the Future", the Zenweld stand exhibited the latest welding and cutting technologies in line with that theme.

The products and services offered to visitors at the Zenweld stand included:

Welding Machines: MIG/MAG, TIG, plasma and laser welding machines
Cutting Machines: Plasma and laser cutting machines
Automation Systems: Automation solutions for welding and cutting operations
Consumables: Electrodes, wires, gases and other consumables for welding and cutting

Technical consultancy was also provided to visitors at the Zenweld stand by expert engineers. Visitors had the opportunity to learn about the innovative solutions offered by Zenweld and to identify the ones that best fit their own production needs.

In his statement, Zenweld General Manager Murat Zengin said that İmatech 2024 had been highly productive for Zenweld and that they had established many new business connections at the fair. Murat Zengin added that Zenweld will continue to invest in innovation and R&D in the coming period, aiming to be one of the leading welding and cutting technology manufacturers in Türkiye and worldwide.

About Zenweld

Zenweld is a Turkish brand that has been operating in welding and cutting technologies since 2005. With a wide product range and an expert team, Zenweld offers solutions for the varied needs of the metalworking industry and is among the suppliers of Türkiye's leading industrial companies.

About İmatech 2024

İmatech 2024 is Türkiye's largest industrial production technologies fair. The fair was held at Fuar İzmir on 22–25 February 2024 and hosted more than 1,000 exhibitors and over 50,000 visitors across four days.`,
    },
    startDate: "2024-02-22",
    endDate: "2024-02-25",
    venue: { tr: "Fuar İzmir", en: "Fuar İzmir" },
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2024"),
    images: [stockPhotos.metalWork, stockPhotos.teamTalk],
    featured: false,
    active: true,
  },
];

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

export const news: NewsItem[] = [
  {
    id: "n1",
    slug: "yeni-bayi-agi-genislemesi",
    title: {
      tr: "Bayi ağımız 30 noktaya ulaştı",
      en: "Our dealer network reaches 30 locations",
    },
    summary: {
      tr: "Türkiye genelindeki yetkili satış ve servis noktalarımızın sayısı 30'a ulaştı.",
      en: "Our authorised sales and service points across Türkiye have reached 30.",
    },
    body: {
      tr: "Türkiye genelindeki yetkili satış ve servis noktalarımızın sayısı 30'a ulaştı. Yeni açılan noktalarla birlikte müşterilerimize daha hızlı servis ve stoktan teslim imkânı sunuyoruz.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      en: "Our authorised sales and service points across Türkiye have reached 30. With the newly opened locations we offer faster service and stock availability to our customers.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    coverUrl: stockPhotos.industrialShop,
    category: { tr: "Kurumsal", en: "Corporate" },
    publishedAt: "2026-08-12T09:00:00+03:00",
    featured: true,
    active: true,
  },
  {
    id: "n2",
    slug: "evomig-205-p-tanitildi",
    title: {
      tr: "Evomig 205 P Pulse MIG ürün gamımıza katıldı",
      en: "Evomig 205 P Pulse MIG joins our range",
    },
    summary: {
      tr: "Double pulse desteği ve renkli sinerjik ekranıyla Evomig 205 P satışa sunuldu.",
      en: "With double pulse support and a colour synergic display, the Evomig 205 P is now available.",
    },
    body: {
      tr: "Double pulse desteği ve renkli sinerjik ekranıyla Evomig 205 P satışa sunuldu. Özellikle alüminyum ve paslanmaz uygulamalarında dekoratif dikiş görünümü sağlıyor.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
      en: "With double pulse support and a colour synergic display, the Evomig 205 P is now available, delivering a decorative bead appearance especially on aluminium and stainless applications.\n\nLorem ipsum dolor sit amet.",
    },
    coverUrl: stockPhotos.engineer,
    category: { tr: "Ürün", en: "Product" },
    publishedAt: "2026-06-03T09:00:00+03:00",
    featured: false,
    active: true,
  },
  {
    id: "n3",
    slug: "ihracat-pazarlari-genisliyor",
    title: {
      tr: "İhracat pazarlarımız Orta Doğu'da genişliyor",
      en: "Our export markets expand in the Middle East",
    },
    summary: {
      tr: "Riyad ve Dubai fuarlarının ardından bölgedeki dağıtım ağımızı büyütüyoruz.",
      en: "Following the Riyadh and Dubai fairs, we are growing our regional distribution network.",
    },
    body: {
      tr: "Riyad ve Dubai fuarlarının ardından bölgedeki dağıtım ağımızı büyütüyoruz.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      en: "Following the Riyadh and Dubai fairs, we are growing our regional distribution network.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    coverUrl: stockPhotos.factoryLine,
    category: { tr: "İhracat", en: "Export" },
    publishedAt: "2026-01-20T09:00:00+03:00",
    featured: false,
    active: true,
  },
];
