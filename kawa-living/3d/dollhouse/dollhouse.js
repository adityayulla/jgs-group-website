/* Dollhouse 3D unit Kawa Living — modul viewer.
   Dipakai dua tempat: (1) kartu Detail Unit di kawa-living/index.html lewat import() saat tombol
   "Jelajah 3D" ditekan, (2) halaman uji kawa-living/3d/dollhouse/ (mode editor ?edit=1 dan mode
   kamera ?kamera=N untuk gambar acuan render).
   Model <tipe>.glb (dari DAE SketchUp, dibangun tools/siteplan-3d/optimize-model.mjs 1024 1.0),
   data ruangan/titik/perabot <tipe>.json, render per titik img/<tipe>/NN.webp — semua di folder ini.

   mulai(wadah, tipe, opsi) → Promise<{ data, hancur() }>
     wadah : elemen kosong (position: relative) yang diisi canvas + UI
     tipe  : slug, mis. "hiroi-yuri-42" → memuat hiroi-yuri-42.json
     opsi  : { edit: true } mode editor (window.DH), { kamera: N } pandangan dari titik ke-N tanpa UI */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/OrbitControls.js/+esm';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/meshopt_decoder.module.js/+esm';

const DASAR = new URL('./', import.meta.url);
const SENTUH = matchMedia('(hover: none)').matches;

