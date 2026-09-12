#!/usr/bin/env node
/**
 * build.mjs — menyamakan angka "mulai Rp ..." di web dengan harga hidup di dashboard.
 *
 * Kenapa ada (12 Sep 2026): angka harga diketik tangan di 38 tempat, dan sudah melenceng.
 * Web menulis Kawa Living "mulai Rp 410 jutaan" di satu halaman dan "Rp 419 jutaan" di
 * halaman lain, sementara unit termurah yang benar-benar tersedia Rp 414,9 jt. Tentrem
 * Bhumi ditulis "Rp 660" dan "Rp 665", padahal Rp 656,1 jt. Tidak ada yang salah mengetik —
 * angkanya benar waktu ditulis, lalu unit termurah laku dan tidak ada yang tugasnya tahu.
 *
 * Yang dibulatkan tetap dibulatkan: dashboard menyimpan angka tepat, web menampilkan yang
 * mudah diingat (dibulatkan KE BAWAH ke kelipatan 10 juta — gaya yang sudah dipakai selama
 * ini, jadi tidak ada copy yang perlu diubah). Bedanya cuma satu: sekarang ia ikut bergerak.
 *
 *   node tools/harga/build.mjs           # samakan
 *   node tools/harga/build.mjs --periksa # hanya laporkan selisih, jangan ubah apa pun
 *
 * Butuh Node 18+. Tidak ada dependensi npm.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const AKAR = resolve(DIR, "../..");
const PETA = join(DIR, "peta.json");
const API = process.env.HARGA_API || "https://progress.jogjagrahaselaras.com/api/public/pricelist";
const PERIKSA = process.argv.includes("--periksa");

const SLUG = ["kawa-living", "tentrem-bhumi", "tentrem-jiwo"];

/** Harga termurah & termahal yang MASIH TERSEDIA (unit laku tidak dihitung). */
async function hargaProyek(slug) {
  const res = await fetch(`${API}?slug=${slug}&t=${Date.now()}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const { units } = await res.json();
  const harga = units.filter((u) => !u.sold && u.priceCash > 0).map((u) => u.priceCash);
  if (!harga.length) throw new Error(`${slug}: tidak ada unit tersedia berharga`);
  return { min: Math.min(...harga), max: Math.max(...harga), tersedia: harga.length };
}

/** 414.900.000 → 410 (juta). Ke bawah, kelipatan 10 — supaya mudah diingat. */
function bulat(rupiah, ke = 10) {
  return Math.floor(rupiah / 1e6 / ke) * ke;
}

/** Ganti angka 3 digit di dalam sepotong teks dengan angka baru, satuannya dibiarkan. */
function gantiAngka(teks, angkaBaru) {
  return teks.replace(/(Rp\s*)\d{3}/g, `$1${angkaBaru}`);
}

const peta = JSON.parse(readFileSync(PETA, "utf8"));
const KE = peta.pembulatan?.ke ?? 10;

const nilai = {};
for (const slug of SLUG) {
  nilai[slug] = await hargaProyek(slug);
  console.log(
    `  ${slug.padEnd(14)} termurah Rp ${(nilai[slug].min / 1e6).toFixed(1)} jt` +
      ` → tampil "Rp ${bulat(nilai[slug].min, KE)} jt"  (${nilai[slug].tersedia} unit tersedia)`
  );
}
// Rentang harga untuk JSON-LD SENGAJA tidak memasukkan Tentrem Jiwo: yang tersisa di
// sana cuma Unit Office dan satu Villa (Rp 2,5–3,5 M) yang harganya bersifat khusus.
// Rentang asli yang ditulis tangan (419–965 jt) juga tidak memasukkannya. Kalau ikut,
// cuplikan Google akan memasang "Rp 410 Juta — Rp 3,5 Miliar" dan menakuti pembaca
// yang sedang mencari rumah tapak.
const SLUG_RENTANG = ["kawa-living", "tentrem-bhumi"];
nilai.jgs = {
  min: Math.min(...SLUG.map((s) => nilai[s].min)),
  max: Math.max(...SLUG_RENTANG.map((s) => nilai[s].max)),
};
console.log(`  ${"jgs (gabungan)".padEnd(14)} termurah Rp ${(nilai.jgs.min / 1e6).toFixed(1)} jt → tampil "Rp ${bulat(nilai.jgs.min, KE)} jt"\n`);

/** 1148 juta → "Rp 1,15 Miliar"; 726 juta → "Rp 730 Juta". Dibulatkan KE ATAS. */
function rupiahAtas(rupiah, ke = 10) {
  const juta = Math.ceil(rupiah / 1e6 / ke) * ke;
  if (juta < 1000) return `Rp ${juta} Juta`;
  return `Rp ${(juta / 1000).toFixed(2).replace(/0$/, "").replace(".", ",")} Miliar`;
}

/** Teks pengganti untuk satu sumber. */
function tekstBaru(sumber, lama) {
  if (sumber === "jgs-rentang") {
    return `Rp ${bulat(nilai.jgs.min, KE)} Juta — ${rupiahAtas(nilai.jgs.max, KE)}`;
  }
  const n = nilai[sumber];
  if (!n) throw new Error(`sumber "${sumber}" tidak dikenal`);
  return gantiAngka(lama, bulat(n.min, KE));
}

let berubah = false;
let masalah = 0;

for (const b of peta.berkas) {
  const jalur = join(AKAR, b.nama);
  const asli = readFileSync(jalur, "utf8");
  let s = asli;
  const catatan = [];

  if (b.mode === "semua") {
    // Seluruh angka Rp di halaman ini milik satu proyek.
    const angka = bulat(nilai[b.sumber].min, KE);
    const re = /(Rp\s*)(\d{3})(\s*(?:[Jj]utaan|[Jj]uta|[Jj]t)\b)/g;
    let n = 0;
    s = s.replace(re, (cocok, a, lama, c) => {
      if (Number(lama) === angka) return cocok;
      n++;
      return `${a}${angka}${c}`;
    });
    if (n) catatan.push(`${n} angka → ${angka}`);
  } else {
    for (const aturan of b.aturan) {
      const baru = tekstBaru(aturan.sumber, aturan.cari);
      if (!s.includes(aturan.cari)) {
        // Kalau nilainya memang sudah sesuai, tidak ada yang salah.
        if (s.includes(baru)) continue;
        console.error(`  ✗ ${b.nama}: tidak menemukan ${JSON.stringify(aturan.cari)}`);
        console.error(`     HTML mungkin disunting tangan — perbarui tools/harga/peta.json.`);
        masalah++;
        continue;
      }
      if (baru === aturan.cari) continue;
      const n = s.split(aturan.cari).length - 1;
      s = s.split(aturan.cari).join(baru);
      catatan.push(`${n}× ${JSON.stringify(aturan.cari)} → ${JSON.stringify(baru)}`);
      aturan.cari = baru;                    // buku besar ikut maju
    }
  }

  if (s === asli) {
    console.log(`  = ${b.nama} (sudah sesuai)`);
    continue;
  }
  if (PERIKSA) {
    console.log(`  ! ${b.nama} BERBEDA — ${catatan.join("; ")}`);
    berubah = true;
    continue;
  }
  writeFileSync(jalur, s);
  console.log(`  ✔ ${b.nama} — ${catatan.join("; ")}`);
  berubah = true;
}

if (!PERIKSA && berubah) writeFileSync(PETA, JSON.stringify(peta, null, 2) + "\n");

if (masalah) {
  console.error(`\n${masalah} aturan tidak ketemu — periksa tools/harga/peta.json.`);
  process.exit(1);
}
console.log(
  berubah
    ? PERIKSA
      ? "\nAda selisih antara web dan dashboard."
      : "\nSelesai — web sudah sama dengan dashboard."
    : "\nSelesai — tidak ada perubahan."
);
