"""Langkah 2 — gambar siteplan berwarna dari muka.json.

    python3 tools/siteplan/tentrem-bhumi/2-gambar-siteplan.py

Membaca muka.json (langkah 1), mewarnai tiap muka menurut perannya, lalu
menulis:
  • siteplan.svg          — gambarnya
  • kavling-kanvas.json   — poligon kavling dalam piksel kanvas, bahan langkah 3

Ubah tampilan di sini: PAL (warna per tipe), X0/Y0/X1/Y1 (bagian denah yang
dipakai), OX/OY/S (posisi & skala di kanvas). Kalau W/H atau OX/OY/S diubah,
JALANKAN ULANG LANGKAH 3 — koordinat kavling ikut berubah.

Render ke PNG/WEBP: lihat README.md.
"""
import json, math, base64, re, os, io
from shapely.geometry import Polygon
from PIL import Image

DIR    = os.path.dirname(os.path.abspath(__file__))
REPO   = os.path.dirname(os.path.dirname(os.path.dirname(DIR)))
MUKA   = os.path.join(DIR, 'muka.json')
SVG    = os.path.join(DIR, 'siteplan.svg')
KANVAS = os.path.join(DIR, 'kavling-kanvas.json')
LOGO   = os.path.join(REPO, 'assets', 'img', 'Logo-Perumahan', 'Logo Tentrem Bhumi.webp')

W, H = 1160, 2080
FACES = json.load(open(MUKA))
M = 4.5885            # satuan PDF per meter (dikalibrasi dari luas kavling)

# ---------------- peran muka ------------------------------------------------
def role_of(f):
    w = ' '.join(f['words'])
    for t in ('Bhama', 'Cantya', 'Andrawina'):
        if t in w:
            m = re.search(t + r'\s+(\d+)', w)
            return ('unit', t, m.group(1) if m else '?')
    if 'FASOS' in w: return ('fasum', 'FASOS', '')
    if 'FASUM' in w: return ('fasum', 'FASUM', '')
    if 'Taman' in w: return ('taman', '', '')
    if f['area'] > 15000 or f['area'] < 400: return ('jalan', '', '')
    return ('lama', '', '')
for f in FACES: f['role'] = role_of(f)

# ---------------- transformasi ---------------------------------------------
X0, Y0, X1, Y1 = 334.0, 54.0, 640.0, 1080.0
S  = 1715.0 / (Y1 - Y0)
OX, OY = 364.0, 296.0
def T(p): return (OX + (p[0] - X0) * S, OY + (p[1] - Y0) * S)
def d(pts): return [T(p) for p in pts]

def rounded_path(pts, r=8.0):
    n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[(i-1) % n], pts[i], pts[(i+1) % n]
        v1 = (p0[0]-p1[0], p0[1]-p1[1]); l1 = math.hypot(*v1)
        v2 = (p2[0]-p1[0], p2[1]-p1[1]); l2 = math.hypot(*v2)
        if l1 < 1e-6 or l2 < 1e-6: continue
        rr = min(r, l1/2.2, l2/2.2)
        out.append(((p1[0]+v1[0]/l1*rr, p1[1]+v1[1]/l1*rr), p1,
                    (p1[0]+v2[0]/l2*rr, p1[1]+v2[1]/l2*rr)))
    if not out: return ''
    s = 'M %.2f %.2f ' % out[0][2]
    for i in range(1, len(out)+1):
        a, c, b = out[i % len(out)]
        s += 'L %.2f %.2f Q %.2f %.2f %.2f %.2f ' % (a[0], a[1], c[0], c[1], b[0], b[1])
    return s + 'Z'

def inset(pts, dd):
    try:
        g = Polygon(pts)
        if not g.is_valid: g = g.buffer(0)
        g = g.buffer(-dd, join_style=2, mitre_limit=3)
        if g.is_empty: return pts
        if g.geom_type == 'MultiPolygon': g = max(g.geoms, key=lambda x: x.area)
        return list(g.exterior.coords)[:-1]
    except Exception:
        return pts

def label_pt(pts):
    g = Polygon(pts); c = g.centroid
    return (c.x, c.y) if g.contains(c) else (g.representative_point().x, g.representative_point().y)
def wh(pts):
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    return max(xs)-min(xs), max(ys)-min(ys), min(xs), min(ys)

