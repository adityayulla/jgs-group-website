#!/usr/bin/env node
/**
 * build.mjs — menempelkan promo dari Panel JGS ke halaman web.
 *
 * Sebelum 12 Sep 2026 promo diketik tangan di SEMBILAN tempat: beranda, badge hero,
 * halaman Kawa Living, tiga halaman landing, dan tiga berkas data pricelist. Akibatnya
 * angkanya sempat berbeda-beda — halaman landing menulis "cashback Rp 25 jt" sementara
 * beranda menulis "diskon Rp 15+5 jt" — dan tidak ada yang tahu sejak kapan.
 *
 * Sekarang promo diketik SEKALI di Panel JGS (tab "Promo"), dan berkas ini menempelkannya
 * ke halaman. Menekan "Simpan & terbitkan" di sana memicu workflow yang menjalankan skrip
 * ini (repository_dispatch event_type "promo").
 *
 * Promo yang lewat tanggal berakhir sudah disaring di Panel JGS — jawabannya jadi
 * { promo: null }, section promo hilang dari halaman, tanpa ada yang perlu mencabutnya.
 *
 *   node tools/promo/build.mjs          # tempel / bersihkan sesuai keadaan promo
 *   node tools/promo/build.mjs --kosong # paksa kosongkan (tanpa memanggil Panel)
 *
 * Butuh Node 18+ (fetch bawaan). Tidak ada dependensi npm.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// PROMO_API bisa ditimpa lewat env — dipakai untuk menguji tampilan tanpa menyentuh Panel asli.
const API = process.env.PROMO_API || "https://panel-jgs.vercel.app/api/promo-publik";
const KOSONGKAN = process.argv.includes("--kosong");

// Halaman yang memuat penanda, dan promo proyek mana yang berlaku di sana.
// null = promo apa pun yang tayang (beranda mewakili seluruh JGS Group).
const HALAMAN = [
  { berkas: "index.html", proyek: null },
  { berkas: "kawa-living/index.html", proyek: "Kawa Living" },
];

const MULAI = "<!--PROMO:MULAI-->";
const SELESAI = "<!--PROMO:SELESAI-->";

const esc = (t) =>
  String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Promo yang sedang tayang, atau null. Kegagalan Panel JGS TIDAK menggagalkan build. */
