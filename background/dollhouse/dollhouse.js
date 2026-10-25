/* Dollhouse 3D tipe Okina — halaman uji.
   Model: okina-61.glb (dari source-3d DAE, dibangun tools/siteplan-3d/optimize-model.mjs 1024 1.0).
   Data ruangan, titik, dan perabot: dollhouse.json. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/OrbitControls.js/+esm';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/meshopt_decoder.module.js/+esm';

const DASAR = new URL('./', import.meta.url);
const EDIT = new URLSearchParams(location.search).has('edit');
const $ = s => document.querySelector(s);
const panggung = $('#panggung'), lapisTitik = $('#titik'), muat = $('#muat'), bar = muat.querySelector('i');

/* ── renderer, scene, kamera ─────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
panggung.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const kontrol = new OrbitControls(kamera, renderer.domElement);
kontrol.enableDamping = true; kontrol.dampingFactor = 0.08;
kontrol.maxPolarAngle = Math.PI * 0.47; kontrol.minDistance = 4; kontrol.maxDistance = 40;
kontrol.enablePan = true; kontrol.screenSpacePanning = false;

scene.add(new THREE.HemisphereLight(0xfdfbf5, 0xb9c3cf, 1.35));
const matahari = new THREE.DirectionalLight(0xfff4e0, 2.2);
matahari.position.set(9, 14, 7); matahari.castShadow = true;
matahari.shadow.mapSize.set(2048, 2048); matahari.shadow.bias = -0.0004; matahari.shadow.normalBias = 0.02;
Object.assign(matahari.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
scene.add(matahari);
const isi = new THREE.DirectionalLight(0xdfe9ff, 0.5); isi.position.set(-8, 6, -6); scene.add(isi);

// Alas lembut penangkap bayangan.
const alas = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.ShadowMaterial({ opacity: 0.18 }));
alas.rotation.x = -Math.PI / 2; alas.position.y = -0.01; alas.receiveShadow = true; scene.add(alas);

/* ── perabot sederhana ───────────────────────────────────── */
const warna = {
  kayu: 0xb98b5c, kayuTua: 0x8a6240, kain: 0x9db3c8, kainTua: 0x5d7a94, putih: 0xf3f1ec, krem: 0xe8dcc8,
  abu: 0x9aa3ad, gelap: 0x3b4252, hijau: 0x6f9c6a, pot: 0xc8b7a3, layar: 0x1d2330, merahMuda: 0xd8a7a0,
};
const mat = {}; const bahan = k => mat[k] || (mat[k] = new THREE.MeshStandardMaterial({ color: warna[k], roughness: 0.85, metalness: 0 }));
const kotak = (w, h, d, k, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bahan(k)); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; return m; };
const silinder = (r, h, k, x = 0, y = 0, z = 0, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), bahan(k)); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; return m; };
const kursi = (x, z, rot) => { const g = new THREE.Group(); g.add(kotak(.42, .05, .42, 'kayu', 0, .42), kotak(.42, .45, .05, 'kayu', 0, .47, -.185)); [-.17, .17].forEach(a => [-.17, .17].forEach(b => g.add(kotak(.04, .42, .04, 'kayuTua', a, 0, b)))); g.position.set(x, 0, z); g.rotation.y = rot; return g; };
const PERABOT = {
  bed(g) { g.add(kotak(1.7, .28, 2.1, 'kayuTua', 0, 0, 0), kotak(1.62, .22, 2.0, 'putih', 0, .28, .03), kotak(1.62, .12, 1.3, 'kain', 0, .5, .38), kotak(1.7, .9, .08, 'kayuTua', 0, 0, -1.05)); [-.42, .42].forEach(x => g.add(kotak(.6, .12, .4, 'krem', x, .5, -.75))); },
  bedsmall(g) { g.add(kotak(1.25, .28, 2.0, 'kayuTua'), kotak(1.17, .22, 1.9, 'putih', 0, .28, .03), kotak(1.17, .12, 1.25, 'kainTua', 0, .5, .35), kotak(1.25, .85, .08, 'kayuTua', 0, 0, -1.0), kotak(.6, .12, .4, 'krem', 0, .5, -.72)); },
  nightstand(g) { g.add(kotak(.5, .5, .45, 'kayu'), silinder(.12, .3, 'krem', 0, .5, 0)); },
  wardrobe(g) { g.add(kotak(1.6, 2.1, .6, 'kayu'), kotak(.02, 1.6, .02, 'gelap', .3, .3, .31), kotak(.02, 1.6, .02, 'gelap', -.3, .3, .31)); },
  sofa(g) { g.add(kotak(2.0, .4, .9, 'kainTua'), kotak(2.0, .45, .25, 'kainTua', 0, .4, -.32), kotak(.2, .25, .9, 'kainTua', -.9, .4), kotak(.2, .25, .9, 'kainTua', .9, .4), kotak(.55, .14, .5, 'kain', -.45, .4, .05), kotak(.55, .14, .5, 'kain', .45, .4, .05)); },
  coffee(g) { g.add(kotak(1.0, .04, .55, 'kayu', 0, .4), kotak(.9, .04, .45, 'kayu', 0, .15)); [-.45, .45].forEach(x => [-.22, .22].forEach(z => g.add(kotak(.04, .4, .04, 'kayuTua', x, 0, z)))); },
  tv(g) { g.add(kotak(1.6, .45, .4, 'kayu'), kotak(1.1, .62, .04, 'layar', 0, .55, -.1)); },
  dining(g) { g.add(kotak(1.4, .05, .8, 'kayu', 0, .72), kotak(.1, .72, .7, 'kayuTua', -.6, 0), kotak(.1, .72, .7, 'kayuTua', .6, 0)); g.add(kursi(-.35, .62, Math.PI), kursi(.35, .62, Math.PI), kursi(-.35, -.62, 0), kursi(.35, -.62, 0)); },
  kitchen(g) { g.add(kotak(2.4, .85, .6, 'putih'), kotak(2.4, .04, .62, 'gelap', 0, .85), kotak(2.4, .7, .35, 'kayu', 0, 1.45, -.12), kotak(.5, .06, .4, 'abu', .7, .89, 0), kotak(.44, .02, .34, 'gelap', -.6, .89, 0)); },
  fridge(g) { g.add(kotak(.7, 1.75, .7, 'abu'), kotak(.02, .5, .02, 'gelap', .25, .9, .36)); },
  toilet(g) { g.add(kotak(.4, .4, .6, 'putih', 0, 0, .05), kotak(.4, .4, .2, 'putih', 0, .4, -.2)); },
  sink(g) { g.add(kotak(.55, .8, .45, 'kayu'), kotak(.6, .08, .5, 'putih', 0, .8), silinder(.02, .2, 'abu', 0, .88, -.15, 8)); },
  shower(g) { g.add(kotak(.9, .03, .9, 'abu'), silinder(.015, 2.0, 'abu', 0, 0, -.42, 8), kotak(.18, .04, .18, 'abu', 0, 2.0, -.3)); },
  table(g) { g.add(kotak(.9, .04, .5, 'kayu', 0, .74)); [-.4, .4].forEach(x => [-.2, .2].forEach(z => g.add(kotak(.04, .74, .04, 'kayuTua', x, 0, z)))); },
  desk(g) { g.add(kotak(1.2, .04, .6, 'kayu', 0, .74), kotak(.04, .74, .55, 'kayuTua', -.56, 0), kotak(.04, .74, .55, 'kayuTua', .56, 0)); g.add(kursi(0, .45, Math.PI)); },
  car(g) { g.add(kotak(1.7, .55, 4.2, 'abu', 0, .3), kotak(1.5, .5, 2.1, 'gelap', 0, .85, -.1)); [-.75, .75].forEach(x => [-1.35, 1.35].forEach(z => { const r = silinder(.3, .2, 'gelap', x, 0, z, 16); r.rotation.z = Math.PI / 2; r.position.y = .3; g.add(r); })); },
  motor(g) { g.add(kotak(.4, .4, 1.6, 'gelap', 0, .4), kotak(.5, .15, .6, 'kainTua', 0, .75, .1)); },
  plant(g) { g.add(silinder(.2, .35, 'pot'), silinder(.4, .7, 'hijau', 0, .35, 0, 10)); },
  rug(g) { g.add(kotak(2.0, .015, 1.4, 'merahMuda')); },
};
function buatPerabot(p) {
  const g = new THREE.Group(); (PERABOT[p.jenis] || PERABOT.plant)(g);
  g.position.set(p.x, p.y || 0, p.z); g.rotation.y = THREE.MathUtils.degToRad(p.rot || 0);
  if (p.skala) g.scale.setScalar(p.skala);
  g.userData.lantai = p.lantai; return g;
}

