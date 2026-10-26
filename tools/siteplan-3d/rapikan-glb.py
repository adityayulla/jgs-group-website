# rapikan-glb.py — Rapikan GLB ekspor SketchUp: satu primitive per bidang & material kembar → material unik, primitive digabung per mesh+material.
import json, struct, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read()
L = struct.unpack_from('<I', raw, 12)[0]; j = json.loads(raw[20:20+L])
o = 20 + L; BL = struct.unpack_from('<I', raw, o)[0]; BIN = memoryview(raw)[o+8:o+8+BL]
acc, bv = j['accessors'], j['bufferViews']
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
def baca(i):
    a = acc[i]; v = bv[a['bufferView']]; dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0); stride = v.get('byteStride', 0)
    if stride and stride != dt.itemsize * n:
        arr = np.ndarray((a['count'], n), dt, BIN, off, (stride, dt.itemsize))
    else:
        arr = np.frombuffer(BIN, dt, a['count'] * n, off).reshape(a['count'], n)
    return np.array(arr)
# material unik berdasarkan isi
kunci = lambda m: json.dumps({k: v for k, v in m.items() if k != 'name'}, sort_keys=True)
peta, mats = {}, []
for m in j['materials']:
    k = kunci(m)
    if k not in peta: peta[k] = len(mats); mats.append(m)
idx_mat = [peta[kunci(m)] for m in j['materials']]
# buffer baru
blob = bytearray(); nbv, nacc = [], []
def tambah(arr, target=None, minmax=False, tipe='VEC3'):
    arr = np.ascontiguousarray(arr)
    while len(blob) % 4: blob.append(0)
    v = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': arr.nbytes}
    if target: v['target'] = target
    blob.extend(arr.tobytes()); nbv.append(v)
    ct = {np.dtype(np.float32): 5126, np.dtype(np.uint16): 5123, np.dtype(np.uint32): 5125}[arr.dtype]
    a = {'bufferView': len(nbv)-1, 'componentType': ct, 'count': arr.shape[0], 'type': tipe}
    if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    nacc.append(a); return len(nacc)-1
# gambar disalin
imgs = []
for im in j.get('images', []):
    v = bv[im['bufferView']]; data = bytes(BIN[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
    while len(blob) % 4: blob.append(0)
    nbv.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data)}); blob.extend(data)
    imgs.append({'bufferView': len(nbv)-1, 'mimeType': im['mimeType'], **({'name': im['name']} if im.get('name') else {})})
meshes = []; tot = 0
for m in j['meshes']:
    grup = {}
    for p in m['primitives']:
        if p.get('mode', 4) != 4 or 'indices' not in p: continue  # garis tepi dibuang
        k = (idx_mat[p['material']] if 'material' in p else -1, 'TEXCOORD_0' in p['attributes'], 'NORMAL' in p['attributes'])
        grup.setdefault(k, []).append(p)
    prims = []
    for (mi, uv, nr), ps in grup.items():
        P, N, U, I = [], [], [], []; basis = 0
        for p in ps:
            pos = baca(p['attributes']['POSITION']); P.append(pos)
            if nr: N.append(baca(p['attributes']['NORMAL']))
            if uv: U.append(baca(p['attributes']['TEXCOORD_0']))
            I.append(baca(p['indices']).reshape(-1).astype(np.uint32) + basis); basis += len(pos)
        P = np.concatenate(P).astype(np.float32); Iv = np.concatenate(I)
        if basis < 65536: Iv = Iv.astype(np.uint16)
        at = {'POSITION': tambah(P, 34962, True)}
        if nr: at['NORMAL'] = tambah(np.concatenate(N).astype(np.float32), 34962)
        if uv: at['TEXCOORD_0'] = tambah(np.concatenate(U).astype(np.float32), 34962, tipe='VEC2')
        pr = {'attributes': at, 'indices': tambah(Iv.reshape(-1, 1), 34963, tipe='SCALAR'), 'mode': 4}
        nacc[pr['indices']]['count'] = len(Iv)
        if mi >= 0: pr['material'] = mi
        prims.append(pr); tot += len(Iv) // 3
    meshes.append({'primitives': prims, **({'name': m['name']} if m.get('name') else {})})
# mesh tanpa primitive → lepas dari node
nodes = []
for n in j['nodes']:
    n = dict(n)
    if 'mesh' in n and not meshes[n['mesh']]['primitives']: n.pop('mesh')
    nodes.append(n)
g = {'asset': {'version': '2.0', 'generator': 'rapikan-glb.py (dari SketchUp GLTF Exporter)'}, 'scene': j.get('scene', 0), 'scenes': j['scenes'],
     'nodes': nodes, 'meshes': meshes, 'materials': mats, 'textures': j.get('textures', []), 'images': imgs,
     'accessors': nacc, 'bufferViews': nbv, 'buffers': [{'byteLength': len(blob)}]}
if j.get('samplers'): g['samplers'] = j['samplers']
js = json.dumps(g, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(blob) % 4: blob.append(0)
with open(out, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(blob), 0x004E4942)); f.write(blob)
print(json.dumps({'materials': len(mats), 'prims': sum(len(m['primitives']) for m in meshes), 'tri': tot, 'MB': round((len(js)+len(blob))/1e6, 1)}))
