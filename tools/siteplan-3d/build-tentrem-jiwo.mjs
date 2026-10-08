// build-tentrem-jiwo.mjs — model SketchUp kawasan Tentrem Jiwo → siteplan 3D.
//
//   cd tools/siteplan-3d && npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 \
//       @gltf-transform/functions@4 meshoptimizer sharp
//   # 1) DAE → glTF (assimp; brew install assimp). Folder tekstur "all tj/" harus
//   #    ikut disalin ke sebelah tj.gltf (path tekstur di DAE relatif).
//   assimp export "all tj.dae" tj.gltf -f gltf2 -tri -jiv
//   # 2) bersihkan + kompres + tulis data kavling
//   node build-tentrem-jiwo.mjs /path/tj.gltf
//     → tentrem-jiwo/3d/kawasan.glb   (satu model utuh, ±5 MB, ±3 MB lewat Brotli)
//     → tentrem-jiwo/3d/kavling.json
//
// Beda dengan Kawa Living: di sini arsitek mengirim SATU model seluruh kawasan
// (rumah sudah di kavlingnya), bukan model per tipe, dan tidak ada DWG. Maka
// batas kavling/jalan di bawah diukur dari model itu sendiri (tampak atas,
// pagar & lantai), dalam koordinat model: meter, x = timur, z = selatan.
// Model lurus mengikuti deret rumah; aslinya kawasan miring ±9° searah jarum
// jam (lihat img/siteplan.jpg) — hanya dipakai untuk label arah hadap.
//
// Tiap rumah dikumpulkan di node "kavling:<kode>" supaya viewer bisa
// menyembunyikannya saat filter. Tipe, LT, harga, status: dari dashboard
// saat runtime, bukan dari file ini.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, prune, flatten, instance, join, simplify, simplifyPrimitive,
         textureCompress, meshopt, compactPrimitive, quantize, reorder, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KELUAR = path.join(AKAR, 'tentrem-jiwo', '3d');
const [,, MASUK] = process.argv;
if (!MASUK) { console.error('pakai: node build-tentrem-jiwo.mjs tj.gltf'); process.exit(1); }

/* ── kavling (diukur dari model) ───────────────────────────── */
const KIRI = [8.2, 22.3], KANAN_X = 29.7;
const timurKanan = z => 45.2 + (z + 50.9) * (44.0 - 45.2) / (-29.9 + 50.9);   // pagar timur deret kanan miring
const kotak = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const KAVLING = [
  // deret barat, menghadap jalan utama (timur)
  { code: 'Abirama 1', poly: [[8.2, -55.7], [22.3, -54.5], [22.3, -43.9], [8.2, -43.9]], arah: [1, 0] },
  { code: 'Abirama 3', poly: kotak(...KIRI, -43.9, -36.9), arah: [1, 0] },
  { code: 'Abirama 5', poly: kotak(...KIRI, -36.9, -29.9), arah: [1, 0] },
  { code: 'Abirama 7', poly: kotak(...KIRI, -29.9, -22.7), arah: [1, 0] },
  // deret timur, menghadap jalan utama (barat)
  { code: 'Abirama 2', poly: [[KANAN_X, -50.9], [timurKanan(-50.9), -50.9], [timurKanan(-43.9), -43.9], [KANAN_X, -43.9]], arah: [-1, 0] },
  { code: 'Abirama 4', poly: [[KANAN_X, -43.9], [timurKanan(-43.9), -43.9], [timurKanan(-36.9), -36.9], [KANAN_X, -36.9]], arah: [-1, 0] },
  { code: 'Abirama 6', poly: [[KANAN_X, -36.9], [timurKanan(-36.9), -36.9], [timurKanan(-29.9), -29.9], [KANAN_X, -29.9]], arah: [-1, 0] },
  { code: 'Abirama 8', poly: kotak(KANAN_X, 52.1, -29.9, -22.7), arah: [-1, 0] },
  // deret selatan, menghadap jalan lingkungan (utara)
  { code: 'Baswara 1', poly: kotak(8.2, 15.6, -18.6, -6.4), arah: [0, -1] },
  { code: 'Baswara 2', poly: kotak(15.6, 23.1, -18.6, -6.4), arah: [0, -1] },
  { code: 'Baswara 3', poly: kotak(23.1, 30.6, -18.6, -6.4), arah: [0, -1] },
  { code: 'Baswara 4', poly: kotak(30.6, 38.1, -18.6, -6.4), arah: [0, -1] },
  { code: 'Villa Tentrem Jiwo', poly: [[38.1, -18.6], [52.2, -18.6], [52.2, -21.3], [62.9, -21.3], [62.9, -6.4], [38.1, -6.4]], arah: [0, -1] },
];
const PETA = {
  batas: [[8.2, -55.7], [22.3, -54.5], [45.2, -52.9], [44.0, -29.9], [52.1, -29.9], [52.1, -21.3], [62.9, -21.3], [62.9, -6.4], [8.2, -6.4]],
  // Jalan kawasan: jalan utama utara–selatan + jalan lingkungan barat–timur.
  jalan: { luar: [[22.3, -55.0], [29.7, -55.0], [29.7, -22.7], [52.1, -22.7], [52.1, -18.6], [8.2, -18.6], [8.2, -22.7], [22.3, -22.7]], lubang: [] },
  jalanDesa: [[1.4, -61.9], [54.2, -56.7], [54.0, -51.7], [1.2, -56.4]],
  gerbang: [[22.3, -54.6], [29.7, -54.0]],
  fasum: [{ nama: 'Pos Satpam', poly: kotak(29.7, 33.7, -54.1, -51.1) }],
};

