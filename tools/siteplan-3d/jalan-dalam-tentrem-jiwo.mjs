// jalan-dalam-tentrem-jiwo.mjs — area di DALAM kavling yang bisa dijelajahi
// di Mode Jalan (saat ini: Villa Tentrem Jiwo, lantai bawah).
//
//   node jalan-dalam-tentrem-jiwo.mjs        (setelah build-tentrem-jiwo.mjs)
//
// Membaca tentrem-jiwo/3d/kawasan.glb (geometri yang benar-benar tampil),
// lalu per sel 25 cm di dalam kavling:
//   lantai  = permukaan menghadap atas tertinggi ≤ 0,8 m (lantai bawah, teras)
//   halang  = ada geometri antara lantai+0,3 m dan lantai+1,9 m
//             (dinding, perabot tinggi, tanaman); celah pintu tetap terbuka.
//             Panel kaca yang turun sampai lantai = pintu kaca geser (kamar
//             wing barat hanya bisa dimasuki dari kolam) → tidak menghalangi.
//   air     = permukaan kolam → tidak bisa dilalui
// Hasilnya ditulis ke kavling.json sebagai `dalam` (base64; 0 = tidak bisa,
// n = lantai (n-1) cm). Viewer menggabungkannya dengan grid jalan.
// WAJIB dicek mata: skrip menulis tools/siteplan-3d/_periksa-dalam.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const SINI = path.dirname(fileURLToPath(import.meta.url));
const AKAR = path.resolve(SINI, '../..');
const DIR = path.join(AKAR, 'tentrem-jiwo', '3d');
// masuk = titik tujuan tombol "Masuk & jelajahi" (lorong di sisi barat kolam),
// lihat = arah pandang setibanya (melintasi kolam ke wing timur).
const KAVLING_DALAM = [{ code: 'Villa Tentrem Jiwo', masuk: [47.0, -11.0], lihat: [56, 1.4, -11] }];
const SEL = 0.25, LANTAI_MAKS = 0.8, BEBAS_BAWAH = 0.3, BEBAS_ATAS = 1.9, TEBAL_DINDING = 0.1;

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(path.join(DIR, 'kawasan.glb'));
await doc.transform(dequantize());
const peta = JSON.parse(fs.readFileSync(path.join(DIR, 'kavling.json'), 'utf8'));

