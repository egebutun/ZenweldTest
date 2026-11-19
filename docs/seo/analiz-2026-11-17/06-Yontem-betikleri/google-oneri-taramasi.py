# GOOGLE ARAMA ONERISI TARAMASI (2026-11-16) -- yalnizca analiz icin, sitenin kodu degildir.
# Google'in arama kutusu onerilerini (otomatik tamamlama) Turkiye/Turkce ayariyla sorgular:
# baslangic kelimeleri, harf/rakam acilimi, soru kaliplari, ikinci seviye ve YouTube.
# Kullanim: python3 google-oneri-taramasi.py <cikti.json>   (ayni dosyayla tekrar calistirilirsa kaldigi yerden devam eder)
# Ayrinti: docs/SEO.md > Analizin tekrarlanmasi.
import json, time, urllib.request, urllib.parse, sys, os
OUT=sys.argv[1]
G={
"genel":["kaynak makinesi","kaynak makinası","kaynak makineleri","inverter kaynak makinesi","invertör kaynak makinesi","çanta kaynak makinesi","200 amper kaynak makinesi","160 amper kaynak makinesi","220 volt kaynak makinesi","380 volt kaynak makinesi","sanayi tipi kaynak makinesi","profesyonel kaynak makinesi","ev tipi kaynak makinesi","kaynak ekipmanları","kaynak malzemeleri","kaynak makinesi markaları"],
"gazalti":["gazaltı kaynak makinesi","gazaltı kaynak makinası","gaz altı kaynak makinesi","mig kaynak makinesi","mig mag kaynak makinesi","tüpsüz gazaltı kaynak makinesi","gazsız gazaltı kaynak makinesi","puls gazaltı","gazaltı kaynağı","su soğutmalı gazaltı"],
"argon":["argon kaynak makinesi","argon kaynak makinası","tig kaynak makinesi","ac dc argon","ac dc tig","alüminyum kaynak makinesi","argon kaynağı","tig kaynağı","su soğutmalı argon"],
"elektrot":["elektrot kaynak makinesi","elektrod kaynak makinesi","elektrik kaynak makinesi","selülozik elektrot","selülozik kaynak makinesi","elektrot kaynağı","örtülü elektrot"],
"cok_fonksiyonlu":["çok fonksiyonlu kaynak makinesi","gazaltı ve elektrot kaynak makinesi","mig tig kaynak makinesi","hem gazaltı hem elektrot","3 ü 1 arada kaynak makinesi"],
"plazma":["plazma kesme makinesi","plazma kesim makinesi","plazma kesme","cnc plazma kesim","plazma kaynak makinesi"],
"lazer_kaynak":["lazer kaynak makinesi","lazer kaynak","el tipi lazer kaynak","fiber lazer kaynak makinesi","lazer kaynak makinası","lazer kaynağı","qcw lazer kaynak"],
"lazer_temizleme":["lazer temizleme makinesi","lazer pas temizleme","lazer temizleme","lazer boya sökme","lazer pas sökme","lazer temizleme makinası"],
"lazer_markalama":["lazer markalama makinesi","lazer markalama","fiber lazer markalama","uv lazer markalama","lazer kodlama makinesi","lazer markalama makinası"],
"lazer_aksesuar":["lazer kaynak kafası","lazer kaynak tabancası","lazer kaynak camı","lazer kaynak lensi","lazer tel sürme","lazer kaynak nozulu"],
"mig_aksesuar":["gazaltı torcu","mig torcu","gazaltı kaynak torcu","push pull torç","kontak meme","gaz nozulu","gazaltı memesi","torç spirali","booster"],
"tig_aksesuar":["argon torcu","tig torcu","argon kaynak torcu","argon pensi","seramik meme","gaz lensi","tungsten elektrot","tungsten","argon ayak pedalı","tig ayak pedalı"],
"mma_aksesuar":["elektrot pensesi","şase pensesi","şase mandalı","kaynak pensesi"],
"plazma_aksesuar":["plazma torcu","plazma elektrot","plazma memesi","plazma sarf","plazma pergeli"],
"diger_aksesuar":["kaynak kablosu","kaynak su soğutma","kaynak soğutma ünitesi","tel sürme ünitesi","tel sürme makarası","kaynak makinesi arabası","tüp arabası","kaynak uzaktan kumanda","karbon elektrot","oluk açma elektrodu"],
"guvenlik":["kaynak maskesi","otomatik kararan kaynak maskesi","colormatik","colormatik kaynak maskesi","kolormatik kaynak maskesi","solarmatik","lazer gözlüğü","lazer kaynak gözlüğü","lazer kaynak maskesi","kaynak eldiveni","kaynakçı eldiveni","argon eldiveni","kaynak önlüğü","kaynakçı kıyafeti","kaynak gözlüğü"],
"tel":["kaynak teli","gazaltı kaynak teli","gazaltı teli","sg2 kaynak teli","sg3 kaynak teli","özlü tel","özlü kaynak teli","gazsız kaynak teli","paslanmaz kaynak teli","alüminyum kaynak teli","argon kaynak teli","tig teli","argon teli","er70s-6","308l kaynak teli","4043 kaynak teli","bakır kaplı kaynak teli"],
"marka":["zenweld","zenweld kaynak","jasic","jasic kaynak","magmaweld","askaynak","gekamac","nuriş"],
"model":["ultimate 405","ultimate 250","ultimate 205","ultimate 320","ultimate 255","evomig","evomig 205","forcearc","forcemig","forcetig","forcecut","multicut","multicut 105","y300 lazer","ls-20000f","zenweld ultimate","zenweld arc","zenweld evomig","zenweld multicut"],
"bilgi":["kaynak nasıl yapılır","kaynak makinesi nasıl","gazaltı kaynağı nasıl","argon kaynağı nasıl","elektrot kaynağı nasıl","kaynak çeşitleri","kaynak dikişi","kaynak ayarları","kaynak amper ayarı","kaynakçı"],
}
DEEP=set(G["genel"][:8]+G["gazalti"][:7]+G["argon"][:6]+G["elektrot"][:5]+G["cok_fonksiyonlu"][:2]+G["plazma"][:3]+G["lazer_kaynak"][:5]+G["lazer_temizleme"][:4]+G["lazer_markalama"][:4]+G["mig_aksesuar"][:6]+G["tig_aksesuar"][:7]+G["mma_aksesuar"][:3]+G["plazma_aksesuar"][:2]+G["diger_aksesuar"][:6]+G["guvenlik"][:10]+G["tel"][:12]+["zenweld"]+G["bilgi"][:4])
LET=list("abcçdefghıijklmnoöprsştuüvyz0123456789")
SUF=[" nedir"," nasıl"," hangi"," kaç"," mı"," neden"," ne işe yarar"," fiyat"," en iyi"," ayarları"," özellikleri"," çeşitleri"," tavsiye"," yorumları"]
PRE=["en iyi ","hangi ","nasıl ","ucuz ","en ucuz ","profesyonel "]
QSEEDS=[s for g in ["genel","gazalti","argon","elektrot","plazma","lazer_kaynak","lazer_temizleme","lazer_markalama","guvenlik","tel","mig_aksesuar","tig_aksesuar"] for s in G[g][:4]]
state={"q":{}} if not os.path.exists(OUT) else json.load(open(OUT))
def q(s,yt=False):
    key=("YT|" if yt else "")+s
    if key in state["q"]: return state["q"][key]
    p={"client":"chrome","hl":"tr","gl":"tr","ie":"utf-8","oe":"utf-8","q":s}
    if yt: p={"client":"firefox","ds":"yt","hl":"tr","gl":"tr","ie":"utf-8","oe":"utf-8","q":s}
    url="https://suggestqueries.google.com/complete/search?"+urllib.parse.urlencode(p)
    for i in range(5):
        try:
            with urllib.request.urlopen(url,timeout=15) as r:
                d=json.loads(r.read().decode("utf-8","replace"))
            sug=d[1]; rel=[]
            if not yt and len(d)>4 and isinstance(d[4],dict): rel=d[4].get("google:suggestrelevance",[])
            res=[[x,(rel[i] if i<len(rel) else None)] for i,x in enumerate(sug)]
            state["q"][key]=res; return res
        except Exception as e:
            time.sleep(3*(i+1))
    state["q"][key]=None; return []