const ARAH = ['Timur', 'Timur Laut', 'Utara', 'Barat Laut', 'Barat', 'Barat Daya', 'Selatan', 'Tenggara'];
const MIRING = -9 * Math.PI / 180;   // model → utara sebenarnya (searah jarum jam di peta)
function hadap([ax, az]) {
  const x = ax * Math.cos(MIRING) + az * Math.sin(MIRING), z = -ax * Math.sin(MIRING) + az * Math.cos(MIRING);
  const sudut = (Math.atan2(-z, x) * 180 / Math.PI + 360) % 360;   // 0° = timur, 90° = utara
  return ARAH[Math.floor((sudut + 22.5) / 45) % 8];
}
const r2 = v => Math.round(v * 100) / 100;
const pusat = p => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
const luas = p => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
function didalam([x, z], t) {
  let ada = false;
  for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
    const [xi, zi] = t[i], [xj, zj] = t[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ada = !ada;
  }
  return ada;
}
/* Titik tengah sisi depan = titik poligon paling jauh ke arah jalan, dirata-rata. */
function muka(k) {
  const d = k.poly.map(([x, z]) => x * k.arah[0] + z * k.arah[1]), maks = Math.max(...d);
  const depan = k.poly.filter((_, i) => d[i] > maks - 0.6);
  return pusat(depan);
}
function lebarDalam(k) {
  const sisi = [-k.arah[1], k.arah[0]];
  const u = k.poly.map(([x, z]) => x * sisi[0] + z * sisi[1]), v = k.poly.map(([x, z]) => x * k.arah[0] + z * k.arah[1]);
  return [Math.max(...u) - Math.min(...u), Math.max(...v) - Math.min(...v)];
}

/* ── model ─────────────────────────────────────────────────── */
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(MASUK);
const root = doc.getRoot(), scene = root.getDefaultScene();
const segitiga = () => { let t = 0; scene.traverse(n => { const m = n.getMesh(); if (m) m.listPrimitives().forEach(p => t += (p.getIndices()?.getCount() ?? 0) / 3); }); return Math.round(t); };
const awal = segitiga();

// 1) Garis tepi SketchUp (LINES / material edge_color) dibuang.
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  if (p.getMode() !== 4 || /^edge_color/.test(p.getMaterial()?.getName() || '')) { m.removePrimitive(p); p.dispose(); }
}