# ---------------- palet -----------------------------------------------------
PAL = {
 'Bhama':     dict(a='#FCE68C', b='#E7C02C', s='#BE970C', t='#463600', leg='#EDCE44'),
 'Cantya':    dict(a='#DEDCFF', b='#AEABF3', s='#8781DF', t='#2C2872', leg='#C3C0F7'),
 'Andrawina': dict(a='#C2F8D9', b='#78DBA3', s='#48BB81', t='#0D4B2F', leg='#9BEABB'),
}
JALAN, JALAN_S = '#E6F0F8', '#C9DBEA'
LAMA,  LAMA_S, LAMA_T = '#D5E7C5', '#B4CE9F', '#5A7543'
FAS_S = '#1F63C9'
TAMAN = '#A9E2A2'
INK   = '#1F2A22'

def img(path):
    buf = io.BytesIO()
    Image.open(path).convert('RGBA').save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

o = []; A = o.append
A('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="%d" height="%d" '
  'viewBox="0 0 %d %d" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">' % (W,H,W,H))
A('<defs>')
for k in PAL:
    A('<linearGradient id="g%s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>' % (k, PAL[k]['a'], PAL[k]['b']))
A('<linearGradient id="gFas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#79B4FF"/><stop offset="1" stop-color="#2F7BEE"/></linearGradient>')
A('<linearGradient id="gBg" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#FCFDFB"/><stop offset="1" stop-color="#EFF5EC"/></linearGradient>')
A('<linearGradient id="gPill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#68AEFF"/><stop offset="1" stop-color="#2B7AF0"/></linearGradient>')
A('<filter id="sh" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="0" dy="1.8" stdDeviation="2.4" flood-color="#16311a" flood-opacity=".26"/></filter>')
A('<filter id="shP" x="-40%" y="-70%" width="180%" height="260%"><feDropShadow dx="0" dy="2.5" stdDeviation="3.5" flood-color="#0d2b4a" flood-opacity=".3"/></filter>')
A('</defs>')
A('<rect width="%d" height="%d" fill="url(#gBg)"/>' % (W,H))

# ---------------- jalan -----------------------------------------------------
A('<g id="jalan">')
for f in FACES:
    if f['role'][0] == 'jalan':
        A('<path d="%s" fill="%s" stroke="%s" stroke-width="1.3"/>' % (rounded_path(d(f['poly']), 5), JALAN, JALAN_S))
A('</g>')

# ---------------- proyek sebelumnya ----------------------------------------
A('<g id="lama">')
lama = [f for f in FACES if f['role'][0]=='lama']
for f in lama:
    A('<path d="%s" fill="%s" stroke="%s" stroke-width="1.2"/>' % (rounded_path(inset(d(f['poly']),2.2), 9), LAMA, LAMA_S))
A('</g>')
big = max(lama, key=lambda f: f['area'])
bx, by = label_pt(d(big['poly']))
A('<g transform="translate(%.1f,%.1f)">' % (bx - 4, 985))
A('<rect x="-31" y="-126" width="62" height="252" rx="26" fill="#FFFFFF" opacity=".9"/>')
A('<text transform="rotate(-90)" x="0" y="-3" text-anchor="middle" font-size="14" font-weight="700" fill="%s" letter-spacing="2.6">PROYEK SEBELUMNYA</text>' % LAMA_T)
A('<text transform="rotate(-90)" x="0" y="15" text-anchor="middle" font-size="12" font-weight="700" fill="#93AB80" letter-spacing="4">SOLD OUT</text>')
A('</g>')

# ---------------- taman -----------------------------------------------------
for f in FACES:
    if f['role'][0]=='taman':
        A('<path d="%s" fill="%s" stroke="#77C46F" stroke-width="1"/>' % (rounded_path(inset(d(f['poly']),1.4), 5), TAMAN))

