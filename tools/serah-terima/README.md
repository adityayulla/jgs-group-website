# Regenerasi arsip Wall of Receipts

Dipakai kalau ada foto arsip baru, atau mau mengubah kurasi/kompresi.
Foto sumber ada di Google Drive folder `1phlUh11QkaYMq4GHXv9DddnoMUHjtw8_`.

```bash
cd tools/serah-terima
mkdir -p raw
python3 - <<'PY'          # 1. unduh (butuh folder Drive di-share "anyone with link")
import subprocess, pathlib, sys; sys.path.insert(0,'.')
from manifest import FILES
raw = pathlib.Path("raw")
for proj, label, fid in FILES:
    out = raw / f"{proj}__{label.replace(' ','-')}.jpg"
    if out.exists(): continue
    subprocess.run(["curl","-sL","-o",str(out),
                    f"https://drive.google.com/uc?export=download&id={fid}"])
PY
python3 build.py           # 2. dedup + kompres → assets/img/serah-terima/ + assets/data/
python3 gen_html.py        # 3. cetak potongan HTML → snippets/
```

Lalu tempel `snippets/ticker.html` ke `#stRail` dan `snippets/strip.html` ke
`#stStrip` di `index.html`, serta `snippets/grid.html` ke `#stGrid` di
`serah-terima/index.html`.

**Jangan lupa bump `?v=` pada `global.css`** kalau CSS-nya ikut berubah.

Kurasi ada di `build.py`:
- `DROP` — foto yang dibuang (orang tidak terlihat / bukan momen serah terima)
- `FEATURED` — urutan foto terkuat, mengisi strip "5 terakhir" selama antrean
  dashboard masih kosong
- `NAMES` — nama pembeli yang sudah berizin tampil. **Jangan mengarang nama.**
