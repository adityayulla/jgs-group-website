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

   Navigasi meniru Google Maps + Street View:
     peta    seret = geser, klik kanan / 2 jari = putar, scroll = zoom
     jalan   ikon orang diseret ke jalan → kamera setinggi mata;
             seret = menoleh, ketuk jalan / panah = berjalan
   ============================================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
import { MapControls } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/controls/MapControls.js/+esm';
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
.s3d__howto{position:absolute;left:12px;bottom:10px;right:66px;margin:0;font-size:11px;color:var(--muted,#6a7089);pointer-events:none;
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
.s3d__ctrls{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;align-items:center;gap:8px}
.s3d__c{width:40px;height:40px;display:grid;place-items:center;padding:0;font:inherit;color:var(--navy,#1b2a64);background:#fff;
  border:1px solid var(--line,rgba(27,42,100,.12));border-radius:10px;cursor:pointer;box-shadow:0 1px 4px rgba(15,20,48,.16);-webkit-tap-highlight-color:transparent}
.s3d__c:hover{background:#f6f4ee}
.s3d__zoom{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(15,20,48,.16)}
.s3d__zoom .s3d__c{border-radius:0;box-shadow:none;border:0}
.s3d__zoom .s3d__c+.s3d__c{border-top:1px solid var(--line,rgba(27,42,100,.12))}
.s3d__peg{background:#f5b400;color:#3b2a00;border-color:#e0a400;touch-action:none;cursor:grab}
.s3d__peg:hover{background:#ffc21a}
.s3d__ghost{position:fixed;left:0;top:0;z-index:1000;pointer-events:none;opacity:.7;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));transition:opacity .15s}
.s3d__ghost.ok{opacity:1}
body.s3d-seret,body.s3d-seret *{cursor:grabbing!important}
.s3d__kartu{position:absolute;top:10px;left:12px;display:flex;align-items:center;gap:8px;max-width:calc(100% - 24px);background:#fff;
  border-radius:12px;padding:5px 12px 5px 5px;box-shadow:0 1px 6px rgba(15,20,48,.2)}
.s3d__kartu .s3d__c{width:34px;height:34px;box-shadow:none;border:0;background:#f6f4ee}
.s3d__kartu b{display:block;font-size:13px;font-weight:700;color:var(--navy,#1b2a64);line-height:1.2}
.s3d__kartu small{display:block;font-size:11.5px;color:var(--muted,#6a7089);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s3d__stage .s3d__mini{position:absolute;left:12px;bottom:12px;width:132px;height:132px;border-radius:12px;border:2px solid #fff;
  box-shadow:0 1px 6px rgba(15,20,48,.25);cursor:pointer;touch-action:none;background:#d9dfc9}
.s3d__hint{position:absolute;top:62px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px);margin:0;
  font-size:12px;font-weight:600;color:#fff;background:rgba(15,20,48,.8);border-radius:999px;padding:7px 14px;text-align:center;
  pointer-events:none;transition:opacity .5s}
.s3d__hint.mati{opacity:0}
.s3d__jalan{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:8px;font:inherit;font-size:14px;font-weight:600;
  color:var(--navy,#1b2a64);background:#fff;border:1.5px solid var(--navy,#1b2a64);border-radius:999px;padding:11px 16px;cursor:pointer}
.s3d__jalan:hover{background:#f6f4ee}
.s3d:not(.s3d--jalan) .s3d__sv{display:none!important}
.s3d--jalan .s3d__home,.s3d--jalan .s3d__howto,.s3d--jalan .s3d__peg{display:none}
@media (max-width:420px){.s3d__stage .s3d__mini{width:104px;height:104px}}
@media (prefers-reduced-motion: reduce){.s3d__hint,.s3d__ghost{transition:none}}
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
  const caraPakai = el('p', 's3d__howto', HP ? 'Geser 1 jari = geser peta · 2 jari = zoom & putar · tarik ikon orang kuning ke jalan untuk Mode Jalan'
                                             : 'Seret = geser peta · klik kanan + seret = putar · scroll = zoom · seret ikon orang kuning ke jalan untuk Mode Jalan');
  const lembar = el('aside', 's3d__sheet');
  lembar.setAttribute('aria-live', 'polite');
  const ikonOrang = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.6" r="2.6"/><path d="M8.6 9.2c0-1 .8-1.8 1.8-1.8h3.2c1 0 1.8.8 1.8 1.8v5.2h-1.6V22h-3.6v-7.6H8.6z"/></svg>';
  const kontrol = el('div', 's3d__ctrls',
    `<button type="button" class="s3d__c s3d__peg" aria-label="Mode Jalan: ketuk, atau seret ke jalan" title="Mode Jalan: klik, atau seret ke jalan">${ikonOrang}</button>` +
    '<div class="s3d__zoom"><button type="button" class="s3d__c" data-zoom="-1" aria-label="Perbesar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' +
    '<button type="button" class="s3d__c" data-zoom="1" aria-label="Perkecil"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button></div>');
  const kartuJalan = el('div', 's3d__kartu s3d__sv',
    '<button type="button" class="s3d__c" aria-label="Kembali ke peta" title="Kembali ke peta (Esc)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>' +
    '<div><b>Mode Jalan</b><small>Kawa Living</small></div>');
  const petunjuk = el('p', 's3d__hint s3d__sv mati');
  const petaMini = el('canvas', 's3d__mini s3d__sv');
  petaMini.setAttribute('aria-label', 'Peta mini, ketuk untuk berpindah');
  const bayangOrang = el('div', 's3d__ghost', '<svg width="34" height="44" viewBox="0 0 24 31" aria-hidden="true"><ellipse cx="12" cy="29.5" rx="5" ry="1.5" fill="rgba(0,0,0,.35)"/><circle cx="12" cy="4.6" r="3" fill="#f5b400" stroke="#3b2a00" stroke-width=".8"/><path d="M8 9.6c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v6.2h-1.8V28h-4.4V15.8H8z" fill="#f5b400" stroke="#3b2a00" stroke-width=".8"/></svg>');
  bayangOrang.hidden = true;
  document.body.appendChild(bayangOrang);
  panggung.append(muat, tombolHome, caraPakai, kartuJalan, petunjuk, petaMini, kontrol);
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
  kamera.rotation.order = 'YXZ';
  // MapControls = gaya Google Maps: seret menggeser, klik kanan / dua jari memutar.
  const kendali = new MapControls(kamera, renderer.domElement);
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
    m.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !HP; o.receiveShadow = !HP;
      // Dinding = material bawaan putih. Tanpa environment map, sisi yang
      // tidak kena matahari jadi abu-abu; sedikit emissive membuatnya tetap
      // terbaca putih tapi masih ada bayangan halus. Atap memakai material
      // bawaan yang sama, tapi diganti atapMat per kavling, jadi tidak ikut.
      if (o.material.name === 'material' && !o.userData.atap && o.material.emissive) {
        o.material.emissive.set(0xffffff);
        o.material.emissiveIntensity = 0.32;
      }
    });
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
    else { kendali.target.copy(target); kamera.position.copy(posisi); kamera.lookAt(target); perluGambar = true; }
  }
  function poseKavling(k) {
    const target = new THREE.Vector3(k.pusat[0], k.tinggi / 2, k.pusat[1]);
    // Pandang dari depan rumah, sedikit menyerong & dari atas.
    const depan = new THREE.Vector3(k.arah[0], 0, k.arah[1]).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    const posisi = target.clone().addScaledVector(depan.multiplyScalar(Math.cos(0.75)).setY(Math.sin(0.75)).normalize(), HP ? 55 : 45);
    return { target, posisi };
  }
  function terbangKe(k) {
    const { target, posisi } = poseKavling(k);
    terbang(target, posisi);
  }
  /* Peta tidak boleh tergeser jauh dari kawasan. */
  const kotakKawasan = new THREE.Box3().setFromPoints(titikBatas).expandByScalar(25);
  function jagaDiKawasan() {
    const t = kendali.target;
    const x = Math.min(kotakKawasan.max.x, Math.max(kotakKawasan.min.x, t.x));
    const z = Math.min(kotakKawasan.max.z, Math.max(kotakKawasan.min.z, t.z));
    if (x !== t.x || z !== t.z) { kamera.position.x += x - t.x; kamera.position.z += z - t.z; t.x = x; t.z = z; }
  }

  /* ── ukuran & loop render (hanya menggambar saat ada perubahan) ── */
  let perluGambar = true;
  function ukur() {
    const w = panggung.clientWidth, h = panggung.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    skalaLabel();
  }
  function skalaLabel() {
    kamera.updateProjectionMatrix();
    // Sprite sizeAttenuation:false: tinggi di layar = scale · h / (2·tan(fov/2)).
    const skala = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) / (panggung.clientHeight || 1);
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
  let terakhir = performance.now();
  function putar(now) {
    raf = 0;
    if (!terlihat) return;
    const dt = Math.min(0.1, Math.max(0, (now - terakhir) / 1000));
    terakhir = now;
    if (transisi || sv.on) {
      // Mode jalan & transisinya digambar tiap frame.
      if (transisi) langkahTransisi(now); else langkahJalan(dt);
      if (sv.on) gambarPetaMini();
      renderer.render(scene, kamera);
      perluGambar = false;
    } else {
      const gerak = langkahTween(now);
      const ubah = kendali.update();
      jagaDiKawasan();
      if (gerak || ubah || perluGambar) {
        renderer.render(scene, kamera);
        perluGambar = false;
      }
    }
    raf = requestAnimationFrame(putar);
  }
  raf = requestAnimationFrame(putar);
  tombolHome.addEventListener('click', () => { pilih(null, false); lihatSemua(); });

  /* ── Mode Jalan (seperti Google Street View) ─────────────
     Kamera setinggi mata berdiri di jalan. Seret = menoleh, ketuk
     jalan / panah = berjalan, ketuk rumah = menghadap rumahnya.
     Area yang bisa dilalui = poligon jalan DWG dikurangi lubangnya
     (+ jalan desa), dirasterkan per 1 m sekali saat pertama dipakai. */
  const MATA = 1.6, SEL = 1;
  const batasAntara = (v, a, b) => Math.min(b, Math.max(a, v));
  const selisihSudut = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  const yawKe = (dx, dz) => Math.atan2(-dx, -dz);

  let grid = null;
  function siapkanGrid() {
    if (grid) return;
    const lubang = peta.jalan.lubang || [];
    const semua = [...peta.jalan.luar, ...(peta.jalanDesa || [])];
    const x0 = Math.min(...semua.map(p => p[0])) - 2, z0 = Math.min(...semua.map(p => p[1])) - 2;
    const nx = Math.ceil((Math.max(...semua.map(p => p[0])) + 2 - x0) / SEL);
    const nz = Math.ceil((Math.max(...semua.map(p => p[1])) + 2 - z0) / SEL);
    const mentah = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const p = [x0 + (i + 0.5) * SEL, z0 + (j + 0.5) * SEL];
      if ((didalam(p, peta.jalan.luar) && !lubang.some(h => didalam(p, h))) || (peta.jalanDesa && didalam(p, peta.jalanDesa))) mentah[j * nx + i] = 1;
    }
    // Kikis satu sel dari tepi supaya kamera tidak menempel ke rumah / pagar.
    const sel = mentah.slice();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (mentah[k] && (i === 0 || j === 0 || i === nx - 1 || j === nz - 1 || !mentah[k - 1] || !mentah[k + 1] || !mentah[k - nx] || !mentah[k + nx])) sel[k] = 0;
    }
    grid = { x0, z0, nx, nz, sel };
  }
  const indeksSel = (x, z) => {
    const i = Math.floor((x - grid.x0) / SEL), j = Math.floor((z - grid.z0) / SEL);
    return i >= 0 && j >= 0 && i < grid.nx && j < grid.nz ? j * grid.nx + i : -1;
  };
  const bisaJalan = (x, z) => { const k = indeksSel(x, z); return k >= 0 && grid.sel[k] === 1; };
  const tengahSel = k => ({ x: grid.x0 + (k % grid.nx + 0.5) * SEL, z: grid.z0 + (Math.floor(k / grid.nx) + 0.5) * SEL });
  /* Titik jalan terdekat (atau null kalau lebih dari `maks` meter). */
  function keJalan(x, z, maks = 40) {
    if (bisaJalan(x, z)) return { x, z, d: 0 };
    const ci = Math.floor((x - grid.x0) / SEL), cj = Math.floor((z - grid.z0) / SEL);
    let best = null, bd = Infinity;
    for (let r = 1; r <= maks / SEL; r++) {
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di, j = cj + dj;
        if (i < 0 || j < 0 || i >= grid.nx || j >= grid.nz || !grid.sel[j * grid.nx + i]) continue;
        const c = tengahSel(j * grid.nx + i), d = Math.hypot(c.x - x, c.z - z);
        if (d < bd) { bd = d; best = c; }
      }
      if (best && bd <= r * SEL) break;
    }
    return best && bd <= maks ? { ...best, d: bd } : null;
  }
  function lurus(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.4);
    for (let i = 1; i <= n; i++) if (!bisaJalan(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n)) return false;
    return true;
  }
  /* Rute di jaringan jalan: A* 8 arah di grid, lalu dipangkas jadi
     potongan-potongan lurus (tidak menembus rumah). */
  function cariRute(a, b) {
    if (lurus(a, b)) return [b];
    const { nx, nz, sel } = grid, N = nx * nz;
    const ka = indeksSel(a.x, a.z), kb = indeksSel(b.x, b.z);
    if (ka < 0 || kb < 0 || !sel[ka] || !sel[kb]) return null;
    const biaya = new Float32Array(N).fill(Infinity), asal = new Int32Array(N).fill(-1), tutup = new Uint8Array(N);
    const antre = [];
    const masuk = (f, k) => {
      antre.push([f, k]);
      for (let i = antre.length - 1; i > 0;) { const p = (i - 1) >> 1; if (antre[p][0] <= antre[i][0]) break; [antre[p], antre[i]] = [antre[i], antre[p]]; i = p; }
    };
    const keluar = () => {
      const top = antre[0], akhir = antre.pop();
      if (antre.length) {
        antre[0] = akhir;
        for (let i = 0; ;) {
          const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < antre.length && antre[l][0] < antre[m][0]) m = l;
          if (r < antre.length && antre[r][0] < antre[m][0]) m = r;
          if (m === i) break;
          [antre[m], antre[i]] = [antre[i], antre[m]]; i = m;
        }
      }
      return top;
    };
    const bi = kb % nx, bj = Math.floor(kb / nx);
    const h = k => Math.hypot(k % nx - bi, Math.floor(k / nx) - bj);
    const tetangga = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    biaya[ka] = 0; masuk(h(ka), ka);
    while (antre.length) {
      const k = keluar()[1];
      if (k === kb) break;
      if (tutup[k]) continue;
      tutup[k] = 1;
      const i = k % nx, j = Math.floor(k / nx);
      for (const [di, dj, c] of tetangga) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const nk = nj * nx + ni;
        if (!sel[nk] || tutup[nk] || (di && dj && (!sel[j * nx + ni] || !sel[nj * nx + i]))) continue;
        const nb = biaya[k] + c;
        if (nb < biaya[nk]) { biaya[nk] = nb; asal[nk] = k; masuk(nb + h(nk), nk); }
      }
    }
    if (asal[kb] < 0) return null;
    const titik = [];
    for (let k = asal[kb]; k !== ka && k >= 0; k = asal[k]) titik.push(tengahSel(k));
    titik.reverse(); titik.push(b);
    const rute = [];
    for (let dari = a, i = 0; i < titik.length;) {
      let j = titik.length - 1;
      while (j > i && !lurus(dari, titik[j])) j--;
      rute.push(titik[j]); dari = titik[j]; i = j + 1;
    }
    return rute;
  }
  /* Arah jalan yang bisa ditempuh dari sebuah titik (untuk panah). */
  function arahJalan(x, z) {
    const n = 32, bebas = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
      let d = 0;
      while (d < 30 && bisaJalan(x + dx * (d + 0.5), z + dz * (d + 0.5))) d += 0.5;
      bebas.push(d);
    }
    const puncak = [];
    bebas.forEach((d, i) => { if (d >= 7 && d >= bebas[(i + n - 1) % n] && d >= bebas[(i + 1) % n]) puncak.push({ i, d }); });
    puncak.sort((p, q) => q.d - p.d);
    const hasil = [];
    puncak.forEach(p => { if (hasil.every(q => Math.min(Math.abs(q.i - p.i), n - Math.abs(q.i - p.i)) > 4)) hasil.push(p); });
    return hasil.slice(0, 4).map(p => { const a = p.i / n * Math.PI * 2; return { dx: Math.sin(a), dz: Math.cos(a), d: p.d }; });
  }

  const sv = { on: false, pos: new THREE.Vector3(), yaw: 0, pitch: 0, yawTuju: 0, pitchTuju: 0, fov: 70, fovTuju: 70,
               rute: [], laju: 10, tiba: null, arah: [], arahDari: null };
  const tombolTekan = new Set();
  const langit = (() => {
    const c = document.createElement('canvas'); c.width = 2; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#8fbfe6'); gr.addColorStop(0.55, '#d6e7f0'); gr.addColorStop(1, '#e4ece6');
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const kabutPeta = scene.fog, kabutJalan = new THREE.Fog(0xd6e7f0, 80, 320);

  // Panah putih di jalan.
  const bentukPanah = new THREE.Shape();
  [[0, 0.75], [0.85, -0.1], [0.85, -0.5], [0, 0.33], [-0.85, -0.5], [-0.85, -0.1]].forEach(([x, y], i) => (i ? bentukPanah.lineTo(x, y) : bentukPanah.moveTo(x, y)));
  const geoPanah = new THREE.ShapeGeometry(bentukPanah).rotateX(-Math.PI / 2);
  const panah = [0, 1, 2, 3].map(() => {
    const m = new THREE.Mesh(geoPanah, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false }));
    m.visible = false; m.renderOrder = 5; scene.add(m); return m;
  });
  // Kursor lingkaran di jalan.
  const kursor = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.78, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
  kursor.add(new THREE.Mesh(new THREE.CircleGeometry(0.55, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, fog: false, depthWrite: false })));
  kursor.visible = false; kursor.renderOrder = 5; scene.add(kursor);
  // Sorotan biru jalan saat ikon orang diseret (seperti garis biru di Google Maps).
  const sorotJalan = new THREE.Group();
  {
    const mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55, depthWrite: false });
    sorotJalan.add(datar(peta.jalan.luar, 0.1, mat, peta.jalan.lubang || []));
    if (peta.jalanDesa) sorotJalan.add(datar(peta.jalanDesa, 0.1, mat));
    sorotJalan.children.forEach(m => (m.receiveShadow = false));
  }
  sorotJalan.visible = false; scene.add(sorotJalan);

  /* Transisi kamera antar mode (posisi, arah, fov sekaligus). */
  let transisi = null;
  function mulaiTransisi(posisi, quat, fov, selesai) {
    transisi = { p0: kamera.position.clone(), q0: kamera.quaternion.clone(), f0: kamera.fov,
                 p1: posisi.clone(), q1: quat.clone(), f1: fov, t0: performance.now(), ms: GERAK_HALUS ? 1100 : 1, selesai };
  }
  function langkahTransisi(now) {
    const T = transisi, t = Math.min(1, (now - T.t0) / T.ms);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    kamera.position.lerpVectors(T.p0, T.p1, e);
    kamera.quaternion.slerpQuaternions(T.q0, T.q1, e);
    kamera.fov = T.f0 + (T.f1 - T.f0) * e;
    skalaLabel();
    if (t >= 1) { transisi = null; T.selesai && T.selesai(); }
  }

  function arahKamera() {
    const v = new THREE.Vector3(); kamera.getWorldDirection(v);
    return { dx: v.x, dz: v.z };
  }
  /* Hadap ke arah jalan yang paling dekat dengan arah kamera sekarang. */
  function yawAwal(x, z) {
    const { dx, dz } = arahKamera(), yk = yawKe(dx, dz);
    const opsi = arahJalan(x, z);
    if (!opsi.length) return yk;
    opsi.sort((p, q) => Math.abs(selisihSudut(yawKe(p.dx, p.dz), yk)) - Math.abs(selisihSudut(yawKe(q.dx, q.dz), yk)));
    return yawKe(opsi[0].dx, opsi[0].dz);
  }
  function masukJalan(x, z, yaw, pitch = -0.06) {
    siapkanGrid();
    sv.on = true; kendali.enabled = false; tween = null; tombolTekan.clear();
    sv.pos.set(x, MATA, z); sv.rute = []; sv.tiba = null; sv.arahDari = null;
    sv.yaw = sv.yawTuju = yaw; sv.pitch = sv.pitchTuju = pitch;
    sv.fov = sv.fovTuju = kamera.aspect < 1 ? 80 : 68;
    kamera.near = 0.2;
    scene.background = langit; scene.fog = kabutJalan;
    labelFasum.forEach(l => (l.visible = false));   // label tembus dinding membingungkan di jalan
    akar.classList.add('s3d--jalan');
    mulaiTransisi(sv.pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')), sv.fov);
    tunjukkanPetunjuk();
    gambarLembar();
  }
  function keluarJalan() {
    if (!sv.on) return;
    sv.on = false; tombolTekan.clear(); sv.rute = []; sv.tiba = null;
    panah.forEach(p => (p.visible = false)); kursor.visible = false;
    scene.background = null; scene.fog = kabutPeta;
    labelFasum.forEach(l => (l.visible = true));
    akar.classList.remove('s3d--jalan');
    const { target, posisi } = terpilih ? poseKavling(terpilih) : posisiRumah();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(posisi, target, kamera.up));
    mulaiTransisi(posisi, q, 35, () => {
      kamera.near = 1; kamera.updateProjectionMatrix();
      kendali.target.copy(target); kendali.enabled = true; kendali.update();
      perluGambar = true;
    });
    gambarLembar();
  }
  function jalanKe(x, z, tiba) {
    const t = keJalan(x, z);
    if (!t) return;
    const rute = cariRute({ x: sv.pos.x, z: sv.pos.z }, t);
    if (!rute) return;
    let L = 0, p = sv.pos;
    rute.forEach(q => { L += Math.hypot(q.x - p.x, q.z - p.z); p = q; });
    sv.rute = rute; sv.laju = batasAntara(L / 1.6, 8, 45); sv.tiba = tiba || null;
    sembunyikanPetunjuk();
  }
  function hadapKe(x, y, z) {
    const dx = x - sv.pos.x, dz = z - sv.pos.z;
    sv.yawTuju = sv.yaw + selisihSudut(yawKe(dx, dz), sv.yaw);
    sv.pitchTuju = batasAntara(Math.atan2(y - MATA, Math.hypot(dx, dz)), -0.4, 0.4);
  }
  const titikDepan = k => keJalan(k.muka[0] + k.arah[0] * 4, k.muka[1] + k.arah[1] * 4);
  function kunjungi(k) {
    if (!sv.on) siapkanGrid();
    const s = titikDepan(k);
    if (!s) return;
    const [hx, hy, hz] = [k.pusat[0], k.tinggi * 0.45, k.pusat[1]];
    if (!sv.on) {
      const dx = hx - s.x, dz = hz - s.z;
      masukJalan(s.x, s.z, yawKe(dx, dz), batasAntara(Math.atan2(hy - MATA, Math.hypot(dx, dz)), -0.4, 0.4));
    } else jalanKe(s.x, s.z, () => hadapKe(hx, hy, hz));
  }
  /* Masuk dari gerbang: berdiri di depan gerbang, menghadap ke dalam kawasan. */
  function masukGerbang() {
    siapkanGrid();
    const [a, b] = peta.gerbang;
    let nx = -(b[1] - a[1]), nz = b[0] - a[0];
    const L = Math.hypot(nx, nz); nx /= L; nz /= L;
    if (!didalam([gerbangTengah[0] + nx * 6, gerbangTengah[1] + nz * 6], peta.batas)) { nx = -nx; nz = -nz; }
    const luar = keJalan(gerbangTengah[0] - nx * 9, gerbangTengah[1] - nz * 9, 4);
    const s = luar || keJalan(gerbangTengah[0] + nx * 5, gerbangTengah[1] + nz * 5);
    if (s) masukJalan(s.x, s.z, yawKe(nx, nz));
  }

  function langkahJalan(dt) {
    const maju = (tombolTekan.has('arrowup') || tombolTekan.has('w')) - (tombolTekan.has('arrowdown') || tombolTekan.has('s'));
    const belok = (tombolTekan.has('arrowleft') || tombolTekan.has('a')) - (tombolTekan.has('arrowright') || tombolTekan.has('d'));
    if (belok) { sv.yaw += belok * 1.7 * dt; sv.yawTuju = sv.yaw; }
    if (maju) {
      sv.rute = []; sv.tiba = null;
      const dx = -Math.sin(sv.yaw) * maju * 9 * dt, dz = -Math.cos(sv.yaw) * maju * 9 * dt;
      // Menabrak tepi jalan → meluncur sejajar tepi.
      if (bisaJalan(sv.pos.x + dx, sv.pos.z + dz)) { sv.pos.x += dx; sv.pos.z += dz; }
      else if (bisaJalan(sv.pos.x + dx, sv.pos.z)) sv.pos.x += dx;
      else if (bisaJalan(sv.pos.x, sv.pos.z + dz)) sv.pos.z += dz;
    }
    if (sv.rute.length) {
      const t = sv.rute[0], dx = t.x - sv.pos.x, dz = t.z - sv.pos.z, d = Math.hypot(dx, dz), langkah = sv.laju * dt;
      if (d <= langkah) {
        sv.pos.x = t.x; sv.pos.z = t.z; sv.rute.shift();
        if (!sv.rute.length && sv.tiba) { const f = sv.tiba; sv.tiba = null; f(); }
      } else { sv.pos.x += dx / d * langkah; sv.pos.z += dz / d * langkah; }
    }
    const a = 1 - Math.exp(-dt * 7);
    sv.yaw += selisihSudut(sv.yawTuju, sv.yaw) * a;
    sv.pitch += (sv.pitchTuju - sv.pitch) * a;
    sv.fov += (sv.fovTuju - sv.fov) * a;
    kamera.position.copy(sv.pos);
    kamera.rotation.set(sv.pitch, sv.yaw, 0, 'YXZ');
    if (Math.abs(kamera.fov - sv.fov) > 0.01) { kamera.fov = sv.fov; skalaLabel(); }

    // Panah: dihitung ulang tiap pindah ±0,75 m.
    if (!sv.arahDari || Math.hypot(sv.arahDari.x - sv.pos.x, sv.arahDari.z - sv.pos.z) > 0.75) {
      sv.arah = arahJalan(sv.pos.x, sv.pos.z);
      sv.arahDari = { x: sv.pos.x, z: sv.pos.z };
      perbaruiLokasi();
    }
    panah.forEach((m, i) => {
      const r = sv.arah[i];
      m.visible = !!r;
      if (!r) return;
      m.userData.arah = r;
      m.position.set(sv.pos.x + r.dx * 3.6, 0.12, sv.pos.z + r.dz * 3.6);
      m.rotation.y = yawKe(r.dx, r.dz);
    });
  }

  const lokasiEl = kartuJalan.querySelector('small');
  function perbaruiLokasi() {
    const { x, z } = sv.pos;
    let teks = peta.jalanDesa && didalam([x, z], peta.jalanDesa) ? 'Jalan desa, depan gerbang' : 'Jalan kawasan';
    let dekat = null, jd = 9;
    kavling.forEach(k => { const d = Math.hypot(k.muka[0] - x, k.muka[1] - z); if (d < jd) { jd = d; dekat = k; } });
    if (terpilih && Math.hypot(terpilih.muka[0] - x, terpilih.muka[1] - z) < 9) dekat = terpilih;   // rumah yang sedang dilihat menang
    if (dekat) teks += ' · ' + (dekat === terpilih ? 'di depan ' : 'dekat ') + dekat.code;
    else {
      let f = null, fd = 30;
      peta.fasum.forEach(q => { const d = Math.hypot(q.pusat[0] - x, q.pusat[1] - z); if (d < fd) { fd = d; f = q; } });
      if (f) teks += ' · dekat ' + f.nama;
    }
    if (lokasiEl.textContent !== teks) lokasiEl.textContent = teks;
  }

  let waktuPetunjuk = 0;
  function tunjukkanPetunjuk() {
    petunjuk.textContent = HP ? 'Geser untuk melihat sekeliling · ketuk jalan atau panah untuk berjalan'
                              : 'Seret untuk melihat sekeliling · klik jalan atau panah untuk berjalan · tombol ↑↓←→ juga bisa';
    petunjuk.classList.remove('mati');
    clearTimeout(waktuPetunjuk);
    waktuPetunjuk = setTimeout(sembunyikanPetunjuk, 7000);
  }
  function sembunyikanPetunjuk() { petunjuk.classList.add('mati'); }

  /* Peta mini: berpusat di posisi kita, arah pandang = kerucut biru. */
  const ctxMini = petaMini.getContext('2d');
  function gambarPetaMini() {
    const W = petaMini.clientWidth;
    if (!W) return;
    const r = Math.min(window.devicePixelRatio || 1, 2);
    if (petaMini.width !== Math.round(W * r)) petaMini.width = petaMini.height = Math.round(W * r);
    const S = petaMini.width, JANGKAU = 45, s = S / (2 * JANGKAU), g = ctxMini;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#d9dfc9'; g.fillRect(0, 0, S, S);
    g.setTransform(s, 0, 0, s, S / 2 - kamera.position.x * s, S / 2 - kamera.position.z * s);
    const poli = t => { t.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z))); g.closePath(); };
    g.fillStyle = '#e6e1d2'; g.beginPath(); poli(peta.batas); g.fill();
    g.fillStyle = '#b5d39a'; peta.taman.forEach(t => { g.beginPath(); poli(t); g.fill(); });
    g.fillStyle = '#ffffff'; g.beginPath(); poli(peta.jalan.luar); (peta.jalan.lubang || []).forEach(poli); g.fill('evenodd');
    if (peta.jalanDesa) { g.beginPath(); poli(peta.jalanDesa); g.fill(); }
    g.fillStyle = '#dcd5c3'; peta.fasum.forEach(f => { g.beginPath(); poli(f.poly); g.fill(); });
    g.lineWidth = 0.3; g.strokeStyle = '#ffffff';
    kavling.forEach(k => {
      g.globalAlpha = tampil(k) ? 1 : 0.3;
      g.fillStyle = STATUS[k.status].css; g.beginPath(); poli(k.poly); g.fill(); g.stroke();
    });
    g.globalAlpha = 1;
    if (terpilih) { g.lineWidth = 1.2; g.strokeStyle = '#f3c64a'; g.beginPath(); poli(terpilih.poly); g.stroke(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const a = Math.atan2(-Math.cos(sv.yaw), -Math.sin(sv.yaw));
    const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * kamera.aspect);
    g.fillStyle = 'rgba(59,130,246,.32)';
    g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S * 0.26, a - hf, a + hf); g.closePath(); g.fill();
    g.beginPath(); g.arc(S / 2, S / 2, 5.5 * r, 0, Math.PI * 2);
    g.fillStyle = '#3b82f6'; g.fill(); g.lineWidth = 2 * r; g.strokeStyle = '#fff'; g.stroke();
  }
  petaMini.addEventListener('click', e => {
    if (!sv.on || transisi) return;
    const r = petaMini.getBoundingClientRect(), k = 90 / r.width;
    jalanKe(kamera.position.x + (e.clientX - r.left - r.width / 2) * k, kamera.position.z + (e.clientY - r.top - r.height / 2) * k);
  });

  /* ── interaksi: ketuk kavling / mode jalan ────────────── */
  const kanvas = renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const bidangTanah = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function arahkanRay(e) {
    const r = kanvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return false;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    kamera.updateMatrixWorld();
    ray.setFromCamera(ndc, kamera);
    return true;
  }
  const kenaTanah = e => (arahkanRay(e) ? ray.ray.intersectPlane(bidangTanah, new THREE.Vector3()) : null);
  function kenaKavling(e) {
    if (!arahkanRay(e)) return null;
    const hit = ray.intersectObjects(kena.filter(h => tampil(h.userData.k)), false)[0];
    return hit ? hit.object.userData.k : null;
  }
  // Di mode jalan: panah > rumah > jalan.
  function kenaJalan(e) {
    if (!arahkanRay(e)) return null;
    const p = ray.intersectObjects(panah.filter(m => m.visible), false)[0];
    if (p) return { jenis: 'panah', obj: p.object };
    const t = ray.ray.intersectPlane(bidangTanah, new THREE.Vector3());
    const jt = t ? t.distanceTo(ray.ray.origin) : Infinity;
    const r = ray.intersectObjects(kena.filter(h => tampil(h.userData.k)), false)[0];
    if (r && r.distance < jt + 0.3) return { jenis: 'rumah', k: r.object.userData.k };
    if (t && jt < 120) {
      const c = keJalan(t.x, t.z, 4);
      if (c) return { jenis: 'jalan', t, c };
    }
    return null;
  }

  let turun = null, cubit = null;
  const jari = new Map();
  kanvas.addEventListener('contextmenu', e => e.preventDefault());
  kanvas.addEventListener('pointerdown', e => {
    turun = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (!sv.on || transisi) return;
    try { kanvas.setPointerCapture(e.pointerId); } catch (_) { /* pointer sudah lepas */ }
    jari.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (jari.size === 2) { const [a, b] = [...jari.values()]; cubit = { d: Math.hypot(a.x - b.x, a.y - b.y), fov: sv.fov }; }
    kursor.visible = false;
    kanvas.style.cursor = 'grabbing';
  });
  kanvas.addEventListener('pointermove', e => {
    if (!sv.on || transisi) {
      if (e.pointerType === 'mouse' && !e.buttons && !transisi) kanvas.style.cursor = kenaKavling(e) ? 'pointer' : 'grab';
      return;
    }
    const p = jari.get(e.pointerId);
    if (p) {
      if (jari.size === 1) {
        // Seret = "memegang" pemandangan, persis Street View.
        const k = THREE.MathUtils.degToRad(sv.fov) / kanvas.clientHeight;
        sv.yaw += (e.clientX - p.x) * k; sv.yawTuju = sv.yaw;
        sv.pitch = batasAntara(sv.pitch + (e.clientY - p.y) * k, -1.2, 1.2); sv.pitchTuju = sv.pitch;
        if (turun && Math.hypot(e.clientX - turun.x, e.clientY - turun.y) > 7) sembunyikanPetunjuk();
      }
      p.x = e.clientX; p.y = e.clientY;
      if (jari.size === 2 && cubit) {
        const [a, b] = [...jari.values()];
        sv.fov = sv.fovTuju = batasAntara(cubit.fov * cubit.d / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), 30, 95);
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const h = kenaJalan(e);
    panah.forEach(m => (m.material.opacity = h && h.obj === m ? 1 : 0.85));
    kursor.visible = !!h && h.jenis === 'jalan';
    if (kursor.visible) kursor.position.set(h.t.x, 0.14, h.t.z);
    kanvas.style.cursor = h ? 'pointer' : 'grab';
  });
  function lepasJari(e) {
    jari.delete(e.pointerId);
    if (jari.size < 2) cubit = null;
    if (sv.on) kanvas.style.cursor = 'grab';
  }
  kanvas.addEventListener('pointercancel', e => { lepasJari(e); turun = null; });
  kanvas.addEventListener('pointerleave', () => { kursor.visible = false; });
  kanvas.addEventListener('pointerup', e => {
    const banyakJari = jari.size > 1;
    lepasJari(e);
    if (!turun) return;
    const ketuk = Math.hypot(e.clientX - turun.x, e.clientY - turun.y) <= 6 && performance.now() - turun.t < 600;
    turun = null;
    if (!ketuk || banyakJari || transisi) return;
    if (!sv.on) { const k = kenaKavling(e); if (k) pilih(k); return; }
    const h = kenaJalan(e);
    if (!h) return;
    if (h.jenis === 'panah') {
      const r = h.obj.userData.arah;
      sv.yawTuju = sv.yaw + selisihSudut(yawKe(r.dx, r.dz), sv.yaw); sv.pitchTuju = -0.06;
      const L = Math.min(r.d - 1, 12);
      jalanKe(sv.pos.x + r.dx * L, sv.pos.z + r.dz * L);
    } else if (h.jenis === 'rumah') {
      pilih(h.k, false);
      hadapKe(h.k.pusat[0], h.k.tinggi * 0.45, h.k.pusat[1]);
    } else jalanKe(h.c.x, h.c.z);
  });
  kanvas.addEventListener('wheel', e => {
    if (!sv.on) return;
    e.preventDefault();
    sv.fovTuju = batasAntara(sv.fovTuju + e.deltaY * 0.04, 30, 95);
  }, { passive: false });
  // Klik dua kali di jalan (tampilan peta) = langsung masuk Mode Jalan di titik itu.
  kanvas.addEventListener('dblclick', e => {
    if (sv.on || transisi) return;
    const t = kenaTanah(e);
    if (!t) return;
    siapkanGrid();
    const c = keJalan(t.x, t.z, 3);
    if (c) masukJalan(c.x, c.z, yawAwal(c.x, c.z));
  });
  window.addEventListener('keydown', e => {
    if (!sv.on) return;
    if (e.key === 'Escape') { keluarJalan(); return; }
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k) && !(e.target.closest && e.target.closest('input,textarea,select'))) {
      tombolTekan.add(k); e.preventDefault(); sembunyikanPetunjuk();
    }
  });
  window.addEventListener('keyup', e => tombolTekan.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => tombolTekan.clear());

  /* Ikon orang: ketuk untuk masuk, atau seret ke jalan. */
  const peg = kontrol.querySelector('.s3d__peg');
  let seretPeg = null;
  function titikJatuh(e) {
    const t = kenaTanah(e);
    return t ? keJalan(t.x, t.z, 3) : null;
  }
  const mulaiDariTombol = () => (terpilih ? kunjungi(terpilih) : masukGerbang());
  peg.addEventListener('pointerenter', e => { if (!sv.on && e.pointerType === 'mouse') { sorotJalan.visible = true; perluGambar = true; } });
  peg.addEventListener('pointerleave', () => { if (!seretPeg) { sorotJalan.visible = false; perluGambar = true; } });
  peg.addEventListener('pointerdown', e => {
    if (sv.on || transisi) return;
    e.preventDefault();
    try { peg.setPointerCapture(e.pointerId); } catch (_) { /* pointer sudah lepas */ }
    seretPeg = { x: e.clientX, y: e.clientY, gerak: false };
  });
  peg.addEventListener('pointermove', e => {
    if (!seretPeg) return;
    if (!seretPeg.gerak && Math.hypot(e.clientX - seretPeg.x, e.clientY - seretPeg.y) > 6) {
      seretPeg.gerak = true; siapkanGrid();
      bayangOrang.hidden = false; sorotJalan.visible = true; document.body.classList.add('s3d-seret');
    }
    if (!seretPeg.gerak) return;
    bayangOrang.style.transform = `translate(${e.clientX - 17}px, ${e.clientY - 42}px)`;
    const c = titikJatuh(e);
    bayangOrang.classList.toggle('ok', !!c);
    kursor.visible = !!c;
    if (c) kursor.position.set(c.x, 0.14, c.z);
    perluGambar = true;
  });
  function selesaiSeret() {
    seretPeg = null; bayangOrang.hidden = true; sorotJalan.visible = false; kursor.visible = false;
    document.body.classList.remove('s3d-seret');
    perluGambar = true;
  }
  peg.addEventListener('pointerup', e => {
    if (!seretPeg) return;
    const gerak = seretPeg.gerak, c = gerak ? titikJatuh(e) : null;
    selesaiSeret();
    if (!gerak) mulaiDariTombol();
    else if (c) masukJalan(c.x, c.z, yawAwal(c.x, c.z));
  });
  peg.addEventListener('pointercancel', selesaiSeret);
  peg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !sv.on) { e.preventDefault(); mulaiDariTombol(); } });
  kartuJalan.querySelector('button').addEventListener('click', keluarJalan);
  kontrol.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
    const arah = +b.dataset.zoom;
    if (sv.on) { sv.fovTuju = batasAntara(sv.fovTuju + arah * 12, 30, 95); return; }
    const off = kamera.position.clone().sub(kendali.target);
    off.setLength(batasAntara(off.length() * (arah < 0 ? 0.7 : 1.4), kendali.minDistance, kendali.maxDistance));
    terbang(kendali.target.clone(), kendali.target.clone().add(off), 400);
  }));

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
      skalaLabel();
      if (terbangkan) { if (sv.on) kunjungi(k); else terbangKe(k); }
      sv.arahDari = null;
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
    const keJalanBtn = el('button', 's3d__jalan', ikonOrang.replace('currentColor', '#e0a400') + (sv.on ? 'Berjalan ke depan rumah ini' : 'Lihat dari jalan'));
    keJalanBtn.type = 'button';
    keJalanBtn.addEventListener('click', () => kunjungi(k));
    f.appendChild(keJalanBtn);
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
    jeda() { terlihat = false; tombolTekan.clear(); },
    lanjut() { terlihat = true; if (!raf) raf = requestAnimationFrame(putar); ukur(); },
  };
}
