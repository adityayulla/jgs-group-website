/* ============================================================
   konten.js — JGS Group content data & carousel
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     UNIT POPULER — 6 cards
     ============================================================ */
  /* CADANGAN. Isi sebenarnya dari Dashboard (Konten Web → Unit Unggulan),
     lihat muatDariDashboard() di bawah. */
  let popularCards = [
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Tipe Hiroi',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 441, kt: 2, km: 1, lb: 36, lt: 71,
      href: '/kawa-living/#tipe-hiroi-yuri', img: '/assets/img/unit-unggulan/hiroi-15.webp' },
    { badge: 'Hot Deals',  badgeColor: 'orange',
      project: 'Tipe Okina',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 614, kt: 3, km: 2, lb: 61, lt: 90,
      href: '/kawa-living/#tipe-okina', img: '/assets/img/unit-unggulan/okina-10.webp' },
    { badge: 'Premium',    badgeColor: 'gold',
      project: 'Tipe Andrawina', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 965, kt: 3, km: 2, lb: 68, lt: 127,
      href: '/tentrem-bhumi/#unit-andrawina', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/andrawina(1).webp' },
    { badge: 'Terlaris',   badgeColor: 'orange',
      project: 'Tipe Bhama', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 656, kt: 2, km: 1, lb: 40, lt: 90,
      href: '/tentrem-bhumi/#unit-bhama', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-bhama.webp' },
    { badge: 'New',        badgeColor: 'green',
      project: 'Tipe Cantya', type: 'Tentrem Bhumi',
      location: 'Kaliurang KM 12,5, Ngaglik',
      price: 803, kt: 3, km: 1, lb: 48, lt: 125,
      href: '/tentrem-bhumi/#unit-cantya', img: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-cantya.webp' },
    { badge: 'Best Value', badgeColor: 'blue',
      project: 'Tipe Yuri',   type: 'Kawa Living',
      location: 'Jalan Wates KM 10, Sedayu',
      price: 479, kt: 2, km: 1, lb: 40, lt: 80,
      href: '/kawa-living/#tipe-yuri', img: '/assets/img/unit-unggulan/yuri-12.webp' },
  ];

  /* ============================================================
     PENGHARGAAN — 5 cards
     ============================================================ */
  /* CADANGAN. Isi sebenarnya dari Dashboard (Konten Web → Penghargaan). */
  let awardCards = [
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

  /* Isi kartu kini bisa datang dari dashboard — selalu di-escape. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Render: popular card (full-image overlay) ──────────── */
  function renderPopularCard(raw) {
    const d = {};
    Object.keys(raw).forEach(k => { d[k] = esc(raw[k]); });
    const dataBg = d.img ? ` data-bg="${d.img}"` : '';
    const badgeBg = BADGE_COLORS[d.badgeColor] || '#E8872A';
    /* 24 Sep 2026: seluruh kartu adalah tautan. Clarity 30 hari: ±130 dari 341 dead-tap di
       halaman utama jatuh di kartu ini — pengunjung mengetuk foto/harga, bukan teks "lihat detail". */
    return `<a class="pop-card" href="${d.href}" aria-label="${d.project} ${d.type} — lihat detail">
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
    <span class="pop-card__cta">lihat detail →</span>
  </div>
</a>`;
  }

  /* ── Render: award card ─────────────────────────────────── */
  function renderAwardCard(raw) {
    const d = {};
    Object.keys(raw).forEach(k => { d[k] = esc(raw[k]); });
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
  /* Foto kartu populer dipakai galeri hero (foto-galeri.js) */
  function pasangGaleri() {
    window.JGS_GALERI_UNIT = popularCards.map(d => ({
      src: d.img, alt: d.project + ' ' + d.type, judul: d.project + ' · ' + d.type,
      sub: 'Rp ' + d.price + ' Juta · ' + d.kt + 'KT ' + d.km + 'KM · LB ' + d.lb + ' · LT ' + d.lt,
      href: d.href, cta: 'Lihat ' + d.type + ' →'
    }));
  }
  pasangGaleri();

  /* Dipegang di luar initPopular supaya carousel bisa digambar ulang saat
     isi dari dashboard datang, tanpa memasang tombol panah dua kali. */
  let popCards = [];
  let popObserver = null;
  let popPanahTerpasang = false;

  function initPopular() {
    const track  = document.getElementById('popTrack');
    const dotsEl = document.getElementById('popDots');
    const prev   = document.getElementById('popPrev');
    const next   = document.getElementById('popNext');
    if (!track) return;

    track.innerHTML = popularCards.map(renderPopularCard).join('');

    /* Subjudul mengikuti jumlah kartu ("Enam tipe pilihan, …"). */
    const subjudul = document.querySelector('#popular .popular__subtitle');
    if (subjudul) {
      const KATA = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua belas'];
      subjudul.textContent = (KATA[popularCards.length] || popularCards.length) + ' tipe pilihan, satu komitmen terhadap kualitas hunian.';
    }

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

    const cards = popCards = Array.from(track.children);
    if (dotsEl) dotsEl.innerHTML = '';
    if (popObserver) popObserver.disconnect();

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
    const observer = popObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const idx = cards.indexOf(entry.target);
          if (idx !== -1) updateDots(idx);
        }
      });
    }, { root: track, threshold: 0.5 });

    cards.forEach(card => observer.observe(card));

    if (prev && next && !popPanahTerpasang) {
      popPanahTerpasang = true;
      const scroll = dir => {
        const w = (popCards[0] ? popCards[0].offsetWidth : 280) + 20;
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

  /* CADANGAN saja. Daftar sebenarnya dibaca langsung dari
     /blog/index.html saat halaman dimuat (lihat initBlog) — jadi
     menambah artikel di sana sudah cukup, halaman depan ikut sendiri.
     Isi di bawah ini hanya dipakai kalau berkas itu gagal diambil,
     supaya section blog tidak pernah kosong. */
  const blogPosts = [
    {
      cat: 'Area & Lokasi',
      title: 'Sedayu Itu Daerah Mana? Mengenal Kawasan Sedayu, Bantul',
      excerpt: 'Sedayu masuk Bantul, tapi bertetangga dengan Sleman dan Kulon Progo. Batas wilayah, kalurahan, akses Jalan Wates, dan cara menilai jauh-dekatnya.',
      date: '11 Agustus 2026',
      href: '/blog/sedayu-daerah-mana/',
      img: '/blog/img/sedayu-kawasan.jpg',
    },
    {
      cat: 'Panduan Membeli',
      title: 'Beli Rumah Cash Bertahap Tanpa Riba di Jogja: Cara Kerjanya & Yang Perlu Dicek',
      excerpt: 'Tanpa bunga bank, tanpa BI checking. Kenali skema cash bertahap langsung ke developer — kelebihan, risikonya, dan cara memastikannya aman.',
      date: '27 Juli 2026',
      href: '/blog/rumah-cash-bertahap-tanpa-riba-jogja/',
      img: '/blog/img/cash-bertahap.jpg',
    },
    {
      cat: 'Panduan Membeli',
      title: 'Perumahan di Jogja: Barat, Utara, atau Timur? Panduan Memilih Area yang Cocok',
      excerpt: 'Sebelum melihat harga, tentukan dulu sisi Jogja yang cocok — Barat (Sedayu), Utara (Ngaglik), atau Timur (Kalasan). Begini cara memilihnya.',
      date: '26 Juli 2026',
      href: '/blog/perumahan-jogja-panduan-area/',
      img: '/blog/img/perumahan-jogja-area.jpg',
    },
    {
      cat: 'Transparansi Progress',
      title: 'Di Balik Layar: Bagaimana Tim Lapangan JGS Menyusun Update Progress untuk Anda',
      excerpt: 'Dari lokasi berdebu, lewat tangan pengawas kami, sampai ke layar HP Anda — begini proses update progress kami disusun setiap minggu.',
      date: '20 Juli 2026',
      href: '/blog/di-balik-layar-update-progress/',
      img: '/blog/img/progress-card.jpg',
    },
    {
      cat: 'Track Record',
      title: '13 Tahun, 300+ Keluarga: Apa Arti Track Record untuk Pembeli Rumah',
      excerpt: 'Rekam jejak adalah satu-satunya bukti yang tidak bisa dibuat dalam semalam — dan begini cara memeriksanya.',
      date: '16 Juli 2026',
      href: '/blog/track-record-developer-rumah/',
      img: '/assets/img/serah-terima/tentrem-jiwo__tj-7.webp',
    },
    {
      cat: 'Developer Terpercaya',
      title: '9 Pertanyaan yang Wajib Anda Ajukan ke Developer Sebelum Bayar DP',
      excerpt: 'Di momen sebelum DP, Anda masih punya semua daya tawar. Simpan daftar ini dan bawa ke setiap kantor pemasaran.',
      date: '16 Juli 2026',
      href: '/blog/pertanyaan-sebelum-dp-rumah/',
      img: '/assets/img/Proyek-Kami/Tentrem Jiwo/gate tentrem jiwo.webp',
    },
  ];

  /* Artikel "Coming Soon" — dipakai mengisi slot kosong saat jumlah artikel
     ganjil (layout 2 kolom di mobile). Kosongkan array ini bila belum ada
     artikel yang akan datang; slotnya akan dibiarkan kosong. */
  /* Kosong: semua artikel yang pernah dijanjikan sudah tayang. Isi lagi
     HANYA kalau memang ada artikel yang sedang digarap — kartu "segera
     hadir" di samping artikel yang sudah banyak justru bikin blog
     terlihat mandek. */
  const comingSoonPosts = [];

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

  const BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                    'Juli','Agustus','September','Oktober','November','Desember'];

  function tanggalID(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    return `${+m[3]} ${BULAN_ID[+m[2] - 1]} ${m[1]}`;
  }

  /* Baca daftar artikel dari /blog/index.html — satu sumber kebenaran.
     Halaman itu cuma ~17 KB dan sudah di-cache browser setelah sekali
     ambil. Kalau gagal (offline, berkas dipindah), pemanggil memakai
     array cadangan blogPosts. */
  async function ambilArtikelDariBlog() {
    const res = await fetch('/blog/index.html', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

    const teks = (el, sel) => (el.querySelector(sel)?.textContent || '').trim();
    return [...doc.querySelectorAll('a.post-card--live')]
      .map((a) => ({
        href: a.getAttribute('href'),
        iso: a.getAttribute('data-date') || '',
        date: tanggalID(a.getAttribute('data-date')),
        img: a.querySelector('img')?.getAttribute('src') || '',
        cat: teks(a, '.post-card__meta'),
        title: teks(a, '.post-card__title'),
        excerpt: teks(a, '.post-card__excerpt'),
      }))
      .filter((d) => d.href && d.title)
      // Urutkan sendiri: kalau suatu saat kartu disisipkan di posisi yang
      // salah di /blog/, halaman depan tetap menampilkan yang terbaru.
      .sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));
  }

  function gambarKartu(grid) {
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const bg = el.getAttribute('data-bg');
        if (bg) {
          el.style.backgroundImage = "url('" + bg + "')";
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
        obs.unobserve(el);
      });
    }, { rootMargin: '400px' });
    grid.querySelectorAll('[data-bg]').forEach(function (el) { obs.observe(el); });
  }

  function tulisKartu(grid, posts) {
    let html = posts.map(renderBlogCard).join('');
    // Jumlah artikel ganjil → isi 1 slot kosong (mobile 2 kolom) dengan kartu
    // coming-soon bila tersedia. Kartu ini disembunyikan di desktop via CSS.
    if (posts.length % 2 === 1 && comingSoonPosts.length) {
      html += renderComingSoonCard(comingSoonPosts[0]);
    }
    grid.innerHTML = html;
    gambarKartu(grid);
  }

  function initBlog() {
    const sub = document.querySelector('[data-blog-subtitle]');
    if (sub) sub.textContent = blogSubtitle;
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    const JUMLAH = 6;
    tulisKartu(grid, blogPosts.slice(0, JUMLAH));   // tampil dulu, jangan kosong

    ambilArtikelDariBlog()
      .then((semua) => {
        const baru = semua.slice(0, JUMLAH);
        if (!baru.length) return;
        // Sudah sama? jangan digambar ulang — menghindari kedipan.
        const kunci = (l) => l.map((d) => d.href).join('|');
        if (kunci(baru) === kunci(blogPosts.slice(0, JUMLAH))) return;
        tulisKartu(grid, baru);
      })
      .catch(() => { /* pakai cadangan yang sudah tampil */ });
  }

  /* ============================================================
     ISI DARI DASHBOARD — Konten Web → Unit Unggulan, Video House Tour,
     Penghargaan (progress.jogjagrahaselaras.com/api/public/web-content).
     Isi di berkas ini dan di index.html tetap jadi CADANGAN: kalau feed
     mati atau belum terisi, tidak ada yang berubah. Bagian yang isinya
     sama dengan cadangan tidak digambar ulang — tanpa kedipan.
     ============================================================ */
  const FEED_DAFTAR = 'https://progress.jogjagrahaselaras.com/api/public/web-content?keys=unit-unggulan,house-tour,penghargaan,testimoni,mitra,faq,kpr,kpr-bank';
  const CACHE_DAFTAR = 'jgs_daftar_v2';

  function sidik(list, kolom) {
    return JSON.stringify(list.map(d => kolom.map(k => String(d[k]))));
  }

  const KOLOM_UNIT = ['badge', 'badgeColor', 'project', 'type', 'location', 'price', 'kt', 'km', 'lb', 'lt', 'href', 'img'];
  const KOLOM_AWARD = ['year', 'name', 'giver', 'img'];
  const KOLOM_TUR = ['video', 'judul', 'proyek', 'img'];

  const PLAY = '<span class="ht__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';

  /* Kartu house tour yang sekarang tertulis di index.html. */
  function turDiHalaman(grid) {
    return Array.from(grid.querySelectorAll('.ht__card')).map(c => {
      const cap = c.querySelector('.ht__cap');
      const kecil = cap && cap.querySelector('small');
      const img = c.querySelector('.ht__thumb');
      return {
        video: ((c.getAttribute('onclick') || '').match(/openHt\('([^']+)'\)/) || [])[1] || '',
        judul: cap && cap.firstChild ? cap.firstChild.nodeValue.trim() : '',
        proyek: kecil ? kecil.textContent.trim() : '',
        img: img ? img.getAttribute('src') : ''
      };
    });
  }

  function renderTur(raw) {
    const video = String(raw.video).replace(/[^A-Za-z0-9_-]/g, '');
    const judul = esc(raw.judul), proyek = esc(raw.proyek);
    return `<button class="ht__card" type="button" onclick="openHt('${video}')" aria-label="Putar house tour ${judul} — ${proyek}">
        <img class="ht__thumb" src="${esc(raw.img)}" alt="House tour unit ${judul} — ${proyek}" loading="lazy">
        ${PLAY}
        <span class="ht__cap">${judul}<small>${proyek}</small></span>
      </button>`;
  }

  /* ── Testimoni, Mitra, FAQ: tertulis di index.html, digambar ulang
     hanya kalau isi dashboard berbeda. Kartu baru langsung diberi
     reveal--in — pengamat scroll-reveal main.js tidak mengenalnya. ── */
  const rapi = x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim();
  const teksDari = (el, sel) => { const n = el.querySelector(sel); return n ? rapi(n.textContent) : ''; };
  const srcDari = (el, sel) => {
    const n = el.querySelector(sel); const v = n ? n.getAttribute('src') || '' : '';
    return v && !/^(\/|https?:)/.test(v) ? '/' + v : v;
  };

  const KOLOM_TS = ['nama', 'unit', 'body', 'sumber', 'tag', 'img'];
  function testimoniDiHalaman(grid) {
    return Array.from(grid.querySelectorAll('.ts__card')).map(c => ({
      nama: teksDari(c, '.ts__name'), unit: teksDari(c, '.ts__unit'), body: teksDari(c, '.ts__body'),
      sumber: teksDari(c, '.ts__source').replace(/^G/, ''), tag: teksDari(c, '.ts__media-tag'),
      img: srcDari(c, '.ts__media img')
    }));
  }
  function renderTestimoni(raw) {
    const d = {}; Object.keys(raw).forEach(k => { d[k] = esc(raw[k]); });
    return `<article class="ts__card glass reveal reveal--in">
        <div class="ts__media">
          <img src="${d.img}" alt="${d.tag} ${d.nama}" loading="lazy">
          <span class="ts__media-tag">${d.tag}</span>
        </div>
        <div class="ts__content">
          <div class="ts__quote">"</div>
          <div>
            <span class="ts__source"><span class="ts__source-g">G</span>${d.sumber}</span>
            <div class="ts__stars" aria-label="5 bintang">★★★★★</div>
            <p class="ts__body">${d.body}</p>
          </div>
          <div class="ts__foot">
            <div class="ts__av">${esc(String(raw.nama).trim().charAt(0).toUpperCase())}</div>
            <div>
              <div class="ts__name">${d.nama}</div>
              <div class="ts__unit">${d.unit}</div>
            </div>
          </div>
        </div>
      </article>`;
  }

  const KOLOM_MITRA = ['nama', 'role', 'lembaga', 'tag', 'body', 'foto', 'logo'];
  function mitraDiHalaman(grid) {
    return Array.from(grid.querySelectorAll('.mitra__card')).map(c => {
      const logo = c.querySelector('.mitra__logo img');
      return {
        nama: teksDari(c, '.mitra__name'), role: teksDari(c, '.mitra__role'),
        lembaga: logo ? rapi(logo.getAttribute('alt')) : '', tag: teksDari(c, '.mitra__tag'),
        body: teksDari(c, '.mitra__body'), foto: srcDari(c, '.mitra__photo img'), logo: srcDari(c, '.mitra__logo img')
      };
    });
  }
  function renderMitra(raw) {
    const d = {}; Object.keys(raw).forEach(k => { d[k] = esc(raw[k]); });
    return `<article class="mitra__card reveal reveal--in">
        <div class="mitra__photo"><img src="${d.foto}" alt="${d.nama} — ${d.role}" loading="lazy"></div>
        <div class="mitra__main">
          <div class="mitra__head">
            <div class="mitra__logo"><img src="${d.logo}" alt="${d.lembaga}" loading="lazy"></div>
            <span class="mitra__tag">${d.tag}</span>
          </div>
          <p class="mitra__body">${d.body}</p>
          <div class="mitra__foot">
            <div class="mitra__name">${d.nama}</div>
            <div class="mitra__role">${d.role}</div>
          </div>
        </div>
      </article>`;
  }

  const KOLOM_FAQ = ['q', 'a'];
  function faqDiHalaman(list) {
    return Array.from(list.querySelectorAll('.faq__row')).map(r => ({ q: teksDari(r, '.faq__q'), a: teksDari(r, '.faq__a') }));
  }
  function renderFaq(raw, i) {
    return `<div class="faq__row">
        <div class="faq__qrow">
          <span class="faq__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="faq__q">${esc(raw.q)}</span>
          <span class="faq__plus">+</span>
        </div>
        <div class="faq__a">${esc(raw.a)}</div>
      </div>`;
  }
  /* ── Kalkulator KPR: angka awal + logo bank kerja sama ────── */
  let kalkulatorDisentuh = false;
  function awasiKalkulator() {
    const panel = document.querySelector('#kalkulator .calc__panel');
    if (!panel) return;
    const tandai = e => { if (e.isTrusted) kalkulatorDisentuh = true; };
    panel.addEventListener('input', tandai, true);
    panel.addEventListener('click', tandai, true);
  }
  function pasangKpr(v) {
    /* Pengunjung yang sudah menggeser kalkulator tidak diganggu. */
    if (!v || kalkulatorDisentuh) return;
    const setel = (id, nilai) => {
      const el = document.getElementById(id);
      if (!el || typeof nilai !== 'number' || parseFloat(el.value) === nilai) return;
      el.value = String(nilai);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setel('slHarga', v.harga);
    setel('slDp', v.dp);
    setel('slBunga', v.bunga);
    const aktif = document.querySelector('#kalkulator .calc__tenor-btn--on');
    const tujuan = document.querySelector('#kalkulator .calc__tenor-btn[data-t="' + parseInt(v.tenor, 10) + '"]');
    if (tujuan && tujuan !== aktif) tujuan.click();
  }
  function pasangBank(items) {
    const panel = document.querySelector('#kalkulator .calc__panel');
    if (!panel) return;
    let baris = panel.querySelector('.calc__bank');
    if (!Array.isArray(items) || items.length === 0) {
      if (baris) baris.remove();
      return;
    }
    if (!baris) {
      baris = document.createElement('div');
      baris.className = 'calc__bank';
      baris.style.cssText = 'padding:16px 24px 18px;border-top:1px solid var(--line);background:#fff;';
      panel.appendChild(baris);
    }
    baris.innerHTML =
      '<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Bank kerja sama KPR</div>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px;">' +
      items.map(b => `<img src="${esc(b.logo)}" alt="${esc(b.nama)}" title="${esc(b.nama)}" loading="lazy" style="height:28px;width:auto;max-width:110px;object-fit:contain;">`).join('') +
      '</div>';
  }

  function pakaiDashboard(s) {
    try {
      const ts = s && s['testimoni'] && s['testimoni'].items;
      const grid = document.querySelector('#testimoni .ts__grid');
      if (grid && Array.isArray(ts) && ts.length && sidik(ts, KOLOM_TS) !== sidik(testimoniDiHalaman(grid), KOLOM_TS)) {
        grid.innerHTML = ts.map(renderTestimoni).join('');
      }
    } catch (e) {}
    try {
      const mt = s && s['mitra'] && s['mitra'].items;
      const grid = document.querySelector('#mitra .mitra__grid');
      if (grid && Array.isArray(mt) && mt.length && sidik(mt, KOLOM_MITRA) !== sidik(mitraDiHalaman(grid), KOLOM_MITRA)) {
        grid.innerHTML = mt.map(renderMitra).join('');
      }
    } catch (e) {}
    try {
      const fq = s && s['faq'] && s['faq'].items;
      const list = document.querySelector('#faq .faq__list');
      if (list && Array.isArray(fq) && fq.length && sidik(fq, KOLOM_FAQ) !== sidik(faqDiHalaman(list), KOLOM_FAQ)) {
        // Klik buka/tutup ditangani initFAQ() di main.js (pendengar di document).
        list.innerHTML = fq.map(renderFaq).join('');
      }
    } catch (e) {}
    try { pasangKpr(s && s['kpr']); } catch (e) {}
    try { pasangBank(s && s['kpr-bank'] && s['kpr-bank'].items); } catch (e) {}
    try {
      const unit = s && s['unit-unggulan'] && s['unit-unggulan'].items;
      if (Array.isArray(unit) && unit.length && sidik(unit, KOLOM_UNIT) !== sidik(popularCards, KOLOM_UNIT)) {
        popularCards = unit;
        pasangGaleri();
        initPopular();
      }
    } catch (e) {}
    try {
      const aw = s && s['penghargaan'] && s['penghargaan'].items;
      if (Array.isArray(aw) && aw.length && sidik(aw, KOLOM_AWARD) !== sidik(awardCards, KOLOM_AWARD)) {
        awardCards = aw;
        initAwards();
      }
    } catch (e) {}
    try {
      const tur = s && s['house-tour'] && s['house-tour'].items;
      const grid = document.querySelector('#house-tour .ht__grid');
      if (grid && Array.isArray(tur) && tur.length && sidik(tur, KOLOM_TUR) !== sidik(turDiHalaman(grid), KOLOM_TUR)) {
        grid.innerHTML = tur.map(renderTur).join('');
      }
    } catch (e) {}
  }

  function muatDariDashboard() {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_DAFTAR) || 'null');
      if (c && Date.now() - c.t < 5 * 60 * 1000) { pakaiDashboard(c.v); return; }
    } catch (e) {}
    fetch(FEED_DAFTAR, { mode: 'cors' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !j.sections) return;
        try { sessionStorage.setItem(CACHE_DAFTAR, JSON.stringify({ t: Date.now(), v: j.sections })); } catch (e) {}
        pakaiDashboard(j.sections);
      })
      .catch(() => { /* pakai cadangan yang sudah tampil */ });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPopular();
    initAwards();
    initBlog();
    awasiKalkulator();
    muatDariDashboard();
  });
})();
