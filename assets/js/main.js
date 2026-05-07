/* ============================================================
   JGS Group — main.js
   Shared: inject navbar/footer, parallax background,
           scroll-reveal, counter animation, nav scroll, FAQ
   ============================================================ */

(function () {
  'use strict';

  /* ── Component injection ─────────────────────────────────── */
  function getComponentBase() {
    // Works from both root and subdirectories
    const depth = location.pathname.replace(/^\//, '').split('/').filter(Boolean).length;
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    return prefix + 'components/';
  }

  async function injectComponent(selector, file) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(getComponentBase() + file);
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
      el.firstElementChild && el.replaceWith(...el.children);
    } catch (e) {
      console.warn('[JGS] Could not load component:', file, e);
    }
  }

  async function injectAll() {
    await Promise.all([
      injectComponent('#navbar-placeholder', 'navbar.html'),
      injectComponent('#footer-placeholder', 'footer.html'),
    ]);
    initNav();
  }

  /* ── Nav: scroll state + burger drawer ──────────────────── */
  function initNav() {
    const nav    = document.getElementById('nav');
    const burger = document.getElementById('navBurger');
    const drawer = document.getElementById('navDrawer');
    const close  = document.getElementById('navClose');

    if (nav) {
      const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 40);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (burger && drawer) {
      const open  = () => drawer.classList.add('navdr--on');
      const shut  = () => drawer.classList.remove('navdr--on');
      burger.addEventListener('click', open);
      if (close) close.addEventListener('click', shut);
      drawer.addEventListener('click', e => { if (e.target === drawer) shut(); });
      // Close on any drawer link click
      drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', shut));
    }

    // Highlight current page link
    const links = document.querySelectorAll('.nav__links a, .navdr__links a');
    links.forEach(a => {
      if (a.href === location.href || location.pathname.startsWith(new URL(a.href).pathname) && new URL(a.href).pathname !== '/') {
        a.style.opacity = '1';
        a.style.color = 'var(--navy)';
        a.style.fontWeight = '600';
      }
    });
  }

  /* ── Background: cursor-reactive parallax ───────────────── */
  function initBackground() {
    const root = document.querySelector('.bg-root');
    if (!root) return;

    const washA = root.querySelector('.reb__wash--a');
    const washB = root.querySelector('.reb__wash--b');
    const washC = root.querySelector('.reb__wash--c');
    const grid  = root.querySelector('.reb__blueprint');

    let mx = 0, my = 0, cx = 0.5, cy = 0.5;
    let raf = null;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      cx = lerp(cx, mx, 0.06);
      cy = lerp(cy, my, 0.06);

      const dx = (cx - 0.5) * 2;
      const dy = (cy - 0.5) * 2;

      if (washA) washA.style.transform = `translate3d(${dx * -30}px, ${dy * -24}px, 0)`;
      if (washB) washB.style.transform = `translate3d(${dx * 34}px,  ${dy * 28}px,  0)`;
      if (washC) washC.style.transform = `translate3d(${dx * 24}px,  ${dy * -30}px, 0)`;

      if (grid) {
        const pct = `${cx * 100}% ${cy * 100}%`;
        grid.style.maskPosition = pct;
        grid.style.webkitMaskPosition = pct;
        // Update CSS custom props for mask-image radial center
        root.style.setProperty('--mx-pct', `${cx * 100}%`);
        root.style.setProperty('--my-pct', `${cy * 100}%`);
      }

      raf = requestAnimationFrame(tick);
    }

    document.addEventListener('mousemove', e => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    }, { passive: true });

    // Gentle idle drift when no mouse
    let idleT = 0;
    document.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      function drift() {
        idleT += 0.004;
        mx = 0.5 + Math.sin(idleT) * 0.15;
        my = 0.5 + Math.cos(idleT * 0.7) * 0.1;
        raf = requestAnimationFrame(drift);
      }
      drift();
    });

    tick();
  }

  /* ── Scroll-reveal (IntersectionObserver) ───────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal--in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => obs.observe(el));
  }

  /* ── Counter animation ───────────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);

        const el     = e.target;
        const target = parseInt(el.dataset.count, 10);
        const dur    = 1800;
        const start  = performance.now();

        function step(now) {
          const p = Math.min((now - start) / dur, 1);
          // easeOutQuart
          const ep = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(ep * target);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
  }

  /* ── FAQ accordion ───────────────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq__row').forEach(row => {
      row.addEventListener('click', () => {
        const isOn = row.classList.contains('faq__row--on');
        // close all
        document.querySelectorAll('.faq__row--on').forEach(r => r.classList.remove('faq__row--on'));
        if (!isOn) {
          row.classList.add('faq__row--on');
          // toggle plus → minus
          const plus = row.querySelector('.faq__plus');
          if (plus) plus.textContent = '−';
        }
        // reset all others
        document.querySelectorAll('.faq__row:not(.faq__row--on) .faq__plus').forEach(p => { p.textContent = '+'; });
      });
    });
  }

  /* ── KPR Calculator ──────────────────────────────────────── */
  function initCalc() {
    const form = document.getElementById('kprCalc');
    if (!form) return;

    const rangeHarga  = form.querySelector('#calcHarga');
    const rangeDp     = form.querySelector('#calcDp');
    const rangeTenor  = form.querySelector('#calcTenor');
    const dispHarga   = form.querySelector('#dispHarga');
    const dispDp      = form.querySelector('#dispDp');
    const dispTenor   = form.querySelector('#dispTenor');
    const result      = form.querySelector('#calcResult');

    function fmt(n) {
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0','') + ' M';
      if (n >= 1e6) return (n / 1e6).toFixed(0) + ' Jt';
      return n.toLocaleString('id-ID');
    }

    function calculate() {
      const harga = parseInt(rangeHarga.value) * 1e6;
      const dpPct = parseInt(rangeDp.value);
      const tenor = parseInt(rangeTenor.value);
      const suku  = 0.105 / 12; // 10.5% p.a. flat

      const pinjaman = harga * (1 - dpPct / 100);
      const bulan    = tenor * 12;
      const cicilan  = bulan > 0
        ? (pinjaman * suku * Math.pow(1 + suku, bulan)) / (Math.pow(1 + suku, bulan) - 1)
        : 0;

      if (dispHarga) dispHarga.textContent = 'Rp ' + fmt(harga);
      if (dispDp)    dispDp.textContent    = dpPct + '%  (Rp ' + fmt(harga * dpPct / 100) + ')';
      if (dispTenor) dispTenor.textContent = tenor + ' tahun';
      if (result)    result.textContent    = 'Rp ' + fmt(Math.round(cicilan)) + '/bln';
    }

    [rangeHarga, rangeDp, rangeTenor].forEach(r => r && r.addEventListener('input', calculate));
    calculate();
  }

  /* ── Smooth scroll for anchor links ─────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── Parallax image on scroll ────────────────────────────── */
  function initScrollParallax() {
    const items = document.querySelectorAll('[data-parallax]');
    if (!items.length) return;

    function update() {
      const sy = window.scrollY;
      items.forEach(el => {
        const speed  = parseFloat(el.dataset.parallax) || 0.15;
        const rect   = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const offset = (center - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── Product row active state (homepage) ─────────────────── */
  function initProductRows() {
    const rows = document.querySelectorAll('.prod__row');
    if (!rows.length) return;

    rows.forEach(row => {
      row.addEventListener('mouseenter', () => {
        rows.forEach(r => r.classList.remove('prod__row--on'));
        row.classList.add('prod__row--on');
        const target = row.dataset.preview;
        if (target) {
          const preview = document.querySelector('.prod__preview-img');
          if (preview) preview.src = target;
          const label = document.querySelector('.prod__preview-name');
          if (label) label.textContent = row.dataset.name || '';
        }
      });
    });
  }

  /* ── Blueprint cursor parallax ───────────────────────────── */
  function initBlueprintParallax() {
    const blueprintImg = document.getElementById('blueprintImg');
    if (!blueprintImg) return;
    document.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      blueprintImg.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    injectAll().then(() => {
      initBackground();
      initReveal();
      initCounters();
      initFAQ();
      initCalc();
      initSmoothScroll();
      initScrollParallax();
      initProductRows();
      initBlueprintParallax();
    });
  });

})();