/* ── muat model + data ───────────────────────────────────── */
const rumah = new THREE.Group(); scene.add(rumah);
const perabotGrup = new THREE.Group(); scene.add(perabotGrup);
const bahanKlip = []; // semua material yang dipotong per lantai
const bahanDinding = []; // material dinding (putih)
let bb;

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const data = await fetch(new URL('dollhouse.json', DASAR)).then(r => { if (!r.ok) throw new Error('dollhouse.json ' + r.status); return r.json(); });
const gltf = await loader.loadAsync(new URL(data.model, DASAR).href, e => { if (e.total) bar.style.width = Math.round(e.loaded / e.total * 90) + '%'; });
rumah.add(gltf.scene);
gltf.scene.traverse(o => {
  if (!o.isMesh) return;
  o.castShadow = o.receiveShadow = true;
  const ms = Array.isArray(o.material) ? o.material : [o.material];
  ms.forEach(m => {
    m.side = THREE.DoubleSide; bahanKlip.push(m);
    if (m.transparent && m.opacity < 1) { m.depthWrite = false; return; } // kaca
    // Dinding = material polos (tanpa tekstur) dan tekstur beton; warna/tekstur dibiarkan asli.
    if (!m.map || /concrete/i.test(m.name)) { m.flatShading = true; m.needsUpdate = true; bahanDinding.push(m); }
  });
});
/* Tampilan rumah utuh: hanya DINDING SAMPING (bidang yang menghadap ±x) di sisi dekat kamera yang tembus pandang.
   Tiap mesh berdinding dipecah jadi tiga: sisa (normal), samping-solid (sisi jauh), samping-tembus (sisi dekat). */
