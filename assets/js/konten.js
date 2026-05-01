/* ============================================================
   konten.js — JGS Group content data & carousel
   ============================================================ */

(function () {
  'use strict';

  const TENTREM_IMG = 'https://jogjagrahaselaras.com/tentrem-bhumi/photos/cantya/cantya%20berjejer%202.webp';

  /* ============================================================
     UNIT POPULER — 6 cards
     ============================================================ */
  const popularCards = [
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Kawa Living',   type: 'Tipe Hiroi',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 420, kt: 2, km: 2, lb: 36, lt: 75,
      href: '/kawa-living', img: null },
    { badge: 'Best Value', badgeColor: 'blue',
      project: 'Kawa Living',   type: 'Tipe Yuri',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 490, kt: 2, km: 2, lb: 40, lt: 80,
      href: '/kawa-living', img: null },
    { badge: 'Hot Deals',  badgeColor: 'orange',
      project: 'Kawa Living',   type: 'Tipe Okina',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 680, kt: 3, km: 2, lb: 61, lt: 90,
      href: '/kawa-living', img: null },
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Tentrem Bhumi', type: 'Tipe Bhama',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 620, kt: 2, km: 2, lb: 40, lt: 90,
      href: '/tentrem-bhumi', img: TENTREM_IMG },
    { badge: 'New',        badgeColor: 'green',
      project: 'Tentrem Bhumi', type: 'Tipe Cantya',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 690, kt: 3, km: 2, lb: 48, lt: 125,
      href: '/tentrem-bhumi', img: TENTREM_IMG },
    { badge: 'Premium',    badgeColor: 'gold',
      project: 'Tentrem Bhumi', type: 'Tipe Andrawina',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 960, kt: 3, km: 3, lb: 68, lt: 127,
      href: '/tentrem-bhumi', img: TENTREM_IMG },
  ];

  /* ============================================================
     PENGHARGAAN — 4 cards
     ============================================================ */
  const awardCards = [
    { icon: '🏆', year: '2021', name: 'Juara 1 Penyumbang KPR Terbanyak', giver: 'Bank Mandiri' },
    { icon: '🥇', year: '2022', name: 'Juara 1 Penyumbang KPR Terbanyak', giver: 'Bank Mandiri' },
    { icon: '🏗',  year: '2023', name: 'Developer Pembangunan Terbaik',    giver: 'Bank BTN Syariah' },
    { icon: '🥇', year: '2023', name: 'Juara 1 Penyumbang KPR Terbanyak', giver: 'Bank Mandiri' },
  ];

  /* ── SVG icons ─────────────────────────────────────────── */
  const BED  = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 11V7a3 3 0 013-3h8a3 3 0 013 3v4M1 11h14M1 11v2M15 11v2M4 4V2h8v2"/></svg>`;
  const BATH = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9h12v1.5A4.5 4.5 0 019.5 15h-3A4.5 4.5 0 012 10.5V9zm0 0V5a2 2 0 014 0v4"/></svg>`;
  const SQ   = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/></svg>`;
  const PIN  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

  const BADGE_COLORS = {
    orange: '#E8872A',
    blue:   '#2A5AE8',
    green:  '#2A9E5A',
    gold:   '#c8860a',
  };

  /* ── Render: popular card (full-image overlay) ──────────── */
  function renderPopularCard(d) {
    const imgStyle = d.img
      ? `background-image:url('${d.img}');`
      : '';
    const badgeBg = BADGE_COLORS[d.badgeColor] || '#E8872A';
    return `<div class="pop-card">
  <div class="pop-card__img" style="${imgStyle}"></div>
  <div class="pop-card__shade"></div>
  <span class="pop-card__badge" style="background:${badgeBg}">${d.badge}</span>
  <div class="pop-card__head">
    <div class="pop-card__name">${d.project}</div>
    <div class="pop-card__type">${d.type}</div>
    <div class="pop-card__loc">${PIN}${d.location}</div>
  </div>
  <div class="pop-card__body">
    <div class="pop-card__price">
      <span class="pop-card__rp">Rp</span>
      <span class="pop-card__val">${d.price}</span>
      <span class="pop-card__unit">Juta</span>
    </div>
    <div class="pop-card__meta">
      <span class="pop-card__meta-item">${BED}&nbsp;${d.kt}KT</span>
      <span class="pop-card__meta-item">${BATH}&nbsp;${d.km}KM</span>
    </div>
    <div class="pop-card__meta">
      <span class="pop-card__meta-item">${SQ}&nbsp;LB ${d.lb} · LT ${d.lt}</span>
    </div>
    <a href="${d.href}" class="pop-card__cta">lihat detail →</a>
  </div>
</div>`;
  }

  /* ── Render: award card ─────────────────────────────────── */
  function renderAwardCard(d, i) {
    const delayCls = i === 0 ? '' : ' reveal--delay-' + Math.min(i, 3);
    return `<div class="aw2-card reveal${delayCls}">
  <div class="aw2-card__icon">${d.icon}</div>
  <div class="aw2-card__year">${d.year}</div>
  <div class="aw2-card__name">${d.name}</div>
  <div class="aw2-card__giver">${d.giver}</div>
