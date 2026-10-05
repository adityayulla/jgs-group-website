/* ============================================================
   statistik.js — Angka statistik beranda dari Dashboard
   ------------------------------------------------------------
   Sumber: menu "Konten Web → Statistik" di panel admin
   (progress.jogjagrahaselaras.com/api/public/web-content?key=statistik).

   Angka di HTML (data-count) tetap jadi CADANGAN: kalau feed mati atau
   belum terisi, tidak ada yang diubah. Elemen ditandai data-stat:
     tahun | serah | penghargaan

   Dimuat oleh main.js, hanya di beranda.
   ============================================================ */
(function () {
  'use strict';
  if (window.__JGS_STATISTIK__) return;
  window.__JGS_STATISTIK__ = true;

  var FEED = 'https://progress.jogjagrahaselaras.com/api/public/web-content?key=statistik';
  var CACHE_KEY = 'jgs_statistik_v1';
  var CACHE_MS = 5 * 60 * 1000;
  var data = null;

  function terapkan() {
    if (!data) return;
    try {
      var nilai = { tahun: data.tahun, serah: data.serahTerima, penghargaan: data.penghargaan };
      var els = document.querySelectorAll('[data-stat]');
      for (var i = 0; i < els.length; i++) {
        var v = nilai[els[i].getAttribute('data-stat')];
        if (typeof v !== 'number' || !(v >= 0)) continue;
        /* Animasi hitung (main.js) membaca data-count tiap frame; kalau
           animasinya sudah selesai, angkanya ditulis langsung. */
        els[i].setAttribute('data-count', String(v));
        if (els[i].getAttribute('data-count-selesai') === '1') els[i].textContent = String(v);
      }
    } catch (e) {}
  }

  function pakai(v) {
    if (!v || typeof v.tahun !== 'number') return;
    data = v;
    terapkan();
  }

  document.addEventListener('DOMContentLoaded', terapkan);

  try {
    var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) { pakai(c.v); return; }
  } catch (e) {}

  fetch(FEED, { mode: 'cors' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.value) return;
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: j.value })); } catch (e) {}
      pakai(j.value);
    })
    .catch(function () {});
})();
