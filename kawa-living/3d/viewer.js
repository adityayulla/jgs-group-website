/* ============================================================
   Siteplan 3D Kawa Living
   ------------------------------------------------------------
   Dimuat HANYA saat pengunjung menekan "Lihat versi 3D" (import()
   dinamis dari index.html) — tidak ada byte yang ikut di load awal.

   Sumber data:
     kavling.json                 geometri dari DWG resmi
                                  (tools/siteplan-3d/build-kavling.py)
     /api/public/siteplan         status laku / siap huni  (dashboard)
     /api/public/pricelist        tipe, LT, harga, hoek    (dashboard)
     models/*.glb                 satu model per tipe, dipakai ulang
                                  (clone berbagi geometri & tekstur)

   Kalau status gagal dimuat, kavling TIDAK ditandai tersedia — semuanya
   abu-abu "tanya marketing", sama seperti siteplan gambar.
   ============================================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/OrbitControls.js/+esm';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/meshopt_decoder.module.js/+esm';

const DASAR = new URL('./', import.meta.url);
const API_STATUS = 'https://progress.jogjagrahaselaras.com/api/public/siteplan?slug=kawa-living';
const API_HARGA  = 'https://progress.jogjagrahaselaras.com/api/public/pricelist?slug=kawa-living';
/* Cadangan saja: kontak.js menukar nomor & sapaan ke marketing halaman
   ini dari dashboard tepat saat tautan diklik. */
const WA_CADANGAN = '6288902929571';
const WA_SAPA = 'Dwi';

/* Warna status sama dengan legenda siteplan gambar. */
const STATUS = {
  tersedia: { label: 'Tersedia',  hex: 0x1f8a4c, css: '#1f8a4c' },
  siap:     { label: 'Siap Huni', hex: 0xdb7f2e, css: '#db7f2e' },
  terjual:  { label: 'Terjual',   hex: 0x1b2a64, css: '#1b2a64' },
  tanya:    { label: 'Tanya marketing', hex: 0x8a8f99, css: '#8a8f99' },
};