# ---------------- fasum + mini playground -----------------------------------
GAP = [(373.0,769.3),(448.3,769.3),(447.7,787.4),(373.1,787.9)]   # celah Andrawina 6-7
fas_boxes = {}
ICONS = []
FAS_CT = {}
A('<g id="fasum">')
for f in FACES:
    if f['role'][0] != 'fasum': continue
    pts = inset(d(f['poly']), 2.4)
    A('<path d="%s" fill="url(#gFas)" stroke="%s" stroke-width="1.3" filter="url(#sh)"/>' % (rounded_path(pts, 10), FAS_S))
    w,h,mx,my = wh(pts); fas_boxes[f['role'][1] + str(round(my))] = (mx,my,mx+w,my+h)
    lx, ly = label_pt(pts)
    kind = {'FASOS': 'parkir'}.get(f['role'][1])
    if kind is None:
        kind = 'main' if my < 500 else ('kolam' if my < 1000 else 'gate')
    ICONS.append((kind, lx, ly))
    FAS_CT[kind] = (lx, ly, mx, my, mx + w, my + h, pts)
def ikon(kind, x, y, sc=1.0):
    g = '<g transform="translate(%.1f,%.1f) scale(%.2f)" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' % (x, y, sc)
    if kind == 'parkir':
        g = '<text x="%.1f" y="%.1f" text-anchor="middle" font-size="%d" font-weight="700" fill="#fff">P</text>' % (x, y + 9*sc, int(26*sc))
        return g
    if kind == 'kolam':
        g += '<path d="M -16 -4 q 8 -7 16 0 q 8 7 16 0"/><path d="M -16 6 q 8 -7 16 0 q 8 7 16 0"/><path d="M -10 -12 l 0 -6 M 10 -12 l 0 -6"/>'
    if kind == 'main':
        g += ('<path d="M 12 -12 L 12 12"/><path d="M 12 -12 L -12 10"/>'
              '<path d="M 4 -12 L 4 -4 M 4 -4 L 12 -4 M 4 4 L 12 4"/>'
              '<path d="M -12 10 L -12 13 M 12 12 L 12 13"/>')
    if kind == 'gate':
        g += '<path d="M -16 10 L -16 -8 L 0 -14 L 16 -8 L 16 10"/><path d="M -6 10 L -6 0 L 6 0 L 6 10"/>'
    if kind == 'ayun':
        g += ('<path d="M 12 -12 L 12 12"/><path d="M 12 -12 L -12 10"/>'
              '<path d="M 4 -12 L 4 -4 M 4 -4 L 12 -4 M 4 4 L 12 4"/>')
    return g + '</g>'

pts = inset(d(GAP), 2.4)
A('<path d="%s" fill="url(#gFas)" stroke="%s" stroke-width="1.3" filter="url(#sh)"/>' % (rounded_path(pts, 8), FAS_S))
mini = wh(pts); mlx, mly = label_pt(pts); MINI_POLY = pts
for k, ix, iy in ICONS: A(ikon(k, ix, iy))
A(ikon('ayun', mlx, mly, 0.66))
A('</g>')

# ---------------- kavling ---------------------------------------------------
A('<g id="kavling">')
kav = {}
for f in FACES:
    if f['role'][0] != 'unit': continue
    _, tipe, no = f['role']
    pts = inset(d(f['poly']), 2.8)
    kav['%s %s' % (tipe, no)] = pts
    p = PAL[tipe]
    A('<path d="%s" fill="url(#g%s)" stroke="%s" stroke-width="1.4" filter="url(#sh)"/>' % (rounded_path(pts, 10), tipe, p['s']))
    lx, ly = label_pt(pts); w,h,_,_ = wh(pts)
    fs = 16 if tipe != 'Andrawina' else 15
    if w >= h*1.2:
        A('<text x="%.1f" y="%.1f" text-anchor="middle" font-size="%d" font-weight="700" fill="%s" letter-spacing=".8">%s %s</text>'
          % (lx, ly+fs*0.36, fs, p['t'], tipe.upper(), no))
    else:
        A('<text transform="translate(%.1f,%.1f) rotate(-90)" text-anchor="middle" font-size="%d" font-weight="700" fill="%s" letter-spacing=".8">%s %s</text>'
          % (lx+fs*0.36, ly, fs, p['t'], tipe.upper(), no))
A('</g>')
json.dump({'ukuran': [W, H],
           'kavling': {k: [[round(a,2), round(b,2)] for a, b in v] for k, v in kav.items()}},
          open(KANVAS, 'w'))