// 2) Perabot & dekor interior: grup kecil (< 0,8 m) yang berat, plus tirai,
//    kursi, logam krom dsb. Dari luar tidak terlihat, tapi memakan >80% segitiga
//    (Unit Office di model lengkap dengan isi kantornya).
const MINEXT = 0.8;
const BUANG_MAT = /Curtain|Chrome|Steel|Blinds|Rolgordijn|Textile|Fabric|Leather|kursi|Ivory/i;
function kotakDunia(n) {
  const M = n.getWorldMatrix(), min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const prim of n.getMesh().listPrimitives()) {
    const a = prim.getAttribute('POSITION'); if (!a) continue;
    const lo = a.getMin([]), hi = a.getMax([]);
    for (let i = 0; i < 8; i++) {
      const v = [i & 1 ? hi[0] : lo[0], i & 2 ? hi[1] : lo[1], i & 4 ? hi[2] : lo[2]];
      const w = [0, 1, 2].map(r => M[r] * v[0] + M[r + 4] * v[1] + M[r + 8] * v[2] + M[r + 12]);
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], w[k]); max[k] = Math.max(max[k], w[k]); }
    }
  }
  return { min, max };
}
const triNode = n => n.getMesh().listPrimitives().reduce((t, p) => t + (p.getIndices()?.getCount() ?? 0) / 3, 0);
const ukuran = b => Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
function kotakPohon(n) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]; let t = 0;
  n.traverse(c => { if (!c.getMesh()) return; const b = kotakDunia(c); t += triNode(c); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], b.min[k]); max[k] = Math.max(max[k], b.max[k]); } });
  return { min, max, t };
}
function sapu(n) {
  const b = kotakPohon(n);
  if (!b.t) return;
  if (ukuran(b) < MINEXT && b.t > 60) { n.traverse(c => c.setMesh(null)); return; }
  for (const c of n.listChildren()) sapu(c);
  if (n.getMesh()) {
    const e = ukuran(kotakDunia(n));
    const mat = n.getMesh().listPrimitives().map(p => p.getMaterial()?.getName() || '').join(' ');
    if ((e < MINEXT && triNode(n) > 60) || (BUANG_MAT.test(mat) && e < 4)) n.setMesh(null);
  }
}
scene.listChildren().forEach(sapu);
await doc.transform(prune(), dedup(), flatten(), weld());

// 3) Mesh berpola rumit (roster, batu tempel, pagar besi): normal & UV warna
//    polos dibuang supaya verteks bisa disatukan, lalu disederhanakan keras.
//    Tanpa normal, three.js memakai flat shading — tidak kentara di pola sekecil itu.
const rumit = p => (p.getIndices()?.getCount() ?? 0) / 3 > 4000;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) if (rumit(p)) {
  p.setAttribute('NORMAL', null);
  if (!p.getMaterial()?.getBaseColorTexture()) p.setAttribute('TEXCOORD_0', null);
}
await doc.transform(weld());
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) if (rumit(p))
  simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: 0.06, error: 0.06, lockBorder: false });
await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.004 }), dedup(), prune());

// 4) Kelompokkan per kavling. Objek yang utuh di satu kavling dipindah ke
//    grupnya; objek yang melintasi beberapa kavling (dinding & atap rumah
//    kopel, lantai deret) dipotong per segitiga menurut titik beratnya.
//    Sisanya (jalan, pagar luar, pos satpam) tetap di akar.
const grupKav = new Map();
for (const k of KAVLING) {
  const g = doc.createNode('kavling:' + k.code).setExtras({ kavling: k.code });
  scene.addChild(g);
  grupKav.set(k, g);
}
const kotakKav = KAVLING.map(k => {
  const xs = k.poly.map(p => p[0]), zs = k.poly.map(p => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
});
const kavDi = (x, z) => KAVLING.find(k => didalam([x, z], k.poly));
let dipotong = 0;
for (const n of scene.listChildren()) {
  if (!n.getMesh() || [...grupKav.values()].includes(n)) continue;
  const b = kotakDunia(n);
  const kena = KAVLING.filter((k, i) => b.max[0] > kotakKav[i][0] && b.min[0] < kotakKav[i][1] && b.max[2] > kotakKav[i][2] && b.min[2] < kotakKav[i][3]);
  if (!kena.length) continue;
  const c = [(b.min[0] + b.max[0]) / 2, (b.min[2] + b.max[2]) / 2];
  const kc = kavDi(...c);
  if (kena.length === 1 && kc && b.min[0] >= kotakKav[KAVLING.indexOf(kc)][0] - 0.3 && b.max[0] <= kotakKav[KAVLING.indexOf(kc)][1] + 0.3
      && b.min[2] >= kotakKav[KAVLING.indexOf(kc)][2] - 0.3 && b.max[2] <= kotakKav[KAVLING.indexOf(kc)][3] + 0.3) {
    scene.removeChild(n); grupKav.get(kc).addChild(n); continue;
  }
  // Potong per segitiga.
  const M = n.getWorldMatrix();
  const bagian = new Map();   // k|null → mesh baru
  const v = [0, 0, 0];
  for (const prim of n.getMesh().listPrimitives()) {
    const pos = prim.getAttribute('POSITION'), idx = prim.getIndices();
    if (!pos || !idx) continue;
    const perK = new Map();
    for (let i = 0; i < idx.getCount(); i += 3) {
      let sx = 0, sz = 0;
      for (let j = 0; j < 3; j++) {
        pos.getElement(idx.getScalar(i + j), v);
        sx += M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12];
        sz += M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14];
      }
      const k = kavDi(sx / 3, sz / 3) || null;
      if (!perK.has(k)) perK.set(k, []);
      perK.get(k).push(idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2));
    }
    for (const [k, list] of perK) {
      if (!bagian.has(k)) bagian.set(k, doc.createMesh());
      const p2 = prim.clone().setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(list)).setBuffer(idx.getBuffer()));
      bagian.get(k).addPrimitive(compactPrimitive(p2));
    }
  }
  if (bagian.size === 1 && bagian.has(null)) { for (const m of bagian.values()) m.dispose(); continue; }
  for (const [k, mesh] of bagian) {
    const baru = doc.createNode(n.getName()).setMatrix(M).setMesh(mesh);
    (k ? grupKav.get(k) : scene).addChild(baru);
  }
  n.dispose();
  dipotong++;
}
await doc.transform(prune());
// 5) Instancing per grup (instance() bawaan membatch lintas seluruh scene, jadi
//    tiap grup dipindah sebentar ke scene sendiri). Lalu join per grup.
const grupSemua = [...grupKav.values()];
console.error('objek dipotong per kavling:', dipotong);
// 5) Instancing per grup. instance() bawaan membatch semua node di semua
//    scene, jadi isi scene dilepas dulu dan tiap grup diproses sendirian di
//    scene sementara; batch-nya lalu dikembalikan ke grupnya.
const sisa = scene.listChildren().filter(n => !grupSemua.includes(n));
scene.listChildren().forEach(n => scene.removeChild(n));
const sementara = doc.createScene('sementara');
for (const g of [...grupSemua, null]) {
  const anak = g ? g.listChildren() : sisa;
  anak.forEach(n => { if (g) g.removeChild(n); sementara.addChild(n); });
  await doc.transform(instance({ min: 3 }));
  const hasil = sementara.listChildren();
  hasil.forEach(n => { sementara.removeChild(n); g ? g.addChild(n) : scene.addChild(n); });
}
sementara.dispose();
grupSemua.forEach(g => scene.addChild(g));
await doc.transform(join(), weld(), dedup(), prune());

