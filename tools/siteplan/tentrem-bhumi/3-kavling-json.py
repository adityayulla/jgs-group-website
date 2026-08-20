"""Langkah 3 — tulis tentrem-bhumi/siteplan-kavling.json dari kavling-kanvas.json.

    python3 tools/siteplan/tentrem-bhumi/3-kavling-json.py

Mengubah poligon kavling dari piksel kanvas jadi PERSEN terhadap gambar,
supaya overlay status jual di situs (dan di Progress Dashboard, yang
meminjam file yang sama) ikut melar bersama gambarnya.

WAJIB diperiksa mata sesudahnya:
    python3 tools/siteplan/tentrem-bhumi/4-periksa.py
"""
import json, os

DIR    = os.path.dirname(os.path.abspath(__file__))
REPO   = os.path.dirname(os.path.dirname(os.path.dirname(DIR)))
KANVAS = os.path.join(DIR, 'kavling-kanvas.json')
KELUAR = os.path.join(REPO, 'tentrem-bhumi', 'siteplan-kavling.json')
GAMBAR = 'photos/kawasan/siteplan-tentrem-bhumi-2026-08.webp'

src = json.load(open(KANVAS))
W, H = [float(v) for v in src['ukuran']]
kav = src['kavling']

def urut(k):
    tipe, no = k.rsplit(' ', 1)
    return (['Andrawina', 'Bhama', 'Cantya'].index(tipe), int(no))

out = []
for code in sorted(kav, key=urut):
    poly = [[round(x / W * 100, 3), round(y / H * 100, 3)] for x, y in kav[code]]
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    out.append({'code': code, 'poly': poly,
                'bbox': [min(xs), min(ys), max(xs), max(ys)]})

json.dump({
  '_catatan': [
    'Bentuk kavling untuk overlay status jual di halaman /tentrem-bhumi/.',
    'poly = titik-titik bentuk asli kavling dalam PERSEN terhadap gambar siteplan',
    '([x,y]), jadi ikut ukuran layar. Sebagian kavling bukan persegi (mis.',
    'Cantya 14 & 15 yang ujungnya miring) — karena itu poligon, bukan kotak.',
    'bbox = kotak pembatas, dipakai menaruh label TERJUAL/SIAP HUNI.',
    'JANGAN disunting tangan. Dibuat ulang dari siteplan CAD lewat',
    'tools/siteplan/tentrem-bhumi/ (baca README.md di sana). Kalau gambar',
    'siteplan diganti, file ini WAJIB dibuat ulang — kalau tidak, overlay',
    'menempel di kavling yang salah, di situs maupun di Progress Dashboard.'
  ],
  'gambar': GAMBAR,
  'ukuran': [int(W), int(H)],
  'kavling': out
}, open(KELUAR, 'w'), ensure_ascii=False, indent=1)
print('%d kavling -> %s' % (len(out), KELUAR))