# ---------------- ukuran jalan ---------------------------------------------
def dim(x1,y1,x2,y2,teks,vert=False):
    g = '<g stroke="#5B8CB8" stroke-width="1.8" stroke-linecap="round">'
    g += '<path d="M %.1f %.1f L %.1f %.1f" />' % (x1,y1,x2,y2)
    if vert:
        g += '<path d="M %.1f %.1f L %.1f %.1f"/>' % (x1-7,y1,x1+7,y1)
        g += '<path d="M %.1f %.1f L %.1f %.1f"/>' % (x2-7,y2,x2+7,y2)
    else:
        g += '<path d="M %.1f %.1f L %.1f %.1f"/>' % (x1,y1-7,x1,y1+7)
        g += '<path d="M %.1f %.1f L %.1f %.1f"/>' % (x2,y2-7,x2,y2+7)
    g += '</g>'
    mx,my = (x1+x2)/2, (y1+y2)/2
    if vert:
        g += ('<text transform="translate(%.1f,%.1f) rotate(-90)" text-anchor="middle" font-size="14" '
              'font-weight="700" fill="#3D6E96">%s</text>') % (mx+16, my, teks)
    else:
        g += '<text x="%.1f" y="%.1f" text-anchor="middle" font-size="14" font-weight="700" fill="#3D6E96">%s</text>' % (mx, my-13, teks)
    return g
# jalan antar blok (dari CAD): Bhama 1 -> Cantya 1 = 7 m ; Cantya ganjil-genap = 6,75 m ; jalan utama = 6,42 m
a = T((508.0, 293.4)); b = T((508.0, 325.4)); A(dim(a[0],a[1],b[0],b[1], '7 M', vert=True))
a = T((530.2, 470.0)); b = T((561.1, 470.0)); A(dim(a[0],a[1],b[0],b[1], '6,75 M'))
a = T((343.6, 900.0)); b = T((373.6, 900.0)); A(dim(a[0],a[1],b[0],b[1], '6,42 M'))

# ---------------- pill fasilitas -------------------------------------------
def pill(x, y, text, align='left'):
    fs = 14; w = len(text)*fs*0.62 + 30; h = 34
    x0 = x if align == 'left' else x - w
    s  = '<g filter="url(#shP)"><rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f" fill="url(#gPill)"/></g>' % (x0, y-h/2, w, h, h/2)
    s += '<text x="%.1f" y="%.1f" text-anchor="middle" font-size="%d" font-weight="700" fill="#fff" letter-spacing="1.4">%s</text>' % (x0+w/2, y+fs*0.36, fs, text)
    return s, x0, x0+w

def leader(pts):
    dd = 'M ' + ' L '.join('%.1f %.1f' % p for p in pts)
    s  = '<path d="%s" fill="none" stroke="#4B94FF" stroke-width="2.4" stroke-dasharray="9 8" stroke-linecap="round" stroke-linejoin="round"/>' % dd
    s += '<circle cx="%.1f" cy="%.1f" r="5" fill="#2F7BEE"/>' % pts[-1]
    return s

A('<g id="pill">')
def edge_x(poly, y, side):
    xs = []
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]; x2, y2 = poly[(i+1) % n]
        if (y1 - y) * (y2 - y) <= 0 and abs(y2 - y1) > 1e-9:
            xs.append(x1 + (x2 - x1) * (y - y1) / (y2 - y1))
    if not xs: return None
    return min(xs) if side == 'left' else max(xs)

def tarik(poly, y, side, pill_x, teks):
    tx = edge_x(poly, y, side)
    if tx is None:
        tx = (min(p[0] for p in poly) if side == 'left' else max(p[0] for p in poly))
    align = 'left' if side == 'left' else 'right'
    p, x0, x1_ = pill(pill_x, y, teks, align)
    anchor = x1_ if side == 'left' else x0
    A(leader([(anchor, y), (tx, y)]))
    A(p)

mn = FAS_CT['main']; kl = FAS_CT['kolam']; gt = FAS_CT['gate']; pk = FAS_CT['parkir']
tarik(mn[6], mn[1] - 42, 'left',  40,   'PLAYGROUND')
tarik(mn[6], mn[1] + 42, 'left',  40,   'LAP. BASKET')
tarik(pk[6], pk[1] + 10, 'right', 1120, 'AREA PARKIR')
tarik(kl[6], kl[1] + 6,  'right', 1120, 'SWIMMING POOL')
tarik(MINI_POLY, mly,    'right', 1120, 'MINI PLAYGROUND')
tarik(gt[6], gt[1] - 24, 'right', 1120, 'POS JAGA')
tarik(gt[6], gt[1] + 24, 'right', 1120, 'GATE MASUK')
A('</g>')

