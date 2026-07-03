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

  /* ── Marketing per halaman: set via data-agent="dwi|fira" di tag <script> ── */
  var _scr = document.currentScript;
  var AGENT_KEY = (_scr && _scr.getAttribute('data-agent')) || 'dwi';
  var AGENTS = {
    dwi:  { name: 'Dwi',  photo: '/assets/img/marketing-dwi.jpg',  wa: '6288902929571' },
    fira: { name: 'Fira', photo: '/assets/img/marketing-fira.jpg', wa: '6289506888328' }
  };
  var AGENT = AGENTS[AGENT_KEY] || AGENTS.dwi;

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
    '  max-height: calc(100dvh - 40px); overflow-y: auto;' +
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
    '.pm-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; text-align: left; }' +
    '.pm-avatar { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid #e3ede3; }' +
    '.pm-head-txt { min-width: 0; }' +
    '.pm-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }' +
    '.pm-head .pm-title { margin-bottom: 2px; }' +
    '.pm-agent { font-size: 12px; color: #2d4a2b; margin: 0; line-height: 1.35; }' +
    '.pm-agent b { font-weight: 600; }' +
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
    '.pm-nocall {' +
    '  display: flex; align-items: flex-start; gap: 8px;' +
    '  font-size: 12.5px; color: #666; line-height: 1.5;' +
    '  margin: 2px 0 8px; cursor: pointer; text-align: left;' +
    '}' +
    /* Selector pakai #pricelist-form supaya menang dari rule "#pricelist-form input" */
    '#pricelist-form .pm-nocall input {' +
    '  width: auto; padding: 0; margin: 2px 0 0; flex-shrink: 0;' +
    '  accent-color: #2d4a2b; cursor: pointer;' +
    '}' +
    '.pm-benefits {' +
    '  background: #f4f7f4; border-radius: 10px;' +
    '  padding: 10px 14px; margin-bottom: 16px;' +
    '  font-size: 12.5px; color: #444; line-height: 1.7;' +
    '  text-align: left;' +
    '}' +
    '.pm-benefits div::before { content: "✓ "; color: #2d4a2b; font-weight: 700; }' +
    '.pm-divider {' +
    '  display: flex; align-items: center; gap: 10px;' +
    '  margin: 14px 0 10px; color: #bbb; font-size: 12px;' +
    '}' +
    '.pm-divider::before, .pm-divider::after {' +
    '  content: ""; flex: 1; height: 1px; background: #e5e5e5;' +
    '}' +
    '#pl-wa {' +
    '  display: flex; align-items: center; justify-content: center; gap: 8px;' +
    '  width: 100%; box-sizing: border-box;' +
    '  background: #fff; color: #1e7a43;' +
    '  border: 1.5px solid #34b767; border-radius: 12px; padding: 12px;' +
    '  font-size: 14px; font-weight: 500; text-decoration: none;' +
    '  transition: background 0.2s;' +
    '}' +
    '#pl-wa:hover { background: #f0faf4; }' +
    '#pl-wa svg { width: 18px; height: 18px; flex-shrink: 0; }' +
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
    '@keyframes plSpin { to { transform: rotate(360deg); } }' +
    /* Mobile: rapatkan isi supaya form muat tanpa scroll */
    '@media (max-width: 600px) {' +
    '  #pricelist-modal { padding: 22px 20px 20px; border-radius: 16px; }' +
    '  .pm-head { gap: 11px; margin-bottom: 12px; }' +
    '  .pm-avatar { width: 48px; height: 48px; }' +
    '  .pm-agent { font-size: 11.5px; }' +
    '  .pm-icon { font-size: 26px; margin-bottom: 6px; }' +
    '  .pm-title { font-size: 18px; margin-bottom: 5px; }' +
    '  .pm-sub { font-size: 12.5px; line-height: 1.5; margin-bottom: 14px; }' +
    '  .pm-benefits { padding: 11px 14px; margin-bottom: 15px; line-height: 1.65; font-size: 12px; }' +
    '  #pricelist-form input { padding: 13px 14px; margin-bottom: 11px; font-size: 14px; }' +
    '  .pm-nocall { font-size: 12px; line-height: 1.45; margin: 4px 0 9px; }' +
    '  .pm-privacy { font-size: 11px; margin-bottom: 13px; }' +
    '  #pl-submit { padding: 14px; }' +
    '  .pm-divider { margin: 13px 0 10px; }' +
    '  #pl-wa { padding: 12px; }' +
    '}';
  document.head.appendChild(style);

  /* ── Inject HTML modal ──────────────────────────────────── */
  var modalHTML =
    '<div id="pricelist-overlay" style="display:none;" onclick="if(event.target===this)window.closePricelistModal()">' +
      '<div id="pricelist-modal">' +
        '<button id="pricelist-close" onclick="window.closePricelistModal()">✕</button>' +
        '<div id="pricelist-modal-body">' +
          '<div class="pm-head">' +
            '<img class="pm-avatar" src="' + AGENT.photo + '" alt="' + AGENT.name + ' — tim marketing JGS Group" width="54" height="54">' +
            '<div class="pm-head-txt">' +
              '<h3 class="pm-title">Download Pricelist</h3>' +
              '<p class="pm-agent">Dibalas langsung oleh <b>' + AGENT.name + '</b>, tim kami 👋</p>' +
            '</div>' +
          '</div>' +
          '<p class="pm-sub">Isi data berikut untuk mendapatkan pricelist lengkap proyek JGS Group</p>' +
          '<div class="pm-benefits">' +
            '<div>Harga terbaru per kavling — cash keras &amp; KPR</div>' +
            '<div>Promo bulan ini — total hemat &plusmn;Rp 43 jt/unit</div>' +
            '<div>Kontak WhatsApp marketing untuk survey gratis</div>' +
          '</div>' +
          '<div id="pricelist-form">' +
            '<input id="pl-nama" type="text" placeholder="Nama lengkap" autocomplete="name">' +
            '<input id="pl-hp" type="tel" placeholder="Nomor WhatsApp" autocomplete="tel">' +
            '<label class="pm-nocall"><input id="pl-nocall" type="checkbox"> Jangan hubungi saya dulu — saya mau pelajari sendiri</label>' +
            '<p class="pm-privacy">🔒 Data Anda aman dan tidak akan disebarkan</p>' +
            '<button id="pl-submit" onclick="window.submitPricelist()">Kirim &amp; Lanjutkan →</button>' +
            '<div class="pm-divider">atau</div>' +
            '<a id="pl-wa" href="https://wa.me/' + AGENT.wa + '?text=' + encodeURIComponent('Halo ' + AGENT.name + ', saya ingin minta pricelist lengkap JGS. (via web)') + '" target="_blank" rel="noopener">' +
              '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
              'Chat langsung dengan ' + AGENT.name +
            '</a>' +
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
    var nocall = document.getElementById('pl-nocall');
    if (nocall) nocall.checked = false;
    /* Autofocus nama — delay kecil supaya keyboard mobile muncul setelah animasi modal */
    setTimeout(function () {
      var nama = document.getElementById('pl-nama');
      if (nama) nama.focus();
    }, 350);
  };

  window.closePricelistModal = function () {
    var ov = document.getElementById('pricelist-overlay');
    if (ov) ov.style.display = 'none';
    document.body.style.overflow = '';
  };

  window.submitPricelist = function () {
    var nama  = document.getElementById('pl-nama').value.trim();
    var hp    = document.getElementById('pl-hp').value.trim();

    if (!nama || !hp) {
      alert('Mohon isi nama dan nomor WhatsApp terlebih dahulu.');
      return;
    }

    var utm = getUtm();
    var payload = {
      date:         new Date().toLocaleDateString('id-ID'),
      time:         new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      Nama:         nama,
      Handphone:    hp,
      Email:        '',
      Sumber:       window.location.pathname,
      utm_source:   utm.utm_source,
      utm_medium:   utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content:  utm.utm_content,
      referrer:     utm.referrer,
      JanganHubungi: (document.getElementById('pl-nocall') && document.getElementById('pl-nocall').checked) ? 'YA' : ''
    };

    console.log('Payload dikirim:', JSON.stringify(payload));

    var xhr = new XMLHttpRequest();
    xhr.open('POST', APPS_SCRIPT_URL, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send('data=' + encodeURIComponent(JSON.stringify(payload)));

    /* Redirect setelah 1.5 detik — beri waktu XHR terkirim */
    setTimeout(function() { window.location.href = REDIRECT_URL; }, 1500);
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

  /* Auto-buka modal jika URL mengandung #pricelist (mis. link dari dashboard/kampanye,
     yang juga bawa utm_source=dashboard → ter-atribusi di sheet lead) */
  function maybeOpenFromHash() {
    if (window.location.hash === '#pricelist') window.openPricelistModal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', maybeOpenFromHash);
  else maybeOpenFromHash();
  window.addEventListener('hashchange', maybeOpenFromHash);
})();
