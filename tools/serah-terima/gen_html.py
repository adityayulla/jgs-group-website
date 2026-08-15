"""Cetak potongan HTML statis dari arsip.

Kenapa statis, bukan dirender JS: halaman /serah-terima/ harus bisa
dibaca mesin pencari dan tetap tampil kalau dashboard sedang mati.
JS hanya MENAMBAH entri live di depan (lihat assets/js/serah-terima.js).
"""
import json, pathlib, html

DATA = pathlib.Path("/Users/adityasamawi/Projects/JGS-Group/assets/data/serah-terima-arsip.json")
OUT = pathlib.Path("snippets"); OUT.mkdir(exist_ok=True)

d = json.load(open(DATA))
items = d["items"]

featured = sorted([i for i in items if i["featured"] is not None],
                  key=lambda x: x["featured"])
rest = [i for i in items if i["featured"] is None]
ordered = featured + rest


def label_of(i):
    """Label kartu: 'Yama 20'.

    Kalau tipe/nomornya tak diketahui, kartu TIDAK diberi baris teks —
    cukup stempel nama perumahan di atas foto. Kalau dipaksa memakai
    nama perumahan, lima foto Tentrem Jiwo akan terbaca sebagai lima
    pengulangan yang sama, bukan lima rumah berbeda.
    """
    return i["unit"]


def cap_of(i):
    return f"{i['unit']} · {i['project']}" if i["unit"] else i["project"]


def dims(i):
    from PIL import Image
    root = pathlib.Path("/Users/adityasamawi/Projects/JGS-Group")
    with Image.open(root / i["thumb"].lstrip("/")) as im:
        return im.size


def alt_of(i):
    unit = f" unit {i['unit']}" if i["unit"] else ""
    return f"Serah terima kunci{unit} di {i['project']} — JGS Group"


def card(i, thumb=True, lazy=True, eager=False):
    src = i["thumb"] if thumb else i["photo"]
    loading = "" if eager else ' loading="lazy"'
    w, h = dims(i)
    stamp = f'<span class="st__stamp">{html.escape(i["project"])}</span>'
    body = (f'<div class="st__body"><div class="st__name">'
            f'{html.escape(label_of(i))}</div></div>') if i["unit"] else ""
    return f'''      <a class="st__card" href="{i['photo']}" data-st-lb
         data-cap="{html.escape(cap_of(i))}">
        <div class="st__media">
          {stamp}
          <img src="{src}" alt="{html.escape(alt_of(i))}" width="{w}" height="{h}"{loading} decoding="async">
        </div>
        {body}
      </a>'''


def tick(i, eager=False):
    loading = "" if eager else ' loading="lazy"'
    tickcap = (f'<b>{html.escape(label_of(i))}</b>{html.escape(i["project"])}'
               if i["unit"] else f'<b>{html.escape(i["project"])}</b>')
    return f'''        <a class="st-tick__item" href="/serah-terima/">
          <img src="{i['thumb']}" alt="{html.escape(alt_of(i))}" width="124" height="124"{loading} decoding="async">
          <span class="st-tick__cap">{tickcap}</span>
        </a>'''


# ── Ticker ──────────────────────────────────────────────────────
# Rel dicetak DUA KALI supaya gulirannya mulus (animasi geser -50%).
# Konsekuensinya: begitu salinan pertama lebih sempit dari layar,
# pengunjung melihat foto yang sama dua kali dalam satu putaran.
# Dengan 14 foto (1.904px) itu terjadi di detik ke-11 pada layar 1440px.
# 36 foto = 4.896px → salinan kedua baru muncul setelah ±83 detik.
# Kalau angka ini diubah, sesuaikan durasi .st-tick__rail di global.css
# supaya kecepatannya tetap (±41 px/detik).
# Hanya foto yang punya nama tipe: di ticker, keterangan itu satu-satunya
# teks, jadi tiga foto "Kawa Living" tanpa tipe akan terbaca sebagai
# pengulangan. Di halaman penuh mereka tetap tampil (tanpa baris teks).
tick_items = [i for i in ordered if i["unit"]][:36]
rail = "\n".join(tick(i, eager=(n < 3)) for n, i in enumerate(tick_items))
rail += "\n" + "\n".join(tick(i) for i in tick_items)  # salinan untuk loop
(OUT / "ticker.html").write_text(rail)

# ── Strip 5 kartu di homepage ──
(OUT / "strip.html").write_text("\n".join(card(i) for i in ordered[:5]))

# ── Grid penuh halaman /serah-terima/ ──
(OUT / "grid.html").write_text("\n".join(card(i) for i in ordered))

print(f"ticker: {len(tick_items)}×2 · strip: 5 · grid: {len(ordered)}")
print("per proyek:", d["perProject"])
