/* ============================================================
   pricelist-modal.js — Shared lead-generation modal
   Self-contained: inject CSS + HTML on load, expose
   window.openPricelistModal() / closePricelistModal() / submitPricelist()
   ============================================================ */
(function () {
  'use strict';

  /* Idempotent: jangan inject dua kali kalau script ke-load berulang */
  if (window.__JGS_PRICELIST_MODAL__) return;
  window.__JGS_PRICELIST_MODAL__ = true;

  /* ── Config ──────────────────────────────────────────────── */
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznJXL_2a_hhRdYmB7Es44sGH_Dc9E96fcgch40mfrPlq-heaV2ewkSSDmxgVpu7qq6Lg/exec';
  var REDIRECT_URL    = '/download/';

  /* ── UTM / Traffic Source tracking ──────────────────────── */
  var _utm = null;

  function captureUtm() {
    var p   = new URLSearchParams(window.location.search);
    var src = p.get('utm_source')   || '';
    var med = p.get('utm_medium')   || '';
    var cam = p.get('utm_campaign') || '';
    var con = p.get('utm_content')  || '';
    var ref = document.referrer     || '';

    // Kalau URL punya UTM params, simpan ke sessionStorage agar persist lintas halaman
    if (src || med || cam) {
      var fresh = { utm_source: src, utm_medium: med, utm_campaign: cam, utm_content: con, referrer: ref };
      try { sessionStorage.setItem('jgs_utm', JSON.stringify(fresh)); } catch(e) {}
      return fresh;
    }

    // Coba ambil yang sudah tersimpan (user navigasi dari landing page ke halaman lain)
    try {
      var stored = sessionStorage.getItem('jgs_utm');
      if (stored) return JSON.parse(stored);
    } catch(e) {}

    // Fallback: deteksi dari referrer
    if (!ref) return { utm_source: 'direct', utm_medium: '(none)', utm_campaign: '', utm_content: '', referrer: '' };
    if (/google\.com/i.test(ref))            return { utm_source: 'google',    utm_medium: 'organic',   utm_campaign: '', utm_content: '', referrer: ref };
    if (/facebook\.com|fb\.com/i.test(ref)) return { utm_source: 'facebook',  utm_medium: 'social',    utm_campaign: '', utm_content: '', referrer: ref };
    if (/instagram\.com/i.test(ref))         return { utm_source: 'instagram', utm_medium: 'social',    utm_campaign: '', utm_content: '', referrer: ref };
    if (/tiktok\.com/i.test(ref))            return { utm_source: 'tiktok',    utm_medium: 'social',    utm_campaign: '', utm_content: '', referrer: ref };
    if (/youtube\.com/i.test(ref))           return { utm_source: 'youtube',   utm_medium: 'social',    utm_campaign: '', utm_content: '', referrer: ref };
    if (/wa\.me|whatsapp/i.test(ref))        return { utm_source: 'whatsapp',  utm_medium: 'messaging', utm_campaign: '', utm_content: '', referrer: ref };
    return { utm_source: ref, utm_medium: 'referral', utm_campaign: '', utm_content: '', referrer: ref };
  }

  // Capture segera saat script load supaya referrer masih tersedia
  function getUtm() {
    if (!_utm) _utm = captureUtm();
    return _utm;
  }
  getUtm();

  /* ── Inject CSS ──────────────────────────────────────────── */
  var style = document.createElement('style');
  style.setAttribute('data-pricelist-modal', '');
  style.textContent =
    '#pricelist-overlay {' +
    '  position: fixed; inset: 0;' +
    '  background: rgba(0,0,0,0.55);' +
    '  z-index: 1000;' +
    '  display: flex; align-items: center; justify-content: center;' +
    '  padding: 20px; backdrop-filter: blur(3px);' +
    '}' +
    '#pricelist-modal {' +
    '  background: #fff; border-radius: 18px;' +
    '  padding: 28px 24px 24px;' +
    '  width: 100%; max-width: 380px;' +
    '  position: relative;' +
    '  box-shadow: 0 20px 60px rgba(0,0,0,0.2);' +
    '  animation: plModalIn 0.3s ease-out;' +
    '}' +
    '@keyframes plModalIn {' +
    '  from { opacity: 0; transform: translateY(12px) scale(.98); }' +
    '  to   { opacity: 1; transform: translateY(0) scale(1); }' +
    '}' +
    '#pricelist-close {' +
    '  position: absolute; top: 14px; right: 16px;' +
    '  background: none; border: none;' +
    '  font-size: 18px; color: #999; cursor: pointer; line-height: 1;' +
    '}' +
    '.pm-icon { font-size: 32px; margin-bottom: 8px; }' +
    '.pm-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }' +
    '.pm-sub { font-size: 13px; color: #888; line-height: 1.55; margin-bottom: 18px; }' +
    '#pricelist-form input {' +
    '  width: 100%; padding: 13px 14px;' +
    '  border: 1.5px solid #e0e0e0; border-radius: 10px;' +
    '  font-size: 14px; margin-bottom: 10px;' +
    '  outline: none; box-sizing: border-box;' +
    '  transition: border-color 0.2s;' +
    '}' +
    '#pricelist-form input:focus { border-color: #2d4a2b; }' +
    '.pm-privacy { font-size: 11.5px; color: #aaa; margin-bottom: 14px; margin-top: 2px; }' +
    '#pl-submit {' +
    '  width: 100%; background: #2d4a2b; color: #fff;' +
    '  border: none; border-radius: 12px; padding: 14px;' +
    '  font-size: 15px; font-weight: 500; cursor: pointer;' +
    '  transition: background 0.2s, transform 0.1s;' +
    '}' +
    '#pl-submit:hover { background: #1e3320; }' +
    '#pl-submit:active { transform: scale(0.98); }' +
    '#pl-submit:disabled { background: #aaa; cursor: not-allowed; }' +
    '#pricelist-loading { text-align: center; padding: 20px 0; color: #888; font-size: 14px; }' +
    '.pl-spinner {' +
    '  width: 36px; height: 36px;' +
    '  border: 3px solid #e0e0e0; border-top-color: #2d4a2b;' +
    '  border-radius: 50%;' +
    '  animation: plSpin 0.7s linear infinite;' +
    '  margin: 0 auto 12px;' +
    '}' +
    '@keyframes plSpin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  /* ── Inject HTML modal ──────────────────────────────────── */
  var modalHTML =
    '<div id="pricelist-overlay" style="display:none;" onclick="if(event.target===this)window.closePricelistModal()">' +
      '<div id="pricelist-modal">' +
        '<button id="pricelist-close" onclick="window.closePricelistModal()">✕</button>' +
        '<div id="pricelist-modal-body">' +
          '<div class="pm-icon">📄</div>' +
          '<h3 class="pm-title">Download Pricelist</h3>' +
          '<p class="pm-sub">Isi data berikut untuk mendapatkan pricelist lengkap proyek JGS Group</p>' +
          '<div id="pricelist-form">' +
            '<input id="pl-nama" type="text" placeholder="Nama lengkap" autocomplete="name">' +
            '<input id="pl-hp" type="tel" placeholder="Nomor WhatsApp" autocomplete="tel">' +
            '<input id="pl-email" type="email" placeholder="Alamat email" autocomplete="email">' +
            '<p class="pm-privacy">🔒 Data Anda aman dan tidak akan disebarkan</p>' +
            '<button id="pl-submit" onclick="window.submitPricelist()">Kirim &amp; Lanjutkan →</button>' +
          '</div>' +
          '<div id="pricelist-loading" style="display:none;">' +
            '<div class="pl-spinner"></div>' +
            '<p>Sedang memproses...</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function injectModal() {
    if (document.getElementById('pricelist-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  if (document.body) injectModal();
  else document.addEventListener('DOMContentLoaded', injectModal);

  /* ── Public API ─────────────────────────────────────────── */
  window.openPricelistModal = function () {
    injectModal();
    document.getElementById('pricelist-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('pricelist-form').style.display = 'block';
    document.getElementById('pricelist-loading').style.display = 'none';
    document.getElementById('pl-nama').value  = '';
    document.getElementById('pl-hp').value    = '';
    document.getElementById('pl-email').value = '';
  };

  window.closePricelistModal = function () {
    var ov = document.getElementById('pricelist-overlay');
    if (ov) ov.style.display = 'none';
    document.body.style.overflow = '';
  };

  window.submitPricelist = function () {
    var nama  = document.getElementById('pl-nama').value.trim();
    var hp    = document.getElementById('pl-hp').value.trim();
    var email = document.getElementById('pl-email').value.trim();

    if (!nama || !hp || !email) {
      alert('Mohon isi semua data terlebih dahulu.');
      return;
    }

    var utm = getUtm();
    var payload = {
      date:         new Date().toLocaleDateString('id-ID'),
      time:         new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      Nama:         nama,
      Handphone:    hp,
      Email:        email,
      Sumber:       window.location.pathname,
      utm_source:   utm.utm_source,
      utm_medium:   utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content:  utm.utm_content,
      referrer:     utm.referrer
    };

    console.log('Payload dikirim:', JSON.stringify(payload));

    var xhr = new XMLHttpRequest();
    xhr.open('POST', APPS_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    /* Redirect setelah XHR selesai (atau timeout 5 detik) agar data tidak terpotong */
    var redirected = false;
    function doRedirect() {
      if (!redirected) { redirected = true; window.location.href = REDIRECT_URL; }
    }
    xhr.onload    = doRedirect;
    xhr.onerror   = doRedirect;
    xhr.ontimeout = doRedirect;
    xhr.timeout   = 5000;

    xhr.send('data=' + encodeURIComponent(JSON.stringify(payload)));
  };

  /* Auto-bind ke tombol-tombol yang punya class/data-attribute pricelist */
  document.addEventListener('DOMContentLoaded', function () {
    var btns = document.querySelectorAll(
      '.btn-pricelist, .btn-pricelist-cta, .btn-pricelist-trigger, [data-action="pricelist"]'
    );
    btns.forEach(function (btn) {
      /* Hindari double-binding kalau sudah ada onclick inline */
      if (btn.getAttribute('onclick')) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        window.openPricelistModal();
      });
    });
  });
})();
