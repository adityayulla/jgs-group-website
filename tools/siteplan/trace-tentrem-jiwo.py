"""Buat ulang tentrem-jiwo/siteplan-kavling.json dari gambar siteplannya.

    pip install opencv-python numpy
    python3 tools/siteplan/trace-tentrem-jiwo.py     # dijalankan dari akar repo

Artwork Tentrem Jiwo bukan blok warna seperti Kawa Living, melainkan garis
tipis di atas latar krem. Jadi yang dicari BUKAN warna kavlingnya, tapi
ruang kosong yang dikurung garis: mask garis (piksel gelap) dibalik, lalu
tiap "sel" tertutup diambil sebagai satu kavling. Kavling ditunjuk lewat
satu titik di dalamnya — posisi teks labelnya di gambar (TITIK di bawah).

Kekecualian: A 1 (= Abirama 1). Di artwork sisi atas & kanannya membuka ke
jalan — selnya bocor menyatu dengan latar, jadi tidak bisa ditelusuri.
Bentuknya disusun dari tetangga dan garis di sekitarnya: alas = sisi atas
Abirama 3, sisi barat meneruskan sisi barat Abirama 3, sisi utara mengikuti
garis jalan masuk, sisi timur menyusur tepi jalan lingkungan.

WAJIB diperiksa mata: skrip menulis tools/siteplan/_periksa-tentrem-jiwo.png,
siteplan dengan poligon + kode kavling di atasnya. Pastikan tiap poligon
memuat tepat satu label yang tercetak di gambar. Kalau artwork siteplan
diganti, semua angka di bawah perlu disetel ulang.
"""
import cv2, numpy as np, json, os

AKAR    = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GAMBAR  = os.path.join(AKAR, 'tentrem-jiwo', 'img', 'siteplan.jpg')
KELUAR  = os.path.join(AKAR, 'tentrem-jiwo', 'siteplan-kavling.json')
PERIKSA = os.path.join(AKAR, 'tools', 'siteplan', '_periksa-tentrem-jiwo.png')

# Titik di dalam tiap kavling (PERSEN terhadap gambar) — diambil dari posisi
# teks labelnya. Urutannya juga urutan kavling di JSON.
TITIK = [
  ('Abirama 2',  59.6, 19.6),
  ('Abirama 3',  24.9, 24.6),
  ('Abirama 4',  57.1, 30.8),
  ('Abirama 5',  23.6, 36.0),
  ('Abirama 6',  56.0, 42.1),
  ('Abirama 7',  21.6, 47.5),
  ('Abirama 8',  60.0, 54.0),
  ('Baswara 1',  14.6, 69.8),
  ('Baswara 2',  27.0, 71.6),
  ('Baswara 3',  37.7, 73.7),
  ('Baswara 4',  49.1, 75.7),
  ('Villa Tentrem Jiwo', 73.8, 78.3),
]

AMBANG_GARIS = 195   # piksel di bawah ini dianggap garis/teks, bukan ruang kavling
TEBAL_GARIS  = 3     # dipakai mengembalikan sel ke tengah garis pembatasnya
LUAS_MIN     = 40000 # px²; kavling terkecil ±88.000 px, kotak label ±6.000

img = cv2.imread(GAMBAR)
if img is None:
    raise SystemExit('Gambar siteplan tidak terbaca: ' + GAMBAR)
H, W = img.shape[:2]

abu   = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
garis = (abu < AMBANG_GARIS).astype(np.uint8)
# Garis di JPEG tepinya kabur — ditebalkan sedikit supaya sel tidak bocor
# lewat piksel setengah terang di perpotongan.
garis = cv2.dilate(garis, np.ones((3, 3), np.uint8), 1)
n, lab, stats, _ = cv2.connectedComponentsWithStats(1 - garis, 4)