const bidang = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9); // potong horizontal per lantai
const bidangDekat = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
const bidangJauh = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e9);
const tembusGrup = new THREE.Group(); tembusGrup.visible = false; scene.add(tembusGrup);
const meshDinding = []; gltf.scene.traverse(o => { if (o.isMesh && bahanDinding.includes(o.material)) meshDinding.push(o); });
const nm = new THREE.Matrix3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), nrm = new THREE.Vector3();
for (const o of meshDinding) {
  o.updateWorldMatrix(true, false); nm.getNormalMatrix(o.matrixWorld);
  const g = o.geometry, pos = g.attributes.position, idx = g.index;
  const n = idx ? idx.count : pos.count, ambil = i => idx ? idx.getX(i) : i;
  const samping = [], sisa = [];
  for (let i = 0; i < n; i += 3) {
    const ia = ambil(i), ib = ambil(i + 1), ic = ambil(i + 2);
    pa.fromBufferAttribute(pos, ia); pb.fromBufferAttribute(pos, ib); pc.fromBufferAttribute(pos, ic);
    nrm.copy(pb).sub(pa).cross(pc.clone().sub(pa)).applyMatrix3(nm).normalize();
    (Math.abs(nrm.x) > 0.7 ? samping : sisa).push(ia, ib, ic);
  }
  if (!samping.length) continue;
  g.setIndex(sisa); // mesh asli tinggal bidang non-samping
  const gs = g.clone(); gs.setIndex(samping);
  const solid = new THREE.Mesh(gs, o.material.clone()); solid.material.clippingPlanes = [bidang, bidangJauh]; solid.material.clipShadows = true;
  solid.castShadow = solid.receiveShadow = true; bahanKlip.push(solid.material);
  const tembus = new THREE.Mesh(gs, o.material.clone()); Object.assign(tembus.material, { transparent: true, opacity: 0.18, depthWrite: false, clippingPlanes: [bidangDekat] });
  [solid, tembus].forEach(m => { m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); });
  o.parent.add(solid); tembusGrup.add(tembus);
  // tembus mengikuti transformasi dunia mesh asli
  tembus.matrixAutoUpdate = false; o.updateWorldMatrix(true, false); tembus.matrix.copy(o.matrixWorld);
}
function setTembus(aktif) { tembusGrup.visible = aktif; if (!aktif) bidangJauh.constant = 1e9; }
bb = new THREE.Box3().setFromObject(rumah);

