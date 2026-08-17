/* ═══════════════════════════════════════════════════════════════
   Wall of Receipts — foto serah terima
   ───────────────────────────────────────────────────────────────
   Arsip (Kawa Village & Royal Mansion) SUDAH tercetak statis di
   HTML — halaman tetap penuh walau JS mati atau dashboard down.

   Skrip ini menambah tiga hal saja:
     1. entri LIVE dari Progress Dashboard, disisipkan di depan
        (hanya yang sudah disetujui approver — lihat migration 0028)
     2. filter per perumahan di halaman /serah-terima/
     3. lightbox

   Dipakai di: / (ticker + section) dan /serah-terima/
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FEED = 'https://progress.jogjagrahaselaras.com/api/public/serah-terima';

  /* ── util ──────────────────────────────────────────────────── */
  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ── kartu untuk entri live ──────────────────────────────────
     Label = kode unit dari dashboard (mis. "Abirama 5"), yang memang
     sudah berformat tipe + nomor. Nama pembeli TIDAK ditampilkan. */
  function liveCard(item) {
    var label = item.unit || item.project;

    var a = el('a', 'st__card', {
      href: item.photo,
      'data-st-lb': '',
      'data-cap': label + ' · ' + item.project
    });

    var media = el('div', 'st__media');
    var stamp = el('span', 'st__stamp');
    stamp.textContent = item.project;
    var img = el('img', null, {
      src: item.photo,
      alt: 'Serah terima kunci unit ' + label + ' di ' + item.project + ' — JGS Group',
      loading: 'lazy',
      decoding: 'async'
    });
    media.appendChild(stamp);
    media.appendChild(img);

    var body = el('div', 'st__body');
    var n = el('div', 'st__name'); n.textContent = label;
    body.appendChild(n);

    a.appendChild(media); a.appendChild(body);
    return a;
  }

  /* opsi.lightbox = foto dibuka di tempat (halaman proyek), bukan
     melempar pengunjung ke /serah-terima/. */
  function liveTick(item, opsi) {
    var label = item.unit || item.project;
    var a = opsi.lightbox
      ? el('a', 'st-tick__item', {
          href: item.photo,
          'data-st-lb': '',
          'data-cap': label + ' · ' + item.project
        })
      : el('a', 'st-tick__item', { href: opsi.href || '/serah-terima/' });
    var img = el('img', null, {
      src: item.photo,
      alt: 'Serah terima kunci unit ' + label + ' di ' + item.project + ' — JGS Group',
      loading: 'lazy', decoding: 'async'
    });
    var cap = el('span', 'st-tick__cap');
    var b = el('b'); b.textContent = label;
    cap.appendChild(b);
    cap.appendChild(document.createTextNode(item.project));
    a.appendChild(img); a.appendChild(cap);
    return a;
  }

  /* ── saring per perumahan ────────────────────────────────────
     Halaman proyek (mis. /tentrem-bhumi/) menandai wadahnya dengan
     data-project="tentrem-bhumi"; tanpa atribut itu semua entri
     dipakai, seperti di homepage. */
  function saring(items, wadah) {
    var slug = wadah.getAttribute('data-project') || '';
    if (!slug) return items;
    return items.filter(function (it) { return it.projectSlug === slug; });
  }

  /* ── ambil feed live, sisipkan di depan ────────────────────── */
  function loadLive() {
    var strip = document.getElementById('stStrip');
    var rail = document.getElementById('stRail');
    var grid = document.getElementById('stGrid');
    if (!strip && !rail && !grid) return;

    fetch(FEED + '?limit=60', { mode: 'cors' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var items = (data && data.items) || [];
        if (!items.length) return;

        // Strip homepage: sisipkan di depan, buang kelebihan di belakang
        if (strip) {
          saring(items, strip).slice(0, 5).reverse().forEach(function (it) {
            strip.insertBefore(liveCard(it), strip.firstElementChild);
          });
          while (strip.children.length > 5) strip.removeChild(strip.lastElementChild);
        }

        // Ticker: sisipkan di depan rel (rel tunggal, tanpa salinan)
        if (rail) {
          var railOpsi = {
            href: rail.getAttribute('data-more') || '/serah-terima/',
            lightbox: rail.hasAttribute('data-lightbox')
          };
          saring(items, rail).slice(0, 6).reverse().forEach(function (it) {
            rail.insertBefore(liveTick(it, railOpsi), rail.firstElementChild);
          });
        }

        // Halaman penuh: sisipkan di depan grid
        if (grid) {
          saring(items, grid).slice().reverse().forEach(function (it) {
            var card = liveCard(it);
            card.setAttribute('data-project', it.project);
            grid.insertBefore(card, grid.firstElementChild);
          });
          // Kartu ini datang SESUDAH filter dijalankan, jadi belum tersaring.
          // Tanpa baris ini, /serah-terima/#kawa-village ikut menampilkan
          // entri live dari proyek lain.
          terapkanFilterAktif();
        }

      })
      .catch(function () {
        /* Dashboard tidak terjangkau — arsip statis tetap tampil. */
      });
  }


  /* Terapkan filter yang sedang aktif ke SELURUH isi grid. Dipanggil
     saat tombol diklik dan setiap kali kartu baru disisipkan. */
  function terapkanFilterAktif() {
    var bar = document.getElementById('stFilters');
    var grid = document.getElementById('stGrid');
    if (!bar || !grid) return;
    var btn = bar.querySelector('.stp__filt[aria-pressed="true"]');
    var want = btn ? (btn.getAttribute('data-project') || '') : '';

    var shown = 0;
    Array.prototype.forEach.call(grid.children, function (card) {
      var stamp = card.querySelector('.st__stamp');
      var proj = card.getAttribute('data-project') || (stamp ? stamp.textContent : '');
      var ok = !want || proj === want;
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });

    var empty = document.getElementById('stEmpty');
    if (empty) empty.hidden = shown > 0;
  }

  /* ── filter per perumahan (/serah-terima/) ─────────────────── */
  function initFilters() {
    var bar = document.getElementById('stFilters');
    var grid = document.getElementById('stGrid');
    if (!bar || !grid) return;

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('.stp__filt');
      if (!btn) return;
      Array.prototype.forEach.call(bar.querySelectorAll('.stp__filt'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      terapkanFilterAktif();
    });

    // Tautan dari halaman proyek, mis. /serah-terima/#kawa-village —
    // filternya langsung diterapkan supaya pengunjung mendarat tepat.
    var minta = decodeURIComponent(location.hash.replace('#', '')).toLowerCase();
    if (!minta) return;
    Array.prototype.some.call(bar.querySelectorAll('.stp__filt'), function (b) {
      var proj = (b.getAttribute('data-project') || '').toLowerCase();
      if (!proj || proj.replace(/\s+/g, '-') !== minta) return false;
      b.click();
      b.scrollIntoView({ block: 'center' });
      return true;
    });
  }

  /* ── lightbox ──────────────────────────────────────────────── */
  function initLightbox() {
    var box, img, cap, lastFocus;

    function build() {
      box = el('div', 'st-lb', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Foto serah terima' });
      img = el('img', 'st-lb__img', { alt: '' });
      cap = el('p', 'st-lb__cap');
      var close = el('button', 'st-lb__close', { type: 'button', 'aria-label': 'Tutup' });
      close.innerHTML = '&times;';
      close.addEventListener('click', hide);
      box.appendChild(img); box.appendChild(cap); box.appendChild(close);
      box.addEventListener('click', function (e) { if (e.target === box) hide(); });
      document.body.appendChild(box);
    }

    function show(href, caption, alt) {
      if (!box) build();
      img.src = href;
      img.alt = alt || caption || '';
      cap.textContent = caption || '';
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('.st-lb__close').focus();
    }

    function hide() {
      if (!box) return;
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      img.src = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest('[data-st-lb]');
      if (!card) return;
      e.preventDefault();
      lastFocus = card;
      var inner = card.querySelector('img');
      show(card.getAttribute('href'), card.getAttribute('data-cap'), inner && inner.alt);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hide();
    });
  }

  /* ── ticker: geser sendiri, tapi pengunjung selalu boleh ambil alih ──
     Dulu gerakannya animasi CSS transform. Masalahnya transform tidak
     memindahkan posisi scroll, jadi wadahnya tidak bisa digeser jari —
     di HP orang mencoba menggeser, yang terjadi malah animasinya berhenti.

     Sekarang: wadahnya benar-benar bisa di-scroll, dan gerak otomatis
     hanya "mendorong" scrollLeft sedikit demi sedikit. Begitu ada
     sentuhan, wheel, atau tombol panah, dorongan itu berhenti PERMANEN —
     tidak melawan jari pengunjung. */
  function initTicker() {
    var mask = document.querySelector('.st-tick__mask');
    var rail = document.getElementById('stRail');
    if (!mask || !rail) return;

    var KECEPATAN = 41 / 1000;   // px per milidetik, sama dgn versi lama
    var arah = 1;
    var berhenti = false;
    var jeda = false;
    var last = 0;

    if (window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;                    // biarkan digeser manual saja
    }

    function stop() {
      berhenti = true;
      mask.removeEventListener('pointerdown', stop);
      mask.removeEventListener('touchstart', stop);
      mask.removeEventListener('wheel', stop);
      mask.removeEventListener('keydown', stop);
    }

    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) {
      mask.addEventListener(ev, stop, { passive: true });
    });
    mask.addEventListener('mouseenter', function () { jeda = true; });
    mask.addEventListener('mouseleave', function () { jeda = false; });

    // Posisi disimpan sendiri, tidak dibaca ulang dari scrollLeft tiap
    // frame: sebagian browser membulatkan scrollLeft ke bilangan bulat,
    // dan 0,68px per frame bisa hilang oleh pembulatan sehingga ticker
    // mandek di tempat.
    var pos = 0;

    function langkah(now) {
      if (berhenti) return;
      var delta = last ? Math.min(now - last, 50) : 0;  // abaikan lompatan tab
      last = now;

      var sisa = mask.scrollWidth - mask.clientWidth;
      if (sisa > 8 && !jeda) {
        pos += arah * KECEPATAN * delta;
        if (pos <= 0)         { pos = 0;    arah = 1; }
        else if (pos >= sisa) { pos = sisa; arah = -1; }
        mask.scrollLeft = pos;
      }
      requestAnimationFrame(langkah);
    }
    requestAnimationFrame(langkah);
  }

  function init() {
    loadLive();
    initTicker();
    initFilters();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