const kali = (M, v) => [0, 1, 2].map(r => M[r] * v[0] + M[r + 4] * v[1] + M[r + 8] * v[2] + M[r + 12]);
function susun(t, q, s) {
  const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  return [(1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0, (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
          (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0, t[0], t[1], t[2], 1];
}
function kaliM(a, b) { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; }
/* Semua segitiga dunia (instancing ikut dihitung). */
function* segitiga() {
  for (const n of doc.getRoot().listNodes()) {
    const m = n.getMesh(); if (!m) continue;
    const W = n.getWorldMatrix(); let Ms = [W];
    const inst = n.getExtension('EXT_mesh_gpu_instancing');
    if (inst) {
      const T = inst.getAttribute('TRANSLATION'), R = inst.getAttribute('ROTATION'), S = inst.getAttribute('SCALE');
      Ms = [];
      for (let i = 0; i < (T || R || S).getCount(); i++)
        Ms.push(kaliM(W, susun(T ? T.getElement(i, []) : [0, 0, 0], R ? R.getElement(i, []) : [0, 0, 0, 1], S ? S.getElement(i, []) : [1, 1, 1])));
    }
    for (const p of m.listPrimitives()) {
      const pos = p.getAttribute('POSITION'), idx = p.getIndices(); if (!pos || !idx || p.getMode() !== 4) continue;
      const nama = p.getMaterial()?.getName() || '';
      const air = /Water|Piscina/i.test(nama), kaca = /Glass|Translucent/i.test(nama);
      for (const M of Ms) for (let i = 0; i < idx.getCount(); i += 3)
        yield { v: [0, 1, 2].map(j => kali(M, pos.getElement(idx.getScalar(i + j), []))), air, kaca };
    }
  }
}
function didalam([x, z], t) {
  let ada = false;
  for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
    const [xi, zi] = t[i], [xj, zj] = t[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ada = !ada;
  }
  return ada;
}
const jarakSeg = (px, pz, ax, az, bx, bz) => {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
  const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0;
  return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};

const hasil = [];
const semua = [...segitiga()];
for (const { code: kode, masuk, lihat } of KAVLING_DALAM) {
  const k = peta.kavling.find(q => q.code === kode);
  const xs = k.poly.map(p => p[0]), zs = k.poly.map(p => p[1]);
  const x0 = Math.floor(Math.min(...xs) / SEL) * SEL, z0 = Math.floor(Math.min(...zs) / SEL) * SEL;
  const nx = Math.ceil((Math.max(...xs) - x0) / SEL), nz = Math.ceil((Math.max(...zs) - z0) / SEL);
  const N = nx * nz;
  const lantai = new Float32Array(N).fill(-Infinity), air = new Uint8Array(N), halang = new Uint8Array(N);
  const pusat = c => [x0 + (c % nx + 0.5) * SEL, z0 + (Math.floor(c / nx) + 0.5) * SEL];
  const tri = semua.filter(({ v }) => {
    const mx = Math.max(v[0][0], v[1][0], v[2][0]), mnx = Math.min(v[0][0], v[1][0], v[2][0]);
    const mz = Math.max(v[0][2], v[1][2], v[2][2]), mnz = Math.min(v[0][2], v[1][2], v[2][2]);
    return mx >= x0 && mnx <= x0 + nx * SEL && mz >= z0 && mnz <= z0 + nz * SEL;
  });
  // Tinggi bidang segitiga di titik (x,z) — null kalau di luar proyeksinya.
  function tinggiDi(v, x, z) {
    const [a, b, c] = v;
    const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(d) < 1e-9) return null;
    const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d;
    const l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return null;
    return l1 * a[1] + l2 * b[1] + l3 * c[1];
  }
  const selDalam = (v, pad) => {
    const i0 = Math.max(0, Math.floor((Math.min(v[0][0], v[1][0], v[2][0]) - pad - x0) / SEL));
    const i1 = Math.min(nx - 1, Math.floor((Math.max(v[0][0], v[1][0], v[2][0]) + pad - x0) / SEL));
    const j0 = Math.max(0, Math.floor((Math.min(v[0][2], v[1][2], v[2][2]) - pad - z0) / SEL));
    const j1 = Math.min(nz - 1, Math.floor((Math.max(v[0][2], v[1][2], v[2][2]) + pad - z0) / SEL));
    const out = [];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) out.push(j * nx + i);
    return out;
  };
  // 1) Lantai: permukaan menghadap atas.
  for (const { v, air: basah } of tri) {
    const ux = v[1][0] - v[0][0], uy = v[1][1] - v[0][1], uz = v[1][2] - v[0][2];
    const wx = v[2][0] - v[0][0], wy = v[2][1] - v[0][1], wz = v[2][2] - v[0][2];
    const ny = uz * wx - ux * wz, L = Math.hypot(uy * wz - uz * wy, ny, ux * wy - uy * wx);
    if (!L || Math.abs(ny / L) < 0.7) continue;
    for (const c of selDalam(v, 0)) {
      const [x, z] = pusat(c), y = tinggiDi(v, x, z);
      if (y == null) continue;
      if (basah && y > -1) air[c] = 1;
      if (y <= LANTAI_MAKS && y > lantai[c]) lantai[c] = y;
    }
  }
  // 2) Penghalang di pita setinggi badan di atas lantai sel itu.
  for (const { v, kaca } of tri) {
    const ys = v.map(p => p[1]), ymin = Math.min(...ys), ymax = Math.max(...ys);
    if (ymax < -0.5 || ymin > LANTAI_MAKS + BEBAS_ATAS) continue;
    if (kaca && ymin < LANTAI_MAKS + BEBAS_BAWAH) continue;   // pintu kaca sampai lantai
    for (const c of selDalam(v, TEBAL_DINDING)) {
      const f = lantai[c]; if (f === -Infinity) continue;
      const [x, z] = pusat(c);
      let y = tinggiDi(v, x, z);
      if (y == null) {
        // Segitiga tegak (dinding): dekat garis proyeksinya?
        const dekat = [0, 1, 2].some(e => jarakSeg(x, z, v[e][0], v[e][2], v[(e + 1) % 3][0], v[(e + 1) % 3][2]) < TEBAL_DINDING);
        if (!dekat) continue;
        if (ymax > f + BEBAS_BAWAH && ymin < f + BEBAS_ATAS) halang[c] = 1;
        continue;
      }
      if (y > f + BEBAS_BAWAH && y < f + BEBAS_ATAS) halang[c] = 1;
    }
  }
  // 3) Bisa dilalui = di dalam kavling, ada lantai, bukan air, tidak terhalang.
  const bisa = new Uint8Array(N);
  for (let c = 0; c < N; c++) {
    const [x, z] = pusat(c);
    if (didalam([x, z], k.poly) && lantai[c] > -0.5 && !air[c] && !halang[c]) bisa[c] = 1;
  }
  // 4) Hanya yang tersambung ke sisi depan kavling (jalan); sisanya (kamar
  //    tertutup, celah sempit di belakang) dibuang.
  const sambung = new Uint8Array(N), antre = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const c = j * nx + i, [x, z] = pusat(c);
    if (bisa[c] && Math.abs((x - k.muka[0]) * k.arah[0] + (z - k.muka[1]) * k.arah[1]) < SEL * 1.5) { sambung[c] = 1; antre.push(c); }
  }
  while (antre.length) {
    const c = antre.pop(), i = c % nx, j = Math.floor(c / nx);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const d = b * nx + a; if (bisa[d] && !sambung[d]) { sambung[d] = 1; antre.push(d); }
    }
  }
  const data = new Uint8Array(N);
  let n = 0;
  for (let c = 0; c < N; c++) if (sambung[c]) { data[c] = Math.max(1, Math.min(255, Math.round(lantai[c] * 100) + 1)); n++; }
  hasil.push({ code: kode, masuk, lihat, x0, z0, sel: SEL, nx, nz, data: Buffer.from(data).toString('base64') });
  console.log(kode, { sel: N, bisa: n, m2: n * SEL * SEL });

  // Gambar periksa: hijau = bisa, merah = halang, biru = air.
  const s = 8, img = Buffer.alloc(nx * s * nz * s * 3, 30);
  for (let c = 0; c < N; c++) {
    const col = sambung[c] ? [60 + Math.min(150, lantai[c] * 200), 200, 60] : air[c] ? [40, 110, 210] : halang[c] ? [200, 50, 50] : bisa[c] ? [80, 120, 60] : [30, 30, 30];
    const i = c % nx, j = Math.floor(c / nx);
    for (let y = 0; y < s - 1; y++) for (let x = 0; x < s - 1; x++) img.set(col, (((j * s + y) * nx * s) + i * s + x) * 3);
  }
  await sharp(img, { raw: { width: nx * s, height: nz * s, channels: 3 } }).png().toFile(path.join(SINI, '_periksa-dalam.png'));
}
peta.dalam = hasil;
peta._catatan = peta._catatan.filter(t => !/^dalam:/.test(t)).concat(
  ['dalam: area di dalam kavling yang bisa dijelajahi Mode Jalan (tools/siteplan-3d/jalan-dalam-tentrem-jiwo.mjs); data base64, 0 = tidak bisa, n = lantai (n-1) cm.']);
fs.writeFileSync(path.join(DIR, 'kavling.json'), JSON.stringify(peta));