async function ambilPromo() {
  if (KOSONGKAN) return null;
  try {
    const res = await fetch(`${API}?t=${Date.now()}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { promo } = await res.json();
    return promo ?? null;
  } catch (e) {
    console.error(`\n✗ Panel JGS tidak terbaca: ${e.message}`);
    console.error("  Halaman TIDAK disentuh — biar promo yang sedang tayang tetap tayang,");
    console.error("  daripada terhapus hanya karena panel sedang mati.");
    process.exitCode = 1;
    return undefined;                   // undefined = jangan ubah apa pun
  }
}

/* Gaya section promo ikut ditempel di sini, bukan di CSS halaman: kalau promo sedang
   kosong, tidak ada aturan CSS yatim yang menumpuk di berkas halaman. */
const GAYA = `<style>
.promo { padding: 60px var(--pad-x); max-width: var(--max-w); margin: 0 auto; }
.promo__inner {
  position: relative; border-radius: var(--r-xl); overflow: hidden;
  background: linear-gradient(135deg, #141d3e 0%, var(--navy) 55%, #2c3e8c 100%);
  display: grid; grid-template-columns: 1fr auto; gap: 60px; align-items: center;
  padding: 64px 56px;
}
.promo__glow {
  position: absolute; right: -100px; top: -100px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(219,127,46,.3) 0%, transparent 65%);
  filter: blur(60px); pointer-events: none;
}
.promo__label {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .16em;
  text-transform: uppercase; color: var(--orange); margin-bottom: 16px;
}
.promo__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); animation: pulse 2s infinite; }
.promo__title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(28px, 3.5vw, 48px); line-height: 1.05;
  letter-spacing: -.02em; color: #fff; margin: 0 0 28px;
}
.promo__list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; position: relative; }
.promo__item { display: flex; align-items: flex-start; gap: 12px; }
.promo__check {
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(219,127,46,.2); border: 1px solid rgba(219,127,46,.5);
  display: grid; place-items: center; flex-shrink: 0; margin-top: 1px;
  color: var(--orange);
}
.promo__item-text { font-size: 15px; color: rgba(255,255,255,.85); line-height: 1.5; }
.promo__item-text strong { color: #fff; }
.promo__right { position: relative; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.promo__savings {
  background: rgba(219,127,46,.15); border: 1px solid rgba(219,127,46,.3);
  border-radius: var(--r-lg); padding: 28px 36px; text-align: center; white-space: nowrap;
}
.promo__savings-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; color: rgba(255,255,255,.6); text-transform: uppercase; margin-bottom: 8px; }
.promo__savings-val   { font-family: var(--font-display); font-size: 42px; font-weight: 500; color: var(--orange); letter-spacing: -.02em; line-height: 1; }
.promo__savings-sub   { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 6px; }
.promo__cta  { width: 100%; background: var(--orange); color: #fff; justify-content: center; }
.promo__cta:hover { background: var(--orange-2); }
.promo__fine { font-size: 11px; color: rgba(255,255,255,.4); text-align: center; }
@media (max-width: 760px) {
.promo { padding: 24px 20px; }
.promo__inner {
  grid-template-columns: 1fr;
  gap: 28px;
  padding: 36px 24px;
  border-radius: var(--r-lg);
}
.promo__title { font-size: clamp(22px, 7vw, 36px); margin-bottom: 20px; }
.promo__list  { gap: 12px; margin-bottom: 24px; }
.promo__item-text { font-size: 14px; }
.promo__right { align-items: stretch; gap: 14px; }
.promo__savings {
  padding: 20px 24px;
  white-space: normal;
  text-align: center;
}
.promo__savings-label { margin-bottom: 6px; margin-right: 0; }
.promo__savings-val   { font-size: 36px; }
.promo__savings-sub   { white-space: normal; }
.promo__cta   { justify-content: center; }
}
@media (max-width: 480px) {
.promo { padding: 20px 16px; }
.promo__inner { padding: 28px 20px; }
}
@media (max-width: 375px) {
.promo__savings { flex-direction: column; text-align: center; gap: 8px; }
.promo__savings-label { margin-right: 0; margin-bottom: 4px; }
}
</style>`;

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni",
               "Juli","Agustus","September","Oktober","November","Desember"];

/** '2026-09-30' → '30 September 2026'. Tanggal mesin tidak pernah tampil ke pembeli. */
function tanggalIndonesia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
}

const CENTANG =
  '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';

function seksiHtml(promo) {
  const butir = promo.butir
    .map(
      (b) =>
        `        <li class="promo__item">\n          <div class="promo__check">${CENTANG}</div>\n` +
        `          <span class="promo__item-text">${esc(b)}</span>\n        </li>`
    )
    .join("\n");

  const angka = promo.jumlah
    ? `      <div class="promo__savings">\n` +
      `        <div class="promo__savings-label">${esc(promo.cap || "Total Hemat")}</div>\n` +
      `        <div class="promo__savings-val">${esc(promo.jumlah)}</div>\n` +
      (promo.sub ? `        <div class="promo__savings-sub">${esc(promo.sub)}</div>\n` : "") +
      `      </div>\n`
    : "";

  const wa =
    "https://wa.me/6289506888328?text=" +
    encodeURIComponent(`Halo, saya ingin tahu detail ${promo.judul}`);

  return `${GAYA}
  <div class="promo" id="promo">
    <div class="promo__inner reveal">
      <div>
        <div class="promo__label"><span class="promo__dot"></span>Promo Aktif · Terbatas</div>
        <h2 class="promo__title">${esc(promo.judul)}</h2>
        <ul class="promo__list">
${butir}
        </ul>
      </div>
      <div class="promo__right">
${angka}      <a href="${wa}" target="_blank" rel="noopener" class="btn btn--lg promo__cta">Klaim Promo Sekarang</a>
        <span class="promo__fine">*Syarat &amp; ketentuan berlaku${
          promo.berakhir ? ` · berlaku s/d ${esc(tanggalIndonesia(promo.berakhir))}` : ""
        }</span>
      </div>
    </div>
  </div>
`;
}

const promo = await ambilPromo();
if (promo === undefined) process.exit(1);

console.log(promo ? `▸ Promo tayang: ${promo.judul}` : "▸ Tidak ada promo yang tayang");

let berubah = false;
for (const { berkas, proyek } of HALAMAN) {
  const jalur = join(AKAR, berkas);
  const asli = readFileSync(jalur, "utf8");

  const i = asli.indexOf(MULAI);
  const j = asli.indexOf(SELESAI);
  if (i === -1 || j === -1) {
    console.error(`  ✗ ${berkas}: penanda PROMO tidak ditemukan — dilewati`);
    process.exitCode = 1;
    continue;
  }

  const berlaku =
    promo && (proyek === null || !Array.isArray(promo.proyek) || promo.proyek.includes(proyek));
  const isi = berlaku ? "\n" + seksiHtml(promo) + "  " : "";
  const baru = asli.slice(0, i + MULAI.length) + isi + asli.slice(j);

  if (baru === asli) {
    console.log(`  = ${berkas} (tidak berubah)`);
    continue;
  }
  writeFileSync(jalur, baru);
  console.log(`  ✔ ${berkas} — ${berlaku ? "promo dipasang" : "dikosongkan"}`);
  berubah = true;
}

console.log(berubah ? "\nSelesai — ada yang berubah." : "\nSelesai — tidak ada perubahan.");