# ---------------- judul -----------------------------------------------------
A('<g id="judul">')
A('<image x="38" y="26" width="228" height="113" xlink:href="%s"/>' % img(LOGO))
A('<rect x="288" y="52" width="188" height="52" rx="18" fill="#CFE3BE"/>')
A('<text x="382" y="87" text-anchor="middle" font-size="23" font-weight="700" fill="#33422A" letter-spacing="2.6">SITEPLAN</text>')
A('<text x="288" y="128" font-size="14" fill="#5C6B5C">Jl. Besi Jangkang, Tanjungsari, Ngaglik, Sleman</text>')
A('<text x="288" y="150" font-size="14" font-weight="700" fill="#3E6B45">33 kavling · 7 menit ke UII</text>')
A('</g>')

# ---------------- legenda ---------------------------------------------------
LY = 208
A('<g id="legenda">')
A('<rect x="34" y="%d" width="%d" height="62" rx="18" fill="#FFFFFF" stroke="#DFE7DA" stroke-width="1.4"/>' % (LY, W-68))
LEG = [('gBhama',     PAL['Bhama']['s'],     'BHAMA',     '7 unit'),
       ('gCantya',    PAL['Cantya']['s'],    'CANTYA',    '15 unit'),
       ('gAndrawina', PAL['Andrawina']['s'], 'ANDRAWINA', '11 unit'),
       ('gFas',       FAS_S,                 'FASILITAS UMUM', ''),
       (None,         LAMA_S,                'PROYEK SEBELUMNYA', '')]
xs = [56, 250, 452, 704, 892]
for (grad, stroke, nama, ket), x in zip(LEG, xs):
    fill = ('url(#%s)' % grad) if grad else LAMA
    A('<rect x="%d" y="%d" width="30" height="22" rx="7" fill="%s" stroke="%s" stroke-width="1.2"/>' % (x, LY+20, fill, stroke))
    A('<text x="%d" y="%d" font-size="13" font-weight="700" fill="%s" letter-spacing=".7">%s</text>' % (x+40, LY+36, INK, nama))
    if ket:
        A('<text x="%d" y="%d" font-size="12" fill="#6E7C6C">%s</text>' % (x+40, LY+51, ket))
A('</g>')

# ---------------- kompas ----------------------------------------------------
CX, CY, R = 1032, 1030, 48
A('<g id="kompas">')
A('<circle cx="%d" cy="%d" r="%d" fill="#FFFFFF" stroke="#DFE7DA" stroke-width="2"/>' % (CX, CY, R))
A('<path d="M %d %d L %d %d L %d %d Z" fill="#E5384C"/>' % (CX, CY-R+10, CX-10, CY, CX+10, CY))
A('<path d="M %d %d L %d %d L %d %d Z" fill="#2A6B57"/>' % (CX, CY+R-10, CX-10, CY, CX+10, CY))
A('<path d="M %d %d L %d %d L %d %d Z" fill="#9FB2A6"/>' % (CX-R+10, CY, CX, CY-8, CX, CY+8))
A('<path d="M %d %d L %d %d L %d %d Z" fill="#C9D5CD"/>' % (CX+R-10, CY, CX, CY-8, CX, CY+8))
for lab, dx, dy in (('U',0,-R-12),('S',0,R+22),('B',-R-15,5),('T',R+15,5)):
    A('<text x="%d" y="%d" text-anchor="middle" font-size="15" font-weight="700" fill="#5C6B5C">%s</text>' % (CX+dx, CY+dy, lab))
A('</g>')

# ---------------- catatan ---------------------------------------------------
A('<text x="%d" y="%d" text-anchor="end" font-size="12" fill="#9AA79A">Siteplan per 20 Agustus 2026 · gambar ilustrasi, dapat berubah sewaktu-waktu</text>' % (W-38, H-26))

A('</svg>')
open(SVG, 'w').write('\n'.join(o))
print('%s (%dx%d, %d kavling)' % (SVG, W, H, len(kav)))
print(KANVAS)
