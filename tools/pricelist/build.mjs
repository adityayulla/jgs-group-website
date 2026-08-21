#!/usr/bin/env node
/**
 * build.mjs — merakit PDF pricelist dari data dashboard.
 *
 * Dulu harga dan status jual diketik langsung di assets/pdf/pricelist-*.html,
 * jadi setiap unit laku PDF-nya ikut basi sampai ada yang sempat menyunting.
 * Sekarang isinya dijemput dari dashboard:
 *
 *   harga, tipe, LT, hook  →  /api/public/pricelist?slug=   (diisi approver)
 *   laku / belum           →  ikut di jawaban yang sama
 *
 * Alurnya: data → HTML (assets/pdf/pricelist-<slug>.html) → PDF
 * (download/PriceList_*.pdf, lewat headless Chrome). HTML-nya ikut
 * di-commit supaya perubahan pricelist bisa dibaca di diff — dan karena
 * HTML-nya deterministik, PDF hanya dibangun ulang kalau HTML berubah
 * (Chrome menstempel tanggal ke tiap PDF, jadi kalau tidak dijaga
 * setiap kali jalan akan terlihat berubah padahal isinya sama).
 *
 *   node tools/pricelist/build.mjs              # semua proyek
 *   node tools/pricelist/build.mjs tentrem-bhumi
 *   node tools/pricelist/build.mjs --paksa      # render PDF walau HTML sama
 *   node tools/pricelist/build.mjs --tanpa-pdf  # HTML saja (cek cepat)
 *
 * Butuh Node 18+ (fetch bawaan) dan Google Chrome. Tidak ada dependensi npm.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const AKAR = resolve(DIR, "../..");
const DATA = join(DIR, "data");
const API = "https://progress.jogjagrahaselaras.com/api/public/pricelist";

const argv = process.argv.slice(2);
const PAKSA = argv.includes("--paksa");
const TANPA_PDF = argv.includes("--tanpa-pdf");
const pilihan = argv.filter((a) => !a.startsWith("--"));

/* ── Data ─────────────────────────────────────────────────────── */

const baca = (p) => JSON.parse(readFileSync(p, "utf8"));
const bersama = baca(join(DATA, "_bersama.json"));

/**
 * Salinan harga sementara, dipakai HANYA selama dashboard belum punya
 * /api/public/pricelist (migration 0032). Sengaja dipisah dan berisik:
 * begitu API-nya hidup, file ini tidak terpakai dan boleh dihapus.
 */
function snapshot(slug) {
  const p = join(DATA, "_snapshot-harga.json");
  if (!existsSync(p)) return null;
  const isi = baca(p)[slug];
  return isi?.length ? isi : null;
}

async function ambilUnit(slug) {
  let res = null;
  let galatJaringan = null;
  try {
    // Build ini dipicu beberapa detik setelah approver menyimpan, sedangkan
    // jawaban API disimpan 60 detik di tepi. Query unik memaksa perhitungan
    // baru — kalau tidak, PDF-nya bisa lahir dari angka sebelum diubah.
    res = await fetch(`${API}?slug=${slug}&t=${Date.now()}`, {
      headers: { accept: "application/json" },
    });
  } catch (e) {
    galatJaringan = e.message;
  }

  if (res?.ok) {
    const data = await res.json();
    if (data.units?.length) return { units: data.units, sumber: "dashboard" };
  }

  // Dashboard tidak bisa dipakai. Status jual TIDAK boleh dikarang, jadi
  // tanpa jawaban dari sana pricelist tidak dibangun ulang sama sekali —
  // PDF lama yang masih terpasang lebih baik daripada PDF baru yang salah.
  const sebab = res ? (await res.json().catch(() => ({}))).error ?? "" : "";
  const alasan = res
    ? `${res.status} ${sebab}`.trim()
    : `tidak bisa dihubungi (${galatJaringan})`;

  // Salinan harga hanya sah untuk satu keadaan: harganya memang belum
  // pindah ke dashboard (404 = rutenya belum ter-deploy, atau RPC-nya
  // belum ada). Dashboard yang sedang bermasalah TIDAK boleh diam-diam
  // diganti angka lama — di situ build memang harus gagal.
  const belumPindah = res?.status === 404 || sebab === "pricing-not-migrated";
  const cadangan = belumPindah ? snapshot(slug) : null;
  if (!cadangan) throw new Error(`API pricelist ${slug}: ${alasan}`);

  // Harga boleh dari salinan, status jual tetap wajib dari dashboard.
  const laku = await ambilStatusJual(slug);
  console.warn(
    `  ⚠ /api/public/pricelist belum bisa dipakai (${alasan}).\n` +
      `    Harga diambil dari data/_snapshot-harga.json; status jual tetap dari dashboard.\n` +
      `    Jalankan supabase/migrations/0032_unit_pricing.sql supaya salinan ini tidak dibutuhkan lagi.`
  );
  return {
    units: cadangan.map((u) => ({ ...u, sold: laku.has(u.code) })),
    sumber: "snapshot",
  };
}

