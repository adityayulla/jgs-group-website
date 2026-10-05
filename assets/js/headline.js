/* ============================================================
   headline.js — Teks headline hero dari Dashboard
   ------------------------------------------------------------
   Sumber: menu "Konten Web → Headline" di panel admin
   (progress.jogjagrahaselaras.com/api/public/web-content?key=headline-…).

   Teks di HTML tetap jadi CADANGAN: kalau feed mati atau belum terisi,
   tidak ada yang diubah. Foto hero TIDAK diurus di sini — tetap lewat
   /api/public/hero di tiap halaman.

   Dimuat oleh main.js, hanya di beranda dan tiga halaman proyek.
   ============================================================ */
(function () {
  'use strict';
  if (window.__JGS_HEADLINE__) return;
  window.__JGS_HEADLINE__ = true;

  var seg = location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (seg.length > 1) return;                       // sub-halaman (mis. /tentrem-jiwo/villa/) punya hero sendiri
  var slug = (seg[0] || '').replace(/\.html$/, '');
  var HAL = { '': 'beranda', 'index': 'beranda', 'kawa-living': 'kawa-living',
              'tentrem-bhumi': 'tentrem-bhumi', 'tentrem-jiwo': 'tentrem-jiwo' }[slug];
  if (!HAL) return;

  var FEED = 'https://progress.jogjagrahaselaras.com/api/public/web-content?key=headline-' + HAL;
  var CACHE_KEY = 'jgs_headline_' + HAL;
  var CACHE_MS = 5 * 60 * 1000;
  var teks = null;

  function q(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function setText(el, t) {
    if (el && t && el.textContent.trim() !== t) el.textContent = t;
  }
  function setHtml(el, html) {
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }
  /* Elemen berisi ikon/anak lain + teks: hanya simpul teksnya yang diganti. */
  function setTextNode(el, t, posisi) {
    if (!el || !t) return;
    var nodes = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim()) nodes.push(el.childNodes[i]);
    }
    var n = posisi === 'awal' ? nodes[0] : nodes[nodes.length - 1];
    if (n && n.nodeValue.trim() !== t) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), t);
  }

  var TERAPKAN = {
    'beranda': function (t) {
      setTextNode(q('#hero .hero__eyebrow'), t.eyebrow);
      setText(q('#hero .hero3__t1'), t.baris1);
      /* *teks* → <em>teks</em> (bagian berwarna) */
      if (t.baris2) setHtml(q('#hero .hero3__t2'), esc(t.baris2).replace(/\*([^*]+)\*/g, '<em>$1</em>'));
      setTextNode(q('#hero .hero3__kpr'), t.catatan, 'awal');
    },
    'kawa-living': function (t) {
      var baris = document.querySelectorAll('.hero__title .hero__line');
      setTextNode(q('.hero__copy .hero__eyebrow'), t.eyebrow);
      setText(baris[0], t.baris1);
      setText(q('.hero__title .hero__slab'), t.baris2);
      setText(baris[2], t.baris3);
      setText(q('.hero__copy .hero__sub'), t.sub);
    },
    'tentrem-bhumi': function (t) {
      setText(q('#k-hero-est'), t.eyebrow);
      if (t.baris1 && t.baris2) {
        setHtml(q('#k-hero-h1'), esc(t.baris1) + '<br><span class="hero-hl" id="k-hero-hl">' + esc(t.baris2) + '</span>');
      }
      setText(q('#k-hero-desc'), t.sub);
    },
    'tentrem-jiwo': function (t) {
      var baris = document.querySelectorAll('.tjh__title .tjh__line');
      setText(baris[0], t.baris1);
      setText(q('.tjh__title .tjh__slab'), t.baris2);
      setText(q('.tjh__title .tjh__small'), t.baris3);
      setText(q('.tjh__sub'), t.sub);
    }
  };

  function terapkan() {
    if (!teks) return;
    try { TERAPKAN[HAL](teks); } catch (e) {}
  }

  function pakai(v) {
    if (!v || !v.teks) return;
    teks = v.teks;
    terapkan();
  }

  /* Halaman yang menyusun hero lewat skrip sendiri (Tentrem Bhumi) bisa
     menimpa lagi sesudah kita — ulangi setelah halaman selesai dimuat. */
  document.addEventListener('DOMContentLoaded', terapkan);
  window.addEventListener('load', terapkan);

  try {
    var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < CACHE_MS) { pakai(c.v); return; }
  } catch (e) {}

  fetch(FEED, { mode: 'cors' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j || !j.value || !j.value.teks) return;
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: j.value })); } catch (e) {}
      pakai(j.value);
    })
    .catch(function () {});
})();
