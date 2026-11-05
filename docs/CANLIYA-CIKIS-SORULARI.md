# Canlıya Çıkış — Şirketten Öğrenilecekler

Site canlıya çıkmadan önce şirketteki ilgili kişilerden (BT, SAP
danışmanı, muhasebe, hukuk, kargo ve ödeme kuruluşu) öğrenilmesi ya da
kararlaştırılması gerekenler. Kişiye göre gruplandı; her madde o kişiye
olduğu gibi sorulabilir.

**Nasıl kullanılır:**

1. İlgili bölümü o kişiye iletin.
2. Gelen cevabı Claude'a (ya da siteyi geliştiren kişiye) iletin. Cevap
   koda, panele ya da [KARARLAR.md](KARARLAR.md)'ye işlenir; madde
   işaretlenir.
3. Maddenin sonundaki etiket cevabın nereye gideceğini gösterir:
   - **[Panel]** Yönetim panelinden girilir; kod gerekmez.
   - **[Sunucu]** Canlı sunucuya ayar (ortam değişkeni) olarak girilir.
   - **[Karar]** Bir karardır; KARARLAR'a yazılır, gerekirse kod
     değişir.
   - **[Kod]** Cevap gelince küçük bir kod parçası yazılır (bağlantı
     parçası); sitenin geri kalanı değişmez.

**Güvenlik:** Şifreler, API anahtarları ve banka bilgileri bu dosyaya,
panele, e-postaya ya da mesaja **yazılmaz**. Yalnızca sunucuyu kuran
kişiye verilir; o kişi doğrudan sunucuya girer
([ENTEGRASYONLAR.md](ENTEGRASYONLAR.md) › 9).

Ayrıntılı teknik notlar: [YAPILACAKLAR.md](YAPILACAKLAR.md). Bu dosya
oradaki konulardan **şirketten öğrenilecek** olanları toplar.

---

## 1. BT (Bilgi İşlem)

**Sunucu ve alan adı**

- [ ] Site hangi sunucuda çalışacak (şirketin kendi sunucusu, kiralık
      sunucu, bulut)? Sunucu Türkiye'de mi? (Müşteri verisinin yurt
      dışında tutulması KVKK açısından hukukçuya da sorulmalı.) [Karar]
- [ ] Sunucuyu kim kuracak ve yönetecek? Kurulum: Node.js 22, önünde HTTPS
      sağlayan web sunucusu (ör. nginx). [Sunucu]
- [ ] `zenweld.com` alan adı ve DNS kayıtları kimin yönetiminde? DNS'e
      kayıt ekleyebilecek kişi kim? (E-posta doğrulaması ve sitenin
      adrese bağlanması için.) [Sunucu]
- [ ] Deneme (test) ortamı olacak mı? Canlıya almadan önce değişiklikler
      orada denenir. [Karar]

**Veritabanı ve yedek**

- [ ] PostgreSQL 18 nerede çalışacak (yönetilen hizmet mi, sunucunun
      içinde mi)? Canlı ve deneme için ayrı veritabanı. [Sunucu]
- [ ] Yedekler ne sıklıkla alınacak, nerede saklanacak, kaç gün tutulacak?
      Yedekten geri dönme bir kez denenecek mi? [Karar]

**Dosya deposu (fotoğraflar ve belgeler)**

- [ ] Ürün fotoğrafları ve MSDS gibi belgeler nerede saklanacak: sunucunun
      diskinde mi, ayrı bir dosya deposunda (S3 uyumlu) mı? Yedeği nasıl
      alınacak? (Sunucunun diskine yazan depo hazır: `DOSYA_KLASORU`; bu
      klasör yedeğe eklenmeli. S3 uyumlu depo seçilirse onun parçası
      yazılır.) [Karar] [Kod]

**Zamanlanmış işler ve izleme**

- [ ] Sunucuda zamanlayıcı kurulabilir mi? (SAP stoğu 15 dakikada bir
      okunacak; süresi dolan havale siparişleri günde bir iptal
      edilecek.) [Sunucu]
- [ ] Hata ve kesinti olursa kime haber gidecek (izleme)? [Karar]

**Güvenlik**

- [ ] Sunucudan SAP'a ağ erişimi nasıl olacak (VPN, güvenlik duvarı
      izni)? [Sunucu]
- [ ] Formlar için bot koruması (ör. Cloudflare Turnstile) ve istek
      sınırı kimde kurulacak? [Sunucu] [Kod]
- [ ] Sunucu ayarlarını (anahtar, şifre) kim girecek ve kimler
      görebilecek? [Karar]

