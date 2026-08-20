"""Langkah 1 — ambil bentuk kavling dari PDF siteplan CAD.

    pip install pymupdf shapely pillow
    python3 tools/siteplan/tentrem-bhumi/1-muka-dari-cad.py <siteplan.pdf>

Gambar CAD-nya bukan kumpulan poligon tertutup, melainkan ratusan garis
lepas — banyak yang ujungnya menggantung beberapa titik dari garis
tetangganya. Jadi urutannya: kumpulkan semua ruas, PANJANGKAN tiap ujung
sedikit (EXT) supaya celah CAD tertutup, potong di semua perpotongan,
pangkas ranting yang tetap menggantung, lalu telusuri muka minimal planar
(belok paling kanan). Tiap muka lalu dicocokkan dengan teks yang jatuh di
dalamnya — dari situlah "Bhama 3", "Cantya 7", "FASUM" dan seterusnya.

Keluarannya muka.json: daftar poligon (satuan titik PDF) + kata-kata yang
ada di dalamnya. Dipakai langkah 2 dan 3.
"""
import sys, json, math, os
from collections import defaultdict
import fitz

PDF = sys.argv[1] if len(sys.argv) > 1 else None
if not PDF or not os.path.exists(PDF):
    raise SystemExit('Pakai: python3 1-muka-dari-cad.py <siteplan.pdf>')
KELUAR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'muka.json')

# ─── ruas garis dari halaman 1 ───────────────────────────────────────────────
doc = fitz.open(PDF)
hal = doc[0]
segs = []
for i, x in enumerate(hal.get_drawings()):
    col = x.get('color') or x.get('fill')
    for it in x['items']:
        if it[0] == 'l':
            a, b = it[1], it[2]
            segs.append((i, round(a.x,2), round(a.y,2), round(b.x,2), round(b.y,2), col))
        elif it[0] == 'qu':
            q = it[1]; p = [q.ul, q.ur, q.lr, q.ll]
            for k in range(4):
                a, b = p[k], p[(k+1)%4]
                segs.append((i, round(a.x,2), round(a.y,2), round(b.x,2), round(b.y,2), col))
raw=[]
for i,x1,y1,x2,y2,col in segs:
    if i==0: continue
    if col and (col[0]>0.9 and col[1]<0.5): continue
    if col and min(col)>0.9: continue
    if max(x1,x2)<200: continue
    if (x1,y1)==(x2,y2): continue
    raw.append([(x1,y1),(x2,y2)])
def d(p,q): return math.hypot(p[0]-q[0],p[1]-q[1])

EXT=4.0
ext=[]
for a,b in raw:
    L=d(a,b)
    if L==0: continue
    ux,uy=(b[0]-a[0])/L,(b[1]-a[1])/L
    e = EXT if L<200 else 1.0
    ext.append([(a[0]-ux*e, a[1]-uy*e), (b[0]+ux*e, b[1]+uy*e)])
raw=ext

TOL=0.6
pts={}
def snap(p):
    k=(round(p[0]/TOL),round(p[1]/TOL))
    for dx in(-1,0,1):
        for dy in(-1,0,1):
            kk=(k[0]+dx,k[1]+dy)
            if kk in pts: return pts[kk]
    pts[k]=(round(p[0],3),round(p[1],3)); return pts[k]
def seg_int(a,b,c,e):
    x1,y1=a;x2,y2=b;x3,y3=c;x4,y4=e
    den=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3)
    if abs(den)<1e-9: return None
    t=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/den
    u=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/den
    if -1e-9<=t<=1+1e-9 and -1e-9<=u<=1+1e-9:
        return (x1+t*(x2-x1), y1+t*(y2-y1))
    return None
pieces=[]
for i,(a,b) in enumerate(raw):
    cuts=[a,b]
    for j,(c,e) in enumerate(raw):
        if i==j: continue
        p=seg_int(a,b,c,e)
        if p: cuts.append(p)
    cuts.sort(key=lambda p:d(a,p))
    ded=[cuts[0]]
    for p in cuts[1:]:
        if d(p,ded[-1])>TOL: ded.append(p)
    for k in range(len(ded)-1):
        pieces.append((snap(ded[k]),snap(ded[k+1])))
adj=defaultdict(set)
for a,b in pieces:
    if a!=b: adj[a].add(b); adj[b].add(a)
print('simpul',len(adj))
while True:
    deg1=[p for p in adj if len(adj[p])<=1]
    if not deg1: break
    for p in deg1:
        for q in list(adj[p]): adj[q].discard(p)
        del adj[p]
print('setelah pangkas',len(adj))
half=set()
for a in adj:
    for b in adj[a]: half.add((a,b))
def ang(a,b): return math.atan2(b[1]-a[1],b[0]-a[0])
faces=[];used=set()
for h in list(half):
    if h in used: continue
    face=[];cur=h
    while cur not in used:
        used.add(cur);face.append(cur)
        a,b=cur; back=ang(b,a); best=None;bestd=None
        for c in adj[b]:
            if c==a and len(adj[b])>1: continue
            dd=(back-ang(b,c))%(2*math.pi)
            if bestd is None or dd<bestd: bestd=dd;best=c
        if best is None: best=a
        cur=(b,best)
        if cur==h: break
        if len(face)>500: break
    if len(face)>=3: faces.append(face)
def area(P):
    s=0
    for i in range(len(P)):
        x1,y1=P[i];x2,y2=P[(i+1)%len(P)]
        s+=x1*y2-x2*y1
    return s/2
out=[]
for f in faces:
    P=[h[0] for h in f];A=area(P)
    if A>50: out.append({'poly':P,'area':A})
out.sort(key=lambda x:-x['area'])



# ─── cocokkan teks ke muka ──────────────────────────────────────────────────
kata = [(w[4], ((w[0]+w[2])/2, (w[1]+w[3])/2)) for w in hal.get_text('words')]
def di_dalam(pt, P):
    x, y = pt; c = False; n = len(P)
    for i in range(n):
        x1, y1 = P[i]; x2, y2 = P[(i-1) % n]
        if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1) + x1:
            c = not c
    return c
for f in out:
    f['words'] = [w for w, pt in kata if di_dalam(pt, f['poly'])]

json.dump(out, open(KELUAR, 'w'), ensure_ascii=False)
print('%d muka -> %s' % (len(out), KELUAR))
for f in out:
    if f['words']:
        print('  %-28s luas %6d' % (' '.join(f['words'])[:28], f['area']))