// Perabot & titik
const pins = [];
for (const r of data.ruang || []) {
  for (const p of r.perabot || []) { const g = buatPerabot({ ...p, lantai: r.lantai, y: (p.y ?? tinggiLantai(r.lantai)) }); perabotGrup.add(g); }
  (r.titik || []).forEach((t, i) => pins.push({ ruang: r, idx: i, pos: new THREE.Vector3(t.x, t.y ?? tinggiLantai(r.lantai) + 1.1, t.z), el: null }));
}
perabotGrup.traverse(o => { if (o.isMesh) bahanKlip.push(o.material); });
pins.forEach((p, n) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pin';
  b.innerHTML = `<b>${n + 1}</b><span>${p.ruang.nama}</span>`;
  b.addEventListener('click', () => bukaKotak(p.ruang, p.idx));
  lapisTitik.appendChild(b); p.el = b;
});
function tinggiLantai(n) { const l = (data.lantai || []).find(l => l.nomor === n); return l ? l.y : 0; }

/* ── lantai aktif & pemotongan ───────────────────────────── */
let lantaiAktif = 1;
function setLantai(n, animasi = true) {
  lantaiAktif = n;
  const l = (data.lantai || []).find(l => l.nomor === n);
  const tinggi = l ? l.y + l.potong : Infinity;
  bidang.constant = isFinite(tinggi) ? tinggi : 1e9;
  bahanKlip.forEach(m => { if (!m.clippingPlanes || m.clippingPlanes.length < 2) m.clippingPlanes = [bidang]; m.clipShadows = true; m.needsUpdate = true; });
  perabotGrup.children.forEach(g => { g.visible = n === 0 || g.userData.lantai === n; });
  setTembus(n === 0);
  document.querySelectorAll('.lantai button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lantai === n)));
  const pusatY = l ? l.y + 1.0 : (bb.min.y + bb.max.y) / 2;
  const target = new THREE.Vector3((bb.min.x + bb.max.x) / 2, pusatY, (bb.min.z + bb.max.z) / 2);
  // Kamera ikut naik/turun sebesar selisih target supaya sudut pandang tetap.
  const posisi = kamera.position.clone().add(target.clone().sub(kontrol.target));
  if (animasi) animasiTarget(target, posisi); else { kontrol.target.copy(target); kamera.position.copy(posisi); }
}
let anim = null;
function animasiTarget(ke, posKe) { anim = { dari: kontrol.target.clone(), ke, posDari: kamera.position.clone(), posKe, t: 0 }; }
document.querySelectorAll('.lantai button').forEach(b => b.addEventListener('click', () => setLantai(+b.dataset.lantai)));

/* ── kamera awal ─────────────────────────────────────────── */
const lebar = bb.max.x - bb.min.x, dalam = bb.max.z - bb.min.z;
kamera.position.set(bb.max.x + lebar * 0.9, 9.5, bb.max.z + dalam * 0.55);
setLantai(1, false);
kontrol.update();

/* ── lightbox ────────────────────────────────────────────── */
const kotakEl = $('#kotak'), img = kotakEl.querySelector('img'), judul = kotakEl.querySelector('figcaption b'), ket = kotakEl.querySelector('figcaption span');
let kotakRuang = null, kotakIdx = 0;
function bukaKotak(r, i) { kotakRuang = r; kotakIdx = i; isiKotak(); kotakEl.classList.add('buka'); }
function isiKotak() { const t = kotakRuang.titik[kotakIdx]; img.src = new URL(t.gambar, DASAR).href; img.alt = t.judul || kotakRuang.nama; judul.textContent = kotakRuang.nama; ket.textContent = t.judul || `Sudut ${kotakIdx + 1} dari ${kotakRuang.titik.length}`; }
function geserKotak(d) { if (!kotakRuang) return; kotakIdx = (kotakIdx + d + kotakRuang.titik.length) % kotakRuang.titik.length; isiKotak(); }
kotakEl.querySelector('.tutup').addEventListener('click', () => kotakEl.classList.remove('buka'));
kotakEl.querySelector('.kiri').addEventListener('click', () => geserKotak(-1));
kotakEl.querySelector('.kanan').addEventListener('click', () => geserKotak(1));
kotakEl.addEventListener('click', e => { if (e.target === kotakEl) kotakEl.classList.remove('buka'); });
addEventListener('keydown', e => { if (!kotakEl.classList.contains('buka')) return; if (e.key === 'Escape') kotakEl.classList.remove('buka'); if (e.key === 'ArrowLeft') geserKotak(-1); if (e.key === 'ArrowRight') geserKotak(1); });

/* ── editor ──────────────────────────────────────────────── */
if (EDIT) {
  const ed = $('#editor'), log = $('#ed-log'), info = $('#ed-info'); ed.classList.add('buka');
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let turun = null;
  renderer.domElement.addEventListener('pointerdown', e => { turun = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!turun || Math.hypot(e.clientX - turun[0], e.clientY - turun[1]) > 4) return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, kamera);
    const hit = ray.intersectObjects([rumah, perabotGrup], true).find(h => bidang.distanceToPoint(h.point) >= -1e-3 || lantaiAktif === 0);
    if (!hit) { info.textContent = 'tidak kena model'; return; }
    const p = hit.point; const s = `{ "x": ${p.x.toFixed(2)}, "y": ${p.y.toFixed(2)}, "z": ${p.z.toFixed(2)} }`;
    info.textContent = `lantai ${lantaiAktif} · ${s}`; log.value += s + ',\n';
  });
  $('#ed-salin').addEventListener('click', () => navigator.clipboard.writeText(log.value));
  $('#ed-hapus').addEventListener('click', () => { log.value = ''; });
  window.DH = { scene, kamera, kontrol, rumah, bb, data, setLantai, THREE, bidang };
}