/** Status jual dari endpoint siteplan — sudah hidup jauh sebelum 0032. */
async function ambilStatusJual(slug) {
  const res = await fetch(
    `https://progress.jogjagrahaselaras.com/api/public/siteplan?slug=${slug}&t=${Date.now()}`
  );
  if (!res.ok) throw new Error(`API siteplan ${slug}: ${res.status}`);
  const data = await res.json();
  if (!data.units?.length) throw new Error(`API siteplan ${slug}: kosong`);
  return new Set(data.units.filter((u) => u.sold).map((u) => u.code));
}

/* ── Baris tabel ──────────────────────────────────────────────── */

/** "Hiroi Yuri 12" → "Hiroi Yuri" */
const deret = (code) => code.replace(/\s*\d+\s*$/, "");
const nomor = (code) => parseInt(code.match(/(\d+)\s*$/)?.[1] ?? "0", 10);

/**
 * Kavling yang tipe, luas, harga, dan status jualnya sama dicetak satu
 * baris — begitulah pricelist ini selalu dibaca ("Mizu 4 s/d 7"), dan
 * tanpa itu tabelnya jadi 74 baris berisi angka kembar.
 *
 * Kavling hook tidak pernah digabung: label "(Hook)" menempel pada satu
 * kavling tertentu, bukan pada sekelompok.
 */
function gabung(units) {
  const kunci = (u) =>
    u.hook
      ? `H${u.code}`
      : u.sold
        ? `S|${u.type}|${u.landArea}`
        : `A|${u.type}|${u.landArea}|${u.priceCash}|${u.priceKpr}`;

  const grup = new Map();
  for (const u of units) {
    const k = kunci(u);
    if (!grup.has(k)) grup.set(k, []);
    grup.get(k).push(u);
  }
  return Array.from(grup.values());
}