/* ── gaya: disuntik sekali, semua selektor di bawah .dh ──── */
const CSS = `
.dh{position:absolute;inset:0;overflow:hidden;background:radial-gradient(120% 90% at 50% 10%,#f6f8fb 0%,#dfe6ef 55%,#c9d4e2 100%);color:#15203b;font-family:inherit;font-size:16px;line-height:1.45;color-scheme:light;user-select:none;-webkit-user-select:none}
.dh *{box-sizing:border-box}
.dh__panggung{position:absolute;inset:0}
.dh__panggung canvas{display:block;width:100%;height:100%;touch-action:none;outline:0}
.dh__titik{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
.dh__pin{position:absolute;left:0;top:0;transform:translate(-50%,-50%);pointer-events:auto;appearance:none;border:0;background:transparent;padding:0;cursor:pointer;display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .25s;font:inherit}
.dh__pin.tampak{opacity:1}
.dh__pin b{width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid #1b2a64;display:grid;place-items:center;color:#1b2a64;font-size:12px;font-weight:700;box-shadow:0 6px 16px -4px rgba(15,23,51,.5);position:relative}
.dh__pin b::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(27,42,100,.45);animation:dhDenyut 2s ease-out infinite}
@keyframes dhDenyut{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.35);opacity:0}}
.dh__pin span{display:none;font-size:12px;font-weight:600;color:#15203b;background:rgba(255,255,255,.88);padding:4px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 6px 16px -8px rgba(15,23,51,.5)}
@media (hover:hover){.dh__pin:hover span,.dh__pin:focus-visible span{display:inline}}
.dh__pin:hover b,.dh__pin:focus-visible b{background:#1b2a64;color:#fff}
.dh__lantai{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:3;display:flex;gap:3px;background:rgba(255,255,255,.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.9);border-radius:999px;padding:3px;box-shadow:0 18px 40px -18px rgba(15,23,51,.45);max-width:calc(100% - 24px)}
.dh__lantai button{appearance:none;border:0;background:transparent;font:inherit;font-weight:600;font-size:13px;color:#4a5470;padding:7px 13px;border-radius:999px;cursor:pointer;white-space:nowrap}
.dh__lantai button[aria-pressed="true"]{background:#1b2a64;color:#fff}
.dh__petunjuk{position:absolute;left:12px;top:12px;z-index:3;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(21,32,59,.72);background:rgba(255,255,255,.65);padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);pointer-events:none;max-width:calc(100% - 24px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dh__muat{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:#e9eef4;transition:opacity .5s}
.dh__muat.sembunyi{opacity:0;pointer-events:none}
.dh__muat div{width:min(220px,60%);height:3px;background:rgba(27,42,100,.15);border-radius:3px;overflow:hidden}
.dh__muat i{display:block;height:100%;width:0;background:#1b2a64;transition:width .2s}
.dh--kamera .dh__lantai,.dh--kamera .dh__petunjuk,.dh--kamera .dh__titik,.dh--kamera .dh__editor{display:none}
.dh__editor{position:absolute;left:12px;bottom:64px;z-index:4;width:min(360px,calc(100% - 24px));background:rgba(255,255,255,.92);border:1px solid #e2dfd6;border-radius:14px;padding:12px;font-size:12px;display:flex;flex-direction:column;gap:8px;max-height:50%}
.dh__editor textarea{width:100%;flex:1;min-height:120px;font:11px/1.4 ui-monospace,Menlo,monospace;border:1px solid #e2dfd6;border-radius:8px;padding:8px;resize:vertical}
.dh__editor .baris{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.dh__editor button{font:inherit;font-weight:600;border:1px solid #e2dfd6;background:#fff;border-radius:8px;padding:5px 9px;cursor:pointer}
/* lightbox render ruangan: satu untuk seluruh halaman, menempel di body */
.dh-kotak{position:fixed;inset:0;z-index:10000;background:rgba(10,16,38,.88);display:none;align-items:center;justify-content:center;padding:16px;font-family:inherit}
.dh-kotak.buka{display:flex}
.dh-kotak figure{margin:0;max-width:min(1100px,100%);width:100%;display:flex;flex-direction:column;gap:12px;align-items:center}
.dh-kotak img{max-width:100%;max-height:72vh;border-radius:14px;box-shadow:0 40px 80px -30px rgba(0,0,0,.8);background:#223}
.dh-kotak figcaption{color:#fff;text-align:center;display:flex;flex-direction:column;gap:2px}
.dh-kotak figcaption b{font-weight:600;font-size:20px}
.dh-kotak figcaption span{font-size:13px;color:rgba(255,255,255,.75)}
.dh-kotak button{position:absolute;appearance:none;border:0;background:rgba(255,255,255,.14);color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer;display:grid;place-items:center;line-height:1}
.dh-kotak .tutup{right:16px;top:calc(16px + env(safe-area-inset-top))}
.dh-kotak .nav{top:50%;transform:translateY(-50%)}
.dh-kotak .kiri{left:12px}.dh-kotak .kanan{right:12px}
`;
function pasangCSS() {
  if (document.getElementById('dh-css')) return;
  const s = document.createElement('style'); s.id = 'dh-css'; s.textContent = CSS; document.head.appendChild(s);
}
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ── lightbox bersama ────────────────────────────────────── */
let kotak = null;
function siapkanKotak() {
  if (kotak) return kotak;
  const root = el('div', 'dh-kotak',
    '<button type="button" class="tutup" aria-label="Tutup">×</button>' +
    '<button type="button" class="nav kiri" aria-label="Sebelumnya">‹</button>' +
    '<figure><img alt=""><figcaption><b></b><span></span></figcaption></figure>' +
    '<button type="button" class="nav kanan" aria-label="Berikutnya">›</button>');
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Gambar ruangan');
  document.body.appendChild(root);
  const img = root.querySelector('img'), judul = root.querySelector('figcaption b'), ket = root.querySelector('figcaption span');
  const kiri = root.querySelector('.kiri'), kanan = root.querySelector('.kanan');
  let ruang = null, idx = 0;
  const isi = () => {
    const t = ruang.titik[idx];
    img.src = new URL(t.gambar, DASAR).href; img.alt = t.judul || ruang.nama;
    judul.textContent = ruang.nama; ket.textContent = t.judul || `Sudut ${idx + 1} dari ${ruang.titik.length}`;
    kiri.style.display = kanan.style.display = ruang.titik.length > 1 ? '' : 'none';
  };
  const tutup = () => { root.classList.remove('buka'); img.removeAttribute('src'); };
  const geser = d => { if (!ruang) return; idx = (idx + d + ruang.titik.length) % ruang.titik.length; isi(); };
  root.querySelector('.tutup').addEventListener('click', tutup);
  kiri.addEventListener('click', () => geser(-1)); kanan.addEventListener('click', () => geser(1));
  root.addEventListener('click', e => { if (e.target === root) tutup(); });
  addEventListener('keydown', e => {
    if (!root.classList.contains('buka')) return;
    if (e.key === 'Escape') tutup(); if (e.key === 'ArrowLeft') geser(-1); if (e.key === 'ArrowRight') geser(1);
  });
  kotak = { buka(r, i) { ruang = r; idx = i; isi(); root.classList.add('buka'); } };
  return kotak;
}

