#!/bin/bash
# Zenweld sitesini bilgisayarda calistirir (Mac: Finder'da cift tikla).
#
# 1. GitHub'daki son degisiklikleri indirir (git pull).
# 2. Gerekirse paketleri kurar (npm install).
# 3. Siteyi http://localhost:3000 adresinde acar.
# 4. Pencere acik kaldikca 5 dakikada bir GitHub'i kontrol eder; yeni
#    degisiklik varsa indirir, acik sayfa kendiliginden yenilenir.
#
# Kapatmak icin bu pencerede Ctrl+C'ye basin ya da pencereyi kapatin.

cd "$(dirname "$0")" || exit 1

CHECK_EVERY=300

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js kurulu degil."
  echo "https://nodejs.org adresinden LTS surumunu indirip kurun, sonra bu dosyaya tekrar cift tiklayin."
  read -r -p "Kapatmak icin Enter'a basin..."
  exit 1
fi

# GitHub'daki son hali indirir. Bilgisayarda elle degistirilmis ve
# GitHub'dakiyle cakisan bir dosya varsa hicbir seyi ezmez, uyarir.
update() {
  local before after
  before=$(git rev-parse HEAD)
  if ! git pull --ff-only -q 2>/dev/null; then
    echo "[$(date +%H:%M)] GitHub'dan guncelleme alinamadi (internet yok ya da bilgisayarda degistirilmis dosya var)."
    return 1
  fi
  after=$(git rev-parse HEAD)
  if [ "$before" != "$after" ]; then
    echo "[$(date +%H:%M)] Yeni degisiklikler indirildi:"
    git log --oneline "$before..$after" | sed 's/^/   /'
    if ! git diff --quiet "$before" "$after" -- package-lock.json; then
      PACKAGES_CHANGED=1
    fi
  fi
}

echo "GitHub'daki son degisiklikler kontrol ediliyor..."
PACKAGES_CHANGED=0
update

if [ ! -d node_modules ] || [ "$PACKAGES_CHANGED" = 1 ]; then
  echo "Paketler kuruluyor (ilk seferde birkac dakika surebilir)..."
  npm install || { read -r -p "Kurulum basarisiz. Kapatmak icin Enter'a basin..."; exit 1; }
fi

(
  while true; do
    sleep "$CHECK_EVERY"
    update
    if [ "$PACKAGES_CHANGED" = 1 ]; then
      echo "   Paket listesi degisti: bu pencereyi kapatip dosyaya tekrar cift tiklayin."
      PACKAGES_CHANGED=0
    fi
  done
) &
WATCHER=$!
trap 'kill "$WATCHER" 2>/dev/null' EXIT

(sleep 8 && open "http://localhost:3000") &

echo ""
echo "Site: http://localhost:3000   Yonetim paneli: http://localhost:3000/yonetim"
echo "Kapatmak icin Ctrl+C."
echo ""
npm run dev
