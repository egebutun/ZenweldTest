# GOOGLE ARAMA ONERILERININ TEMIZLENMESI (2026-11-16) -- yalnizca analiz icin, sitenin kodu degildir.
# google-oneri-taramasi.py ciktisini (<klasor>/ac2/sonuc.json) okur; rakip markasi, alakasiz
# (TV "kaynak ayari", sac kaynagi, plastik boru...) ve konu disi onerileri ayiklar, gruplara ayirir,
# tam liste (CSV) ve Anahtar Kelime Planlayici'ya yuklenecek listeyi yazar.
# Kullanim: python3 google-oneri-temizleme.py <klasor>  (klasorde ac2/sonuc.json ve cikti/ beklenir)
# Ayrinti: docs/SEO.md > Analizin tekrarlanmasi.
import json, csv, re, sys, collections, os
S=sys.argv[1]
st=json.load(open(f"{S}/ac2/sonuc.json"))
grp=st.get("grp",{})
# Onceki taramanin listesi varsa "yeni terim" sayisi ona gore hesaplanir; yoksa bos kabul edilir.
_onceki=f"{S}/cikti/anahtar-kelime-planlayici-listesi.txt"
old=set(l.strip() for l in open(_onceki,encoding="utf-8") if l.strip()) if os.path.exists(_onceki) else set()
RAKIP="magmaweld|askaynak|as kaynak|gedik|geka|gekamac|nuriş|nuris|lincoln|esab|fronius|kemppi|stanley|stayer|klpro|kl pro|awelco|sgs|catpower|crafter|demiriz|soyberg|stanvolt|hanker|paton|kolarc|özen|buğra|bluweld|rgwel|ciweld|bodor|telwin|gys|jetıı|kzubr|tieweld|mac&mos|atiker|starline|baymax|gfb|3m|labor|rayno|proter|essafe|trafimet|oerlikon|böhler|ewm|miller|hypertherm|xenon|dado|dxtech|beykon|blulaser|atomstack|milmaksan|tbk|nuris|weldmax|riland|sincap|dexter|condere|dawreek|dabu|einhell|bosch|makita|dewalt|milwaukee|ryobi|black decker|ingco|total|tolsen|wert|attlas|könig|max extra|rotex|kingdom|hugong|sacit|lava|binzel|abicor|yeswelder|vector|kanger|alpha|evo"
DISI="sahibinden|ikinci el|2\\. el|\\b2 el\\b|letgo|dolap|ilan|iş ilan|is ilan|operatör|gtip|hs code|h\\.s code|oyuncak|epilasyon|dövme|ameliyat|aliexpress|amazon|temu|trendyol|hepsiburada|n11|akakçe|cimri|koçtaş|bauhaus|bim|a101|şok|kdv|tevkifat|amortisman|gümrük|airpods|pods|kolormatik gözlük|gözlük camı|gözlük fiyat|tungsten karbür|tungsten küp|tungsten cube|tungsten nedir|kiralık|kiralama|patladı|sigara|kamyon|sözlük|ingilizce|ne demek|şarkı|film|dizi|oyun|minecraft|roblox|puzzle|çizim|png|logo|wallpaper|resim|pdf indir|sınav|soruları|meb|modül|lise|ders|kpss|ehliyet|maaş|maaşı|iş başvurusu|kurs|sertifika programı|belgesi nasıl alınır|izmir iş|istanbul iş"
WELD=re.compile(r"kaynak|lazer|plazma|torç|torc|tungsten|elektrot|elektrod|gazaltı|gaz altı|argon|\\btig\\b|\\btıg\\b|\\bmig\\b|\\bmıg\\b|\\bmag\\b|\\bmma\\b|kontak meme|nozul|şase|pense|zenweld|jasic|booster|tel sürme|colormatik kaynak|kolormatik kaynak|solarmatik|inverter|invertör|selülozik|özlü tel|sg2|sg3|er70|seramik meme|gaz lensi|ayak pedal|ultimate|evomig|forcearc|forcemig|forcetig|forcecut|multicut|y300")
MODEL=re.compile(r"ultimate|evomig|force|multicut|y300")
EX=re.compile(r"keratin|saça |solarmatik saat|incident|reddit|kaynakça|kaynak kod|kaynak göster|insan kaynak|enerji kaynağ|veri kaynağ|kaynak suyu|su kaynağ|sıcak su|kaynak yönetim|kaynak kitap|kaynak bul|kaynak tara|kaynak tuşu|kaynak ayarı menü|kaynak saç|saç kaynak|medikal|mikro kaynak|kaynak saçı|\\btv\\b|televizyon|arçelik|beko|vestel|samsung|\\blg\\b|philips|sony|toshiba|grundig|altus|regal|telefunken|plastik|pprc|\\bppr\\b|pe boru|polietilen|elektrofüzyon|branda|naylon|poşet|lazer yazıcı|lazer metre|lazer terazi|lazer pointer|lazer tag|lazer göz|lazer tedavi|lazer kesim|lazer kesme|lazer epilasyon|araba camı|osram|vernik|optik|atasun|güneş gözlüğü|migros|might|django|migrat|telefon|telekom|tcl|ütü|denali|gmc|rockshox|ultimate ears|char broil|tefal|şarkı|kaynak dizi|film kaynak|kaynak sayfa|kaynak site|kaynak link|kaynak yapma oyun|tiktok|instagram|facebook|youtube kaynak|apk|indir")
rk=re.compile(r"\b(%s)\b"%RAKIP); dk=re.compile(DISI)
def grup(s):
    rules=[("lazer_temizleme",r"lazer.*(temizle|pas|boya|cüruf|sök)"),("lazer_markalama",r"lazer.*(markala|kodla|yazı|kazıma|gravür)"),("lazer_aksesuar",r"lazer.*(kafa|tabanca|cam|lens|nozul|tel sür|gözlü|maske)"),("lazer_kaynak",r"lazer"),
      ("guvenlik",r"mask|gözlü|eldiven|önlü|kıyafet|colormatik|kolormatik|solarmatik|kararan"),
      ("tel",r"tel(i|leri)?\b|özlü|sg2|sg3|er70|308|316|4043|5356|argon çubu"),
      ("plazma",r"plazma"),("mig_aksesuar",r"kontak|nozul|meme|torc|torç|spiral|booster|push pull"),
      ("tig_aksesuar",r"tungsten|pens(i|e)\b|gaz lensi|pedal"),("mma_aksesuar",r"pense|şase|mandal"),
      ("diger_aksesuar",r"kablo|soğutma|tel sürme|makara|araba|kumanda|karbon elektrot|oluk"),
      ("cok_fonksiyonlu",r"çok fonksiyon|hem gaz|ve elektrot|mig tig|3 ü 1|3'ü 1"),
      ("gazalti",r"gaz ?altı|gazsız|tüpsüz|\bmig\b|\bmag\b|puls"),("argon",r"argon|\btig\b|\btıg\b|ac dc|ac/dc|alüminyum kaynak"),
      ("elektrot",r"elektro[td]|selülozik|örtülü|inverter|invertör"),("marka",r"zenweld|jasic|ultimate|evomig|force|multicut|y300"),
      ("bilgi",r"nasıl|nedir|neden|ne işe|hangi|kaç|çeşit|ayar"),("genel",r"kaynak")]
    for g,p in rules:
        if re.search(p,s): return g
    return "diger"