n=0
def run(s,yt=False):
    global n
    r=q(s,yt); n+=1
    if n%100==0:
        json.dump(state,open(OUT,"w"),ensure_ascii=False); print(n,"sorgu",flush=True)
    time.sleep(0.3); return r
grp={}
for g,ss in G.items():
    for s in ss: grp[s]=g
# 1) düz
for s in grp: run(s)
# 2) harf/rakam açılımı
for s in DEEP:
    for l in LET: run(f"{s} {l}")
# 3) soru kalıpları
for s in QSEEDS:
    for x in SUF: run(s+x)
    for x in PRE: run(x+s)
# 4) ikinci seviye: düz sorguların önerileri tekrar
lvl2=[]
for s in grp:
    for x,_ in (state["q"].get(s) or []):
        if x!=s and x not in state["q"]: lvl2.append(x)
for s in dict.fromkeys(lvl2): run(s)
# 5) YouTube
for s in G["bilgi"]+["gazaltı kaynak makinesi","argon kaynak makinesi","lazer kaynak makinesi","lazer temizleme makinesi","plazma kesme makinesi","elektrot kaynak makinesi","kaynak maskesi","zenweld"]:
    run(s,yt=True)
    for x in [" nasıl"," ayarları"," kullanımı"]: run(s+x,yt=True)
state["grp"]=grp
json.dump(state,open(OUT,"w"),ensure_ascii=False)
print("BITTI",n,"sorgu")
