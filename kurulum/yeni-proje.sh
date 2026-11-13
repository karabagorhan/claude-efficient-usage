#!/usr/bin/env bash
# Kullanım: kurulum/yeni-proje.sh <uygulama|ofis> <hedef-klasör>
# Seçilen şablonu hedef klasöre kopyalar. Var olan dosyaların üzerine yazmaz.
set -euo pipefail

tur="${1:-}"
hedef="${2:-}"
kok="$(cd "$(dirname "$0")/.." && pwd)"

case "$tur" in
  uygulama) kaynak="$kok/sablonlar/uygulama-projesi" ;;
  ofis)     kaynak="$kok/sablonlar/ofis-projesi" ;;
  *) echo "Kullanım: $0 <uygulama|ofis> <hedef-klasör>" >&2; exit 1 ;;
esac
[ -n "$hedef" ] || { echo "Hedef klasör belirtilmedi." >&2; exit 1; }

mkdir -p "$hedef/.claude"
for dosya in CLAUDE.md .claude/settings.json; do
  if [ -e "$hedef/$dosya" ]; then
    echo "ATLANDI (zaten var): $hedef/$dosya  ->  elle birleştirin: $kaynak/$dosya"
  else
    cp "$kaynak/$dosya" "$hedef/$dosya"
    echo "KOPYALANDI: $hedef/$dosya"
  fi
done

if [ "$tur" = "uygulama" ]; then
  echo
  echo "Playwright gerekiyorsa (bir kez, global):  npm install -g @playwright/cli@latest"
  echo "Sonra proje klasöründe:                  playwright-cli install --skills"
fi
echo
echo "Claude Code'u bu klasörde açın; klasöre güvendiğinizde plugin kurulumu önerilecek."
