// buang-pohon.mjs — buang pohon kamboja taman depan dari GLB SketchUp (Yuri 1). Cetak node material wood1/frangipani*;
// dengan argumen keluaran + KOTAK='[x0,z0]' (koordinat SUMBER, sebelum dipusatkan) membuang node yang seluruhnya di x<x0 dan z>z0.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
const [,, inp, out] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp); const scene = doc.getRoot().getDefaultScene();
const sb = getBounds(scene); console.log('scene', sb.min.map(v=>+v.toFixed(2)), sb.max.map(v=>+v.toFixed(2)));
const kandidat = [];
scene.traverse(n => { const m = n.getMesh(); if (!m) return; const names = m.listPrimitives().map(p => p.getMaterial()?.getName() || '');
  if (!names.some(x => /^wood1$|^frangipani/.test(x))) return;
  const M = n.getWorldMatrix(); let min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9], v=0;
  for (const p of m.listPrimitives()) { const a = p.getAttribute('POSITION'); v += a.getCount(); const lo=a.getMin([]), hi=a.getMax([]);
    for (let i=0;i<8;i++){ const q=[i&1?hi[0]:lo[0], i&2?hi[1]:lo[1], i&4?hi[2]:lo[2]]; const w=[0,1,2].map(r=>M[r]*q[0]+M[r+4]*q[1]+M[r+8]*q[2]+M[r+12]); for(let k=0;k<3;k++){min[k]=Math.min(min[k],w[k]);max[k]=Math.max(max[k],w[k]);} } }
  kandidat.push({ n, names: [...new Set(names)], v, min, max }); });
kandidat.sort((a,b)=>b.v-a.v).slice(0,8).forEach(k=>console.log(k.names.join(','), k.v, k.min.map(x=>+x.toFixed(2)), k.max.map(x=>+x.toFixed(2))));
if (out) {
  const [x0,z0] = JSON.parse(process.env.KOTAK); let b=0; // buang node yang seluruhnya di x < x0 dan z > z0 (dunia)
  for (const k of kandidat) if (k.max[0] < x0 && k.min[2] > z0) { k.n.setMesh(null); b++; }
  console.log('dibuang', b); await io.write(out, doc);
}
