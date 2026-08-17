"""Buat ulang kawa-living/siteplan-kavling.json dari gambar siteplannya.

    pip install opencv-python numpy
    python3 tools/siteplan/trace-kawa-living.py      # dijalankan dari akar repo

Tiap deret kavling ditangani sebagai satu "grup": blok warnanya dipisahkan
sepanjang sumbu panjang deret. Batas antar kavling dicari dengan mencocokkan
jarak-tetap (pitch + geser) pada profil warna — kavling di satu deret memang
berjarak seragam, jadi model itu jauh lebih tahan noise daripada mencari
lembah satu per satu (celah antar blok di gambar ini tipis dan kabur).

WAJIB diperiksa mata: skrip menulis tools/siteplan/_periksa-kawa-living.png,
gambar siteplan dengan poligon + kode kavling di atasnya. Pastikan tiap
poligon memuat tepat satu label yang tercetak di gambar. Kalau artwork
siteplan diganti, ROI tiap grup di GROUPS di bawah perlu disetel ulang.
"""
import cv2, numpy as np, json, os

AKAR    = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GAMBAR  = os.path.join(AKAR, 'kawa-living', 'img', 'Siteplan Kawa Living.webp')
KELUAR  = os.path.join(AKAR, 'kawa-living', 'siteplan-kavling.json')
PERIKSA = os.path.join(AKAR, 'tools', 'siteplan', '_periksa-kawa-living.png')

img = cv2.imread(GAMBAR)
if img is None:
    raise SystemExit('Gambar siteplan tidak terbaca: ' + GAMBAR)
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
Hc, S, V = hsv[:,:,0].astype(int), hsv[:,:,1].astype(int), hsv[:,:,2].astype(int)

FAMS = {
  'gold':   ((Hc>=18)&(Hc<=33)&(S>90)&(V>110)),
  'lgreen': ((Hc>=34)&(Hc<=45)&(S>50)&(V>130)),
  'mint':   ((Hc>=46)&(Hc<=95)&(S>35)&(S<170)&(V>140)),
  'lav':    ((Hc>=110)&(Hc<=145)&(S>20)&(S<130)&(V>165)),
}
MASK = {k: cv2.morphologyEx(
            cv2.morphologyEx(v.astype(np.uint8)*255, cv2.MORPH_CLOSE, np.ones((5,5),np.uint8)),
            cv2.MORPH_OPEN, np.ones((5,5),np.uint8))
        for k, v in FAMS.items()}

# fam, ROI (x0,y0,x1,y1), label berurutan, sumbu panjang ('auto'|'v'|'h')
GROUPS = [
  ('gold',   (1100,   40, 1414,  560), ['Himawari %d'%i for i in range(11,3,-1)], 'v'),
  ('gold',   ( 890,  200, 1130,  370), ['Himawari 1','Himawari 2','Himawari 3'], 'h'),
  ('gold',   ( 800,  360, 1010, 1230), ['Hiroi Yuri %d'%i for i in range(15,0,-1)], 'v'),
  ('gold',   (1060,  760, 1414, 1400), ['Okina %d'%i for i in range(20,10,-1)], 'v'),
  ('lgreen', ( 940,  350, 1120, 1160), ['Mizu %d'%i for i in range(14,0,-1)], 'v'),
  ('lav',    ( 880,   40, 1160,  220), ['Yuri 11','Yuri 12','Yuri 13','Yuri 14'], 'h'),
  ('lav',    ( 620,  690,  860,  990), ['Yuri %d'%i for i in range(10,5,-1)], 'v'),
  ('lav',    ( 590, 1000,  820, 1120), ['Yuri 5','Yuri 4','Yuri 3'], 'h'),
  ('lav',    ( 590, 1120,  820, 1260), ['Yuri 2','Yuri 1'], 'v'),
  ('mint',   ( 450, 1240, 1080, 1560), ['Okina %d'%i for i in range(1,11)], 'h'),
]


def group_pts(fam, roi):
    x0,y0,x1,y1 = roi
    m = np.zeros((H,W), np.uint8)
    m[y0:y1, x0:x1] = MASK[fam][y0:y1, x0:x1]
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = [i for i in range(1,n) if stats[i,4] > 1500]
    out = np.zeros((H,W), np.uint8)
    for i in keep: out[lab==i] = 255
    ys, xs = np.nonzero(out)
    return np.column_stack([xs, ys]).astype(np.float32)