const HP = window.matchMedia('(max-width: 899px), (pointer: coarse)').matches;
const GERAK_HALUS = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── util ─────────────────────────────────────────────────── */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const urut = (a, b) => {
  const [da, na] = [a.code.replace(/ \d+$/, ''), +a.code.match(/\d+$/)[0]];
  const [db, nb] = [b.code.replace(/ \d+$/, ''), +b.code.match(/\d+$/)[0]];
  return da === db ? na - nb : da.localeCompare(db);
};
function rupiah(n) {
  if (!n) return null;
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
  return 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
}
function ambil(url) {
  return fetch(url, { mode: 'cors' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

/* ── CSS (disuntik sekali, bukan bagian load awal halaman) ── */
function pasangCSS() {
  if (document.getElementById('s3d-css')) return;
  const s = el('style');
  s.id = 's3d-css';
  s.textContent = `
.s3d{display:flex;flex-direction:column;background:#fff;border-radius:var(--r-lg,24px);overflow:hidden;
  box-shadow:0 12px 40px rgba(27,42,100,.12);font-family:var(--font-body,Inter,system-ui,sans-serif);color:var(--ink,#0f1430)}
.s3d__stage{position:relative;height:min(64vh,560px);min-height:340px;background:#eef0e6}
.s3d__stage canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
.s3d__btn{position:absolute;font:inherit;font-size:12px;font-weight:600;color:var(--navy,#1b2a64);background:#fff;
  border:1.5px solid var(--navy,#1b2a64);border-radius:999px;padding:7px 13px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.s3d__home{top:12px;right:12px}
.s3d__howto{position:absolute;left:12px;bottom:10px;right:12px;margin:0;font-size:11px;color:var(--muted,#6a7089);pointer-events:none;
  text-shadow:0 0 6px #eef0e6}
.s3d__load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  background:#eef0e6;font-size:13px;color:var(--muted,#6a7089);transition:opacity .3s}
.s3d__bar{width:min(240px,60%);height:4px;border-radius:4px;background:rgba(27,42,100,.12);overflow:hidden}
.s3d__bar i{display:block;height:100%;width:0;background:var(--orange,#db7f2e);transition:width .2s}
.s3d__sheet{padding:18px 16px 20px;border-top:1px solid var(--line,rgba(27,42,100,.12))}
@media (min-width:900px){
  .s3d{flex-direction:row}
  .s3d__stage{flex:1;height:620px}
  .s3d__sheet{width:360px;flex:none;height:620px;overflow-y:auto;border-top:0;border-left:1px solid var(--line,rgba(27,42,100,.12));padding:22px}
}
.s3d h3{font-family:var(--font-display,Fraunces,Georgia,serif);font-weight:500;font-size:24px;line-height:1.1;margin:0;color:var(--navy,#1b2a64);letter-spacing:-.01em}
.s3d__sub{margin:4px 0 14px;font-size:13px;color:var(--muted,#6a7089)}
.s3d__chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.s3d__chip{font:inherit;font-size:12.5px;font-weight:600;color:var(--navy,#1b2a64);background:#fff;border:1.5px solid var(--line,rgba(27,42,100,.12));
  border-radius:999px;padding:6px 11px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.s3d__chip b{font-weight:700}
.s3d__chip[aria-pressed="true"]{background:var(--navy,#1b2a64);border-color:var(--navy,#1b2a64);color:#fff}
.s3d__dot{width:10px;height:10px;border-radius:50%;background:var(--c);flex:none;box-shadow:0 0 0 1.5px #fff}
.s3d__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
.s3d__kav{font:inherit;font-size:12px;font-weight:600;color:var(--ink,#0f1430);background:#fff;border:1px solid var(--line,rgba(27,42,100,.12));
  border-left:4px solid var(--c);border-radius:8px;padding:8px 7px;cursor:pointer;text-align:left;line-height:1.2}
.s3d__kav:hover{background:#f6f4ee}
.s3d__note{margin:14px 0 0;font-size:11.5px;color:var(--muted,#6a7089);line-height:1.5}
.s3d__back{font:inherit;font-size:12.5px;font-weight:600;color:var(--muted,#6a7089);background:none;border:0;padding:0;margin:0 0 10px;cursor:pointer}
.s3d__head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.s3d__pill{font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;
  color:#fff;background:var(--c);border-radius:999px;padding:5px 10px;white-space:nowrap}
.s3d__price{margin:10px 0 14px;font-family:var(--font-display,Fraunces,Georgia,serif);font-size:26px;font-weight:500;color:var(--navy,#1b2a64);line-height:1.1}
.s3d__price small{display:block;font-family:var(--font-body,Inter,sans-serif);font-size:12.5px;font-weight:500;color:var(--muted,#6a7089);margin-top:4px}
.s3d__facts{display:grid;grid-template-columns:1fr 1fr;margin:0 0 16px;border-top:1px solid var(--line,rgba(27,42,100,.12))}
.s3d__facts div{padding:9px 8px 9px 0;border-bottom:1px solid var(--line,rgba(27,42,100,.12))}
.s3d__facts dt{font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#6a7089)}
.s3d__facts dd{margin:3px 0 0;font-size:14px;font-weight:600;color:var(--navy,#1b2a64)}
.s3d__facts .s3d__wide{grid-column:1/-1}
.s3d__cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;font:inherit;font-size:14.5px;font-weight:600;text-decoration:none;
  color:#fff;background:#1f8a4c;border-radius:999px;padding:13px 16px}
.s3d__cta:hover{filter:brightness(1.07)}
.s3d__link{display:block;text-align:center;margin-top:10px;font-size:13px;font-weight:600;color:var(--orange,#db7f2e)}
.s3d button:focus-visible,.s3d a:focus-visible{outline:2px solid var(--orange,#db7f2e);outline-offset:2px}
`;
  document.head.appendChild(s);
}

/* ── teks → tekstur (label fasum, gerbang, kavling terpilih) ─ */
function teksTekstur(teks, { bg = '#ffffff', fg = '#1b2a64', w = 512, h = 128, ukuran = 56, radius = 64 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath();
  if (g.roundRect) g.roundRect(4, 4, w - 8, h - 8, radius); else g.rect(4, 4, w - 8, h - 8);
  g.fill();
  g.fillStyle = fg;
  g.font = `600 ${ukuran}px Inter, system-ui, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(teks, w / 2, h / 2 + 2, w - 24);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function label(teks, opsi, tinggiPx = 22) {
  const tex = teksTekstur(teks, opsi);
  const m = new THREE.SpriteMaterial({ map: tex, depthTest: false, sizeAttenuation: false });
  const s = new THREE.Sprite(m);
  const r = tex.image.width / tex.image.height;
  s.userData.tinggiPx = tinggiPx;
  s.userData.rasio = r;
  s.renderOrder = 10;
  return s;
}

/* ── geometri datar dari poligon [x,z] ───────────────────── */
function bentuk(titik) {
  const s = new THREE.Shape();
  titik.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  return s;
}
function datar(titik, y, mat, lubang = []) {
  const s = bentuk(titik);
  lubang.forEach(h => s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z)))));
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}
function pusat(titik) {
  let x = 0, z = 0;
  titik.forEach(p => { x += p[0]; z += p[1]; });
  return [x / titik.length, z / titik.length];
}
function didalam([x, z], titik) {
  let ada = false;
  for (let i = 0, j = titik.length - 1; i < titik.length; j = i++) {
    const [xi, zi] = titik[i], [xj, zj] = titik[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ada = !ada;
  }
  return ada;
}
/* Arah sisi terpanjang poligon — dipakai meluruskan bangunan fasum. */
function sudutUtama(titik) {
  let best = 0, ang = 0;
  titik.forEach((a, i) => {
    const b = titik[(i + 1) % titik.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L > best) { best = L; ang = Math.atan2(b[0] - a[0], b[1] - a[1]); }
  });
  return ang;
}

/* ============================================================ */
export async function mulai(host, { onProgress } = {}) {
  pasangCSS();
  host.innerHTML = '';
  const akar = el('div', 's3d');
  const panggung = el('div', 's3d__stage');
  panggung.setAttribute('role', 'application');
  panggung.setAttribute('aria-label', 'Model 3D siteplan Kawa Living. Pilih kavling dari daftar di samping atau ketuk rumahnya.');
  const muat = el('div', 's3d__load', '<span>Memuat siteplan 3D…</span><div class="s3d__bar"><i></i></div>');
  const tombolHome = el('button', 's3d__btn s3d__home', 'Lihat semua');
  tombolHome.type = 'button';
  const caraPakai = el('p', 's3d__howto', HP ? 'Geser 1 jari memutar · 2 jari menggeser & zoom · ketuk rumah untuk detail'
                                             : 'Seret untuk memutar · klik kanan + seret untuk menggeser · scroll untuk zoom');
  const lembar = el('aside', 's3d__sheet');
  lembar.setAttribute('aria-live', 'polite');
  panggung.append(muat, tombolHome, caraPakai);
  akar.append(panggung, lembar);
  host.appendChild(akar);

  const bar = muat.querySelector('i');
  const progres = p => { bar.style.width = Math.round(p * 100) + '%'; onProgress && onProgress(p); };

  /* ── data ─────────────────────────────────────────────── */
  const MODEL = ['mizu-36', 'yuri-40', 'hiroi-yuri-42', 'himawari-49', 'himawari-51', 'okina-61'];
  const muatModel = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const persen = {};
  const hitung = () => progres(Object.values(persen).reduce((a, b) => a + b, 0) / (MODEL.length + 1));
  const janjiModel = MODEL.map(k => muatModel.loadAsync(new URL('models/' + k + '.glb', DASAR).href, e => {
    if (e.total) { persen[k] = e.loaded / e.total; hitung(); }
  }).then(g => { persen[k] = 1; hitung(); return [k, g.scene]; }));

  const [peta, status, harga] = await Promise.all([
    fetch(new URL('kavling.json', DASAR)).then(r => { if (!r.ok) throw new Error('kavling.json ' + r.status); return r.json(); }),
    ambil(API_STATUS),
    ambil(API_HARGA),
  ]);
  persen.data = 1; hitung();
  const model = Object.fromEntries(await Promise.all(janjiModel));

  const statusAda = !!(status && status.units && status.units.length);
  const perUnit = {}, perHarga = {};
  if (statusAda) status.units.forEach(u => (perUnit[u.code.toLowerCase()] = u));
  if (harga && harga.units) harga.units.forEach(u => (perHarga[u.code.toLowerCase()] = u));

  const gerbangTengah = [(peta.gerbang[0][0] + peta.gerbang[1][0]) / 2, (peta.gerbang[0][1] + peta.gerbang[1][1]) / 2];
  const kavling = peta.kavling.map(k => {
    const kunci = k.code.toLowerCase();
    const u = perUnit[kunci], h = perHarga[kunci] || {};
    const st = !statusAda ? 'tanya'
             : (u ? u.sold : (status.sold || []).some(c => c.toLowerCase() === kunci)) ? 'terjual'
             : (u ? u.built : (status.readyStock || []).some(c => c.toLowerCase() === kunci)) ? 'siap'
             : 'tersedia';
    const [cx, cz] = pusat(k.poly);
    let dekat = null;
    peta.fasum.forEach(f => {
      const d = Math.hypot(f.pusat[0] - cx, f.pusat[1] - cz);
      if (!dekat || d < dekat.d) dekat = { nama: f.nama, d };
    });
    return {
      ...k, status: st, unit: u || null, harga: h, pusat: [cx, cz], dekat,
      keGerbang: Math.hypot(k.muka[0] - gerbangTengah[0], k.muka[1] - gerbangTengah[1]),
    };
  }).sort(urut);

  /* ── renderer, kamera, cahaya ─────────────────────────── */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0xeef0e6, 1);
  renderer.shadowMap.enabled = !HP;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  panggung.insertBefore(renderer.domElement, muat);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeef0e6, 380, 900);
  const kamera = new THREE.PerspectiveCamera(35, 1, 1, 1500);
  const kendali = new OrbitControls(kamera, renderer.domElement);
  kendali.enableDamping = true;
  kendali.dampingFactor = 0.09;
  kendali.maxPolarAngle = 1.3;
  kendali.minDistance = 18;
  kendali.maxDistance = 520;
  kendali.screenSpacePanning = false;
  kendali.zoomToCursor = true;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7bfa6, 1.6));
  const matahari = new THREE.DirectionalLight(0xfff1dc, 2.2);
  matahari.position.set(80, 140, 60);
  if (!HP) {
    matahari.castShadow = true;
    matahari.shadow.mapSize.set(2048, 2048);
    Object.assign(matahari.shadow.camera, { left: -130, right: 130, top: 90, bottom: -90, near: 20, far: 400 });
    matahari.shadow.bias = -0.0005;
    matahari.shadow.normalBias = 0.04;
  }
  scene.add(matahari, matahari.target);

  const L = c => new THREE.MeshLambertMaterial({ color: c });

  /* ── lingkungan: lahan, jalan, taman, fasum ───────────── */
  const tanahLuar = new THREE.Mesh(new THREE.CircleGeometry(700, 48).rotateX(-Math.PI / 2), L(0xd9dfc9));
  tanahLuar.position.y = -0.08;
  tanahLuar.receiveShadow = true;
  scene.add(tanahLuar);
  scene.add(datar(peta.batas, -0.02, L(0xe6e1d2)));
  const aspal = L(0x9a9fa8);
  scene.add(datar(peta.jalan.luar, 0.02, aspal, peta.jalan.lubang));
  if (peta.jalanDesa) scene.add(datar(peta.jalanDesa, 0.0, aspal));
  const rumput = L(0xb5d39a);
  peta.taman.forEach(t => scene.add(datar(t, 0.03, rumput)));

  /* Pohon: dua InstancedMesh (batang + tajuk) — satu draw call masing-masing. */
  const pohon = [];
  let biji = 7;
  const acak = () => ((biji = (biji * 16807) % 2147483647) - 1) / 2147483646;
  function tanamDi(titik, jumlah, jarakMin = 4) {
    const xs = titik.map(p => p[0]), zs = titik.map(p => p[1]);
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    for (let i = 0, coba = 0; i < jumlah && coba < jumlah * 40; coba++) {
      const p = [x0 + acak() * (x1 - x0), z0 + acak() * (z1 - z0)];
      if (!didalam(p, titik)) continue;
      if (pohon.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < jarakMin)) continue;
      pohon.push([p[0], p[1], 0.8 + acak() * 0.5]);
      i++;
    }
  }
  peta.taman.forEach(t => {
    const luas = Math.abs(t.reduce((s, a, i) => { const b = t[(i + 1) % t.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
    tanamDi(t, Math.max(2, Math.round(luas / 22)));
  });

  const fasumMat = L(0xdcd5c3);
  const putih = L(0xf5f3ee);
  const labelFasum = [];
  peta.fasum.forEach(f => {
    const [cx, cz] = f.pusat;
    const rot = sudutUtama(f.poly);
    if (/Lapangan/.test(f.nama)) {
      scene.add(datar(f.poly, 0.04, L(0x6aa86f)));
      const sisi = Math.sqrt(f.luas);
      const lap = new THREE.Group();
      const garis = new THREE.LineBasicMaterial({ color: 0xffffff });
      const w = sisi * 0.95, d = sisi * 0.6;
      const kotak = new THREE.BufferGeometry().setFromPoints([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]].map(([x, z]) => new THREE.Vector3(x, 0.06, z)));
      lap.add(new THREE.Line(kotak, garis));
      lap.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.06, -d / 2), new THREE.Vector3(0, 0.06, d / 2)]), garis));
      const lingkar = new THREE.EllipseCurve(0, 0, d * 0.18, d * 0.18).getPoints(32).map(p => new THREE.Vector3(p.x, 0.06, p.y));
      lap.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lingkar), garis));
      [-1, 1].forEach(s => {   // tiang ring basket di kedua ujung
        const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.05, 8), L(0x444a55));
        tiang.position.set(s * (w / 2 - 0.3), 1.52, 0);
        const papan = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), putih);
        papan.position.set(s * (w / 2 - 0.45), 3.2, 0);
        tiang.castShadow = papan.castShadow = true;
        lap.add(tiang, papan);
      });
      lap.position.set(cx, 0, cz);
      lap.rotation.y = rot - Math.PI / 2;
      scene.add(lap);
    } else {
      scene.add(datar(f.poly, 0.04, fasumMat));
    }
    if (f.nama === 'Masjid') {
      const s = Math.sqrt(f.luas) * 0.5;
      const g = new THREE.Group();
      const badan = new THREE.Mesh(new THREE.BoxGeometry(s, 4.2, s), putih);
      badan.position.y = 2.1;
      const kubah = new THREE.Mesh(new THREE.SphereGeometry(s * 0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), L(0x2f7a5b));
      kubah.position.y = 4.2;
      const menara = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 11, 12), putih);
      menara.position.set(s / 2 + 1.2, 5.5, s / 2 - 0.6);
      const puncak = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 12), L(0x2f7a5b));
      puncak.position.set(s / 2 + 1.2, 11.8, s / 2 - 0.6);
      [badan, kubah, menara, puncak].forEach(m => { m.castShadow = m.receiveShadow = true; g.add(m); });
      g.position.set(cx, 0, cz);
      g.rotation.y = rot;
      scene.add(g);
    } else if (f.nama === 'Pos Satpam') {
      const pos = new THREE.Mesh(new THREE.BoxGeometry(3, 2.8, 3), putih);
      pos.position.set(cx, 1.4, cz);
      const atap = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.1, 4), L(0x55607a));
      atap.rotation.y = Math.PI / 4;
      atap.position.set(cx, 3.35, cz);
      pos.castShadow = atap.castShadow = true;
      scene.add(pos, atap);
    } else if (f.nama === 'Fasos') {
      tanamDi(f.poly, 4, 5);
    }
    const lb = label(f.nama, { bg: 'rgba(255,255,255,.92)', fg: '#1b2a64', w: 720, ukuran: 52 }, 20);
    lb.position.set(cx, f.nama === 'Masjid' ? 14 : f.nama === 'Pos Satpam' ? 11 : 6, cz);
    scene.add(lb);
    labelFasum.push(lb);
  });

  /* Gerbang one gate: dua pilar + balok bertuliskan KAWA LIVING. */
  {
    const [a, b] = peta.gerbang;
    const lebar = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const g = new THREE.Group();
    const pilarMat = L(0x1b2a64);
    [-1, 1].forEach(s => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 1), pilarMat);
      p.position.set(s * (lebar / 2 - 0.5), 3, 0);
      p.castShadow = true;
      g.add(p);
    });
    const balok = new THREE.Mesh(new THREE.BoxGeometry(lebar, 1.3, 0.8), pilarMat);
    balok.position.y = 6.2;
    balok.castShadow = true;
    const papan = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(lebar * 0.7, 10), 1),
      new THREE.MeshBasicMaterial({ map: teksTekstur('KAWA LIVING', { bg: '#1b2a64', fg: '#f6f4ee', w: 1024, h: 102, ukuran: 66, radius: 0 }) }));
    papan.position.set(0, 6.2, 0.41);
    const papan2 = papan.clone();
    papan2.position.z = -0.41;
    papan2.rotation.y = Math.PI;
    g.add(balok, papan, papan2);
    g.position.set((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
    g.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);   // sumbu x lokal = garis gerbang
    scene.add(g);
  }

  if (pohon.length) {
    const batang = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.22, 1.8, 6), L(0x7a5a3e), pohon.length);
    const tajuk = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6, 0), L(0x5d9a54), pohon.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    pohon.forEach(([x, z, k], i) => {
      m.compose(p.set(x, 0.9 * k, z), q.identity(), s.setScalar(k));
      batang.setMatrixAt(i, m);
      q.setFromEuler(new THREE.Euler(acak(), acak() * 3, 0));
      m.compose(p.set(x, 2.6 * k, z), q, s.setScalar(k));
      tajuk.setMatrixAt(i, m);
    });
    batang.castShadow = tajuk.castShadow = true;
    scene.add(batang, tajuk);
  }

  /* ── kavling: model per tipe di-clone, atap = warna status ─ */
  const atapMat = Object.fromEntries(Object.entries(STATUS).map(([k, v]) =>
    [k, new THREE.MeshLambertMaterial({ color: v.hex })]));
  const tepiMat = Object.fromEntries(Object.entries(STATUS).map(([k, v]) =>
    [k, new THREE.MeshBasicMaterial({ color: v.hex })]));
  const hantuMat = new THREE.MeshBasicMaterial({ color: 0xcfd3c4, transparent: true, opacity: 0.55 });
  const pilihMat = new THREE.MeshBasicMaterial({ color: 0xf3c64a });
  const tak = new THREE.MeshBasicMaterial({ visible: false });
  const kena = [];

  /* Atap = penanda status. Di model SketchUp hanya satu sisi atap yang
     bertekstur genteng; sisi lainnya memakai material bawaan ("material")
     yang juga dipakai dinding. Maka material bawaan dipecah per segitiga:
     permukaan menghadap atas di atas 60% tinggi rumah ikut jadi atap.
     Dikerjakan sekali per tipe — clone berbagi hasilnya. */
  function pisahAtap(m) {
    m.updateMatrixWorld(true);
    const tinggi = new THREE.Box3().setFromObject(m).max.y;
    const batasY = tinggi * 0.6;
    const baru = [];
    m.traverse(o => {
      if (!o.isMesh) return;
      if (/Roofing/i.test(o.material.name)) { o.userData.atap = true; return; }
      if (o.material.name !== 'material' || !o.geometry.index) return;
      const g = o.geometry, pos = g.attributes.position, idx = g.index.array;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
      const atap = [], sisa = [];
      for (let i = 0; i < idx.length; i += 3) {
        a.fromBufferAttribute(pos, idx[i]).applyMatrix4(o.matrixWorld);
        b.fromBufferAttribute(pos, idx[i + 1]).applyMatrix4(o.matrixWorld);
        c.fromBufferAttribute(pos, idx[i + 2]).applyMatrix4(o.matrixWorld);
        n.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
        const keAtas = Math.abs(n.y) > 0.3 && (a.y + b.y + c.y) / 3 > batasY;
        (keAtas ? atap : sisa).push(idx[i], idx[i + 1], idx[i + 2]);
      }
      if (!atap.length) return;
      const gAtap = g.clone();
      gAtap.setIndex(atap);
      g.setIndex(sisa);
      const mAtap = new THREE.Mesh(gAtap, o.material);
      mAtap.userData.atap = true;
      baru.push([o, mAtap]);
    });
    baru.forEach(([o, mAtap]) => {
      mAtap.position.copy(o.position); mAtap.quaternion.copy(o.quaternion); mAtap.scale.copy(o.scale);
      o.parent.add(mAtap);
    });
    m.traverse(o => { if (o.isMesh) { o.castShadow = !HP; o.receiveShadow = !HP; } });
  }
  Object.values(model).forEach(pisahAtap);

  const kedalaman = {}, tinggiModel = {};
  Object.entries(model).forEach(([id, m]) => {
    const b = new THREE.Box3().setFromObject(m);
    kedalaman[id] = b.max.z - b.min.z;
    tinggiModel[id] = b.max.y;
  });
  kavling.forEach(k => {
    const g = new THREE.Group();
    // Model: depan (+Z) menempel sisi depan kavling, menghadap jalan.
    const rumah = model[k.model].clone();
    const dalamModel = kedalaman[k.model];
    rumah.position.set(k.muka[0] - k.arah[0] * dalamModel / 2, 0.05, k.muka[1] - k.arah[1] * dalamModel / 2);
    rumah.rotation.y = k.rotY;
    k.pusat = [rumah.position.x, rumah.position.z];
    k.tinggi = tinggiModel[k.model];
    rumah.traverse(o => { if (o.isMesh && o.userData.atap) o.material = atapMat[k.status]; });
    g.add(rumah);

    // Alas kavling (terlihat saat rumahnya disembunyikan filter) + garis tepi tebal warna status.
    const alas = datar(k.poly, 0.045, hantuMat);
    alas.visible = false;
    g.add(alas);
    const tepi = new THREE.Mesh(tepiGeo(k.poly, 0.35), tepiMat[k.status]);
    tepi.position.y = 0.07;
    g.add(tepi);

    // Area ketuk: prisma tak terlihat setinggi rumah.
    const prisma = new THREE.ExtrudeGeometry(bentuk(k.poly), { depth: 9, bevelEnabled: false });
    prisma.rotateX(-Math.PI / 2);
    const hit = new THREE.Mesh(prisma, tak);
    hit.userData.k = k;
    g.add(hit);
    kena.push(hit);

    Object.assign(k, { grup: g, rumah, alas, tepi });
    scene.add(g);
  });

  /* Pita garis tepi kavling (bukan THREE.Line — lebar garis WebGL selalu 1px). */
  function tepiGeo(titik, tebal) {
    const pos = [];
    const n = titik.length;
    for (let i = 0; i < n; i++) {
      const a = titik[i], b = titik[(i + 1) % n];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const L = Math.hypot(dx, dz) || 1;
      // Ke dalam: sisi kiri/kanan tergantung arah putaran — dicek pakai titik tengah.
      let nx = -dz / L * tebal, nz = dx / L * tebal;
      const mid = [(a[0] + b[0]) / 2 + nx, (a[1] + b[1]) / 2 + nz];
      if (!didalam(mid, titik)) { nx = -nx; nz = -nz; }
      const p = [[a[0], a[1]], [b[0], b[1]], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]];
      [0, 1, 2, 0, 2, 3].forEach(j => pos.push(p[j][0], 0, p[j][1]));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }

  /* Label kavling terpilih — satu sprite, dipindah-pindah. */
  let labelPilih = null;

  /* ── kamera: "Lihat semua" ─────────────────────────────── */
  const titikBatas = peta.batas.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const tengah = new THREE.Box3().setFromPoints(titikBatas).getCenter(new THREE.Vector3());
  // Sumbu panjang kawasan (barat daya → timur laut).
  const xs = peta.batas.map(p => p[0]);
  const ujungB = titikBatas[xs.indexOf(Math.min(...xs))], ujungT = titikBatas[xs.indexOf(Math.max(...xs))];
  const sumbu = new THREE.Vector3().subVectors(ujungT, ujungB).setY(0).normalize();

  function arahRumah() {
    // HP tegak: pandang sepanjang sumbu panjang dari arah gerbang supaya kawasan
    // memanjang ke atas layar. Layar lebar: pandang dari selatan, tegak lurus sumbu.
    const tegak = kamera.aspect < 1;
    const h = tegak ? sumbu.clone().negate() : new THREE.Vector3(-sumbu.z, 0, sumbu.x);
    if (!tegak && h.z < 0) h.negate();
    return h.multiplyScalar(Math.cos(0.95)).setY(Math.sin(0.95)).normalize();
  }
  function jarakPas(arah) {
    const maju = arah.clone().negate();
    const kanan = new THREE.Vector3().crossVectors(maju, new THREE.Vector3(0, 1, 0)).normalize();
    const atas = new THREE.Vector3().crossVectors(kanan, maju).normalize();
    const tV = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
    const tH = tV * kamera.aspect;
    let d = 0;
    titikBatas.forEach(p => {
      const v = p.clone().sub(tengah);
      const z = v.dot(arah);
      d = Math.max(d, z + Math.abs(v.dot(kanan)) / tH, z + Math.abs(v.dot(atas)) / tV);
    });
    return d * 1.04;
  }
  function posisiRumah() {
    const a = arahRumah();
    return { target: tengah.clone(), posisi: tengah.clone().addScaledVector(a, jarakPas(a)) };
  }

  let tween = null;
  function terbang(target, posisi, ms = 750) {
    if (!GERAK_HALUS) ms = 0;
    tween = { t0: performance.now(), ms, dariT: kendali.target.clone(), dariP: kamera.position.clone(), keT: target, keP: posisi };
    perluGambar = true;
  }
  function langkahTween(now) {
    if (!tween) return false;
    const t = tween.ms ? Math.min(1, (now - tween.t0) / tween.ms) : 1;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    kendali.target.lerpVectors(tween.dariT, tween.keT, e);
    kamera.position.lerpVectors(tween.dariP, tween.keP, e);
    if (t >= 1) tween = null;
    return true;
  }
  function lihatSemua(halus = true) {
    const { target, posisi } = posisiRumah();
    if (halus) terbang(target, posisi);
    else { kendali.target.copy(target); kamera.position.copy(posisi); perluGambar = true; }
  }
  function terbangKe(k) {
    const t = new THREE.Vector3(k.pusat[0], k.tinggi / 2, k.pusat[1]);
    // Pandang dari depan rumah, sedikit menyerong & dari atas.
    const depan = new THREE.Vector3(k.arah[0], 0, k.arah[1]).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    const p = t.clone().addScaledVector(depan.multiplyScalar(Math.cos(0.75)).setY(Math.sin(0.75)).normalize(), HP ? 55 : 45);
    terbang(t, p);
  }

  /* ── ukuran & loop render (hanya menggambar saat ada perubahan) ── */
  let perluGambar = true;
  function ukur() {
    const w = panggung.clientWidth, h = panggung.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    // Sprite sizeAttenuation:false: tinggi di layar = scale · h / (2·tan(fov/2)).
    const skala = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) / h;
    [...labelFasum, labelPilih].forEach(s => {
      if (!s) return;
      const t = s.userData.tinggiPx * skala;
      s.scale.set(t * s.userData.rasio, t, 1);
    });
    perluGambar = true;
  }
  new ResizeObserver(ukur).observe(panggung);
  ukur();
  lihatSemua(false);
  kendali.addEventListener('change', () => (perluGambar = true));

  let terlihat = true, raf = 0;
  new IntersectionObserver(([e]) => {
    terlihat = e.isIntersecting;
    if (terlihat && !raf) raf = requestAnimationFrame(putar);
  }).observe(panggung);
  function putar(now) {
    raf = 0;
    if (!terlihat) return;
    const gerak = langkahTween(now);
    const ubah = kendali.update();
    if (gerak || ubah || perluGambar) {
      renderer.render(scene, kamera);
      perluGambar = false;
    }
    raf = requestAnimationFrame(putar);
  }
  raf = requestAnimationFrame(putar);
  tombolHome.addEventListener('click', () => { pilih(null, false); lihatSemua(); });

  /* ── interaksi: ketuk kavling ─────────────────────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let turun = null;
  renderer.domElement.addEventListener('pointerdown', e => { turun = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!turun || Math.hypot(e.clientX - turun[0], e.clientY - turun[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, kamera);
    const hit = ray.intersectObjects(kena.filter(h => tampil(h.userData.k)), false)[0];
    if (hit) pilih(hit.object.userData.k);
  });

  /* ── panel ─────────────────────────────────────────────── */
  let saring = 'semua', terpilih = null;
  const tampil = k => saring === 'semua' || k.status === saring;
  const jumlah = s => kavling.filter(k => k.status === s).length;

  function terapkanSaring() {
    kavling.forEach(k => {
      const ya = tampil(k);
      k.rumah.visible = ya;
      k.tepi.visible = ya;
      k.alas.visible = !ya;
    });
    if (terpilih && !tampil(terpilih)) pilih(null, false);
    perluGambar = true;
  }

  function pilih(k, terbangkan = true) {
    if (terpilih) terpilih.tepi.material = tepiMat[terpilih.status];
    terpilih = k;
    if (labelPilih) { scene.remove(labelPilih); labelPilih.material.map.dispose(); labelPilih.material.dispose(); labelPilih = null; }
    if (k) {
      k.tepi.material = pilihMat;
      labelPilih = label(k.code, { bg: STATUS[k.status].css, fg: '#ffffff', w: 520, ukuran: 58 }, 24);
      labelPilih.position.set(k.pusat[0], k.tinggi + 3, k.pusat[1]);
      scene.add(labelPilih);
      ukur();
      if (terbangkan) terbangKe(k);
    }
    gambarLembar();
    perluGambar = true;
  }

  function gambarLembar() {
    lembar.innerHTML = '';
    if (terpilih) return lembar.appendChild(detail(terpilih));
    lembar.appendChild(ringkas());
  }

  function ringkas() {
    const f = document.createDocumentFragment();
    f.appendChild(el('h3', null, 'Siteplan <em>3D</em>'));
    const nTersedia = jumlah('tersedia') + jumlah('siap');
    f.appendChild(el('p', 's3d__sub', statusAda
      ? `${nTersedia} dari ${kavling.length} kavling masih bisa dipilih. Ketuk rumah atau kode kavling untuk detail.`
      : `${kavling.length} kavling. Status jual sedang tidak bisa dimuat — tanyakan ketersediaan ke marketing.`));
    if (statusAda) {
      const chips = el('div', 's3d__chips');
      chips.setAttribute('role', 'group');
      chips.setAttribute('aria-label', 'Saring status kavling');
      [['semua', 'Semua', kavling.length, null], ...['tersedia', 'siap', 'terjual'].map(s => [s, STATUS[s].label, jumlah(s), STATUS[s].css])]
        .forEach(([id, nama, n, warna]) => {
          if (id !== 'semua' && !n) return;
          const b = el('button', 's3d__chip', (warna ? `<i class="s3d__dot" style="--c:${warna}"></i>` : '') + `${nama} <b>${n}</b>`);
          b.type = 'button';
          b.setAttribute('aria-pressed', saring === id ? 'true' : 'false');
          b.addEventListener('click', () => { saring = id; terapkanSaring(); gambarLembar(); });
          chips.appendChild(b);
        });
      f.appendChild(chips);
    }
    const grid = el('div', 's3d__grid');
    kavling.filter(tampil).forEach(k => {
      const b = el('button', 's3d__kav', esc(k.code));
      b.type = 'button';
      b.style.setProperty('--c', STATUS[k.status].css);
      b.setAttribute('aria-label', `${k.code}, ${STATUS[k.status].label}`);
      b.addEventListener('click', () => {
        pilih(k);
        // Di HP daftar ada di bawah panggung — bawa rumahnya ke layar.
        const r = panggung.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) panggung.scrollIntoView({ block: 'start', behavior: GERAK_HALUS ? 'smooth' : 'auto' });
      });
      grid.appendChild(b);
    });
    f.appendChild(grid);
    f.appendChild(el('p', 's3d__note',
      'Status jual & harga langsung dari Progress Dashboard. Harga dapat berubah sewaktu-waktu. ' +
      'Model 3D adalah ilustrasi eksterior tiap tipe; posisi & bentuk kavling dari siteplan resmi.'));
    return f;
  }

  function detail(k) {
    const f = document.createDocumentFragment();
    const balik = el('button', 's3d__back', '← Semua kavling');
    balik.type = 'button';
    balik.addEventListener('click', () => pilih(null, false));
    f.appendChild(balik);
    const st = STATUS[k.status];
    const head = el('div', 's3d__head');
    head.append(el('h3', null, esc(k.code)), Object.assign(el('span', 's3d__pill', esc(st.label)), { style: `--c:${st.css}` }));
    f.appendChild(head);

    const h = k.harga || {};
    const cash = rupiah(h.priceCash), kpr = rupiah(h.priceKpr);
    let hargaHTML;
    if (k.status === 'terjual') hargaHTML = 'Sudah terjual<small>Tanyakan unit serupa yang masih tersedia.</small>';
    else if (cash) hargaHTML = `${cash}<small>Cash keras${kpr ? ` · KPR / cash tempo ${kpr}` : ''}</small>`;
    else hargaHTML = 'Hubungi marketing<small>Harga kavling ini belum dicantumkan.</small>';
    f.appendChild(el('div', 's3d__price', hargaHTML));

    const tipe = h.type ? String(h.type).replace('/', ' / ') : null;
    const posisi = [h.hook ? 'Hoek (sudut)' : null, `±${Math.round(k.keGerbang / 5) * 5} m dari gerbang`].filter(Boolean).join(' · ');
    const fakta = [
      ['Tipe', `${esc(k.deret)}${tipe ? ' ' + esc(tipe) : ''}`],
      ['Hadap', esc(k.hadap)],
      ['Luas tanah', h.landArea ? `${h.landArea} m²` : '—'],
      ['Luas bangunan', tipe ? `${esc(tipe)} m²` : '—'],
      ['Posisi', esc(posisi), true],
      ['Terdekat', `${esc(k.dekat.nama)} ±${Math.max(5, Math.round(k.dekat.d / 5) * 5)} m`, true],
    ];
    if (k.status === 'siap' && k.unit && k.unit.progress) fakta.push(['Progres bangun', `${k.unit.progress}%`, true]);
    const dl = el('dl', 's3d__facts');
    fakta.forEach(([dt, dd, lebar]) => {
      const d = el('div', lebar ? 's3d__wide' : null, `<dt>${dt}</dt><dd>${dd}</dd>`);
      dl.appendChild(d);
    });
    f.appendChild(dl);

    const pesan = k.status === 'terjual'
      ? `Halo ${WA_SAPA}, saya lihat kavling ${k.code} di siteplan 3D Kawa Living sudah terjual. Apakah ada unit serupa yang masih tersedia? (via web)`
      : `Halo ${WA_SAPA}, saya tertarik kavling ${k.code} di Kawa Living. Apakah masih tersedia? (via siteplan 3D web)`;
    const wa = el('a', 's3d__cta', `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>` +
      (k.status === 'terjual' ? 'Tanya unit serupa' : `Tanya ${esc(k.code)} via WhatsApp`));
    wa.href = `https://wa.me/${WA_CADANGAN}?text=${encodeURIComponent(pesan)}`;
    wa.target = '_blank';
    wa.rel = 'noopener';
    f.appendChild(wa);
    if (k.unit && k.unit.url) {
      const a = el('a', 's3d__link', 'Lihat progress pembangunan unit ini →');
      a.href = k.unit.url; a.target = '_blank'; a.rel = 'noopener';
      f.appendChild(a);
    }
    return f;
  }

  terapkanSaring();
  gambarLembar();
  muat.style.opacity = '0';
  setTimeout(() => muat.remove(), 320);

  return {
    jeda() { terlihat = false; },
    lanjut() { terlihat = true; if (!raf) raf = requestAnimationFrame(putar); ukur(); },
  };
}
