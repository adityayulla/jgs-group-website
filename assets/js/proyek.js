/* ============================================================
   proyek.js — Isi halaman proyek dari Dashboard
   ------------------------------------------------------------
   Sumber: menu Konten Web di panel admin
   (progress.jogjagrahaselaras.com/api/public/web-content):
     • Video House Tour → tab proyek  : kartu di section #house-tour
     • Statistik → tahun berdiri       : lencana "13+ TAHUN TERPERCAYA"
                                         (Tentrem Bhumi)

   Isi di HTML tetap jadi CADANGAN: kalau feed mati atau belum terisi,
   tidak ada yang diubah. Bagian yang isinya sama tidak digambar ulang.

   Dimuat oleh main.js di /kawa-living/ dan /tentrem-bhumi/.
   ============================================================ */
(function () {
  'use strict';
  if (window.__JGS_PROYEK__) return;
  window.__JGS_PROYEK__ = true;

  var seg = location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (seg.length !== 1) return;
  var slug = seg[0];
  if (slug !== 'kawa-living' && slug !== 'tentrem-bhumi') return;

  var KEY_TUR = 'house-tour-' + slug;
  var FEED = 'https://progress.jogjagrahaselaras.com/api/public/web-content?keys=' + KEY_TUR + ',statistik';
  var CACHE_KEY = 'jgs_proyek_' + slug;
  var CACHE_MS = 5 * 60 * 1000;
  var data = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function rapi(x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); }
  function sidik(list) {
    return JSON.stringify(list.map(function (d) { return [String(d.video), String(d.judul), String(d.ket), String(d.img)]; }));
  }

  var PLAY = '<span class="ht__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';

  function turDiHalaman(grid) {
    return Array.prototype.map.call(grid.querySelectorAll('.ht__card'), function (c) {
      var cap = c.querySelector('.ht__cap');
      var ket = cap && cap.querySelector('span');
      var img = c.querySelector('.ht__thumb');
      var src = img ? img.getAttribute('src') || '' : '';
      return {
        video: ((c.getAttribute('onclick') || '').match(/openHt\('([^']+)'\)/) || [])[1] || '',
        judul: cap && cap.firstChild ? rapi(cap.firstChild.nodeValue) : '',
        ket: ket ? rapi(ket.textContent) : '',
        /* "photos/…" (relatif) dan "/tentrem-bhumi/photos/…" itu berkas yang sama. */
        img: src ? new URL(src, location.href).pathname : ''
      };
    });
  }

  function renderTur(raw) {
    var video = String(raw.video).replace(/[^A-Za-z0-9_-]/g, '');
    var judul = esc(raw.judul);
    return '<button class="ht__card" type="button" onclick="openHt(\'' + video + '\')" aria-label="Putar house tour ' + judul + '">' +
      '<img class="ht__thumb" src="' + esc(raw.img) + '" alt="House tour unit ' + judul + '" loading="lazy">' +
      PLAY +
      '<span class="ht__cap">' + judul + '<br><span style="font-size:13px;font-weight:400;opacity:.85;">' + esc(raw.ket) + '</span></span>' +
      '</button>';
  }

  function terapkan() {
    if (!data) return;
    try {
      var tur = data[KEY_TUR] && data[KEY_TUR].items;
      var grid = document.querySelector('#house-tour .ht__grid');
      if (grid && Array.isArray(tur) && tur.length && sidik(tur) !== sidik(turDiHalaman(grid))) {
        grid.innerHTML = tur.map(renderTur).join('');
      }
    } catch (e) {}
    try {
      var st = data.statistik;
      var lencana = document.getElementById('k-trust-num');
      if (lencana && st && typeof st.tahun === 'number' && st.tahun > 0) {
        var teks = st.tahun + '+';
        if (lencana.textContent.trim() !== teks) lencana.textContent = teks;
      }
    } catch (e) {}
  }

  function pakai(v) {
    if (!v) return;
    data = v;
    terapkan();
  }

  /* Tentrem Bhumi menyusun hero lewat skrip sendiri dan bisa menimpa
     lencananya sesudah kita — ulangi setelah halaman selesai dimuat. */
  document.addEventListener('DOMContentLoaded', terapkan);
  window.addEventListener('load', terapkan);

  try {
    var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) { pakai(c.v); return; }
  } catch (e) {}

  fetch(FEED, { mode: 'cors' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.sections) return;
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: j.sections })); } catch (e) {}
      pakai(j.sections);
    })
    .catch(function () {});
})();