def cuts_periodik(prof, u0, u1, N):
    """Cari (pitch, geser) yang menaruh N-1 batas tepat di celah antar blok."""
    L = u1 - u0
    best, bestscore = None, 1e18
    for pitch in np.linspace(L/N*0.90, L/N*1.10, 81):
        span = pitch*N
        for off in np.linspace(u0 - (span-L)/2 - pitch*0.12,
                               u0 - (span-L)/2 + pitch*0.12, 41):
            idx = [off + k*pitch for k in range(1, N)]
            ii = np.clip(np.round(np.array(idx)).astype(int), 0, len(prof)-1)
            score = prof[ii].mean()
            # jangan sampai deret melenceng keluar dari bloknya
            score += 0.5*abs(off - u0) + 0.5*abs(off + span - u1)
            if score < bestscore:
                bestscore, best = score, (pitch, off)
    pitch, off = best
    return [max(u0, off)] + [off + k*pitch for k in range(1, N)] + [min(u1, off+pitch*N)]


def slots(fam, roi, labels, axis):
    pts = group_pts(fam, roi)
    (cx,cy),(rw,rh),ang = cv2.minAreaRect(pts)
    th = np.deg2rad(ang)
    ea = np.array([np.cos(th), np.sin(th)])   # arah sisi "rw"
    eb = np.array([-np.sin(th), np.cos(th)])  # arah sisi "rh"
    if axis == 'v':   pakai_b = abs(eb[1]) > abs(ea[1])
    elif axis == 'h': pakai_b = abs(eb[0]) > abs(ea[0])
    else:             pakai_b = rh > rw
    ex, ey = (eb, -ea) if pakai_b else (ea, eb)

    P = pts - np.array([cx,cy])
    u, v = P @ ex, P @ ey
    u0, u1 = np.percentile(u, 0.3), np.percentile(u, 99.7)

    prof = np.bincount(np.clip((u - u.min()).astype(int), 0, None))
    prof = np.convolve(prof.astype(float), np.ones(5)/5, mode='same')
    cs = cuts_periodik(prof, u0 - u.min(), u1 - u.min(), len(labels))
    cs = [c + u.min() for c in cs]

    potongan = []
    for k in range(len(labels)):
        sel = (u >= cs[k]) & (u <= cs[k+1])
        potongan.append(pts[sel] if sel.sum() >= 200 else None)

    kotak = [kotak_miring(p) if p is not None else None for p in potongan]

    # Rapikan: tiap piksel dikembalikan ke kavling yang paling "memilikinya"
    # (jarak Chebyshev di dalam kerangka kotaknya), lalu kotaknya dihitung
    # ulang. Perlu karena garis potong tegak lurus sumbu DERET, sementara
    # deret yang bertangga (Yuri 6-10, Okina 11-20) membuat potongan itu
    # menyerempet blok tetangga — kotak hasil potongan mentah jadi kebesaran.
    for _ in range(3):
        nilai = np.full((len(pts), len(kotak)), np.inf)
        for j, kk in enumerate(kotak):
            if kk is None: continue
            pusat, e1, e2, sa, sb = kk
            P = pts - pusat
            nilai[:, j] = np.maximum(np.abs(P @ e1) / sa, np.abs(P @ e2) / sb)
        milik = np.argmin(nilai, axis=1)
        cukup = np.min(nilai, axis=1) < 1.6      # piksel jauh dibuang
        baru = []
        for j in range(len(kotak)):
            pil = pts[(milik == j) & cukup]
            baru.append(kotak_miring(pil) if len(pil) >= 200 else kotak[j])
        kotak = baru

    # Bentuk akhir ditelusuri dari tepi pikselnya sendiri, bukan kotak
    # pembatasnya: sebagian kavling (Yuri 1-2, Okina 11) trapesium mengikuti
    # batas kawasan, dan kotak menutupi tanah yang bukan miliknya.
    hasil = []
    for j, kk in enumerate(kotak):
        if kk is None:
            hasil.append(None); continue
        pil = pts[(milik == j) & (nilai[:, j] <= 1.02)]
        hasil.append(telusuri_tepi(pil) if len(pil) >= 200 else sudut_persen(kk))
    return hasil


def telusuri_tepi(milik):
    """Poligon cembung yang mengikuti tepi kavling (4-10 titik)."""
    hull = cv2.convexHull(milik.astype(np.float32))
    keliling = cv2.arcLength(hull, True)
    poly = cv2.approxPolyDP(hull, 0.012 * keliling, True).reshape(-1, 2)
    return [[round(float(x)/W*100, 3), round(float(y)/H*100, 3)] for x, y in poly]