/* ── perabot sederhana (penanda tata letak) ──────────────── */
const warna = {
  kayu: 0xb98b5c, kayuTua: 0x8a6240, kain: 0x9db3c8, kainTua: 0x5d7a94, putih: 0xf3f1ec, krem: 0xe8dcc8,
  abu: 0x9aa3ad, gelap: 0x3b4252, hijau: 0x6f9c6a, pot: 0xc8b7a3, layar: 0x1d2330, merahMuda: 0xd8a7a0,
};
function buatPabrikPerabot() {
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
  return p => {
    const g = new THREE.Group(); (PERABOT[p.jenis] || PERABOT.plant)(g);
    g.position.set(p.x, p.y || 0, p.z); g.rotation.y = THREE.MathUtils.degToRad(p.rot || 0);
    if (p.skala) g.scale.setScalar(p.skala);
    g.userData.lantai = p.lantai; return g;
  };
}

/* ── viewer ──────────────────────────────────────────────── */
export async function mulai(wadah, tipe, opsi = {}) {
  pasangCSS();
  const slug = String(tipe || 'okina-61').replace(/[^a-z0-9-]/g, '');
  const EDIT = !!opsi.edit, KAMERA = Number(opsi.kamera || 0);

  /* DOM */
  wadah.innerHTML = '';
  const akar = el('div', 'dh' + (KAMERA > 0 ? ' dh--kamera' : ''));
  const panggung = el('div', 'dh__panggung');
  panggung.setAttribute('role', 'application'); panggung.setAttribute('aria-label', 'Model 3D rumah. Seret untuk memutar, ketuk titik untuk melihat ruangan.');
  const lapisTitik = el('div', 'dh__titik'); lapisTitik.setAttribute('aria-live', 'polite');
  const petunjuk = el('div', 'dh__petunjuk', SENTUH ? 'Dua jari = putar & zoom · Ketuk titik' : 'Seret = putar · Klik lalu scroll = zoom · Klik titik');
  const lantaiEl = el('div', 'dh__lantai'); lantaiEl.setAttribute('role', 'group'); lantaiEl.setAttribute('aria-label', 'Pilih lantai');
  const muat = el('div', 'dh__muat', '<div><i></i></div>'); const bar = muat.querySelector('i');
  akar.append(panggung, lapisTitik, petunjuk, lantaiEl, muat);
  wadah.appendChild(akar);

  /* renderer, scene, kamera */
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
  // Mouse: scroll di atas kanvas baru men-zoom setelah pengunjung mengklik kanvas, supaya scroll halaman tidak tersangkut.
  if (!SENTUH && !EDIT && KAMERA === 0) {
    kontrol.enableZoom = false;
    renderer.domElement.addEventListener('pointerdown', () => { kontrol.enableZoom = true; });
    renderer.domElement.addEventListener('pointerleave', () => { kontrol.enableZoom = false; });
  }
  // Layar sentuh: satu jari tetap menggulir halaman (viewer tampil otomatis di kartu), dua jari memutar + zoom.
  if (SENTUH && !EDIT) { kontrol.touches.ONE = -1; kontrol.touches.TWO = THREE.TOUCH.DOLLY_ROTATE; renderer.domElement.style.touchAction = 'pan-y'; }

  scene.add(new THREE.HemisphereLight(0xfdfbf5, 0xb9c3cf, 1.35));
  const matahari = new THREE.DirectionalLight(0xfff4e0, 2.2);
  matahari.position.set(9, 14, 7); matahari.castShadow = true;
  matahari.shadow.mapSize.set(2048, 2048); matahari.shadow.bias = -0.0004; matahari.shadow.normalBias = 0.02;
  Object.assign(matahari.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  scene.add(matahari);
  const isi = new THREE.DirectionalLight(0xdfe9ff, 0.5); isi.position.set(-8, 6, -6); scene.add(isi);
  const alas = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.ShadowMaterial({ opacity: 0.18 }));
  alas.rotation.x = -Math.PI / 2; alas.position.y = -0.01; alas.receiveShadow = true; scene.add(alas);

  /* model + data */
  const rumah = new THREE.Group(); scene.add(rumah);
  const perabotGrup = new THREE.Group(); scene.add(perabotGrup);
  const bahanKlip = [], bahanDinding = [];
  const JSON_TIPE = slug + '.json';
  const data = await fetch(new URL(JSON_TIPE, DASAR)).then(r => { if (!r.ok) throw new Error(JSON_TIPE + ' ' + r.status); return r.json(); });
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(new URL(data.model, DASAR).href, e => { if (e.total) bar.style.width = Math.round(e.loaded / e.total * 90) + '%'; });
  rumah.add(gltf.scene);
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach(m => {
      m.side = THREE.DoubleSide; bahanKlip.push(m);
      if (m.transparent && m.opacity < 1) { m.depthWrite = false; return; } // kaca
      if (!m.map || /concrete/i.test(m.name)) { m.flatShading = true; m.needsUpdate = true; bahanDinding.push(m); }
    });
  });
  /* Rumah utuh: hanya dinding samping (bidang ±x) di sisi dekat kamera yang tembus pandang.
     Tiap mesh berdinding dipecah: sisa (normal), samping-solid (sisi jauh), samping-tembus (sisi dekat). */
  const bidang = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9);
  const bidangDekat = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const bidangJauh = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e9);
  const tembusGrup = new THREE.Group(); tembusGrup.visible = false; scene.add(tembusGrup);
  const meshDinding = []; gltf.scene.traverse(o => { if (o.isMesh && bahanDinding.includes(o.material)) meshDinding.push(o); });
  const nm = new THREE.Matrix3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), nrm = new THREE.Vector3(), ab = new THREE.Vector3();
  for (const o of meshDinding) {
    o.updateWorldMatrix(true, false); nm.getNormalMatrix(o.matrixWorld);
    const g = o.geometry, pos = g.attributes.position, idx = g.index;
    const n = idx ? idx.count : pos.count, ambil = i => idx ? idx.getX(i) : i;
    const samping = [], sisa = [];
    for (let i = 0; i < n; i += 3) {
      const ia = ambil(i), ib = ambil(i + 1), ic = ambil(i + 2);
      pa.fromBufferAttribute(pos, ia); pb.fromBufferAttribute(pos, ib); pc.fromBufferAttribute(pos, ic);
      nrm.copy(pb).sub(pa).cross(ab.copy(pc).sub(pa)).applyMatrix3(nm).normalize();
      (Math.abs(nrm.x) > 0.7 ? samping : sisa).push(ia, ib, ic);
    }
    if (!samping.length) continue;
    g.setIndex(sisa);
    const gs = g.clone(); gs.setIndex(samping);
    const solid = new THREE.Mesh(gs, o.material.clone()); solid.material.clippingPlanes = [bidang, bidangJauh]; solid.material.clipShadows = true;
    solid.castShadow = solid.receiveShadow = true; bahanKlip.push(solid.material);
    const tembus = new THREE.Mesh(gs, o.material.clone()); Object.assign(tembus.material, { transparent: true, opacity: 0.18, depthWrite: false, clippingPlanes: [bidangDekat] });
    [solid, tembus].forEach(m => { m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); });
    o.parent.add(solid); tembusGrup.add(tembus);
    tembus.matrixAutoUpdate = false; o.updateWorldMatrix(true, false); tembus.matrix.copy(o.matrixWorld);
  }
  const setTembus = aktif => { tembusGrup.visible = aktif; if (!aktif) bidangJauh.constant = 1e9; };
  const bb = new THREE.Box3().setFromObject(rumah);

  /* perabot & titik */
  const tinggiLantai = n => { const l = (data.lantai || []).find(l => l.nomor === n); return l ? l.y : 0; };
  const buatPerabot = buatPabrikPerabot();
  const pins = []; const kotakBersama = siapkanKotak();
  for (const r of data.ruang || []) {
    for (const p of r.perabot || []) perabotGrup.add(buatPerabot({ ...p, lantai: r.lantai, y: (p.y ?? tinggiLantai(r.lantai)) }));
    (r.titik || []).forEach((t, i) => pins.push({ ruang: r, idx: i, pos: new THREE.Vector3(t.x, t.y ?? tinggiLantai(r.lantai) + 1.1, t.z), el: null }));
  }
  perabotGrup.traverse(o => { if (o.isMesh) bahanKlip.push(o.material); });
  pins.forEach((p, n) => {
    const b = el('button', 'dh__pin', `<b>${n + 1}</b><span>${p.ruang.nama}</span>`); b.type = 'button';
    b.setAttribute('aria-label', 'Lihat ' + p.ruang.nama);
    b.addEventListener('click', () => kotakBersama.buka(p.ruang, p.idx));
    lapisTitik.appendChild(b); p.el = b;
  });

  /* lantai aktif & pemotongan */
  const daftarLantai = (data.lantai || []).map(l => l.nomor).sort();
  [[0, 'Rumah utuh'], ...daftarLantai.map(n => [n, 'Lantai ' + n])].forEach(([n, teks]) => {
    const b = el('button', null, teks); b.type = 'button'; b.dataset.lantai = n; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => setLantai(n)); lantaiEl.appendChild(b);
  });
  let lantaiAktif = 1, anim = null;
  function setLantai(n, animasi = true) {
    lantaiAktif = n;
    const l = (data.lantai || []).find(l => l.nomor === n);
    const tinggi = l ? l.y + l.potong : Infinity;
    bidang.constant = isFinite(tinggi) ? tinggi : 1e9;
    bahanKlip.forEach(m => { if (!m.clippingPlanes || m.clippingPlanes.length < 2) m.clippingPlanes = [bidang]; m.clipShadows = true; m.needsUpdate = true; });
    perabotGrup.children.forEach(g => { g.visible = n === 0 || g.userData.lantai === n; });
    setTembus(n === 0);
    lantaiEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lantai === n)));
    const pusatY = l ? l.y + 1.0 : (bb.min.y + bb.max.y) / 2;
    const target = new THREE.Vector3((bb.min.x + bb.max.x) / 2, pusatY, (bb.min.z + bb.max.z) / 2);
    const posisi = kamera.position.clone().add(target.clone().sub(kontrol.target));
    if (animasi) anim = { dari: kontrol.target.clone(), ke: target, posDari: kamera.position.clone(), posKe: posisi, t: 0 };
    else { kontrol.target.copy(target); kamera.position.copy(posisi); }
  }

  /* kamera awal */
  // Tampilan awal: Rumah utuh dilihat dari depan (+z) agak serong kanan dan sedikit dari atas, supaya fasad
  // terlihat utuh. Jarak dipaskan ke bola pembungkus rumah dan rasio wadah (kartu Detail Unit, termasuk HP).
  const lebar = bb.max.x - bb.min.x, dalam = bb.max.z - bb.min.z, tinggi = bb.max.y - bb.min.y;
  setLantai(0, false);
  {
    const asp = Math.max(0.5, (wadah.clientWidth || 3) / (wadah.clientHeight || 2));
    const r = 0.5 * Math.hypot(lebar, dalam, tinggi);
    const jarak = Math.min(kontrol.maxDistance, r / Math.sin(THREE.MathUtils.degToRad(kamera.fov / 2)) / Math.min(1, asp) * 1.0);
    const arah = new THREE.Vector3(0.32, 0.36, 1).normalize();
    kontrol.target.y = bb.min.y + tinggi * 0.4; // fokus agak bawah: halaman depan & carport ikut masuk, ada ruang untuk tombol lantai
    kamera.position.copy(kontrol.target).addScaledVector(arah, jarak);
  }
  kontrol.update();
  if (KAMERA > 0 && pins[KAMERA - 1]) {
    const p = pins[KAMERA - 1], t = p.ruang.titik[p.idx], y0 = tinggiLantai(p.ruang.lantai);
    setLantai(0, false); setTembus(false); lantaiAktif = -1; // rumah utuh, solid, tanpa pin
    kamera.fov = 62; kamera.updateProjectionMatrix();
    const k = t.kamera || {}, lihat = t.lihat || { x: t.x, z: t.z - 1 };
    kamera.position.set(k.x ?? t.x, k.y ?? y0 + 1.5, k.z ?? t.z);
    kontrol.target.set(lihat.x, lihat.y ?? y0 + 1.3, lihat.z); kontrol.minDistance = 0.2; kontrol.update();
  }

  /* editor */
  if (EDIT) {
    const ed = el('div', 'dh__editor',
      '<div class="baris"><b>Mode editor</b> — klik lantai/perabot untuk mengambil koordinat. <button type="button" class="salin">Salin</button><button type="button" class="hapus">Kosongkan</button></div>' +
      '<div class="baris info">—</div><textarea readonly placeholder="koordinat muncul di sini"></textarea>');
    akar.appendChild(ed);
    const log = ed.querySelector('textarea'), info = ed.querySelector('.info');
    const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let turun = null;
    renderer.domElement.addEventListener('pointerdown', e => { turun = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (!turun || Math.hypot(e.clientX - turun[0], e.clientY - turun[1]) > 4) return;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, kamera);
      const hit = ray.intersectObjects([rumah, perabotGrup], true).find(h => bidang.distanceToPoint(h.point) >= -1e-3 || lantaiAktif === 0);
      if (!hit) { info.textContent = 'tidak kena model'; return; }
      const p = hit.point; const s = `{ "x": ${p.x.toFixed(2)}, "y": ${p.y.toFixed(2)}, "z": ${p.z.toFixed(2)} }`;
      info.textContent = `lantai ${lantaiAktif} · ${s}`; log.value += s + ',\n';
    });
    ed.querySelector('.salin').addEventListener('click', () => navigator.clipboard.writeText(log.value));
    ed.querySelector('.hapus').addEventListener('click', () => { log.value = ''; });
    window.DH = { scene, kamera, kontrol, rumah, bb, data, setLantai, THREE, bidang, renderer, pins };
  }

  /* ukuran & loop; berhenti menggambar saat tidak terlihat di layar */
  let lebarPx = 0, tinggiPx = 0, hidup = true, terlihat = true, raf = 0;
  function ukur() {
    const w = wadah.clientWidth, h = wadah.clientHeight; if (!w || !h) return;
    lebarPx = w; tinggiPx = h; renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(ukur); ro.observe(wadah); ukur();
  const io = new IntersectionObserver(([e]) => { terlihat = e.isIntersecting; if (terlihat && hidup && !raf) raf = requestAnimationFrame(gambar); }, { threshold: 0 });
  io.observe(wadah);
  const v = new THREE.Vector3();
  function gambar() {
    raf = 0; if (!hidup) return;
    if (!terlihat) return; // IntersectionObserver menghidupkan lagi
    raf = requestAnimationFrame(gambar);
    if (anim) { anim.t = Math.min(1, anim.t + 0.05); const e = 1 - Math.pow(1 - anim.t, 3); kontrol.target.lerpVectors(anim.dari, anim.ke, e); kamera.position.lerpVectors(anim.posDari, anim.posKe, e); if (anim.t >= 1) anim = null; }
    kontrol.update();
    if (lantaiAktif === 0) {
      const cx = (bb.min.x + bb.max.x) / 2, sisi = kamera.position.x >= cx ? 1 : -1;
      bidangDekat.normal.set(sisi, 0, 0); bidangDekat.constant = -sisi * cx;
      bidangJauh.normal.set(-sisi, 0, 0); bidangJauh.constant = sisi * cx;
    }
    renderer.render(scene, kamera);
    // Damping membuat posisi kamera bergeser sangat kecil tanpa henti: pakai ambang 1 cm, bukan kesamaan persis.
    for (const p of pins) {
      // Titik hanya tampil di tampilan per lantai (potongan 2,2 m), untuk lantai itu saja. Rumah utuh (0) dan mode kamera (-1): tanpa titik.
      if (p.ruang.lantai !== lantaiAktif) { p.el.classList.remove('tampak'); continue; }
      v.copy(p.pos).project(kamera);
      if (v.z > 1) { p.el.classList.remove('tampak'); continue; }
      p.el.style.transform = `translate(${((v.x + 1) / 2 * lebarPx).toFixed(1)}px, ${((1 - v.y) / 2 * tinggiPx).toFixed(1)}px) translate(-50%,-50%)`;
      p.el.classList.add('tampak');
    }
  }
  raf = requestAnimationFrame(gambar);
  bar.style.width = '100%'; setTimeout(() => muat.classList.add('sembunyi'), 150);

  function hancur() {
    hidup = false; if (raf) cancelAnimationFrame(raf); raf = 0;
    ro.disconnect(); io.disconnect(); kontrol.dispose();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); }); });
    renderer.dispose(); renderer.forceContextLoss();
    akar.remove(); if (window.DH && window.DH.renderer === renderer) delete window.DH;
  }
  return { data, hancur };
}
