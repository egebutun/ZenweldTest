import type { AboutContent, SalesRep } from "../types";
import { stockPhotos } from "./images";

/**
 * HAKKIMIZDA SAYFASI — baslangic icerigi
 *
 * Yonetim panelinden (/yonetim/hakkimizda) duzenlenir. Bolum metinleri
 * Zenweld'in onayli metnidir (Ekim 2026), kelimesi kelimesine aktarildi;
 * yalnizca paragraf araliklari ve "Degerlerimiz" maddelerindeki etiketlerin
 * kalin yazilmasi icin bicimlendirme isaretleri eklendi.
 */
export const about: AboutContent = {
  heroTitle: { tr: "Hakkımızda", en: "About Us" },
  heroSubtitle: {
    tr: "Türkiye'nin kaynak teknolojileri markası",
    en: "Türkiye's welding technology brand",
  },
  heroImage: stockPhotos.industrialShop,
  stats: [
    { id: "s1", value: "30+", label: { tr: "Yetkili Bayi", en: "Authorised Dealers" } },
    { id: "s2", value: "60+", label: { tr: "Ürün", en: "Products" } },
    { id: "s3", value: "25+", label: { tr: "Yıllık Tecrübe", en: "Years of Experience" } },
    { id: "s4", value: "%100", label: { tr: "Yerli Üretim", en: "Made in Türkiye" } },
  ],
  sections: [
    {
      id: "a1",
      title: { tr: "", en: "" },
      body: {
        tr: "Zenweld Kaynak, 2000 yılında teknik hırdavat alanında başlattığı faaliyetlerini yıllar içinde kaynak ve kesme teknolojilerine odaklayarak, bugün Türkiye'nin önde gelen kaynak çözümleri sağlayıcılarından biri haline gelmiştir. İstanbul merkezli kurumsal yapımız ve İzmir'deki fabrikamızla, sanayinin artan kalite, hız ve verimlilik beklentilerine en güncel teknolojiyle yanıt veriyoruz.\n\n2012 yılından bu yana, dünyanın önde gelen kaynak teknolojisi üreticilerinden Shenzhen Jasic'in Türkiye'deki yetkili distribütörü ve OEM çözüm ortağıyız. 2016 yılında İzmir'de hayata geçirdiğimiz fabrika yatırımıyla küresel teknolojiyi Türkiye'de üreterek yerli sanayinin gelişimine doğrudan katkı sağlıyoruz. Bu yapı, müşterilerimize hem küresel kalite standardını hem de yerel üretimin getirdiği esneklik, hız ve uygun maliyet avantajını bir arada sunmamıza olanak tanıyor.\n\nKaynak teknolojilerindeki gelişmeleri yakından takip ederek, lazer kaynak makinelerini Türkiye sanayisiyle buluşturan öncü firmalardan biri olduk. Hassas kaynak gerektiren endüstrilerde devrim niteliğinde çözümler sunan lazer kaynak teknolojisi, üretim süreçlerinde yüksek kalite ve verimliliği bir arada mümkün kılmaktadır. Zenweld olarak, Türkiye sanayisinin daha verimli, hızlı ve ekonomik kaynak sistemlerine erişimini sağlamayı temel misyonumuz olarak benimsedik.\n\nGeniş ürün yelpazemiz; MMA, MIG/MAG ve TIG kaynak makineleri, plazma kesim sistemleri, lazer kaynak makineleri ve Cobot tabanlı (Cobot/MIG, Cobot/Lazer) otomasyon çözümlerinden oluşan kapsamlı bir teknoloji portföyünü kapsamaktadır. Yüksek verimlilik, hassasiyet ve kaliteyi öne çıkaran bu yenilikçi çözümlerle müşterilerimizin üretim süreçlerini daha hızlı, daha güvenilir ve daha ekonomik hâle getiriyoruz.\n\nZenweld, yalnızca ürün tedarik eden bir firma değil; sanayicilere danışmanlık, teknik destek ve satış sonrası hizmet sunan bir çözüm ortağıdır. İzmir'de merkezîleştirdiğimiz satış sonrası hizmet altyapımız ve alanında uzman teknik ekibimizle, ürünün tedarikinden devreye alımına ve ömür boyu desteğine kadar tüm süreçte müşterilerimizin yanında yer alıyoruz. Ar-Ge yatırımlarımızı sürekli artırarak en güncel teknolojiye sahip sistemleri Türkiye pazarına kazandırıyor, işletmelerin rekabet gücünü yükseltmelerine destek oluyoruz.",
        // Ingilizce metin henuz yok; onaylanana kadar Turkcesi gosterilir.
        en: "Zenweld Kaynak, 2000 yılında teknik hırdavat alanında başlattığı faaliyetlerini yıllar içinde kaynak ve kesme teknolojilerine odaklayarak, bugün Türkiye'nin önde gelen kaynak çözümleri sağlayıcılarından biri haline gelmiştir. İstanbul merkezli kurumsal yapımız ve İzmir'deki fabrikamızla, sanayinin artan kalite, hız ve verimlilik beklentilerine en güncel teknolojiyle yanıt veriyoruz.\n\n2012 yılından bu yana, dünyanın önde gelen kaynak teknolojisi üreticilerinden Shenzhen Jasic'in Türkiye'deki yetkili distribütörü ve OEM çözüm ortağıyız. 2016 yılında İzmir'de hayata geçirdiğimiz fabrika yatırımıyla küresel teknolojiyi Türkiye'de üreterek yerli sanayinin gelişimine doğrudan katkı sağlıyoruz. Bu yapı, müşterilerimize hem küresel kalite standardını hem de yerel üretimin getirdiği esneklik, hız ve uygun maliyet avantajını bir arada sunmamıza olanak tanıyor.\n\nKaynak teknolojilerindeki gelişmeleri yakından takip ederek, lazer kaynak makinelerini Türkiye sanayisiyle buluşturan öncü firmalardan biri olduk. Hassas kaynak gerektiren endüstrilerde devrim niteliğinde çözümler sunan lazer kaynak teknolojisi, üretim süreçlerinde yüksek kalite ve verimliliği bir arada mümkün kılmaktadır. Zenweld olarak, Türkiye sanayisinin daha verimli, hızlı ve ekonomik kaynak sistemlerine erişimini sağlamayı temel misyonumuz olarak benimsedik.\n\nGeniş ürün yelpazemiz; MMA, MIG/MAG ve TIG kaynak makineleri, plazma kesim sistemleri, lazer kaynak makineleri ve Cobot tabanlı (Cobot/MIG, Cobot/Lazer) otomasyon çözümlerinden oluşan kapsamlı bir teknoloji portföyünü kapsamaktadır. Yüksek verimlilik, hassasiyet ve kaliteyi öne çıkaran bu yenilikçi çözümlerle müşterilerimizin üretim süreçlerini daha hızlı, daha güvenilir ve daha ekonomik hâle getiriyoruz.\n\nZenweld, yalnızca ürün tedarik eden bir firma değil; sanayicilere danışmanlık, teknik destek ve satış sonrası hizmet sunan bir çözüm ortağıdır. İzmir'de merkezîleştirdiğimiz satış sonrası hizmet altyapımız ve alanında uzman teknik ekibimizle, ürünün tedarikinden devreye alımına ve ömür boyu desteğine kadar tüm süreçte müşterilerimizin yanında yer alıyoruz. Ar-Ge yatırımlarımızı sürekli artırarak en güncel teknolojiye sahip sistemleri Türkiye pazarına kazandırıyor, işletmelerin rekabet gücünü yükseltmelerine destek oluyoruz.",
      },
    },
    {
      id: "a2",
      title: { tr: "Vizyonumuz", en: "Vizyonumuz" },
      body: {
        tr: "Kaynak teknolojilerinde Türkiye'nin lider markası olmak ve küresel pazarda söz sahibi bir oyuncu hâline gelmek. Başta lazer kaynak teknolojileri olmak üzere yeni nesil kaynak ve otomasyon çözümlerinin sanayide yaygınlaşmasını sağlayarak, işletmelere daha yüksek kalite, verimlilik ve sürdürülebilir rekabet gücü kazandırmak önceliklerimiz arasındadır.",
        // Ingilizce metin henuz yok; onaylanana kadar Turkcesi gosterilir.
        en: "Kaynak teknolojilerinde Türkiye'nin lider markası olmak ve küresel pazarda söz sahibi bir oyuncu hâline gelmek. Başta lazer kaynak teknolojileri olmak üzere yeni nesil kaynak ve otomasyon çözümlerinin sanayide yaygınlaşmasını sağlayarak, işletmelere daha yüksek kalite, verimlilik ve sürdürülebilir rekabet gücü kazandırmak önceliklerimiz arasındadır.",
      },
    },
    {
      id: "a3",
      title: { tr: "Misyonumuz", en: "Misyonumuz" },
      body: {
        tr: "Sanayicilere en güncel teknolojiye sahip kaynak ve kesme sistemlerini sunarak üretim süreçlerini optimize etmek. Yerel üretim gücümüz, güçlü teknoloji ortaklıklarımız ve uzman teknik kadromuzla, başta lazer kaynak teknolojisi olmak üzere ileri kaynak çözümlerini erişilebilir ve yaygın hâle getirerek Türkiye'nin sanayi gücünün artmasına katkı sağlamak.",
        // Ingilizce metin henuz yok; onaylanana kadar Turkcesi gosterilir.
        en: "Sanayicilere en güncel teknolojiye sahip kaynak ve kesme sistemlerini sunarak üretim süreçlerini optimize etmek. Yerel üretim gücümüz, güçlü teknoloji ortaklıklarımız ve uzman teknik kadromuzla, başta lazer kaynak teknolojisi olmak üzere ileri kaynak çözümlerini erişilebilir ve yaygın hâle getirerek Türkiye'nin sanayi gücünün artmasına katkı sağlamak.",
      },
    },
    {
      id: "a4",
      title: { tr: "Değerlerimiz", en: "Değerlerimiz" },
      body: {
        tr: "- **Öncülük:** Sektördeki teknolojik gelişmeleri yakından izler, yeni nesil çözümleri Türkiye sanayisiyle ilk buluşturanlar arasında yer alırız.\n- **Kalite:** Küresel standartları yerel üretim disiplini ile birleştirir, her üründe yüksek kalite ve güvenilirliği esas alırız.\n- **Çözüm Ortaklığı:** Müşterilerimizi yalnızca alıcı değil, uzun vadeli iş ortağı olarak görür; danışmanlık ve teknik destekle her aşamada yanlarında oluruz.\n- **Güven:** Verdiğimiz sözün arkasında durur; şeffaflık, dürüstlük ve uzun vadeli iş birliği anlayışıyla müşterilerimizin ve iş ortaklarımızın güvenini esas alırız.\n- **Süreklilik:** Güçlü satış sonrası hizmet ağımız ve yedek parça altyapımızla ürünlerimizin ömür boyu performansını güvence altına alırız.",
        // Ingilizce metin henuz yok; onaylanana kadar Turkcesi gosterilir.
        en: "- **Öncülük:** Sektördeki teknolojik gelişmeleri yakından izler, yeni nesil çözümleri Türkiye sanayisiyle ilk buluşturanlar arasında yer alırız.\n- **Kalite:** Küresel standartları yerel üretim disiplini ile birleştirir, her üründe yüksek kalite ve güvenilirliği esas alırız.\n- **Çözüm Ortaklığı:** Müşterilerimizi yalnızca alıcı değil, uzun vadeli iş ortağı olarak görür; danışmanlık ve teknik destekle her aşamada yanlarında oluruz.\n- **Güven:** Verdiğimiz sözün arkasında durur; şeffaflık, dürüstlük ve uzun vadeli iş birliği anlayışıyla müşterilerimizin ve iş ortaklarımızın güvenini esas alırız.\n- **Süreklilik:** Güçlü satış sonrası hizmet ağımız ve yedek parça altyapımızla ürünlerimizin ömür boyu performansını güvence altına alırız.",
      },
    },
  ],
  updatedAt: "2026-10-08T09:00:00+03:00",
};

