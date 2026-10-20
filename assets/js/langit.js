/* Langit JGS — latar satu hari penuh yang mengikuti guliran halaman.
 *
 * Pagi di puncak halaman: matahari terbit dari kiri di balik deretan rumah
 * JGS. Makin digulir makin siang, lalu sore, matahari terbenam di kanan, dan
 * di ujung bawah malam berbintang dengan bulan dan burung hantu melintas.
 *
 * Pakai:  <canvas id="langit"></canvas>  +  <script src="/assets/js/langit.js" defer></script>
 * Kanvas dipasang position:fixed oleh CSS halaman. Skrip ini hanya menggambar.
 *
 * Rumah-rumah di cakrawala digambar sebagai siluet vektor dari empat tipe
 * sungguhan: Okina (Kawa Living), Bhama dan Andrawina (Tentrem Bhumi), serta
 * Abirama (Tentrem Jiwo), ditambah gerbang, pos satpam, lampu jalan, dan pohon.
 * Jendelanya menyala saat malam.
 */
(function () {
  var cv = document.getElementById('langit');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, p = 0, t = 0, perlu = true, tampak = true;
  var redam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function acak(n) { var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function halus(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); }
  function camp(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a === undefined ? 1 : a) + ')'; }

  var bintang = [], daun = [], awan = [], burung = [];
  for (var i = 0; i < 170; i++) bintang.push({ x: acak(i), y: acak(i + 500) * 0.72, r: 0.6 + acak(i + 900) * 1.4, k: acak(i + 1300) });
  for (var j = 0; j < 36; j++) daun.push({ x: acak(j + 77) * 1.2 - 0.1, y: acak(j + 177), s: 5 + acak(j + 277) * 8, v: 0.25 + acak(j + 377) * 0.5, rot: acak(j + 477) * 6.28, w: acak(j + 577), warna: acak(j + 677) });
  for (var k = 0; k < 6; k++) awan.push({ x: acak(k + 31), y: 0.1 + acak(k + 41) * 0.3, s: 0.12 + acak(k + 51) * 0.16, v: 0.004 + acak(k + 61) * 0.006 });
  var hantu = [{ x: 0.1, y: 0.3, v: 0.7, f: 0 }, { x: 0.55, y: 0.42, v: 0.55, f: 2.1 }, { x: 0.85, y: 0.22, v: 0.85, f: 4 }];
  for (var b = 0; b < 7; b++) burung.push({ x: acak(b + 11) * 1.3 - 0.15, y: 0.14 + acak(b + 21) * 0.22, v: 0.6 + acak(b + 31) * 0.6, f: acak(b + 41) * 6 });

  // Warna langit per fase: [p, atas, cakrawala]. p=0 pagi, p=1 malam.
  var fase = [
    [0.00, [60, 70, 140], [255, 170, 100]],   // fajar, matahari baru muncul
    [0.08, [100, 150, 220], [255, 205, 140]], // pagi
    [0.22, [110, 172, 235], [222, 238, 246]], // siang
    [0.36, [112, 168, 228], [238, 232, 210]], // siang menjelang sore
    [0.46, [150, 140, 190], [255, 180, 110]], // sore keemasan
    [0.54, [70, 60, 130], [240, 120, 90]],    // senja
    [0.62, [20, 32, 78], [60, 60, 120]],      // magrib
    [0.80, [11, 20, 48], [24, 38, 88]],       // tengah malam
    [1.00, [30, 42, 90], [90, 80, 120]]       // menjelang subuh
  ];
  function warnaLangit(p) {
    for (var i = 1; i < fase.length; i++) if (p <= fase[i][0]) { var u = (p - fase[i - 1][0]) / (fase[i][0] - fase[i - 1][0]); return [camp(fase[i - 1][1], fase[i][1], u), camp(fase[i - 1][2], fase[i][2], u)]; }
    return [fase[fase.length - 1][1], fase[fase.length - 1][2]];
  }
  // Terang hari: 0 malam, 1 siang.
  function terang(p) { return halus((p - 0.02) / 0.16) * (1 - halus((p - 0.42) / 0.16)); }
  function malam(p) { return halus((p - 0.56) / 0.1) * (1 - 0.25 * halus((p - 0.94) / 0.06)); }

  // ---------------------------------------------------------------- rumah
  // Tiap rumah digambar dalam kotak satuan: lebar 1, tinggi menurut tipenya,
  // titik (0,0) di kiri bawah. ctx sudah diskalakan ke ukuran sebenarnya.
  function jendela(x, y, w, h, nyala) { ctx.fillStyle = nyala; ctx.fillRect(x, y, w, h); }
  var RUMAH = {
    okina: function (ink, nyala) { // dua lantai ramping, atap miring satu sisi, kanopi carport
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -1.05); ctx.lineTo(0.42, -1.3); ctx.lineTo(0.42, -0.98); ctx.lineTo(0.55, -0.98); ctx.lineTo(0.55, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(0.55, -0.62, 0.45, 0.05); // kanopi
      ctx.fillRect(0.95, -0.62, 0.04, 0.62); ctx.fillRect(0.6, -0.62, 0.03, 0.62);
      ctx.fillRect(0.55, -0.1, 0.45, 0.1); // teras carport
      jendela(0.22, -0.95, 0.14, 0.26, nyala); jendela(0.22, -0.46, 0.14, 0.3, nyala);
    },
    bhama: function (ink, nyala) { // satu lantai, atap limas lebar, teras berpilar
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.moveTo(-0.08, -0.5); ctx.lineTo(0.3, -0.82); ctx.lineTo(0.7, -0.82); ctx.lineTo(1.08, -0.5); ctx.closePath(); ctx.fill();
      ctx.fillRect(0, -0.5, 1, 0.5);
      ctx.fillRect(0.38, -0.58, 0.3, 0.08); // teras maju
      jendela(0.1, -0.38, 0.16, 0.28, nyala); jendela(0.74, -0.38, 0.16, 0.28, nyala); jendela(0.46, -0.4, 0.12, 0.4, nyala);
    },
    andrawina: function (ink, nyala) { // dua lantai, atap limas, kanopi lebar
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.moveTo(0.02, -1.0); ctx.lineTo(0.3, -1.25); ctx.lineTo(0.7, -1.25); ctx.lineTo(0.98, -1.0); ctx.closePath(); ctx.fill();
      ctx.fillRect(0.08, -1.0, 0.84, 1.0);
      ctx.fillRect(-0.05, -0.52, 1.1, 0.05); ctx.fillRect(0.0, -0.52, 0.03, 0.52); ctx.fillRect(0.97, -0.52, 0.03, 0.52);
      jendela(0.3, -0.9, 0.4, 0.26, nyala); jendela(0.14, -0.4, 0.14, 0.3, nyala); jendela(0.72, -0.4, 0.14, 0.3, nyala);
    },
    abirama: function (ink, nyala) { // dua lantai, atap pelana miring, kanopi besi
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -1.0); ctx.lineTo(0.1, -1.22); ctx.lineTo(0.75, -1.22); ctx.lineTo(0.82, -1.0); ctx.lineTo(0.82, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(0.35, -0.62, 0.65, 0.05); ctx.fillRect(0.95, -0.62, 0.04, 0.62); ctx.fillRect(0.42, -0.62, 0.03, 0.62);
      jendela(0.3, -0.92, 0.26, 0.24, nyala); jendela(0.1, -0.42, 0.14, 0.3, nyala); jendela(0.56, -0.42, 0.16, 0.3, nyala);
    },
    gerbang: function (ink, nyala) { // gerbang perumahan dengan papan nama dan pos satpam
      ctx.fillStyle = ink;
      ctx.fillRect(0, -0.7, 0.1, 0.7); ctx.fillRect(0.9, -0.7, 0.1, 0.7);
      ctx.fillRect(-0.05, -0.78, 1.1, 0.1);
      ctx.fillRect(1.0, -0.5, 0.42, 0.5); ctx.beginPath(); ctx.moveTo(0.96, -0.5); ctx.lineTo(1.21, -0.66); ctx.lineTo(1.46, -0.5); ctx.closePath(); ctx.fill();
      jendela(1.12, -0.4, 0.18, 0.16, nyala);
      ctx.fillStyle = nyala; ctx.fillRect(0.25, -0.76, 0.5, 0.06); // papan nama menyala
    },
    lampu: function (ink, nyala) {
      ctx.fillStyle = ink; ctx.fillRect(0.46, -0.9, 0.04, 0.9); ctx.fillRect(0.46, -0.9, 0.22, 0.03);
      ctx.fillStyle = nyala; ctx.beginPath(); ctx.arc(0.68, -0.86, 0.05, 0, 6.283); ctx.fill();
    },
    pohon: function (ink) {
      ctx.fillStyle = ink; ctx.fillRect(0.46, -0.45, 0.08, 0.45);
      ctx.beginPath(); ctx.arc(0.5, -0.62, 0.3, 0, 6.283); ctx.arc(0.3, -0.48, 0.22, 0, 6.283); ctx.arc(0.7, -0.5, 0.22, 0, 6.283); ctx.fill();
    },
    pohonTinggi: function (ink) {
      ctx.fillStyle = ink; ctx.fillRect(0.47, -0.7, 0.06, 0.7);
      ctx.beginPath(); ctx.moveTo(0.5, -1.25); ctx.lineTo(0.78, -0.75); ctx.lineTo(0.22, -0.75); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.5, -1.0); ctx.lineTo(0.84, -0.5); ctx.lineTo(0.16, -0.5); ctx.closePath(); ctx.fill();
    }
  };
  // Susunan deretan: tipe dan lebar relatif (satuan). Diulang sampai memenuhi layar.
  var DERET = [
    ['pohonTinggi', 0.9], ['gerbang', 1.5], ['lampu', 0.6], ['okina', 1.0], ['okina', 1.0], ['pohon', 0.8], ['lampu', 0.6],
    ['bhama', 1.3], ['pohon', 0.8], ['andrawina', 1.2], ['lampu', 0.6], ['abirama', 1.15], ['pohonTinggi', 0.9],
    ['okina', 1.0], ['lampu', 0.6], ['bhama', 1.3], ['pohon', 0.8], ['abirama', 1.15], ['andrawina', 1.2], ['pohonTinggi', 0.9]
  ];
  function gambarBukit(ink, yDasar, amp, ofs) {
    ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(0, H);
    for (var x = 0; x <= W; x += 10) { var y = yDasar - (Math.sin(x / W * 3.1 + ofs) * 0.5 + 0.5) * H * amp - Math.sin(x / W * 11 + ofs * 2) * H * 0.01; ctx.lineTo(x, y); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function gambarDeret(ink, nyala, yDasar, satuan, mulai) {
    var x = mulai, i = 0;
    while (x < W + satuan * 2) {
      var d = DERET[i % DERET.length], f = RUMAH[d[0]];
      ctx.save(); ctx.translate(x, yDasar); ctx.scale(satuan, satuan);
      f(ink, nyala); ctx.restore();
      x += d[1] * satuan + satuan * 0.22; i++;
    }
  }

  // ---------------------------------------------------------------- gambar
  function gambar() {
    var langit = warnaLangit(p), tr = terang(p), ml = malam(p);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(langit[0])); g.addColorStop(0.7, rgb(langit[1])); g.addColorStop(1, rgb(camp(langit[1], [20, 30, 40], 0.3)));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // bintang di malam
    if (ml > 0) bintang.forEach(function (b) { var kerlip = 0.6 + 0.4 * Math.sin(t * 0.002 * (1 + b.k) + b.k * 10); ctx.fillStyle = 'rgba(255,255,255,' + (ml * kerlip * 0.9) + ')'; ctx.beginPath(); ctx.arc(b.x * W, b.y * H, b.r, 0, 6.283); ctx.fill(); });

    // matahari: terbit kiri (p=0), puncak (p≈0.4), terbenam kanan (p≈0.8)
    var uL = Math.min(1, p / 0.58), tinggi = Math.sin(uL * Math.PI);
    var sx = W * (0.05 + uL * 0.9), sy = H * (0.86 - tinggi * 0.7), rS = Math.min(W, H) * 0.07;
    if (p < 0.62) {
      var aS = 1 - halus((p - 0.56) / 0.06), merah = 1 - tinggi, ws = [255, 200 + (1 - merah) * 45, 90 + (1 - merah) * 110];
      var sinar = ctx.createRadialGradient(sx, sy, rS * 0.6, sx, sy, rS * 6); sinar.addColorStop(0, rgb(ws, 0.5 * aS)); sinar.addColorStop(1, rgb(ws, 0));
      ctx.fillStyle = sinar; ctx.fillRect(sx - rS * 6, sy - rS * 6, rS * 12, rS * 12);
      ctx.fillStyle = rgb(ws, aS); ctx.beginPath(); ctx.arc(sx, sy, rS, 0, 6.283); ctx.fill();
    }
    // bulan naik dari kanan saat malam
    if (ml > 0) {
      // busur yang sama dengan matahari: terbit dari kiri saat magrib, mencapai puncak di ujung halaman
      // busur penuh: terbit dari kiri saat magrib, puncak tengah malam, tenggelam di kanan menjelang subuh
      var uM = Math.min(1, Math.max(0, (p - 0.58) / 0.42)), tM = Math.sin(uM * Math.PI);
      var bx = W * (0.05 + uM * 0.9), by = H * (0.86 - tM * 0.7), rB = Math.min(W, H) * 0.05;
      ctx.save(); ctx.globalAlpha = ml;
      var cahaya = ctx.createRadialGradient(bx, by, rB * 0.8, bx, by, rB * 4); cahaya.addColorStop(0, 'rgba(255,244,214,.35)'); cahaya.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = cahaya; ctx.fillRect(bx - rB * 4, by - rB * 4, rB * 8, rB * 8);
      ctx.beginPath(); ctx.arc(bx, by, rB, 0, 6.283); ctx.clip();
      ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(bx, by, rB, 0, 6.283); ctx.arc(bx - rB * 0.38, by - rB * 0.18, rB * 0.86, 0, 6.283); ctx.fill('evenodd'); // sabit
      ctx.restore();
    }
    // awan tipis di siang
    if (tr > 0.05) awan.forEach(function (a) { var ax = ((a.x + t * a.v * 0.00002) % 1.3 - 0.15) * W, ay = a.y * H, as = a.s * W; ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * tr) + ')'; ctx.beginPath(); ctx.ellipse(ax, ay, as, as * 0.32, 0, 0, 6.283); ctx.ellipse(ax - as * 0.45, ay + as * 0.08, as * 0.55, as * 0.25, 0, 0, 6.283); ctx.ellipse(ax + as * 0.5, ay + as * 0.1, as * 0.5, as * 0.22, 0, 0, 6.283); ctx.fill(); });
    // burung pagi dan sore (bukan hantu): huruf v kecil
    var aBr = Math.max(halus((p - 0.02) / 0.08) * (1 - halus((p - 0.14) / 0.08)), halus((p - 0.42) / 0.06) * (1 - halus((p - 0.54) / 0.06)));
    if (aBr > 0.02) burung.forEach(function (b) { var bx2 = ((b.x + t * b.v * 0.00004) % 1.3 - 0.15) * W, by2 = (b.y + Math.sin(t * 0.001 * b.v + b.f) * 0.02) * H, s = Math.min(W, H) * 0.012, kp = Math.sin(t * 0.01 * b.v + b.f) * 0.6; ctx.strokeStyle = 'rgba(20,25,50,' + (0.8 * aBr) + ')'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx2 - s, by2 - s * kp); ctx.quadraticCurveTo(bx2 - s * 0.5, by2 + s * 0.3, bx2, by2); ctx.quadraticCurveTo(bx2 + s * 0.5, by2 + s * 0.3, bx2 + s, by2 - s * kp); ctx.stroke(); });
    // burung hantu di malam
    if (ml > 0.02) hantu.forEach(function (h) {
      var hx = ((h.x + t * h.v * 0.00005) % 1.25 - 0.12) * W, hy = (h.y + Math.sin(t * 0.0012 * h.v + h.f) * 0.03) * H, sk = Math.min(W, H) * 0.028, kepak = Math.sin(t * 0.012 * h.v + h.f);
      ctx.save(); ctx.translate(hx, hy); ctx.globalAlpha = ml * 0.95; ctx.fillStyle = '#0a1230'; ctx.strokeStyle = '#0a1230'; ctx.lineWidth = sk * 0.28; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(0, 0, sk * 0.55, sk * 0.38, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(sk * 0.42, -sk * 0.1, sk * 0.3, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sk * 0.25, -sk * 0.35); ctx.lineTo(sk * 0.3, -sk * 0.52); ctx.lineTo(sk * 0.42, -sk * 0.38); ctx.moveTo(sk * 0.6, -sk * 0.35); ctx.lineTo(sk * 0.58, -sk * 0.52); ctx.lineTo(sk * 0.45, -sk * 0.38); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-sk * 0.1, -sk * 0.1); ctx.quadraticCurveTo(-sk * 0.9, -sk * (0.9 + kepak * 0.7), -sk * 1.6, -sk * (0.2 + kepak * 0.9)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sk * 0.1, -sk * 0.1); ctx.quadraticCurveTo(sk * 0.7, -sk * (0.9 + kepak * 0.7), sk * 1.3, -sk * (0.2 + kepak * 0.9)); ctx.stroke();
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.arc(sk * 0.5, -sk * 0.15, sk * 0.07, 0, 6.283); ctx.arc(sk * 0.34, -sk * 0.15, sk * 0.07, 0, 6.283); ctx.fill();
      ctx.restore();
    });

    // bukit jauh dan deretan rumah: gelap di fajar dan malam, kehijauan di siang
    var jauh = camp(camp(langit[1], [8, 14, 36], 0.55), [96, 140, 104], tr * 0.85);
    var dekat = camp([10, 16, 40], [40, 96, 70], tr * 0.9);
    var rumah = camp([12, 18, 44], [34, 48, 84], tr * 0.9);
    var nyala = ml > 0.05 ? 'rgba(255,214,120,' + (0.85 * ml) + ')' : rgb(camp(rumah, [220, 232, 245], tr * 0.7));
    gambarBukit(rgb(jauh), H * 0.82, 0.07, 1.7);
    gambarBukit(rgb(dekat), H * 0.9, 0.03, 0.3);
    var satuan = Math.max(44, Math.min(72, W / 22));
    gambarDeret(rgb(rumah), nyala, H * 0.905, satuan, -satuan * 0.4);
    // jalan di depan deretan
    ctx.fillStyle = rgb(camp([8, 12, 30], [70, 80, 96], tr * 0.8)); ctx.fillRect(0, H * 0.905, W, H);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + tr * 0.3) + ')';
    for (var x = 0; x < W; x += 60) ctx.fillRect(x, H * 0.95, 28, 2);

    // dedaunan beterbangan di siang
    if (tr > 0.02) daun.forEach(function (d) { var dx = ((d.x + t * d.v * 0.00006) % 1.2 - 0.1) * W, dy = (d.y * 0.75 + Math.sin(t * 0.0009 * d.v + d.w * 6) * 0.03) * H, rot = d.rot + t * 0.0015 * d.v; ctx.save(); ctx.translate(dx, dy); ctx.rotate(rot); ctx.globalAlpha = tr * 0.8; ctx.fillStyle = d.warna < 0.5 ? '#6fb36f' : (d.warna < 0.8 ? '#c9a23a' : '#d9773b'); ctx.beginPath(); ctx.ellipse(0, 0, d.s, d.s * 0.45, 0, 0, 6.283); ctx.fill(); ctx.restore(); });
  }

  function ukur() { dpr = Math.min(window.innerWidth < 700 ? 1.5 : 2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); perlu = true; }
  function kemajuan() { var maks = Math.max(1, document.documentElement.scrollHeight - H); p = Math.min(1, Math.max(0, window.scrollY / maks)); perlu = true; }
  function putar(now) { t = now; if (tampak && (perlu || !redam)) { gambar(); perlu = false; } requestAnimationFrame(putar); }
  document.addEventListener('visibilitychange', function () { tampak = !document.hidden; perlu = true; });
  window.addEventListener('resize', ukur); window.addEventListener('scroll', kemajuan, { passive: true });
  ukur(); kemajuan(); requestAnimationFrame(putar);
})();
