/* ============================================================
   foto-galeri.js — galeri foto ringan (lightbox) bersama
   24 Sep 2026: Clarity 30 hari mencatat foto hero halaman utama
   (44 dead-tap) dan /perumahan-jogja/ (33 dead-tap, 26% dari semua
   dead-tap halaman itu) diketuk tanpa terjadi apa-apa. Pengunjung
   mengharapkan galeri. Ini galerinya.

   Pakai:  window.openGaleri(items, idx)
           items = [{ src, alt, judul, sub, href }]
   Geser kiri/kanan di HP, panah ←/→ di desktop, Esc / ketuk luar = tutup.
   ============================================================ */
(function () {
  'use strict';
  if (window.__JGS_GALERI__) return;
  window.__JGS_GALERI__ = true;

  var css =
    '.fg { position: fixed; inset: 0; z-index: 9999; display: none; flex-direction: column;' +
    '  background: rgba(15,20,48,.95); color: #fff; touch-action: pan-y; }' +
    '.fg.open { display: flex; }' +
    '.fg__top { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; font-size: 13px; opacity: .85; }' +
    '.fg__close { width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.16); color: #fff; font-size: 26px; line-height: 1; cursor: pointer; }' +
    '.fg__close:hover { background: rgba(255,255,255,.3); }' +
    '.fg__stage { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; min-height: 0; padding: 0 8px; }' +
    '.fg__img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 14px; box-shadow: 0 30px 60px rgba(0,0,0,.5); user-select: none; -webkit-user-drag: none; }' +
    '.fg__nav { position: absolute; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%; border: 0;' +
    '  background: rgba(255,255,255,.16); color: #fff; font-size: 26px; line-height: 1; cursor: pointer; }' +
    '.fg__nav:hover { background: rgba(255,255,255,.3); }' +
    '.fg__nav--prev { left: 14px; } .fg__nav--next { right: 14px; }' +
    '.fg__cap { padding: 14px 18px 22px; text-align: center; }' +
    '.fg__judul { font-family: "Cormorant Garamond", Georgia, serif; font-size: 22px; font-weight: 500; line-height: 1.2; }' +
    '.fg__sub { font-size: 13px; opacity: .8; margin-top: 3px; }' +
    '.fg__cta { display: inline-block; margin-top: 12px; padding: 11px 22px; border-radius: 999px; background: #E8872A; color: #fff; text-decoration: none; font-size: 14px; font-weight: 500; }' +
    '.fg__cta:hover { background: #d3761f; }' +
    '@media (max-width: 600px) { .fg__nav { display: none; } .fg__img { border-radius: 10px; } .fg__judul { font-size: 20px; } }';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var el, items = [], idx = 0, startX = null;

  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'fg';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Galeri foto');
    el.innerHTML =
      '<div class="fg__top"><span class="fg__count"></span><button class="fg__close" aria-label="Tutup">&times;</button></div>' +
      '<div class="fg__stage">' +
        '<button class="fg__nav fg__nav--prev" aria-label="Sebelumnya">&#8249;</button>' +
        '<img class="fg__img" src="" alt="">' +
        '<button class="fg__nav fg__nav--next" aria-label="Berikutnya">&#8250;</button>' +
      '</div>' +
      '<div class="fg__cap"><div class="fg__judul"></div><div class="fg__sub"></div><a class="fg__cta" href="#">Lihat detail →</a></div>';
    document.body.appendChild(el);
    el.querySelector('.fg__close').addEventListener('click', close);
    el.querySelector('.fg__nav--prev').addEventListener('click', function () { go(-1); });
    el.querySelector('.fg__nav--next').addEventListener('click', function () { go(1); });
    el.querySelector('.fg__stage').addEventListener('click', function (e) { if (e.target === e.currentTarget) close(); });
    el.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX; startX = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (!el.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
    return el;
  }

  function render() {
    var it = items[idx]; if (!it) return;
    var img = el.querySelector('.fg__img');
    img.src = it.src; img.alt = it.alt || it.judul || '';
    el.querySelector('.fg__count').textContent = (idx + 1) + ' / ' + items.length;
    el.querySelector('.fg__judul').textContent = it.judul || '';
    el.querySelector('.fg__sub').textContent = it.sub || '';
    var cta = el.querySelector('.fg__cta');
    if (it.href) { cta.href = it.href; cta.style.display = ''; cta.textContent = it.cta || 'Lihat detail →'; }
    else cta.style.display = 'none';
    /* pramuat tetangga supaya geser terasa instan */
    [idx + 1, idx - 1].forEach(function (i) {
      var n = items[(i + items.length) % items.length];
      if (n && n.src) { var p = new Image(); p.src = n.src; }
    });
  }
  function go(d) { if (!items.length) return; idx = (idx + d + items.length) % items.length; render(); }
  function close() { if (!el) return; el.classList.remove('open'); document.body.style.overflow = ''; }

  window.openGaleri = function (list, start) {
    if (!list || !list.length) return;
    items = list; idx = Math.max(0, Math.min(start || 0, list.length - 1));
    ensure(); render();
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'galeri_open', galeri_page: location.pathname }); } catch (e) {}
  };
  window.closeGaleri = close;
})();
