"""Buat kawa-living/3d/kavling.json (geometri siteplan 3D) dari DWG resmi.

    brew install libredwg
    dwg2dxf -y -o /tmp/kawa.dxf "siteplan kawa living.dwg"
    pip install ezdxf shapely
    python3 tools/siteplan-3d/build-kavling.py /tmp/kawa.dxf     # dari akar repo

Yang diambil dari DWG (koordinatnya sudah meter, utara = +Y):
  R KAVLING + R SITEPLAN (+ garis bantu)  → di-polygonize jadi petak
  R teks / I teks                          → kode kavling, MASJID, FASOS, POS SATPAM
  Jalan = petak sisa terbesar di dalam batas kawasan (DWG tidak punya
  layer jalan). Ujung garis diperpanjang 15 cm supaya celah kecil di
  gambar tertutup — tanpa itu Yuri 5, Okina 3/4, dan Hiroi Yuri 12/13
  bocor jadi satu petak.

Yang SENGAJA tidak ada di file ini: tipe, LT/LB, harga, hoek, status.
Semuanya dijemput langsung dari dashboard saat viewer dibuka
(/api/public/pricelist & /api/public/siteplan), jadi tidak bisa basi.
Label LB/LT DWG hanya disimpan sebagai `dwg` untuk memilih model 3D.

WAJIB diperiksa mata: skrip menulis tools/siteplan-3d/_periksa.png.
"""
import json, math, os, re, sys

import ezdxf
from ezdxf import recover
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import polygonize, unary_union

AKAR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KELUAR = os.path.join(AKAR, 'kawa-living', '3d', 'kavling.json')
GARIS  = {'R KAVLING', 'R SITEPLAN', '0', 'I batas kavling', 'i batas denah'}
PANJANGKAN = 0.15   # meter

# Model per deret. Himawari punya dua lebar: label DWG 51 → model 51,
# selain itu 49. Sub-tipe tanpa model (Hiroi Yuri 37, Yuri 34,5) memakai
# model deretnya — keputusan pemilik, 6 Okt 2026.
def pilih_model(deret, lb_dwg):
    if deret == 'Himawari':
        return 'himawari-51' if lb_dwg == '51' else 'himawari-49'
    return {'Mizu': 'mizu-36', 'Yuri': 'yuri-40', 'Hiroi Yuri': 'hiroi-yuri-42',
            'Okina': 'okina-61'}[deret]

# Nama fasum untuk pengunjung. FASOS 293 = lapangan mini soccer & basket
# (dikonfirmasi pemilik); gerbang one gate ada di jalan masuk dekat pos satpam.
def nama_fasum(teks, luas):
    if teks == 'MASJID':     return 'Masjid'
    if teks == 'POS SATPAM': return 'Pos Satpam'
    if teks == 'FASOS' and luas > 250: return 'Lapangan Mini Soccer & Basket'
    return 'Fasos'

