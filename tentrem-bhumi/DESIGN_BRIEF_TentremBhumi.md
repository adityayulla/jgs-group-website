# Design Brief: Landing Page Tentrem Bhumi
## Untuk dilanjutkan di claude.ai/new (Claude Sonnet)

---

## INSTRUKSI UNTUK CLAUDE DESIGN

Kamu adalah web designer profesional spesialis landing page properti Indonesia.

Di bawah ini adalah kode HTML landing page mobile yang sudah ada.
Tugas kamu adalah melanjutkan pengembangan sesuai permintaan user.

**Rules wajib:**
- Output selalu berupa SATU file HTML lengkap (semua CSS & JS di dalam file)
- Mobile-first, max-width 390px
- Warna utama: hijau (#3B6D11, #EAF3DE, #27500A, #173404)
- Tombol WA selalu hijau #25D366
- Foto unit masih placeholder — biarkan saja, user akan ganti manual
- Pertahankan semua section yang sudah ada kecuali diminta hapus
- Google Maps iframe sudah ada, jangan diganti

---

## CARA PAKAI BRIEF INI

1. Buka claude.ai/new, pilih model Claude Sonnet
2. Paste seluruh isi file ini
3. Tambahkan permintaan spesifik kamu di bawah, contoh:
   - "Tambahkan section FAQ dengan 5 pertanyaan umum"
   - "Tambahkan section spesifikasi bangunan"
   - "Buat versi desktop (max-width 1200px)"
   - "Tambahkan sticky WhatsApp button yang selalu terlihat saat scroll"
   - "Tambahkan section testimoni dengan 3 review"
   - "Tambahkan kalkulasi cicilan KPR interaktif"

---

## BRAND INFO

- **Nama proyek:** Tentrem Bhumi
- **Developer:** JGS Group / PT Jogja Graha Selaras
- **Lokasi:** Jl. Besi Jangkang, Tanjungsari, Sukoharjo, Ngaglik, Sleman, DIY
- **Alamat Maps:** Perumahan Tentrem Bhumi, Ngaglik, Sleman
- **Telepon kantor:** 0274-2840726
- **Marketing utama:** Fira — +62 895-0688-8328
- **Marketing lain:** Okky (+62 856 4353 1971), Dwi (+62 889 0292 9571)
- **Website:** jogjagrahaselaras.com
- **Instagram:** @perumahan.tentrem
- **Berdiri:** Oktober 2024 (developer sejak 2013)
- **Google Rating:** 5 bintang

---

## DATA UNIT

### Andrawina 68 (2 lantai)
- 3 KT, 2 KM, balkon
- LB 68m², LT 99–133m²
- Harga Cash Keras mulai Rp 965.500.000
- Harga KPR mulai Rp 1.040.500.000
- Andrawina-1 & 6: SOLD

### Bhama 48 (1 lantai)
- 2 KT, 1 KM, lebar 8 meter
- LB 48m², LT 92–100m²
- Harga Cash Keras mulai Rp 646.900.000
- Harga KPR mulai Rp 721.900.000
- Bhama-1 & 6: SOLD

### Cantya (1 lantai)
- 2 KT, 1 KM, lebar 6 meter
- Tipe 32.5: LB 32.5m², Cash Keras mulai Rp 630.900.000
- Tipe 48: LB 48m², Cash Keras mulai Rp 695.900.000
- Cantya-3 & 5: SOLD

**Total tersedia:** 33 unit | **Sudah terjual:** 6+ unit

---

## FASILITAS

- Swimming Pool
- Basketball Court
- Playground
- One Gate System
- CCTV 24 jam
- Jalan dalam 6–7 meter

---

## AKSES LOKASI

- 2 menit ke Pom Bensin
- 3 menit ke Pasar Tradisional Jangkang
- 5 menit ke Universitas Islam Indonesia (UII)
- 7 menit ke Budi Mulia International School
- 9 menit ke Kopi Klotok Yogyakarta
- 15 menit ke RS JIH
- 15 menit ke Pakuwon Mall

---

## SPESIFIKASI BANGUNAN

- Pondasi: Pasangan batu kali
- Dinding: Batu bata merah plesteran/aci
- Konstruksi: Beton bertulang
- Lantai utama: Granit 60x60
- Dinding KM: Granit 30x60
- Closet: Standar TOTO
- Cat: PROPAN (dalam & luar)
- Rangka atap: Baja ringan 5/7 tebal 0.75mm
- Plafon: Gypsum 4mm
- Kusen: Aluminium
- Pintu utama: Multiplek finishing HPL
- Listrik: 1300w (1 lantai) / 2200w (2 lantai)
- Air: PDAM
- Meja dapur: Granit 60x60 + kitchen sink

---

## GOOGLE MAPS EMBED

```html
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.86238093926!2d110.4306170749189!3d-7.697914492319535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5d2781b7f58b%3A0x5b1fa95f2222dc20!2sPerumahan%20Tentrem%20Bhumi!5e0!3m2!1sen!2sid!4v1777038476472!5m2!1sen!2sid" width="100%" height="220" style="border:0;display:block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

---

## KODE HTML LANDING PAGE SAAT INI

```html
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Tentrem Bhumi — Rumah di Sleman, Yogyakarta</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
.lp { max-width: 390px; margin: 0 auto; background: #fff; }

/* HERO */
.hero { position: relative; height: 420px; overflow: hidden; background: #1a3a2a; }
.hero-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; }
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%);
  display: flex; flex-direction: column; justify-content: flex-end; padding: 24px 20px;
}
.hero-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35);
  border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #fff;
  margin-bottom: 10px; width: fit-content;
}
.hero h1 { font-size: 22px; font-weight: 600; color: #fff; line-height: 1.3; margin-bottom: 8px; }
.hero-sub { font-size: 14px; color: rgba(255,255,255,0.85); margin-bottom: 18px; line-height: 1.5; }
.btn-wa {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #25D366; color: #fff; border: none; border-radius: 10px;
  padding: 14px; font-size: 15px; font-weight: 600; text-decoration: none; width: 100%;
}

/* TRUST BAR */
.trust { display: flex; border-bottom: 1px solid #eee; }
.trust-item { flex: 1; padding: 14px 8px; text-align: center; border-right: 1px solid #eee; }
.trust-item:last-child { border-right: none; }
.trust-num { font-size: 18px; font-weight: 700; color: #3B6D11; }
.trust-label { font-size: 11px; color: #888; margin-top: 2px; }
.stars { color: #EF9F27; font-size: 14px; }

/* SECTIONS */
.section { padding: 24px 20px; border-bottom: 1px solid #eee; }
.section-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #3B6D11; margin-bottom: 6px; text-transform: uppercase; }
.section-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; line-height: 1.3; }
.section-sub { font-size: 14px; color: #666; margin-bottom: 16px; line-height: 1.5; }

/* FASILITAS */
.fас-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.fас-card { background: #EAF3DE; border-radius: 12px; padding: 14px 12px; display: flex; align-items: center; gap: 10px; }
.fас-icon { width: 36px; height: 36px; border-radius: 8px; background: #C0DD97; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fас-name { font-size: 13px; font-weight: 600; color: #27500A; }

/* AKSES */
.akses-list { display: flex; flex-direction: column; gap: 10px; }
.akses-item { display: flex; align-items: center; gap: 12px; background: #EAF3DE; border-radius: 8px; padding: 12px 14px; }
.akses-time { font-size: 15px; font-weight: 700; color: #3B6D11; min-width: 50px; }
.akses-place { font-size: 13px; color: #27500A; }
.maps-wrap { margin-top: 16px; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
.maps-wrap iframe { display: block; width: 100%; height: 220px; border: none; }
.maps-link { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; padding: 10px; border: 1px solid #3B6D11; border-radius: 8px; font-size: 13px; color: #3B6D11; text-decoration: none; }

/* UNIT TABS */
.unit-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.unit-tab { flex: 1; padding: 8px 4px; text-align: center; font-size: 12px; font-weight: 600; border: 1px solid #ddd; border-radius: 8px; background: #f5f5f5; color: #888; cursor: pointer; }
.unit-tab.active { background: #3B6D11; color: #fff; border-color: #3B6D11; }
.unit-card { border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
.unit-img-ph { height: 160px; background: #EAF3DE; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #3B6D11; }
.unit-body { padding: 14px; }
.unit-name { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
.unit-specs { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.unit-spec { font-size: 12px; background: #EAF3DE; border-radius: 6px; padding: 3px 8px; color: #3B6D11; }
.unit-price-row { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #eee; }
.unit-price-label { font-size: 11px; color: #888; }
.unit-price { font-size: 18px; font-weight: 700; color: #3B6D11; }
.btn-info { font-size: 13px; color: #3B6D11; text-decoration: none; border: 1px solid #3B6D11; border-radius: 8px; padding: 8px 14px; }

/* SOCIAL PROOF */
.sold-banner { background: #EAF3DE; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; display: flex; align-items: center; gap: 12px; }
.sold-num { font-size: 28px; font-weight: 700; color: #3B6D11; }
.sold-text { font-size: 13px; color: #27500A; line-height: 1.4; }

/* CTA FINAL */
.cta-final { padding: 24px 20px; background: #173404; }
.cta-final h2 { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px; }
.cta-final p { font-size: 14px; color: rgba(255,255,255,0.75); margin-bottom: 18px; line-height: 1.5; }
.contact-name { text-align: center; font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 8px; }

/* FOOTER */
.footer { padding: 16px 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
</style>
</head>
<body>
<div class="lp">

<!-- HERO -->
<div class="hero">
  <img class="hero-img" src="hero.jpg" alt="Gerbang Tentrem Bhumi"/>
  <div class="hero-overlay">
    <div class="hero-badge">📍 Sleman, Yogyakarta Utara</div>
    <h1>Hidup tentrem di Yogyakarta</h1>
    <p class="hero-sub">Kolam renang, basket court, dan rumah impian mulai 630 juta-an</p>
    <a class="btn-wa" href="https://api.whatsapp.com/send?phone=628950688832&text=Halo%20Fira%2C%20saya%20tertarik%20dengan%20Tentrem%20Bhumi">
      💬 Chat Fira Sekarang
    </a>
  </div>
</div>

<!-- TRUST BAR -->
<div class="trust">
  <div class="trust-item"><div class="trust-num">35</div><div class="trust-label">Total unit</div></div>
  <div class="trust-item"><div class="trust-num stars">★★★★★</div><div class="trust-label">Google rating</div></div>
  <div class="trust-item"><div class="trust-num">2013</div><div class="trust-label">Berdiri sejak</div></div>
</div>

<!-- FASILITAS -->
<div class="section">
  <div class="section-tag">Fasilitas Umum</div>
  <div class="section-title">Lebih dari sekadar rumah</div>
  <p class="section-sub">Fasilitas lengkap untuk keluarga tumbuh dan berkembang</p>
  <div class="fас-grid">
    <div class="fас-card"><div class="fас-icon">🏊</div><div class="fас-name">Kolam renang</div></div>
    <div class="fас-card"><div class="fас-icon">🏀</div><div class="fас-name">Basket court</div></div>
    <div class="fас-card"><div class="fас-icon">🛝</div><div class="fас-name">Playground</div></div>
    <div class="fас-card"><div class="fас-icon">🔐</div><div class="fас-name">One gate system</div></div>
    <div class="fас-card" style="grid-column:span 2;"><div class="fас-icon">📹</div><div class="fас-name">CCTV 24 jam</div></div>
  </div>
</div>

<!-- LOKASI -->
<div class="section">
  <div class="section-tag">Lokasi</div>
  <div class="section-title">Mudah dijangkau dari mana saja</div>
  <p class="section-sub">Jl. Besi Jangkang, Tanjungsari, Ngaglik, Sleman</p>
  <div class="akses-list">
    <div class="akses-item"><div class="akses-time">2 mnt</div><div class="akses-place">Pom Bensin</div></div>
    <div class="akses-item"><div class="akses-time">5 mnt</div><div class="akses-place">Universitas Islam Indonesia (UII)</div></div>
    <div class="akses-item"><div class="akses-time">7 mnt</div><div class="akses-place">Budi Mulia International School</div></div>
    <div class="akses-item"><div class="akses-time">9 mnt</div><div class="akses-place">Kopi Klotok Yogyakarta</div></div>
    <div class="akses-item"><div class="akses-time">15 mnt</div><div class="akses-place">RS JIH & Pakuwon Mall</div></div>
  </div>
  <div class="maps-wrap">
    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.86238093926!2d110.4306170749189!3d-7.697914492319535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5d2781b7f58b%3A0x5b1fa95f2222dc20!2sPerumahan%20Tentrem%20Bhumi!5e0!3m2!1sen!2sid!4v1777038476472!5m2!1sen!2sid" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
  <a class="maps-link" href="https://maps.google.com/?q=Perumahan+Tentrem+Bhumi+Ngaglik+Sleman">📍 Buka di Google Maps</a>
</div>

<!-- TIPE UNIT -->
<div class="section">
  <div class="section-tag">Tipe Unit</div>
  <div class="section-title">Pilih yang paling sesuai</div>
  <p class="section-sub">3 tipe tersedia, semua dengan spesifikasi premium</p>
  <div class="unit-tabs">
    <div class="unit-tab active" onclick="showUnit('andrawina',this)">Andrawina</div>
    <div class="unit-tab" onclick="showUnit('bhama',this)">Bhama</div>
    <div class="unit-tab" onclick="showUnit('cantya',this)">Cantya</div>
  </div>
  <div id="unit-andrawina" class="unit-card">
    <div class="unit-img-ph">[ Foto Andrawina ]</div>
    <div class="unit-body">
      <div class="unit-name">Andrawina 68</div>
      <div class="unit-specs"><span class="unit-spec">2 lantai</span><span class="unit-spec">3 KT</span><span class="unit-spec">2 KM</span><span class="unit-spec">LB 68m²</span></div>
      <div class="unit-price-row">
        <div><div class="unit-price-label">Mulai dari</div><div class="unit-price">Rp 965 jt</div></div>
        <a class="btn-info" href="https://api.whatsapp.com/send?phone=628950688832&text=Halo%20Fira%2C%20saya%20tertarik%20Andrawina">Info harga</a>
      </div>
    </div>
  </div>
  <div id="unit-bhama" class="unit-card" style="display:none;">
    <div class="unit-img-ph">[ Foto Bhama ]</div>
    <div class="unit-body">
      <div class="unit-name">Bhama 48</div>
      <div class="unit-specs"><span class="unit-spec">1 lantai</span><span class="unit-spec">2 KT</span><span class="unit-spec">1 KM</span><span class="unit-spec">LB 48m²</span></div>
      <div class="unit-price-row">
        <div><div class="unit-price-label">Mulai dari</div><div class="unit-price">Rp 646 jt</div></div>
        <a class="btn-info" href="https://api.whatsapp.com/send?phone=628950688832&text=Halo%20Fira%2C%20saya%20tertarik%20Bhama">Info harga</a>
      </div>
    </div>
  </div>
  <div id="unit-cantya" class="unit-card" style="display:none;">
    <div class="unit-img-ph">[ Foto Cantya ]</div>
    <div class="unit-body">
      <div class="unit-name">Cantya 32.5 & 48</div>
      <div class="unit-specs"><span class="unit-spec">1 lantai</span><span class="unit-spec">2 KT</span><span class="unit-spec">1 KM</span><span class="unit-spec">LB 32–48m²</span></div>
      <div class="unit-price-row">
        <div><div class="unit-price-label">Mulai dari</div><div class="unit-price">Rp 630 jt</div></div>
        <a class="btn-info" href="https://api.whatsapp.com/send?phone=628950688832&text=Halo%20Fira%2C%20saya%20tertarik%20Cantya">Info harga</a>
      </div>
    </div>
  </div>
</div>

<!-- SOCIAL PROOF -->
<div class="section">
  <div class="section-tag">Kepercayaan</div>
  <div class="section-title">Sudah dipercaya banyak keluarga</div>
  <p class="section-sub">Unit terus terjual sejak Oktober 2024</p>
  <div class="sold-banner">
    <div class="sold-num">6+</div>
    <div class="sold-text">Unit sudah terjual<br>dari 33 unit tersedia</div>
  </div>
  <p style="font-size:13px;color:#666;line-height:1.6;">JGS Group berpengalaman sejak 2013 dan telah membangun ratusan hunian di Yogyakarta.</p>
</div>

<!-- CTA FINAL -->
<div class="cta-final">
  <h2>Siap melihat langsung?</h2>
  <p>Konsultasi gratis, tanpa komitmen. Fira siap membantu kamu menemukan unit yang paling sesuai.</p>
  <a class="btn-wa" href="https://api.whatsapp.com/send?phone=628950688832&text=Halo%20Fira%2C%20saya%20mau%20konsultasi%20tentang%20Tentrem%20Bhumi">
    💬 Chat Fira Sekarang
  </a>
  <div class="contact-name">Fira · +62 895-0688-8328</div>
</div>

<div class="footer">© 2025 Tentrem Bhumi · JGS Group · PT Jogja Graha Selaras</div>

</div>
<script>
function showUnit(name, el) {
  ['andrawina','bhama','cantya'].forEach(u => {
    document.getElementById('unit-'+u).style.display = u===name?'block':'none';
  });
  document.querySelectorAll('.unit-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}
</script>
</body>
</html>
```

---

## CONTOH PROMPT LANJUTAN

Setelah paste brief ini ke Claude Design, tambahkan salah satu:

**Tambah FAQ:**
```
Tambahkan section FAQ setelah section Kepercayaan,
dengan 5 pertanyaan paling umum calon buyer properti
(KPR, booking fee, proses pembelian, sertifikat, dll).
Gunakan accordion yang bisa dibuka-tutup.
```

**Tambah sticky WA button:**
```
Tambahkan tombol WhatsApp floating yang selalu
terlihat di pojok kanan bawah saat user scroll.
Warna #25D366, ada efek pulse, link ke Fira.
```

**Tambah kalkulasi KPR:**
```
Tambahkan section kalkulator cicilan KPR interaktif.
Input: harga unit (slider), uang muka (%), tenor (tahun).
Output: estimasi cicilan per bulan.
Asumsi bunga KPR 10% per tahun.
```

**Buat versi desktop:**
```
Buat versi desktop dari landing page ini
dengan max-width 1200px, layout 2 kolom
untuk section fasilitas, unit, dan lokasi.
```