def sel(x_persen, y_persen):
    """Sel tertutup yang memuat titik ini, dikembalikan ke tengah garisnya."""
    x, y = int(x_persen / 100 * W), int(y_persen / 100 * H)
    # Titiknya diambil dari posisi teks label, jadi kerap mendarat di atas
    # hurufnya — atau di dalam kotak putih label yang juga sel tertutup.
    # Karena itu yang dicari sel pertama di sekitarnya yang seluas kavling.
    def sah(j):
        return j != 0 and LUAS_MIN <= stats[j, 4] <= W * H * 0.25
    i = lab[y, x] if sah(lab[y, x]) else 0
    for r in range(1, 120):
        if i:
            break
        for dx, dy in ((r, 0), (-r, 0), (0, r), (0, -r), (r, r), (-r, -r), (r, -r), (-r, r)):
            if 0 <= y + dy < H and 0 <= x + dx < W and sah(lab[y + dy, x + dx]):
                i = lab[y + dy, x + dx]
                break
    if i == 0:
        raise SystemExit('Titik %d,%d tidak ketemu sel kavling di sekitarnya' % (x, y))
    m = (lab == i).astype(np.uint8) * 255
    # Sel berhenti di tepi dalam garis; dilebarkan setengah garis supaya
    # poligonnya jatuh di tengah pembatas, sama seperti yang dilihat mata.
    m = cv2.dilate(m, np.ones((TEBAL_GARIS, TEBAL_GARIS), np.uint8), 1)
    # Teks di dalam kavling bikin lubang — hanya kontur luar yang dipakai.
    kontur, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(kontur, key=cv2.contourArea)
    for eps in np.arange(0.004, 0.03, 0.002):
        p = cv2.approxPolyDP(c, eps * cv2.arcLength(c, True), True)
        if len(p) <= 6:
            break
    return p.reshape(-1, 2).astype(float)


def persen(pts):
    return [[round(float(x) / W * 100, 3), round(float(y) / H * 100, 3)] for x, y in pts]


def urut(pts):
    """Titik searah jarum jam, mulai dari yang paling kiri-atas."""
    c = pts.mean(axis=0)
    sudut = np.arctan2(pts[:, 1] - c[1], pts[:, 0] - c[0])
    pts = pts[np.argsort(sudut)]
    mulai = int(np.argmin(pts[:, 0] + pts[:, 1]))
    return np.roll(pts, -mulai, axis=0)


bentuk = {kode: urut(sel(x, y)) for kode, x, y in TITIK}

# ── A 1: disusun dari tetangga, bukan ditelusuri ────────────────────────
# Dua garis pembatasnya dicari langsung di gambar: garis jalan masuk di
# utara, dan tepi barat jalan lingkungan di timur. Keduanya lurus di bentang
# yang dipindai, jadi cukup dipasang garis lurus lewat titik-titik itu.

def garis_lewat(pts):
    """(m, c) untuk y = m*x + c, dari titik-titik piksel."""
    xs = np.array([p[0] for p in pts], float)
    ys = np.array([p[1] for p in pts], float)
    m, c = np.polyfit(xs, ys, 1)
    return m, c


# Batas utara: dari bawah ke atas, garis gelap pertama di atas kavling A 1.
# Bentang x dipilih yang bersih dari tulisan ("A 1" di kiri, "AKSES MASUK"
# dan "MARKETING GALLERY" di kanan).
utara = []
for x in range(600, 831, 5):
    ys = np.nonzero(garis[0:350, x])[0]
    if len(ys):
        utara.append((x, ys.max()))
m_u, c_u = garis_lewat(utara)

a3 = persen(bentuk['Abirama 3'])
# Sisi atas Abirama 3 = alas A 1: dua titik teratasnya, kiri lalu kanan.
atas = sorted(sorted(a3, key=lambda p: p[1])[:2], key=lambda p: p[0])
kiri_bawah, kanan_bawah = atas[0], atas[1]
# Sisi barat & timur A 1 meneruskan sisi barat & timur Abirama 3 — batas
# kavling dan tepi jalan yang sama, hanya diteruskan ke utara.
tengah = (kiri_bawah[0] + kanan_bawah[0]) / 2


def sisi_tegak(pts):
    """x = m*y + c untuk sisi yang hampir tegak (dua titik terjauh)."""
    pts = sorted(pts, key=lambda p: p[1])
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    x1, y1, x2, y2 = x1 / 100 * W, y1 / 100 * H, x2 / 100 * W, y2 / 100 * H
    m = (x2 - x1) / (y2 - y1)
    return m, x1 - m * y1


m_b, c_b = sisi_tegak([p for p in a3 if p[0] < tengah])
m_t, c_t = sisi_tegak([p for p in a3 if p[0] > tengah])