/** ["Mizu 4","Mizu 5","Mizu 6"] → "Mizu 4 s/d 6" */
function labelGrup(grup) {
  const nama = deret(grup[0].code);
  const angka = grup.map((u) => nomor(u.code)).sort((a, b) => a - b);
  const berurutan = angka.every((n, i) => i === 0 || n === angka[i - 1] + 1);

  let teks;
  if (angka.length === 1) teks = `${nama} ${angka[0]}`;
  else if (angka.length === 2) teks = `${nama} ${angka[0]} & ${angka[1]}`;
  else if (berurutan) teks = `${nama} ${angka[0]} s/d ${angka[angka.length - 1]}`;
  else teks = `${nama} ${angka.join(", ")}`;

  return grup[0].hook ? `${teks} (Hook)` : teks;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const rupiah = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;

function barisHtml(grup) {
  const u = grup[0];
  const kav = `<td class="c-kav">${esc(labelGrup(grup))}</td>`;
  const spek = `<td class="c-mid">${esc(u.type ?? "—")}</td><td class="c-mid">${
    u.landArea ?? "—"
  }</td>`;

  if (u.sold) {
    return `        <tr class="sold">${kav}${spek}<td class="terjual" colspan="2">TERJUAL</td></tr>`;
  }
  // Harga kosong = belum diisi approver. Tidak ada angka yang boleh
  // ditebak di dokumen harga — yang tercetak ajakan menghubungi.
  if (u.priceCash === null || u.priceCash === undefined) {
    return `        <tr>${kav}${spek}<td class="c-tanya" colspan="2">Hubungi Marketing</td></tr>`;
  }
  const kpr =
    u.priceKpr === null || u.priceKpr === undefined ? "—" : rupiah(u.priceKpr);
  return (
    `        <tr>${kav}${spek}` +
    `<td class="c-cash">${rupiah(u.priceCash)}</td>` +
    `<td class="c-kpr">${esc(kpr)}</td></tr>`
  );
}

/* ── Halaman ──────────────────────────────────────────────────── */

function seksiHtml(seksi, units) {
  const baris = gabung(units).map(barisHtml).join("\n");
  return `  <div class="sec">
    <div class="sec__band">${esc(seksi.band)}</div>
    <table>
      <thead><tr><th class="l">Kavling</th><th>Tipe</th><th>LT</th><th>Cash Keras*</th><th>KPR/Tempo**</th></tr></thead>
      <tbody>
${baris}
      </tbody>
    </table>
  </div>`;
}

function halaman(cfg, seksiIsi) {
  const k5 = bersama.k5
    .map(
      (i) =>
        `    <div class="k5__item"><span class="k5__no">${i.no}</span><span><span class="k5__t">${esc(
          i.judul
        )}</span> <span class="k5__d">${esc(i.teks)}</span></span></div>`
    )
    .join("\n");

  const callout = bersama.callout.teks.replace(
    bersama.callout.tebal,
    `<b>${bersama.callout.tebal}</b>`
  );

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Price List — ${esc(cfg.judul)}</title>
<link rel="stylesheet" href="pricelist.css">
</head>
<!-- DIBANGUN OTOMATIS oleh tools/pricelist/build.mjs — jangan disunting tangan.
     Harga & status jual berasal dari dashboard (/admin/harga & Tanda laku);
     teks tetapnya dari tools/pricelist/data/. -->
<body>

  <div class="head">
    <img class="head__logo" src="${cfg.logo}" alt="${esc(cfg.judul)}">
    <div class="head__pl"><b>PRICE LIST</b></div>
  </div>
  <div class="title">${esc(cfg.judul)}</div>
  <div class="tagline">${esc(cfg.tagline)}</div>
  <div class="addr">${esc(cfg.alamat)} · <a href="${cfg.tautanHref}">${esc(
    cfg.tautanTeks
  )}</a></div>

  <div class="promo">
    <div>
      <div class="promo__title">${esc(cfg.promo.judul)}</div>
      <div class="promo__text">${esc(cfg.promo.teks)}</div>
    </div>
    <div class="promo__right">
      <div class="promo__cap">${esc(cfg.promo.cap)}</div>
      <div class="promo__amt">${esc(cfg.promo.jumlah)}</div>
      <div class="promo__sub">${esc(cfg.promo.sub)}</div>
    </div>
  </div>

${seksiIsi.join("\n\n")}

  <div class="k5 blk">
    <div class="k5__band">${esc(bersama.k5Band)}</div>
${k5}
  </div>

  <div class="callout blk">
    <div class="callout__t">${esc(bersama.callout.judul)}</div>
    <div class="callout__d">${callout}</div>
  </div>

  <div class="note">${esc(cfg.catatan)}</div>

  <div class="cta blk">
    <div>
      <div class="cta__t">${esc(cfg.cta.judul)}</div>
      <div class="cta__d">${esc(cfg.cta.teks)}</div>
    </div>
    <div class="cta__wa"><b>${esc(cfg.cta.waNama)}</b><span>${esc(
      cfg.cta.waNomor
    )}</span></div>
  </div>

  <div class="foot">${esc(cfg.footer)}</div>

</body>
</html>
`;
}

/* ── Chrome ───────────────────────────────────────────────────── */

function chrome() {
  const kandidat = [
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
  ].filter(Boolean);
  const ada = kandidat.find((p) => existsSync(p));
  if (!ada) {
    throw new Error(
      "Google Chrome tidak ditemukan. Set CHROME=/path/ke/chrome, atau pakai --tanpa-pdf."
    );
  }
  return ada;
}

function renderPdf(htmlPath, pdfPath) {
  execFileSync(
    chrome(),
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      "--allow-file-access-from-files",
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/* ── Jalan ────────────────────────────────────────────────────── */

async function bangun(slug) {
  const cfg = baca(join(DATA, `${slug}.json`));
  console.log(`\n▸ ${cfg.judul}`);

  const { units, sumber } = await ambilUnit(slug);

  // Tiap kavling harus punya seksi. Kalau ada deret baru di dashboard
  // yang belum dikenal di sini, berhenti — diam-diam menghilangkan
  // kavling dari daftar harga jauh lebih berbahaya daripada gagal.
  const dikenal = new Set(cfg.seksi.map((s) => s.deret));
  const asing = [...new Set(units.map((u) => deret(u.code)))].filter(
    (d) => !dikenal.has(d)
  );
  if (asing.length) {
    throw new Error(
      `Deret "${asing.join(
        '", "'
      )}" ada di dashboard tapi belum punya seksi di tools/pricelist/data/${slug}.json`
    );
  }

  const seksiIsi = cfg.seksi.map((s) => {
    const isi = units
      .filter((u) => deret(u.code) === s.deret)
      .sort((a, b) => nomor(a.code) - nomor(b.code));
    return seksiHtml(s, isi);
  });

  const laku = units.filter((u) => u.sold).length;
  const tanpaHarga = units.filter(
    (u) => !u.sold && (u.priceCash === null || u.priceCash === undefined)
  );
  console.log(
    `  ${units.length} kavling · ${laku} terjual · sumber harga: ${sumber}`
  );
  if (tanpaHarga.length) {
    console.log(
      `  ${tanpaHarga.length} tersedia tanpa harga → "Hubungi Marketing": ` +
        tanpaHarga.map((u) => u.code).join(", ")
    );
  }

  const htmlPath = join(AKAR, "assets/pdf", cfg.html);
  const baru = halaman(cfg, seksiIsi);
  const lama = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
  const berubah = baru !== lama;
  if (berubah) writeFileSync(htmlPath, baru);
  console.log(`  ${berubah ? "diperbarui" : "tidak berubah"}: assets/pdf/${cfg.html}`);

  if (TANPA_PDF) return berubah;
  if (!berubah && !PAKSA) {
    console.log("  PDF dilewati (isi sama). Pakai --paksa untuk memaksa.");
    return false;
  }

  const pdfPath = join(AKAR, "download", cfg.pdf);
  renderPdf(htmlPath, pdfPath);
  console.log(`  ditulis: download/${cfg.pdf}`);
  return true;
}

const daftar = pilihan.length ? pilihan : ["tentrem-bhumi", "kawa-living"];
let adaPerubahan = false;
for (const slug of daftar) {
  adaPerubahan = (await bangun(slug)) || adaPerubahan;
}
console.log(
  adaPerubahan ? "\nSelesai — ada yang berubah." : "\nSelesai — tidak ada perubahan."
);
