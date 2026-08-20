#!/bin/zsh
# siteplan.svg -> PNG (headless Chrome) -> WEBP siap pasang.
#   ./tools/siteplan/tentrem-bhumi/5-render.sh
set -e
DIR="${0:a:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W=1160; H=2080                     # samakan dengan W, H di 2-gambar-siteplan.py
OUT="$DIR/siteplan-tentrem-bhumi-2026-08.webp"

cat > "$DIR/_wrap.html" <<HTML
<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#fff}img{display:block;width:${W}px;height:${H}px}</style>
<img src="file://$DIR/siteplan.svg">
HTML

"$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --allow-file-access-from-files --window-size=$W,$H \
  --screenshot="$DIR/_siteplan.png" "file://$DIR/_wrap.html" 2>/dev/null

python3 - "$DIR/_siteplan.png" "$OUT" <<'PY'
import sys
from PIL import Image
Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'WEBP', quality=90, method=6)
print(sys.argv[2])
PY
rm -f "$DIR/_wrap.html" "$DIR/_siteplan.png"
echo "Salin ke tentrem-bhumi/photos/kawasan/ kalau sudah lolos 4-periksa.py"