/**
 * SATIS TEMSILCILERIMIZ
 *
 * Zenweld'in verdigi liste (Ekim 2026). Yonetim panelinden
 * (/yonetim/satis-temsilcileri) eklenir, duzenlenir, silinir.
 */
const reps: [string, string, string, string, string][] = [
  ["Murat Kapucu", "İstanbul Avrupa Yakası", "Istanbul European Side", "+90 542 829 29 88", "murat.kapucu@zentek.com.tr"],
  ["Ümit Kapucu", "İstanbul Avrupa Yakası", "Istanbul European Side", "+90 533 370 94 63", "umit.kapucu@zentek.com.tr"],
  ["Murat Ulubaba", "İstanbul Anadolu Yakası", "Istanbul Anatolian Side", "+90 533 898 13 87", "murat.ulubaba@zenweld.com"],
  ["Emre Subaşı", "İstanbul Anadolu Yakası", "Istanbul Anatolian Side", "+90 535 677 55 78", "emre.subasi@zenweld.com"],
  ["Hüseyin Sevim", "Bursa Bölge", "Bursa Region", "+90 535 883 46 88", "huseyin.sevim@zenweld.com"],
  ["Hüseyin Açıkel", "Ege Bölge", "Aegean Region", "+90 535 883 50 95", "huseyin.acikel@zenweld.com"],
  ["Emrah Akyıldız", "Ege Bölge", "Aegean Region", "+90 530 955 41 12", "emrah.akyildiz@zenweld.com"],
  ["Hasan Kurtoğlu", "Akdeniz Bölge", "Mediterranean Region", "+90 553 379 33 36", "hasan.kurtoglu@zenweld.com"],
  ["Mehmet Yıldırım", "Akdeniz Bölge", "Mediterranean Region", "+90 535 883 50 97", "mehmet.yildirim@zenweld.com"],
  ["Harun Yaşın", "İç Anadolu Bölgesi", "Central Anatolia Region", "+90 533 409 12 49", "harun.yasin@zenweld.com"],
  ["Tuncay Sülün", "Demo ve Satış Sonrası Hizmetler Uzmanı", "Demo & After-Sales Services Specialist", "+90 507 837 55 56", "tuncay.sulun@zenweld.com"],
];

export const salesReps: SalesRep[] = reps.map(([name, tr, en, phone, email], i) => ({
  id: `sr${i + 1}`,
  name,
  region: { tr, en },
  phone,
  email,
  order: i + 1,
  active: true,
}));
