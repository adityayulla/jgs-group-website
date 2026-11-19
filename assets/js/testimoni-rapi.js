/* ══ Testimoni & Mitra rapi (19 Nov 2026) ══════════════════════════
   Aturan tata letak kartu testimoni (beranda, Kawa Living, Tentrem Bhumi)
   dan kartu mitra (beranda) supaya foto & tulisan menyesuaikan panjang
   ulasan — termasuk kartu yang diisi ulang konten.js dari dashboard.

   - data-panjang="pendek|sedang|panjang|sangat" pada kartu, dihitung dari
     jumlah huruf ulasan. CSS di tiap halaman memakai ini untuk ukuran huruf
     dan lebar kolom foto (ulasan panjang → kolom foto lebih sempit).
   - Ulasan "sangat" panjang dilipat jadi N baris + tombol "Baca selengkapnya".
   - Tanda kutip pembungkus & atribusi di ekor ("…" - Nama, jabatan) dibuang
     karena CSS sudah menambah tanda kutip dan nama tampil di bawah.
   - Grid mitra diberi data-kolom: 4 kartu → 2×2, 3/6 kartu → 3 kolom.
   ═════════════════════════════════════════════════════════════════ */
(function () {
  var NAMA = ['pendek', 'sedang', 'panjang', 'sangat'];
  var JENIS = [
    { kartu: '.ts__card',    teks: '.ts__body',    batas: [140, 380, 650], baris: 9, foto: '.ts__media' },
    { kartu: '.ts-card',     teks: '.ts-text',     batas: [140, 380, 650], baris: 9, foto: '.ts-photo' },
    { kartu: '.mitra__card', teks: '.mitra__body', batas: [180, 300, 600], baris: 12 }
  ];

  var gaya = document.createElement('style');
  gaya.textContent =
    '.ulasan-terlipat{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:var(--baris,9);line-clamp:var(--baris,9);overflow:hidden;flex:none!important}' +
    '.ulasan-lagi{display:inline-flex;align-items:center;gap:6px;margin:-8px 0 18px;padding:0;border:0;background:none;cursor:pointer;' +
    'font-family:inherit;font-size:13px;font-weight:600;line-height:1.2;color:#db7f2e;letter-spacing:.01em}' +
    '.ulasan-lagi::after{content:"";width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg)}' +
    '.ulasan-lagi[aria-expanded="true"]::after{transform:translateY(2px) rotate(-135deg)}' +
    '.ulasan-lagi:hover{text-decoration:underline;text-underline-offset:3px}';
  document.head.appendChild(gaya);

  function bersihkan(p) {
    if (p.children.length) return;
    var asli = p.textContent.replace(/\s+/g, ' ').trim();
    var t = asli;
    if (/^["“]/.test(t)) {
      // "…isi…" - Henky, Director  →  "…isi…"
      t = t.replace(/(["”])\s*[-–—]\s*[^"“”]{2,90}$/, '$1');
      // buang kutip pembungkus hanya kalau di dalamnya tak ada kutip lain
      var dalam = t.replace(/^["“]\s*/, '').replace(/\s*["”]$/, '');
      if (/["”]$/.test(t) && !/["“”]/.test(dalam)) t = dalam;
    }
    if (t !== asli) p.textContent = t;
  }

  function lipat(p, baris) {
    if (p.getAttribute('data-lipat')) return;
    p.setAttribute('data-lipat', '1');
    p.style.setProperty('--baris', baris);
    p.classList.add('ulasan-terlipat');
    requestAnimationFrame(function () {
      if (p.scrollHeight <= p.clientHeight + 2) { p.classList.remove('ulasan-terlipat'); return; }
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ulasan-lagi';
      b.textContent = 'Baca selengkapnya'; b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function () {
        var buka = !p.classList.toggle('ulasan-terlipat');
        b.textContent = buka ? 'Tutup' : 'Baca selengkapnya';
        b.setAttribute('aria-expanded', String(buka));
      });
      p.parentNode.insertBefore(b, p.nextSibling);
    });
  }

  /* Foto utuh (19 Nov 2026): rasio asli foto → --ts-rasio di kartu (CSS memakai
     ini untuk lebar kolom foto di desktop & tinggi bingkai di HP), dan
     --ts-latar di bingkai = foto yang sama sebagai latar buram pengisi sisa
     ruang. Foto sendiri object-fit: contain → tak ada bagian yang terpotong.
     Rasio dibaca dari atribut width/height kalau ada (tanpa menunggu foto
     termuat), kalau tidak dari naturalWidth setelah foto termuat. */
  function fotoUtuh(k, bingkai) {
    var img = bingkai && bingkai.querySelector('img');
    if (!img) return;
    var src = img.currentSrc || img.getAttribute('src');
    if (src) bingkai.style.setProperty('--ts-latar', 'url("' + src.replace(/"/g, '%22') + '")');
    function pasang(w, h) {
      if (!w || !h) return;
      var r = Math.max(0.5, Math.min(1.5, w / h));
      k.style.setProperty('--ts-rasio', r.toFixed(3));
      k.style.setProperty('--ts-rasio-hp', Math.max(r, 0.8).toFixed(3));
      k.classList.add('foto-utuh');
    }
    var aw = +img.getAttribute('width'), ah = +img.getAttribute('height');
    if (aw && ah) pasang(aw, ah);
    else if (img.complete && img.naturalWidth) pasang(img.naturalWidth, img.naturalHeight);
    else img.addEventListener('load', function () { pasang(img.naturalWidth, img.naturalHeight); }, { once: true });
    k.classList.add('foto-utuh');
  }

  function rapikan() {
    JENIS.forEach(function (j) {
      document.querySelectorAll(j.kartu).forEach(function (k) {
        var p = k.querySelector(j.teks);
        if (!p) return;
        bersihkan(p);
        var n = p.textContent.trim().length, i = 0;
        while (i < 3 && n >= j.batas[i]) i++;
        k.setAttribute('data-panjang', NAMA[i]);
        if (i === 3) lipat(p, j.baris);
        if (j.foto) fotoUtuh(k, k.querySelector(j.foto));
      });
    });
    document.querySelectorAll('.mitra__grid').forEach(function (g) {
      var n = g.children.length;
      g.setAttribute('data-kolom', n <= 1 ? '1' : n % 3 === 0 ? '3' : n % 2 === 0 ? '2' : '3');
    });
  }

  function mulai() {
    rapikan();
    if (!window.MutationObserver) return;
    var jadwal = 0;
    var mo = new MutationObserver(function () {
      if (jadwal) return;
      jadwal = requestAnimationFrame(function () { jadwal = 0; rapikan(); });
    });
    document.querySelectorAll('.ts__grid, .ts-cards, .mitra__grid').forEach(function (g) {
      mo.observe(g, { childList: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