</div>`;
  }

  /* ── Init: popular carousel ─────────────────────────────── */
  function initPopular() {
    const track  = document.getElementById('popTrack');
    const dotsEl = document.getElementById('popDots');
    const prev   = document.getElementById('popPrev');
    const next   = document.getElementById('popNext');
    if (!track) return;

    track.innerHTML = popularCards.map(renderPopularCard).join('');

    const cards = Array.from(track.children);

    const dotBtns = popularCards.map((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'pop__dot' + (i === 0 ? ' pop__dot--on' : '');
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      btn.addEventListener('click', () => {
        const card = cards[i];
        if (!card) return;
        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        track.scrollTo({ left: card.offsetLeft - padLeft, behavior: 'smooth' });
      });
      dotsEl && dotsEl.appendChild(btn);
      return btn;
    });

    function updateDots(idx) {
      dotBtns.forEach((b, i) => b.classList.toggle('pop__dot--on', i === idx));
    }

    // IntersectionObserver — update dots as cards scroll into view
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const idx = cards.indexOf(entry.target);
          if (idx !== -1) updateDots(idx);
        }
      });
    }, { root: track, threshold: 0.5 });

    cards.forEach(card => observer.observe(card));

    if (prev && next) {
      const scroll = dir => {
        const w = (cards[0] ? cards[0].offsetWidth : 280) + 20;
        track.scrollBy({ left: dir * w, behavior: 'smooth' });
      };
      prev.addEventListener('click', () => scroll(-1));
      next.addEventListener('click', () => scroll(1));
    }
  }

  /* ── Init: awards grid ──────────────────────────────────── */
  function initAwards() {
    const grid = document.getElementById('awardGrid');
    if (!grid) return;
    grid.innerHTML = awardCards.map(renderAwardCard).join('');
  }

  /* ============================================================
     BLOG PREVIEW
     ============================================================ */
  const blogSubtitle = 'Panduan membeli rumah, investasi properti, dan kehidupan di Yogyakarta.';

  const blogPosts = [
    {
      cat: 'Tips KPR',
      title: 'Panduan Lengkap Ajukan KPR Rumah Pertama di Jogja',
      excerpt: 'Proses KPR tidak harus rumit. Pelajari langkah-langkah mudah dari persiapan berkas hingga akad kredit.',
      date: '20 April 2026',
      href: '/blog',
    },
    {
      cat: 'Info Jogja',
      title: 'Kenapa Ngaglik Sleman Jadi Incaran Pembeli Rumah 2026?',
      excerpt: 'Kawasan Ngaglik tumbuh pesat — infrastruktur berkembang, harga masih kompetitif, dan akses semakin mudah.',
      date: '15 April 2026',
      href: '/blog',
    },
    {
      cat: 'Tips Properti',
      title: 'Cara Cek Legalitas Rumah Sebelum Beli: SHM, PBG, dan AJB',
      excerpt: 'Jangan sampai tergiur harga murah tanpa cek legalitas. Ini panduan lengkap yang wajib Anda tahu sebelum tanda tangan.',
      date: '10 April 2026',
      href: '/blog',
    },
  ];

  function renderBlogCard(d, i) {
    const delayCls = i === 0 ? '' : ' reveal--delay-' + Math.min(i, 3);
    return `<a href="${d.href}" class="blog__card reveal${delayCls}">
  <div class="blog__media" aria-hidden="true"></div>
  <div class="blog__body">
    <span class="blog__cat">${d.cat}</span>
    <h3 class="blog__title">${d.title}</h3>
    <p class="blog__excerpt">${d.excerpt}</p>
    <div class="blog__foot">
      <span class="blog__date">${d.date}</span>
      <span class="blog__more">Baca Selengkapnya →</span>
    </div>
  </div>
</a>`;
  }

  function initBlog() {
    const sub = document.querySelector('[data-blog-subtitle]');
    if (sub) sub.textContent = blogSubtitle;
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    grid.innerHTML = blogPosts.map(renderBlogCard).join('');
  }

  /* ============================================================
     INSTAGRAM FEED
     ============================================================ */
  const IG_HANDLE = '@jogjagrahaselaras';
  const IG_HREF   = 'https://www.instagram.com/jogjagrahaselaras';
  const IG_TILES  = 6;
  const IG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>`;

  function renderIgTile(_, i) {
    const delayIdx = i % 3;
    const delayCls = delayIdx === 0 ? '' : ' reveal--delay-' + delayIdx;
    return `<a href="${IG_HREF}" target="_blank" rel="noopener" class="ig__tile reveal${delayCls}" aria-label="Instagram ${IG_HANDLE} — post ${i + 1}">
  <div class="ig__tile-icon">${IG_ICON}</div>
  <div class="ig__tile-overlay">${IG_ICON}</div>
</a>`;
  }

  function initInstagram() {
    const handle = document.querySelector('[data-ig-handle]');
    if (handle) handle.textContent = IG_HANDLE;
    const grid = document.getElementById('igGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: IG_TILES }, (_, i) => renderIgTile(null, i)).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPopular();
    initAwards();
    initBlog();
    initInstagram();
  });
})();