ARAH = ['Timur', 'Timur Laut', 'Utara', 'Barat Laut', 'Barat', 'Barat Daya', 'Selatan', 'Tenggara']
def arah_mata_angin(nx, ny):
    sudut = math.degrees(math.atan2(ny, nx)) % 360          # 0° = timur, 90° = utara
    return ARAH[int((sudut + 22.5) // 45) % 8]


def main(dxf):
    doc, _ = recover.readfile(dxf)
    msp = doc.modelspace()

    segs = []
    def tambah(titik):
        for a, b in zip(titik, titik[1:]):
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            if L < 1e-6:
                continue
            ux, uy = dx / L * PANJANGKAN, dy / L * PANJANGKAN
            segs.append(LineString([(a[0] - ux, a[1] - uy), (b[0] + ux, b[1] + uy)]))
    for e in msp:
        if e.dxf.layer not in GARIS:
            continue
        t = e.dxftype()
        if t == 'LINE':
            tambah([(e.dxf.start.x, e.dxf.start.y), (e.dxf.end.x, e.dxf.end.y)])
        elif t == 'LWPOLYLINE':
            p = [tuple(q) for q in e.get_points('xy')]
            if e.closed:
                p.append(p[0])
            tambah(p)
        elif t == 'ARC':
            tambah([tuple(v)[:2] for v in e.flattening(0.05)])
    petak = [p for p in polygonize(unary_union(segs)) if p.area > 1]

    teks = [(re.sub(r'\s+', ' ', e.plain_text()).strip(), Point(e.dxf.insert.x, e.dxf.insert.y))
            for e in msp.query('MTEXT') if e.dxf.layer in ('R teks', 'I teks')]
    angka = [(t, p) for t, p in teks if re.match(r'^\d+(\.\d+)?/\d+$', t)]

    kavling, fasum, sisa = [], [], []
    for p in petak:
        isi = [(t, pt) for t, pt in teks if p.contains(pt)]
        kode = [(t, pt) for t, pt in isi if re.match(r'^[A-Z ]+ \d+$', t) and not t.startswith('FASOS')]
        fas = [t for t, _ in isi if t in ('MASJID', 'FASOS', 'POS SATPAM')]
        if len(kode) > 1:
            raise SystemExit('Satu petak memuat >1 kode kavling: %s' % [k for k, _ in kode])
        if kode:
            t, pt = kode[0]
            lb_lt = min(angka, key=lambda a: a[1].distance(pt))[0].split('/')
            kavling.append((t.title(), p, lb_lt))
        elif fas:
            fasum.append((nama_fasum(fas[0], p.area), p))
        else:
            sisa.append(p)
    if len(kavling) != 74 or len({k for k, _, _ in kavling}) != 74:
        raise SystemExit('Jumlah kavling bukan 74 unik: %d' % len(kavling))

    jalan = max(sisa, key=lambda p: p.area)
    taman = [p for p in sisa if p is not jalan and p.area > 10]

    # Titik nol = tengah kawasan. Three.js: x = timur, z = selatan (utara = -z).
    semua = unary_union([p for _, p, _ in kavling] + [p for _, p in fasum] + [jalan])
    ox, oy = semua.centroid.x, semua.centroid.y
    def lokal(x, y):
        return [round(x - ox, 2), round(-(y - oy), 2)]
    def poli(p):
        return [lokal(x, y) for x, y in list(p.exterior.coords)[:-1]]

    jalan_tebal = jalan.buffer(0.3)
    keluar_kav = []
    for kode, p, (lb, lt) in sorted(kavling, key=lambda k: (k[0].rsplit(' ', 1)[0], int(k[0].rsplit(' ', 1)[1]))):
        deret = kode.rsplit(' ', 1)[0]
        # Sumbu panjang kavling dari persegi panjang minimum.
        mrr = list(p.minimum_rotated_rectangle.exterior.coords)
        e1 = (mrr[1][0] - mrr[0][0], mrr[1][1] - mrr[0][1])
        e2 = (mrr[2][0] - mrr[1][0], mrr[2][1] - mrr[1][1])
        panjang = e1 if math.hypot(*e1) >= math.hypot(*e2) else e2
        Lp = math.hypot(*panjang)
        ax, ay = panjang[0] / Lp, panjang[1] / Lp

        # Muka kavling: sisi yang menempel jalan dan paling tegak lurus sumbu
        # panjang (kavling hoek menempel jalan di dua sisi — sisi panjangnya
        # samping, bukan depan).
        titik = list(p.exterior.coords)
        arah_putar = 1 if Polygon(titik).exterior.is_ccw else -1
        kandidat = []
        for a, b in zip(titik, titik[1:]):
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            if L < 2.5:
                continue
            nx, ny = dy / L * arah_putar, -dx / L * arah_putar     # normal ke luar
            mid = Point((a[0] + b[0]) / 2 + nx * 0.6, (a[1] + b[1]) / 2 + ny * 0.6)
            if jalan_tebal.contains(mid):
                kandidat.append((abs(dx * ax + dy * ay) / L, -L, (a, b, nx, ny, L)))
        if not kandidat:
            raise SystemExit('Kavling %s tidak menempel jalan' % kode)
        a, b, nx, ny, lebar = min(kandidat)[2]
        tengah_muka = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)

        # Kedalaman kavling diukur sepanjang normal muka.
        dalam = max((tengah_muka[0] - x) * nx + (tengah_muka[1] - y) * ny for x, y in titik)

        hx, hz = lokal(*tengah_muka)
        fx, fz = nx, -ny                                  # normal di ruang three.js
        keluar_kav.append({
            'code': kode,
            'deret': deret,
            'model': pilih_model(deret, lb),
            'poly': poli(p),
            'muka': [hx, hz],                             # tengah sisi depan
            'arah': [round(fx, 4), round(fz, 4)],         # menghadap ke jalan
            'rotY': round(math.atan2(fx, fz), 4),         # model +Z → arah
            'lebar': round(lebar, 2),
            'dalam': round(dalam, 2),
            'hadap': arah_mata_angin(nx, ny),
            'luasDwg': round(p.area, 1),
            'dwg': {'lb': lb, 'lt': lt},
        })

    # Gerbang one gate: segmen pertama polyline R SITEPLAN adalah sisi barat
    # kawasan (berbatasan jalan desa); bagian yang menempel jalan = mulut jalan.
    batas = next(e for e in msp.query('LWPOLYLINE') if e.dxf.layer == 'R SITEPLAN')
    bt = [tuple(q) for q in batas.get_points('xy')]
    sisi_barat = LineString(bt[:2])
    pos = next(p for n, p in fasum if n == 'Pos Satpam')
    potong = sisi_barat.intersection(jalan.buffer(0.2)).difference(pos.buffer(0.5))
    mulut = list(potong.coords)[0], list(potong.coords)[-1]
    # Jalan desa di luar gerbang: dua garis R SITEPLAN di luar polyline.
    luar = [((e.dxf.start.x, e.dxf.start.y), (e.dxf.end.x, e.dxf.end.y))
            for e in msp.query('LINE') if e.dxf.layer == 'R SITEPLAN']

    data = {
        '_catatan': [
            'Dibuat oleh tools/siteplan-3d/build-kavling.py dari DWG resmi — jangan disunting tangan.',
            'Satuan meter. x = timur, z = selatan (utara = -z). Titik nol = tengah kawasan.',
            'Tipe, LT/LB, harga, hoek, status: dari dashboard saat runtime, bukan dari file ini.',
            'dwg.lb/lt = label tercetak di DWG, hanya untuk memilih model 3D.',
        ],
        'kavling': keluar_kav,
        'fasum': [{'nama': n, 'poly': poli(p), 'pusat': lokal(p.centroid.x, p.centroid.y),
                   'luas': round(p.area)} for n, p in fasum],
        'jalan': {'luar': poli(jalan), 'lubang': [[lokal(x, y) for x, y in list(r.coords)[:-1]]
                                                 for r in jalan.interiors]},
        'taman': [poli(p) for p in taman],
        'batas': poli(semua.convex_hull) if semua.geom_type != 'Polygon' else poli(semua),
        'gerbang': [lokal(*mulut[0]), lokal(*mulut[1])],
        'jalanDesa': poli(Polygon([q for s in luar for q in s]).convex_hull) if len(luar) == 2 else None,
    }
    os.makedirs(os.path.dirname(KELUAR), exist_ok=True)
    with open(KELUAR, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print('kavling.json: %d kavling, %d fasum, %d taman, %d byte' %
          (len(keluar_kav), len(fasum), len(taman), os.path.getsize(KELUAR)))

    periksa(data)


def periksa(data):
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
    except ImportError:
        print('(matplotlib tidak ada — gambar periksa dilewati)')
        return
    fig, ax = plt.subplots(figsize=(20, 12))
    j = data['jalan']['luar']
    ax.fill([q[0] for q in j], [q[1] for q in j], fc='#bbb')
    for t in data['taman']:
        ax.fill([q[0] for q in t], [q[1] for q in t], fc='#bfe0a8')
    for f in data['fasum']:
        ax.fill([q[0] for q in f['poly']], [q[1] for q in f['poly']], fc='#f4c27a', ec='k', lw=.4)
        ax.text(*f['pusat'], f['nama'], fontsize=7, ha='center')
    for k in data['kavling']:
        ax.fill([q[0] for q in k['poly']], [q[1] for q in k['poly']], fc='#9ec5e8', ec='k', lw=.4)
        mx, mz = k['muka']
        ax.annotate('', xy=(mx + k['arah'][0] * 3, mz + k['arah'][1] * 3), xytext=(mx, mz),
                    arrowprops=dict(arrowstyle='->', color='r'))
        cx = sum(q[0] for q in k['poly']) / len(k['poly'])
        cz = sum(q[1] for q in k['poly']) / len(k['poly'])
        ax.text(cx, cz, k['code'] + '\n' + k['hadap'], fontsize=5, ha='center', va='center')
    if data['jalanDesa']:
        d = data['jalanDesa']
        ax.fill([q[0] for q in d], [q[1] for q in d], fc='#999')
    g = data['gerbang']
    ax.plot([g[0][0], g[1][0]], [g[0][1], g[1][1]], 'm-', lw=4)
    ax.set_aspect('equal')
    ax.invert_yaxis()   # z = selatan, jadi utara tetap di atas
    plt.tight_layout()
    out = os.path.join(AKAR, 'tools', 'siteplan-3d', '_periksa.png')
    plt.savefig(out, dpi=100)
    print('periksa:', out)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