rows=[]; seen={}
for key,res in st["q"].items():
    if not res: continue
    yt=key.startswith("YT|"); q=key[3:] if yt else key
    for i,(s,score) in enumerate(res):
        s=re.sub(r"\s+"," ",s.strip().lower())
        if not s: continue
        neden=""
        if dk.search(s) or EX.search(s): neden="alakasız"
        elif rk.search(s) and not re.search(r"zenweld|jasic",s): neden="rakip markası"
        elif not WELD.search(s): neden="konu dışı"
        elif re.search(r"lazer",s) and not re.search(r"kaynak|temizle|pas |pas$|boya|cüruf|markala|kodla|kazıma|gravür|zenweld|jasic|qcw|ls-",s): neden="konu dışı"
        elif MODEL.search(s) and not re.search(r"zenweld|jasic|kaynak|lazer|plazma|\\btig\\b|\\bmig\\b|\\bmma\\b|amper|\\bcel\\b|thp|mts|mtc|ac ?dc|mte|cnc|qcw|ls-",s): neden="konu dışı"
        rows.append([q,s,i+1,score if score is not None else "", "youtube" if yt else "google", grup(s), neden])
        if not neden and s not in seen: seen[s]=grup(s)
# rapordaki terimler (öneri çıkmasa da sayısı istenecek)
rapor=list(grp.keys())+["kaynak su soğutma ünitesi","tel sürme uzatma ünitesi","plazma daire kesme aparatı","lazer koruyucu cam","lazer kaynak kafası","argon ayak pedalı","puls gazaltı kaynak makinesi","sanayi tipi gazaltı kaynak makinesi","ayrık tel sürmeli gazaltı","su soğutmalı argon kaynak makinesi","selülozik elektrot kaynak makinesi","lazer koruyucu gözlük","lazer markalama makinesi fiyat","lazer temizleme makinesi fiyatları","çanta tipi gazaltı kaynak makinesi","çanta tipi argon kaynak makinesi","yerli kaynak makinesi","türk kaynak makinesi markası","kaynak makinesi bayi","kaynak makinesi servisi","kaynak makinesi tamiri"]
for s in rapor:
    s=s.lower()
    if s not in seen and not rk.search(s) or s in("zenweld","jasic"): seen.setdefault(s,grup(s))
with open(f"{S}/cikti/google-otomatik-tamamlama-tum-v2.csv","w",newline="",encoding="utf-8-sig") as f:
    w=csv.writer(f); w.writerow(["aranan","oneri","sira","google_puani","kaynak","grup","cikarilma_nedeni"]); w.writerows(rows)
with open(f"{S}/cikti/anahtar-kelime-planlayici-listesi-v2.csv","w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["Keyword"]); [w.writerow([k]) for k in sorted(seen)]
c=collections.Counter(seen.values())
new=[k for k in seen if k not in old]
yt=[r for r in rows if r[4]=="youtube" and not r[6]]
print("sorgu:",len(st["q"]),"| toplam öneri satırı:",len(rows),"| benzersiz temiz terim:",len(seen),"| yeni:",len(new),"| youtube:",len({r[1] for r in yt}))
print("çıkarılan:",collections.Counter(r[6] for r in rows if r[6]))
print("gruplar:",dict(c.most_common()))
json.dump({"seen":seen,"new":new},open(f"{S}/ac2/ozet.json","w"),ensure_ascii=False)
