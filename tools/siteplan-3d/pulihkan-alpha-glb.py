#!/usr/bin/env python3
"""pulihkan-alpha-glb.py model.glb sumber.mtl — kembalikan transparansi kaca setelah konversi OBJ.
assimp membaca `d` di MTL sebagai alphaMode BLEND tapi menulis alpha baseColorFactor = 1, sehingga kaca
tampil padat seperti kertas. Skrip ini menyalin nilai d < 1 ke material bernama sama (akhiran _ramping
diabaikan). Hanya bagian JSON GLB yang ditulis ulang; geometri dan tekstur tidak berubah."""
import json, struct, sys
glb, mtl = sys.argv[1:3]
d = {}; nama = None
for l in open(mtl, errors='replace'):
    t = l.split()
    if len(t) >= 2 and t[0] == 'newmtl': nama = t[1]
    elif len(t) >= 2 and t[0] == 'd' and nama: d[nama] = float(t[1])
b = open(glb, 'rb').read()
n, tipe = struct.unpack('<II', b[12:20]); assert tipe == 0x4E4F534A
j = json.loads(b[20:20+n]); sisa = b[20+n:]
hasil = []
for m in j.get('materials', []):
    a = d.get(m.get('name', '').removesuffix('_ramping'))
    if a is None or a >= 1 or a <= 0: continue  # d 0 membuat benda hilang total
    pb = m.setdefault('pbrMetallicRoughness', {})
    c = pb.get('baseColorFactor', [1, 1, 1, 1]); c[3] = a; pb['baseColorFactor'] = c
    m['alphaMode'] = 'BLEND'; m.pop('alphaCutoff', None)
    hasil.append((m['name'], a))
s = json.dumps(j, separators=(',', ':')).encode(); s += b' ' * (-len(s) % 4)
o = b[:8] + struct.pack('<I', 12+8+len(s)+len(sisa)) + struct.pack('<II', len(s), 0x4E4F534A) + s + sisa
open(glb, 'wb').write(o)
print(glb.split('/')[-1], hasil)