def kotak_miring(milik):
    """Kotak miring untuk SATU kavling: pusat, dua sumbu, dua setengah-sisi.

    Kemiringan diambil per kavling, bukan dari deretnya: deret Yuri 6-10 dan
    Okina 11-20 menyerong, tapi tiap kavlingnya sendiri hampir lurus (deretnya
    bertangga, bukan berputar). Kalau dipaksa ikut kemiringan deret, poligonnya
    jadi jajar genjang yang meleset dari bloknya.
    """
    (bx, by), _, bang = cv2.minAreaRect(milik)
    th = np.deg2rad(bang)
    e1 = np.array([np.cos(th), np.sin(th)])
    e2 = np.array([-np.sin(th), np.cos(th)])
    P = milik - np.array([bx, by])
    s, t = P @ e1, P @ e2
    # percentil menahan sisa piksel "jembatan" antar kavling di celahnya
    s0, s1 = np.percentile(s, 0.7), np.percentile(s, 99.3)
    t0, t1 = np.percentile(t, 0.7), np.percentile(t, 99.3)
    pusat = np.array([bx, by]) + e1*(s0+s1)/2 + e2*(t0+t1)/2
    return pusat, e1, e2, max((s1-s0)/2, 1.0), max((t1-t0)/2, 1.0)


def sudut_persen(kk):
    pusat, e1, e2, sa, sb = kk
    corners = []
    for (p, q) in ((-sa,-sb), (sa,-sb), (sa,sb), (-sa,sb)):
        pt = pusat + e1*p + e2*q
        corners.append([round(float(pt[0])/W*100, 3), round(float(pt[1])/H*100, 3)])
    return corners


kavling = []
for fam, roi, labels, axis in GROUPS:
    ss = slots(fam, roi, labels, axis)
    first = np.mean(ss[0], axis=0); last = np.mean(ss[-1], axis=0)
    if abs(last[0]-first[0]) > abs(last[1]-first[1]):
        flip = last[0] < first[0]
    else:
        flip = last[1] < first[1]
    if flip: ss = ss[::-1]
    for code, poly in zip(labels, ss):
        if poly is None:
            print('!! kosong', code); continue
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
        kavling.append(dict(code=code, poly=poly,
                            bbox=[round(min(xs),3), round(min(ys),3), round(max(xs),3), round(max(ys),3)]))

CATATAN = [
  "Bentuk kavling untuk overlay status jual di halaman /kawa-living/.",
  "poly = titik-titik bentuk kavling dalam PERSEN terhadap gambar siteplan",
  "([x,y]), jadi ikut ukuran layar. Semua kavling Kawa Living persegi,",
  "hanya arah miringnya berbeda-beda per deret.",
  "bbox = kotak pembatas, dipakai menaruh label TERJUAL/SIAP HUNI.",
  "Dibuat otomatis dari 'img/Siteplan Kawa Living.webp' (deteksi blok warna",
  "per deret + pencocokan jarak-tetap antar kavling). Kalau gambar siteplan",
  "diganti, file ini WAJIB dibuat ulang — kalau tidak, bentuknya meleset.",
  "Skripnya: tools/siteplan/trace-kawa-living.py",
  "code = label yang tercetak di gambar, sama persis dengan kode unit di",
  "Progress Dashboard. Blok 'Area Pengembangan' sengaja tidak didaftar:",
  "belum dijual, jadi tidak boleh ikut berwarna."
]

with open(KELUAR, 'w') as f:
    json.dump({'_catatan': CATATAN,
               'gambar': 'img/Siteplan%20Kawa%20Living.webp',
               'kavling': kavling}, f, indent=1, ensure_ascii=False)
print(len(kavling), 'kavling →', KELUAR)

vis = img.copy()
for k in kavling:
    pts = np.int32([[p[0]/100*W, p[1]/100*H] for p in k['poly']])
    cv2.polylines(vis, [pts], True, (0,0,255), 2)
    c = pts.mean(axis=0).astype(int)
    short = (k['code'].replace('Hiroi Yuri','HY').replace('Himawari','HW')
             .replace('Okina','OK').replace('Mizu','MZ').replace('Yuri','YR'))
    cv2.putText(vis, short, (c[0]-22, c[1]+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,0,255), 2, cv2.LINE_AA)
cv2.imwrite(PERIKSA, vis)
print('periksa hasilnya di', PERIKSA)
