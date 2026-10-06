// optimize-model.mjs — DAE SketchUp → GLB ringan untuk siteplan 3D Kawa Living.
//
//   cd tools/siteplan-3d && npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 \
//       @gltf-transform/functions@4 @gltf-transform/cli@4 meshoptimizer sharp
//   # 1) DAE → glTF (assimp; brew install assimp). Ganti path tekstur di DAE ke folder tex/ dulu.
//   assimp export model.dae model.gltf -f gltf2 -tri -jiv
//   npx gltf-transform copy model.gltf raw.glb
//   # 2) bersihkan + kompres
//   node optimize-model.mjs raw.glb ../../kawa-living/3d/models/mizu-36.glb 512 0.5
//
// Model SketchUp sudah dalam meter dengan depan rumah di +Z. Skrip ini:
// membuang objek nyasar (>30 m dari rumah) dan detail mungil yang berat,
// memusatkan model (x/z di tengah, lantai y=0), menyederhanakan mesh,
// tekstur → WebP maks 512 px, lalu kompresi meshopt. Target ≤ 600 KB.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds, dedup, weld, prune, flatten, join, textureCompress, simplify, meshopt, quantize, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const [,, inp, out, texArg, simpArg] = process.argv;
const TEX = Number(texArg || 512), RATIO = Number(simpArg || 0.5);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
const scene = doc.getRoot().getDefaultScene();
const tris = n => { let t = 0; n.traverse(c => { const m = c.getMesh(); if (m) m.listPrimitives().forEach(p => t += (p.getIndices()?.getCount() ?? 0) / 3); }); return t; };

// 1) Buang objek nyasar (>30 m dari rumah) & detail mungil yang berat.
let dibuang = 0;
const meshNodes = []; scene.traverse(n => { if (n.getMesh()) meshNodes.push(n); });
// Kotak pembatas mesh milik node itu sendiri (tanpa anak-anaknya), di ruang dunia.
function ownBounds(n) {
  const M = n.getWorldMatrix(); const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
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
const ownTris = n => n.getMesh().listPrimitives().reduce((t, p) => t + (p.getIndices()?.getCount() ?? 0) / 3, 0);
const cx = meshNodes.map(n => { const b = ownBounds(n); return (b.min[0] + b.max[0]) / 2; }).sort((a, b) => a - b);
const median = cx[Math.floor(cx.length / 2)];
for (const n of meshNodes) {
  const b = ownBounds(n);
  const ext = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
  const far = Math.abs((b.min[0] + b.max[0]) / 2 - median) > 30;
  const tinyHeavy = ext < 0.6 && ownTris(n) > 300;
  if (far || tinyHeavy) { n.setMesh(null); dibuang++; }
}
// 2) Material: buang garis tepi SketchUp, transparansi kaca tetap.
await doc.transform(prune(), flatten(), dedup(), weld());

// 3) Pusatkan: x,z di tengah, lantai di y=0, depan tetap +Z.
const b = getBounds(scene);
const off = [-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2];
for (const n of scene.listChildren()) {
  const t = n.getTranslation(); n.setTranslation([t[0] + off[0], t[1] + off[1], t[2] + off[2]]);
}
await doc.transform(
  join(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.002 }),
  dedup(), prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 70 }),
  reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
const bb = getBounds(scene);
await io.write(out, doc);
console.log(JSON.stringify({ out: out.split('/').pop(), dibuang, tris: Math.round(tris(scene)), w: +(bb.max[0] - bb.min[0]).toFixed(2), h: +(bb.max[1] - bb.min[1]).toFixed(2), d: +(bb.max[2] - bb.min[2]).toFixed(2) }));
