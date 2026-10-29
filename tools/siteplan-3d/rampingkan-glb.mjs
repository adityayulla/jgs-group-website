// rampingkan-glb.mjs — model OBJ desainer (Tentrem Bhumi) yang terlalu berat, sebelum optimize-model.mjs.
//   node rampingkan-glb.mjs raw.glb ramping.glb
// 1) buang vegetasi (pohon/kaktus/daun): material Vegetation_*, Trunk*, Leaf*, dan node bernama komponen tanaman
//    (Cantya A_Leave + bunga FLOW1.., Bhama flower1-3, Andrawina Kebun_3D___Solobium_Parahyba) — env BUANG_NODE
// 2) sederhanakan keras primitive bermaterial berat (genteng 3D "_14", sofa, gorden, FrontColor, dst.).
//    Ekspor OBJ membuat tiap segitiga punya verteks sendiri (UV/normal beda), sehingga simplify tidak bisa
//    menggabung apa pun. Maka untuk material berat: tekstur diganti warna rata-ratanya, NORMAL & UV dibuang,
//    verteks dilas per posisi, lalu disederhanakan. Tanpa tekstur, dollhouse.js memakai flat shading (tanpa normal).
//    BERAT (env, regex nama material) dan RASIO/ERROR bisa diganti lewat env.
//    BERAT_NODE (env, regex nama node): komponen perabot berat (mis. set meja makan Mizu 197 ribu segitiga)
//    diperlakukan sama, dengan salinan materialnya sendiri supaya bagian lain tetap bertekstur.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, prune, simplifyPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptSimplifier.ready;
const [,, inp, out] = process.argv;
const BUANG = new RegExp(process.env.BUANG || '^(Vegetation_|Trunk|Leaf|Fig\\d)', 'i');
const BERAT = new RegExp(process.env.BERAT || '^(_14|swedese|curtain|CONFORT|FrontColor)', 'i');
const BUANG_NODE = new RegExp(process.env.BUANG_NODE || '(A_Leave|\\bflower\\d|\\bFLOW\\d|Kebun_3D|Solobium)', 'i');
const BERAT_NODE = process.env.BERAT_NODE ? new RegExp(process.env.BERAT_NODE, 'i') : null;
const RASIO = Number(process.env.RASIO || 0.1), ERROR = Number(process.env.ERROR || 0.03);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const tri = p => (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
let dibuang = 0, sebelum = 0, sesudah = 0;
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
  const nama = p.getMaterial()?.getName() || '';
  if (p.getMode() !== 4) { m.removePrimitive(p); p.dispose(); continue; } // garis tepi SketchUp (OBJ "l") — tampak sebagai serpihan melayang
  if (BUANG.test(nama)) { dibuang += tri(p); m.removePrimitive(p); p.dispose(); }
}
// SketchUp mengabaikan warna Kd bila material bertekstur, tapi OBJ→glTF mengalikannya (Kd 0 = hitam pekat): jadikan putih.
for (const mat of doc.getRoot().listMaterials()) if (mat.getBaseColorTexture()) { const f = mat.getBaseColorFactor(); mat.setBaseColorFactor([1, 1, 1, f[3]]); }
const beratMat = doc.getRoot().listMaterials().filter(m => BERAT.test(m.getName()));
const salinan = new Map(), beratPrim = new Set();
if (BERAT_NODE) for (const n of doc.getRoot().listNodes()) {
  const m = n.getMesh(); if (!m || !BERAT_NODE.test(n.getName())) continue;
  for (const p of m.listPrimitives()) {
    const asal = p.getMaterial(); if (!asal || beratMat.includes(asal)) continue;
    if (!salinan.has(asal)) salinan.set(asal, asal.clone().setName(asal.getName() + '_ramping'));
    p.setMaterial(salinan.get(asal)); beratPrim.add(p);
  }
}
beratMat.push(...salinan.values());
for (const mat of beratMat) {
  const tex = mat.getBaseColorTexture();
  if (tex) {
    const { channels } = await sharp(Buffer.from(tex.getImage())).stats();
    const f = mat.getBaseColorFactor(), lin = c => Math.pow(c / 255, 2.2);
    mat.setBaseColorFactor([lin(channels[0].mean) * f[0], lin(channels[1].mean) * f[1], lin(channels[2].mean) * f[2], f[3]]);
    mat.setBaseColorTexture(null);
  }
}
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
  if (!beratMat.includes(p.getMaterial())) continue;
  for (const sem of p.listSemantics()) if (sem !== 'POSITION') p.setAttribute(sem, null);
}
for (const n of doc.getRoot().listNodes()) {
  const m = n.getMesh(); if (!m || !BUANG_NODE.test(n.getName())) continue;
  m.listPrimitives().forEach(p => { dibuang += tri(p); }); n.setMesh(null);
}
await doc.transform(weld());
for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) {
  if (!(beratMat.includes(p.getMaterial()) || beratPrim.has(p)) || tri(p) < 200) continue;
  sebelum += tri(p); simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: RASIO, error: ERROR }); sesudah += tri(p);
}
await doc.transform(prune());
await io.write(out, doc);
console.log(JSON.stringify({ out, vegetasiDibuang: Math.round(dibuang), berat: [Math.round(sebelum), Math.round(sesudah)] }));
