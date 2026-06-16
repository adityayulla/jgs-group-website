/* ============================================================
   konten.js — JGS Group content data & carousel
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     UNIT POPULER — 6 cards
     ============================================================ */
  const popularCards = [
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Tipe Hiroi',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 441, kt: 2, km: 2, lb: 36, lt: 75,
      href: '/kawa-living/', img: '/assets/img/unit-unggulan/hiroi-15.webp' },
    { badge: 'Hot Deals',  badgeColor: 'orange',
      project: 'Tipe Okina',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 614, kt: 3, km: 2, lb: 61, lt: 90,
      href: '/kawa-living/', img: '/assets/img/unit-unggulan/okina-10.webp' },
    { badge: 'Premium',    badgeColor: 'gold',
      project: 'Tipe Andrawina', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 965, kt: 3, km: 3, lb: 68, lt: 127,
      href: '/tentrem-bhumi/', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/andrawina(1).webp' },
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Tipe Bhama', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 656, kt: 2, km: 2, lb: 40, lt: 90,
      href: '/tentrem-bhumi/', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-bhama.webp' },
    { badge: 'New',        badgeColor: 'green',
      project: 'Tipe Cantya', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 803, kt: 3, km: 2, lb: 48, lt: 125,
      href: '/tentrem-bhumi/', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-cantya.webp' },
    { badge: 'Best Value', badgeColor: 'blue',
      project: 'Tipe Yuri',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 479, kt: 2, km: 2, lb: 40, lt: 80,
      href: '/kawa-living/', img: '/assets/img/unit-unggulan/yuri-12.webp' },
  ];

  /* ============================================================
     PENGHARGAAN — 5 cards
     ============================================================ */
  const awardCards = [
    {
      year: '2021',
      name: '1st Contribution of Mandiri KPR',
      giver: 'Bank Mandiri',
      img: '/assets/img/penghargaan/Mandiri-2021.webp'
    },
    {
      year: '2021',
      name: 'Penyelesaian Bangunan Terbaik',
      giver: 'Bank BTN Syariah',
      img: '/assets/img/penghargaan/BTN-2021.webp'
    },
    {
      year: '2022',
      name: '1st Contribution of Mandiri KPR',
      giver: 'Bank Mandiri',
      img: '/assets/img/penghargaan/Mandiri-2022.webp'
    },
    {
      year: '2023',
      name: '1st Contribution of Mandiri KPR',
      giver: 'Bank Mandiri',
      img: '/assets/img/penghargaan/Mandiri-2023.webp'
    },
    {
      year: '2023',
      name: 'Developer Kualitas Pembiayaan Terbaik',
      giver: 'Bank BTN Syariah',
      img: '/assets/img/penghargaan/BTN-2023.webp'
    },
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
    const dataBg = d.img ? ` data-bg="${d.img}"` : '';
    const badgeBg = BADGE_COLORS[d.badgeColor] || '#E8872A';
    return `<div class="pop-card">
  <div class="pop-card__img"${dataBg}></div>
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
  function renderAwardCard(d) {
    return `<div class="aw-card">
    <div class="aw-card__img-wrap">
      <img src="${d.img}" alt="${d.name} ${d.year}"
           class="aw-card__img" loading="lazy">
    </div>
    <div class="aw-card__body">
      <span class="aw-card__year">${d.year}</span>
      <h3 class="aw-card__name">${d.name}</h3>
      <p class="aw-card__giver">${d.giver}</p>
    </div>
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

    // Lazy-load card background images
    var bgObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var bg = el.getAttribute('data-bg');
        if (bg) el.style.backgroundImage = "url('" + bg + "')";
        bgObs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    track.querySelectorAll('[data-bg]').forEach(function(el) { bgObs.observe(el); });

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
    const grid = document.getElementById('awardTrack');
    if (!grid) { console.error('awardTrack not found'); return; }
    grid.innerHTML = awardCards.map(renderAwardCard).join('');
  }

  /* ============================================================
     BLOG PREVIEW
     ============================================================ */
  const blogSubtitle = 'Panduan jujur membeli rumah di Yogyakarta — memilih developer, legalitas, hingga memantau progress pembangunan.';

  const blogPosts = [
    {
      cat: 'Developer Terpercaya',
      title: 'Cara Memastikan Developer Jogja Terpercaya (Tanpa Tertipu Rumah Inden)',
      excerpt: 'Checklist konkret untuk memeriksa kredibilitas developer sebelum menyerahkan uang ratusan juta — plus tanda bahaya developer abal-abal.',
      date: '15 Juni 2026',
      href: '/blog/cara-memastikan-developer-jogja-terpercaya/',
      img: '/assets/img/Proyek-Kami/Tentrem Jiwo/bird view.webp',
    },
    {
      cat: 'Rumah Inden',
      title: 'Beli Rumah Inden di Jogja: 7 Hal yang Wajib Dicek Sebelum Bayar',
      excerpt: 'Bukan menakuti, tapi membekali. Legalitas, izin, skema pembayaran, dan perlindungan pembeli di PPJB.',
      date: '16 Juni 2026',
      href: '/blog/beli-rumah-inden-jogja-aman/',
      img: '/assets/img/Proyek-Kami/Royal Mansion/tipe adiluhung.webp',
    },
    {
      cat: 'Transparansi Progress',
      title: 'Kenapa Progress Rumah Harus Bisa Dipantau (dan Cara JGS Membuktikannya)',
      excerpt: 'Setelah bayar, kabar progress sering menghilang. Beginilah seharusnya pembangunan rumah bisa dipantau.',
      date: '16 Juni 2026',
      href: '/blog/cara-pantau-progress-pembangunan-rumah/',
      img: '/assets/img/Kawa Living tipe Okina.webp',
    },
  ];

  /* Artikel "Coming Soon" — dipakai mengisi slot kosong saat jumlah artikel
     ganjil (layout 2 kolom di mobile). Kosongkan array ini bila belum ada
     artikel yang akan datang; slotnya akan dibiarkan kosong. */
  const comingSoonPosts = [
    {
      cat: 'Segera Hadir',
      title: 'Artikel properti berikutnya sedang kami siapkan',
    },
  ];

  function renderComingSoonCard(d) {
    const dataBg = d.img ? ` data-bg="${d.img}"` : '';
    return `<div class="blog__card blog__card--soon reveal" aria-hidden="true">
  <div class="blog__media"${dataBg}></div>
  <div class="blog__body">
    <span class="blog__cat blog__cat--soon">${d.cat || 'Segera Hadir'}</span>
    <h3 class="blog__title">${d.title}</h3>
    <span class="blog__soon-label">Coming Soon</span>
  </div>
</div>`;
  }

  function renderBlogCard(d, i) {
    const delayCls = i === 0 ? '' : ' reveal--delay-' + Math.min(i, 3);
    const dataBg = d.img ? ` data-bg="${d.img}"` : '';
    return `<a href="${d.href}" class="blog__card reveal${delayCls}">
  <div class="blog__media" aria-hidden="true"${dataBg}></div>
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
    let html = blogPosts.map(renderBlogCard).join('');
    // Jumlah artikel ganjil → isi 1 slot kosong (mobile 2 kolom) dengan kartu
    // coming-soon bila tersedia. Kartu ini disembunyikan di desktop via CSS.
    if (blogPosts.length % 2 === 1 && comingSoonPosts.length) {
      html += renderComingSoonCard(comingSoonPosts[0]);
    }
    grid.innerHTML = html;

    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var bg = el.getAttribute('data-bg');
        if (bg) {
          el.style.backgroundImage = "url('" + bg + "')";
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
        obs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    grid.querySelectorAll('[data-bg]').forEach(function(el) { obs.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPopular();
    initAwards();
    initBlog();
  });
})();
