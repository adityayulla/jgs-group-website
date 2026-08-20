"""Langkah 4 — pemeriksaan mata WAJIB.

    python3 tools/siteplan/tentrem-bhumi/4-periksa.py

Menggambar poligon dari siteplan-kavling.json di atas gambar siteplan yang
tayang, lengkap dengan kodenya. Pastikan tiap poligon menutupi tepat satu
blok berlabel yang sama. Hasilnya _periksa-tentrem-bhumi.png (gitignored).
"""
import json, os
from PIL import Image, ImageDraw

DIR  = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(DIR)))
PETA = os.path.join(REPO, 'tentrem-bhumi', 'siteplan-kavling.json')
HASIL = os.path.join(os.path.dirname(DIR), '_periksa-tentrem-bhumi.png')

d = json.load(open(PETA))
im = Image.open(os.path.join(REPO, 'tentrem-bhumi', d['gambar'])).convert('RGBA')
W, H = im.size
ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
dr = ImageDraw.Draw(ov)
for k in d['kavling']:
    P = [(x / 100 * W, y / 100 * H) for x, y in k['poly']]
    dr.polygon(P, fill=(255, 0, 80, 80), outline=(200, 0, 60, 255))
    b = k['bbox']
    dr.text(((b[0] + b[2]) / 2 / 100 * W - 24, (b[1] + b[3]) / 2 / 100 * H + 6),
            k['code'], fill=(130, 0, 0, 255))
Image.alpha_composite(im, ov).save(HASIL)
print('%d kavling digambar -> %s' % (len(d['kavling']), HASIL))
