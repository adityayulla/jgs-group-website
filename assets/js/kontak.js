/* ============================================================
   kontak.js — Nomor WhatsApp marketing dari Dashboard
   ------------------------------------------------------------
   Sumber: menu "Konten Web → Kontak & WhatsApp" di panel admin
   (progress.jogjagrahaselaras.com/api/public/web-content?key=kontak).

   Nomor yang tertulis di HTML tetap jadi CADANGAN: kalau feed mati
   atau belum terisi, tidak ada tautan yang diubah.

   Aturan tujuan tiap tautan WhatsApp:
     data-kontak="tetap"  → tidak pernah diubah (mis. nomor admin).
     data-kontak="utama"  → marketing "Nomor utama" (navbar, footer).
     halaman terdaftar    → marketing halaman itu (beranda = utama).
     halaman lain (blog…) → marketing yang sama dengan yang tertulis
                            di HTML, memakai nomornya yang terbaru.

   Dimuat oleh main.js; halaman tanpa main.js memasangnya langsung.
   ============================================================ */
(function () {
  'use strict';
  if (window.JGSKontak) return;

  var FEED = 'https://progress.jogjagrahaselaras.com/api/public/web-content?key=kontak';
  var CACHE_KEY = 'jgs_kontak_v1';
  var CACHE_MS = 5 * 60 * 1000;

  /* Nomor yang tertulis di HTML statis → id marketing di dashboard. */
  var NOMOR_LAMA = {
    '6289506888328': 'fira',
    '6288902929571': 'dwi',
    '6285643531971': 'okky'
  };
  var NAMA_LAMA = ['Fira', 'Dwi', 'Okky'];

  var slug = location.pathname.replace(/^\/+/, '').split('/')[0].replace(/\.html$/, '');
  var data = null;
  var antre = [];

  function agen(id) {
    if (!data || !id) return null;
    for (var i = 0; i < data.marketing.length; i++) {
      if (data.marketing[i].id === id) return data.marketing[i];
    }
    return null;
  }
  function agenByNomor(nomor) {
    for (var i = 0; data && i < data.marketing.length; i++) {
      if (data.marketing[i].nomor === nomor) return data.marketing[i];
    }
    return null;
  }
  function agenUtama() { return agen(data.utama); }
  function halamanTerdaftar() {
    return slug === '' || slug === 'index' || Object.prototype.hasOwnProperty.call(data.halaman, slug);
  }
  function agenHalaman() { return agen(data.halaman[slug]) || agenUtama(); }
  function agenModal() {
    if (!data) return null;
    if (slug === '' || slug === 'index') return agen(data.pricelistBeranda) || agenUtama();
    return agenHalaman();
  }

  function isWA(host) {
    return /(^|\.)wa\.me$|(^|\.)api\.whatsapp\.com$|(^|\.)web\.whatsapp\.com$/i.test(host);
  }
  function nomorDari(url) {
    return /wa\.me$/i.test(url.hostname)
      ? url.pathname.replace(/\D/g, '')
      : (url.searchParams.get('phone') || '').replace(/\D/g, '');
  }

  function tujuan(el, nomorAsal) {
    var mode = el.getAttribute('data-kontak');
    if (mode === 'tetap') return null;
    if (mode === 'utama') return agenUtama();
    if (halamanTerdaftar()) return agenHalaman();
    return agenByNomor(nomorAsal) || agen(NOMOR_LAMA[nomorAsal]) || agenUtama();
  }

  function namaDikenal() {
    var n = NAMA_LAMA.slice();
    for (var i = 0; i < data.marketing.length; i++) n.push(data.marketing[i].nama);
    return n.map(function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
  }

  /* Ubah satu tautan WhatsApp. Aman dipanggil berulang. */
  function terapkan(el) {
    try {
      if (!data || !el || el.tagName !== 'A') return;
      var href = el.getAttribute('href') || '';
      if (!/wa\.me|whatsapp\.com/i.test(href)) return;

      /* Skrip halaman bisa menulis ulang href sesudah kita — yang kita
         simpan hanya berlaku selama href masih hasil tulisan kita. */
      var asal = el.getAttribute('data-kontak-asal');
      if (!asal || el.getAttribute('data-kontak-hasil') !== href) asal = href;

      var url = new URL(asal, location.href);
      if (!isWA(url.hostname)) return;
      var nomorAsal = nomorDari(url);
      var a = tujuan(el, nomorAsal);
      if (!a || !nomorAsal) return;

      var hasil = asal.replace(nomorAsal, a.nomor);

      /* Sapaan "Halo Dwi, …" mengikuti nama marketing tujuan. */
      var teks = url.searchParams.get('text');
      if (teks) {
        var baru = teks.replace(new RegExp('^(\\s*Halo\\s+)(' + namaDikenal() + ')\\b', 'i'), '$1' + a.nama);
        if (baru !== teks) {
          var u2 = new URL(hasil, location.href);
          var q = u2.search.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^text=/.test(x); });
          q.push('text=' + encodeURIComponent(baru));
          hasil = u2.origin + u2.pathname + '?' + q.join('&') + u2.hash;
        }
      }

      if (hasil !== href) el.setAttribute('href', hasil);
      el.setAttribute('data-kontak-asal', asal);
      el.setAttribute('data-kontak-hasil', hasil);
    } catch (e) {}
  }

  function tampil(nomor) {
    return ('0' + nomor.replace(/^62/, '')).replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
  }

  function terapkanSemua() {
    if (!data) return;
    try {
      var links = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]');
      for (var i = 0; i < links.length; i++) terapkan(links[i]);

      /* Nomor telepon yang tertulis (footer): data-kontak-tel="utama". */
      var tel = document.querySelectorAll('a[data-kontak-tel="utama"]');
      var u = agenUtama();
      for (var j = 0; u && j < tel.length; j++) {
        tel[j].setAttribute('href', 'tel:+' + u.nomor);
        tel[j].textContent = tampil(u.nomor);
      }
    } catch (e) {}
  }

  function valid(v) {
    return v && Array.isArray(v.marketing) && v.marketing.length && v.utama && v.halaman;
  }

  function pakai(v) {
    if (!valid(v)) return;
    data = v;
    terapkanSemua();
    var cb = antre; antre = [];
    for (var i = 0; i < cb.length; i++) { try { cb[i](api); } catch (e) {} }
    try { document.dispatchEvent(new CustomEvent('jgs:kontak')); } catch (e) {}
  }

  var api = {
    terapkan: terapkan,
    terapkanSemua: terapkanSemua,
    agenModal: agenModal,
    /* Jalankan cb begitu data siap (langsung kalau sudah). */
    siap: function (cb) { if (data) cb(api); else antre.push(cb); }
  };
  window.JGSKontak = api;

  /* Tepat sebelum tautan dibuka — menangkap tautan yang dibuat belakangan. */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a') : null;
    if (el) terapkan(el);
  }, true);

  /* Navbar/footer disuntik main.js dan beberapa halaman menyusun tautan
     lewat skrip — ulangi sesudah halaman selesai dimuat. */
  document.addEventListener('DOMContentLoaded', terapkanSemua);
  window.addEventListener('load', function () {
    terapkanSemua();
    setTimeout(terapkanSemua, 1500);
  });

  try {
    var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) { pakai(c.v); return; }
  } catch (e) {}

  fetch(FEED, { mode: 'cors' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !valid(j.value)) return;
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: j.value })); } catch (e) {}
      pakai(j.value);
    })
    .catch(function () {});
})();