// 6) Tekstur WebP ≤ 512 px, kuantisasi + meshopt.
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 70 }),
  reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
const kawasan = getBounds(scene);
fs.mkdirSync(KELUAR, { recursive: true });
await io.write(path.join(KELUAR, 'kawasan.glb'), doc);

/* ── kavling.json ──────────────────────────────────────────── */
const fasumPusat = PETA.fasum.map(f => ({ ...f, poly: f.poly.map(p => p.map(r2)), pusat: pusat(f.poly).map(r2), luas: r2(luas(f.poly)) }));
const data = {
  _catatan: [
    'Dibuat oleh tools/siteplan-3d/build-tentrem-jiwo.mjs dari model SketchUp kawasan — jangan disunting tangan.',
    'Satuan meter, koordinat model kawasan.glb: x = timur, z = selatan (utara = -z).',
    'Model diluruskan mengikuti deret rumah; aslinya miring ±9° searah jarum jam. hadap sudah dikoreksi.',
    'Tipe, LT/LB, harga, hoek, status: dari dashboard saat runtime, bukan dari file ini.',
  ],
  kavling: KAVLING.map(k => {
    const [lebar, dalam] = lebarDalam(k);
    return { code: k.code, deret: k.code.replace(/ \d+$/, '').replace(' Tentrem Jiwo', ''), poly: k.poly.map(p => p.map(r2)),
             muka: muka(k).map(r2), arah: k.arah, lebar: r2(lebar), dalam: r2(dalam), hadap: hadap(k.arah), luasModel: r2(luas(k.poly)) };
  }),
  batas: PETA.batas, jalan: PETA.jalan, jalanDesa: PETA.jalanDesa, gerbang: PETA.gerbang, taman: [], fasum: fasumPusat,
  tinggiMaks: r2(kawasan.max[1]),
};
fs.writeFileSync(path.join(KELUAR, 'kavling.json'), JSON.stringify(data));
const kb = f => Math.round(fs.statSync(path.join(KELUAR, f)).size / 1024);
console.log(JSON.stringify({ segitigaAwal: awal, segitigaAkhir: segitiga(), glbKB: kb('kawasan.glb'), jsonKB: kb('kavling.json'),
  perKavling: grupSemua.map(g => [g.getName().slice(8), g.listChildren().length]) }));