**E-posta**

- [ ] Site e-postaları hangi servisten gönderilecek? Bugün Resend için
      hazır; şirketin kullandığı başka bir servis varsa söylenmeli.
      [Karar] [Kod]
- [ ] Gönderen adres ne olacak (ör. `noreply@zenweld.com`)? Bu adresin
      alan adı doğrulaması (SPF, DKIM kayıtları) DNS'e eklenmeli.
      [Sunucu]
- [ ] Formların geldiği `info@zenweld.com` kutusunu kim okuyor? [Karar]

---

## 2. SAP danışmanı

**Genel**

- [ ] SAP Business One sürümü ve veritabanı türü (HANA mı, SQL Server
      mı)? [Kod]
- [ ] Service Layer (SAP'ın web servisi) açık mı? Açıksa adresi ve site
      için ayrı bir kullanıcı açılabilir mi? [Sunucu]
- [ ] Deneme için SAP'ta test şirketi var mı? [Sunucu]

**Stok okuma** (site 15 dakikada bir okur)

- [ ] Sitede gösterilecek "kullanılabilir stok" hangi görünümden okunacak
      (bugün `AVAILABLE_STOCK` diye anılıyor)? Kesin adı ve kolonları
      (kalem kodu, miktar). [Kod]
- [ ] Stok hangi depo(lar)dan gelecek? [Karar]
- [ ] Sitedeki ürün kodları SAP kalem kodlarıyla birebir aynı mı?
      Seçenekli ürünler (ör. 3 m / 5 m kablo) SAP'ta ayrı kalem mi?
      [Karar]
- [ ] Okuma yolu: Service Layer mı, veritabanına salt okunur kullanıcı
      mı? [Sunucu] [Kod]

**Siparişin SAP'a yazılması**

- [ ] Site siparişi SAP'ta satış siparişi olarak hangi API ile açılır?
      [Kod]
- [ ] Müşteri kartı: her web müşterisi SAP'ta ayrı cari mi açılacak,
      yoksa tek bir "web satış" carisi mi kullanılacak? [Karar]
- [ ] Siparişte fiyat KDV dahil mi hariç mi gönderilecek? Kargo ücreti,
      kupon indirimi ve taksit vade farkı SAP'ta nasıl gösterilecek
      (ayrı satır, belge indirimi…)? [Karar]
- [ ] Sipariş ödeme kesinleşince aktarılacak şekilde kuruldu (kartla
      verilince, havalede "Ödeme Alındı" denince); uygun mu? Kaç dakikada
      bir gönderilsin (bugün öneri 5 dakika)? İptal ve iade SAP'a nasıl
      yansısın? [Karar]
- [ ] Aktarım başarısız olursa kim ilgilenecek? (Panelde sipariş
      detayında durum, hata ve SAP belge numarası görünüyor; gönderilemeyen
      sipariş yeniden sıraya alınabiliyor.) SAP'ın hangi hataları geçici
      sayılsın (yeniden denensin), hangileri kalıcı? [Karar] [Kod]
- [ ] Faturayı (e-Fatura / e-Arşiv) SAP mi kesiyor? [Karar]

---

## 3. Ödeme (banka / ödeme kuruluşu) — muhasebe ile birlikte

- [ ] Kartla ödeme hangi kuruluşla alınacak: iyzico, PayTR, bankaların
      sanal POS'u (hangi bankalar)? [Karar] [Kod]
- [ ] Kuruluşun 3D Secure ödeme sayfası kullanılacak (kart bilgisi
      bizim sunucumuza hiç gelmez). Kuruluşun deneme (test) hesabı
      açılabilir mi? [Sunucu]
- [ ] Üye işyeri numaraları ve API anahtarları (yalnızca sunucuya
      girilir). [Sunucu]
- [ ] Taksit: hangi kart programları (Bonus, World, Maximum…), kaç taksit,
      vade farkını müşteri mi öder, bankanın komisyon oranları? [Panel]
- [ ] Para iadesi kuruluş üzerinden mi yapılacak (kısmi iade dahil)?
      [Karar] [Kod]
- [ ] Havale/EFT: gerçek IBAN'lar ve hesap sahibi adı; ödeme süresi
      (bugün 3 gün) uygun mu; havaleyi panelde kim onaylayacak? [Panel]

---

## 4. Muhasebe / mali müşavir

- [ ] e-Fatura / e-Arşiv hangi yazılım ya da entegratörle kesiliyor?
      Site siparişinin faturası kim tarafından, ne zaman kesilecek?
      [Karar] [Kod]
- [ ] Sipariş ve fatura kayıtları yasal olarak kaç yıl saklanmalı?
      (Hesap silme ve KVKK imha kuralları buna göre yazılır.) [Karar]
- [ ] Kurumsal faturada istenen bilgiler (unvan, vergi dairesi, vergi
      no) yeterli mi? [Karar]
- [ ] Kargo ücreti ve vade farkı faturada nasıl gösterilecek? [Karar]

---

## 5. Kargo firmaları / lojistik

- [ ] Hangi kargo firmalarıyla çalışılacak? [Panel]
- [ ] Her firmanın takip sayfasının adresi (takip numarasıyla açılan
      adres). Panelde Mağaza Ayarları › Kargo Firmaları'na girilir.
      [Panel]
- [ ] Firma API veriyor mu (kargo etiketi oluşturma, gönderi durumu,
      teslim bilgisi)? Veriyorsa belgeleri ve test hesabı. [Kod]
- [ ] Kargo ücreti: sabit mi kalacak, yoksa desi, ağırlık ya da bölgeye
      göre mi hesaplanacak? Ücretsiz kargo sınırı (bugün örnek 5.000 ₺)
      ve ücret (örnek 250 ₺)? [Karar] [Panel]
- [ ] İadede müşteri ürünü hangi firmayla, hangi anlaşmalı kodla
      gönderecek? Ücretini kim ödeyecek? [Karar]

---

## 6. Hukuk danışmanı / KVKK

- [ ] Sözleşme ve yasal metinler: Ön Bilgilendirme Formu, Mesafeli Satış
      Sözleşmesi, İade ve Değişim, Kullanım Koşulları, Gizlilik, Çerez
      Politikası, KVKK Aydınlatma Metni ve diğer politikalar. Bugünkü
      metinler taslak; hukukçunun metinleriyle değiştirilmeli. [Panel]
- [ ] Kurumsal (ticari) alıcılara cayma hakkı uygulanacak mı? [Karar]
- [ ] ETBİS kaydı (Ticaret Bakanlığı) ve MERSİS numarası. Unvan ve MERSİS
      sitede nerede gösterilmeli (alt bilgi, İletişim)? [Panel] [Karar]
- [ ] Müşteri verisi yurt dışındaki bir sunucuda tutulabilir mi? [Karar]
- [ ] Üye hesabını silince hangi kayıtlar silinsin, hangileri yasal süre
      boyunca saklansın (sipariş, teklif, garanti, yorum)? Ayrıntı:
      [YAPILACAKLAR.md](YAPILACAKLAR.md) › Hesap silme. [Karar]
- [ ] Çerezler: analiz ve pazarlama çerezleri (ör. Google Analytics)
      kullanılacaksa onay metni. [Karar]
- [ ] Ticari ileti (bülten) için İYS kaydı. [Karar]

---

## 7. Satış ve müşteri hizmetleri (şirket içi süreçler)

- [ ] **İade süreci:** kim inceler, kaç günde yanıt verilir, ürün nasıl
      geri gelir, depoda kontrol, para iadesi kaç günde ve nasıl,
      değişim olacak mı, müşteriye hangi aşamada e-posta gider? Ayrıntı:
      [YAPILACAKLAR.md](YAPILACAKLAR.md) › İade talebi 5. [Karar]
- [ ] Hangi formun e-postası kime gitsin (sipariş, iade, teklif, servis,
      garanti…)? Panelde Mağaza Ayarları › E-posta Alıcıları'na girilir.
      [Panel]
- [ ] Panele kimler girecek? Her biri için yönetici hesabı açılır.
      [Sunucu]
- [ ] Müşteriye gidecek e-postalar: sipariş onayı (yasal zorunlu,
      sözleşme kopyasıyla), havale hatırlatma, kargoya verildi, teslim
      edildi, şifre sıfırlama. Gönderen adı ve metinler. [Karar]

---

## 8. Pazarlama ve içerik

- [ ] Gerçek ürün fotoğrafları, teknik değerler ve fiyatlar. [Panel]
- [ ] Fotoğrafların boyutu ve kalitesi için bir standart (sahibiyle
      konuşulacak, K-102). [Karar]
- [ ] Google Search Console ve (istenirse) Google Analytics hesaplarını
      kim açacak ve yönetecek? [Sunucu] [Karar]
- [ ] Bülten için hangi servis kullanılacak (ör. Mailchimp, Brevo)?
      [Karar] [Kod]
- [ ] Sosyal medya hesaplarının adresleri doğru mu? Panelde Mağaza
      Ayarları › Şirket ve İletişim'de. [Panel]
