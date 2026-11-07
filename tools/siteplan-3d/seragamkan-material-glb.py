#!/usr/bin/env python3
"""seragamkan-material-glb.py model.glb — samakan material GLB ekspor SketchUp (Yuri 1) dengan tipe OBJ.
Exporter tidak menulis metallicFactor (bawaan glTF = 1, semua seperti logam: dinding kusam, kayu hitam) dan
mengalikan tekstur dengan warna rata-ratanya (tekstur gelap dua kali). Skrip ini: metallicFactor 0, RGB faktor
material bertekstur jadi putih (alpha dipertahankan), Color L02 (garis alur merah muda bawaan SketchUp) abu 0,55.
Hanya bagian JSON GLB yang ditulis ulang; geometri dan tekstur tidak berubah."""
import json, struct, sys
glb = sys.argv[1]
b = open(glb, 'rb').read()
n, tipe = struct.unpack('<II', b[12:20]); assert tipe == 0x4E4F534A
j = json.loads(b[20:20+n]); sisa = b[20+n:]
for m in j.get('materials', []):
    pb = m.setdefault('pbrMetallicRoughness', {})
    pb['metallicFactor'] = 0
    c = pb.get('baseColorFactor', [1, 1, 1, 1])
    if 'baseColorTexture' in pb: c = [1, 1, 1, c[3]]
    if m.get('name', '').replace('_', ' ') == 'Color L02': c = [.55, .55, .55, c[3]]
    pb['baseColorFactor'] = c
s = json.dumps(j, separators=(',', ':')).encode(); s += b' ' * (-len(s) % 4)
open(glb, 'wb').write(b[:8] + struct.pack('<I', 12+8+len(s)+len(sisa)) + struct.pack('<II', len(s), 0x4E4F534A) + s + sisa)
print(glb.split('/')[-1], len(j.get('materials', [])), 'material')