def temu(m1, c1, m2, c2):
    """Titik temu y = m1*x + c1 (utara) dengan x = m2*y + c2 (tegak)."""
    y = (m1 * c2 + c1) / (1 - m1 * m2)
    return (m2 * y + c2, y)


barat_laut = temu(m_u, c_u, m_b, c_b)
timur_laut = temu(m_u, c_u, m_t, c_t)
a1 = [[round(barat_laut[0] / W * 100, 3), round(barat_laut[1] / H * 100, 3)],
      [round(timur_laut[0] / W * 100, 3), round(timur_laut[1] / H * 100, 3)],
      kanan_bawah, kiri_bawah]

def lebar_di_tengah(poly):
    """Lebar kavling (PERSEN) pada ketinggian tengahnya.

    Semua kavling di sini miring, jadi kotak pembatasnya jauh lebih lebar
    daripada kavlingnya sendiri — kalau ukuran huruf TERJUAL dihitung dari
    kotak itu, tulisan deret Baswara saling tumpang tindih. Yang dipakai
    lebar sungguhan: potongan mendatar poligon di tengah tingginya.
    """
    y = (min(p[1] for p in poly) + max(p[1] for p in poly)) / 2
    x = []
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % len(poly)]
        if (y1 <= y < y2) or (y2 <= y < y1):
            x.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    return round(max(x) - min(x), 3) if len(x) >= 2 else None


kavling = []
for kode in ['Abirama 1'] + [k for k, _, _ in TITIK]:
    poly = a1 if kode == 'Abirama 1' else persen(bentuk[kode])
    xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
    kavling.append(dict(code=kode, poly=poly,
                        bbox=[round(min(xs), 3), round(min(ys), 3),
                              round(max(xs), 3), round(max(ys), 3)],
                        lebar=lebar_di_tengah(poly)))

CATATAN = [
  "Bentuk kavling untuk overlay status jual di halaman /tentrem-jiwo/.",
  "poly = titik-titik bentuk kavling dalam PERSEN terhadap gambar siteplan",
  "([x,y]), jadi ikut ukuran layar. Kavling Tentrem Jiwo tidak ada yang",
  "persegi betul — semua deretnya miring mengikuti jalan.",
  "bbox = kotak pembatas, dipakai menaruh label TERJUAL/SIAP HUNI.",
  "lebar = lebar kavling di tengah tingginya, buat menakar ukuran huruf",
  "label — kavling miring, jadi bbox-nya lebih lebar dari kavlingnya.",
  "JANGAN disunting tangan. Dibuat otomatis dari 'img/siteplan.jpg' lewat",
  "tools/siteplan/trace-tentrem-jiwo.py (sel tertutup di antara garis).",
  "Kalau gambar siteplan diganti, file ini WAJIB dibuat ulang — kalau tidak,",
  "overlay menempel di kavling yang salah, di situs maupun di Progress",
  "Dashboard (dashboard memakai file yang sama lewat getSiteplanMap()).",
  "code = kode unit di Progress Dashboard. Di gambar, Abirama 1 tercetak",
  "'A 1'.",
]

with open(KELUAR, 'w') as f:
    json.dump({'_catatan': CATATAN,
               'gambar': 'img/siteplan.jpg',
               'ukuran': [W, H],
               'kavling': kavling}, f, indent=1, ensure_ascii=False)
print(len(kavling), 'kavling →', KELUAR)

vis = img.copy()
for k in kavling:
    pts = np.int32([[p[0] / 100 * W, p[1] / 100 * H] for p in k['poly']])
    cv2.polylines(vis, [pts], True, (0, 0, 255), 3)
    c = pts.mean(axis=0).astype(int)
    pendek = k['code'].replace('Abirama', 'AB').replace('Baswara', 'BW') \
                      .replace('Villa Tentrem Jiwo', 'VILLA')
    cv2.putText(vis, pendek, (c[0] - 30, c[1] + 40), cv2.FONT_HERSHEY_SIMPLEX,
                0.9, (255, 0, 255), 3, cv2.LINE_AA)
cv2.imwrite(PERIKSA, vis)
print('periksa hasilnya di', PERIKSA)