/* ── loop ────────────────────────────────────────────────── */
function ukur() { const w = panggung.clientWidth, h = panggung.clientHeight; renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix(); }
addEventListener('resize', ukur); ukur();
const v = new THREE.Vector3();
function gambar() {
  requestAnimationFrame(gambar);
  if (anim) { anim.t = Math.min(1, anim.t + 0.05); const e = 1 - Math.pow(1 - anim.t, 3); kontrol.target.lerpVectors(anim.dari, anim.ke, e); kamera.position.lerpVectors(anim.posDari, anim.posKe, e); if (anim.t >= 1) anim = null; }
  kontrol.update();
  if (lantaiAktif === 0) {
    const cx = (bb.min.x + bb.max.x) / 2, sisi = kamera.position.x >= cx ? 1 : -1;
    bidangDekat.normal.set(sisi, 0, 0); bidangDekat.constant = -sisi * cx;  // sisa: dinding samping dekat kamera (tembus)
    bidangJauh.normal.set(-sisi, 0, 0); bidangJauh.constant = sisi * cx;    // sisa: dinding samping jauh (solid)
  }
  renderer.render(scene, kamera);
  const w = innerWidth, h = innerHeight;
  for (const p of pins) {
    const tampak = p.ruang.lantai === lantaiAktif; // tampilan rumah utuh tanpa titik supaya tidak menembus dinding
    if (!tampak) { p.el.classList.remove('tampak'); continue; }
    v.copy(p.pos).project(kamera);
    if (v.z > 1) { p.el.classList.remove('tampak'); continue; }
    p.el.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
    p.el.classList.add('tampak');
  }
}
gambar();
bar.style.width = '100%'; setTimeout(() => muat.classList.add('sembunyi'), 150);
