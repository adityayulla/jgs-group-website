# Pricelist — dibangun dari dashboard

PDF pricelist di `/download/` **tidak lagi disunting tangan**. Isinya dijemput
dari dashboard setiap pagi, lalu dirakit ulang jadi HTML + PDF.

```
dashboard (progress.jogjagrahaselaras.com)
  ├─ harga, tipe, LT, hook  ← diisi approver di /admin/harga
  └─ laku / belum           ← panel "Tanda laku" di /admin
                │
                │  /api/public/pricelist?slug=…
                ▼
        tools/pricelist/build.mjs
                │
                ├─→ assets/pdf/pricelist-<slug>.html   (ikut di-commit, buat dibaca di diff)
                └─→ download/PriceList_<Nama>.pdf      (yang di-link dari /download/)
```

Otomatisnya lewat **`.github/workflows/pricelist.yml`**, dan **pemicunya
perubahan, bukan jam**: begitu approver menyimpan harga di /admin/harga atau
menandai unit laku, dashboard mengirim `repository_dispatch` ke repo ini
(`lib/pricelist-hook.ts` di repo dashboard, butuh env `GITHUB_DISPATCH_TOKEN`).
PDF baru terpasang beberapa menit kemudian, dan commit hanya terjadi kalau
isinya benar-benar berubah.

Ada jadwal mingguan (Senin pagi) sebagai jaring pengaman kalau sinyal itu
tidak sampai — token kedaluwarsa, GitHub bermasalah. Butuh sekarang juga?
Tab **Actions → Pricelist → Run workflow**.

## Yang berubah di mana

| Mau mengubah | Tempatnya |
|---|---|
| Harga, LT, tipe, penanda hook | Dashboard → **/admin/harga** |
| Unit jadi TERJUAL | Dashboard → **/admin** → panel "Tanda laku" |
| Teks promo, tagline, catatan kaki, nomor WA | `data/<slug>.json` di folder ini |
| Komitmen 5P & ajakan pantau progress | `data/_bersama.json` |
| Judul band seksi ("BHAMA · 1 Lantai · …") | `data/<slug>.json` → `seksi[].band` |
| Warna, ukuran, tata letak | `assets/pdf/pricelist.css` |

> Teks promo wajib sama dengan section `#promo` yang aktif di `index.html`.

## Jalan manual

```bash
node tools/pricelist/build.mjs               # dua proyek
node tools/pricelist/build.mjs tentrem-bhumi # satu proyek
node tools/pricelist/build.mjs --tanpa-pdf   # HTML saja, buat cek cepat
node tools/pricelist/build.mjs --paksa       # render PDF walau HTML tidak berubah
```

Butuh Node 18+ dan Google Chrome (di Mac terdeteksi sendiri; kalau tidak,
set `CHROME=/path/ke/chrome`). Tidak ada dependensi npm.

## Aturan yang dipegang skrip

- **Status jual tidak pernah ditebak.** Kalau dashboard tidak bisa dihubungi,
  skrip berhenti dengan error dan PDF lama dibiarkan — lebih baik daripada
  menerbitkan daftar harga yang salah.
- **Harga kosong bukan angka.** Kavling tersedia yang harganya belum diisi
  approver tercetak *"Hubungi Marketing"*, bukan harga lama.
- **Kavling sejenis digabung satu baris** ("Mizu 4 s/d 7") kalau tipe, LT,
  harga, dan status jualnya sama persis. Kavling hook tidak pernah digabung.
- **Deret asing bikin gagal.** Kalau dashboard punya deret rumah yang belum
  terdaftar di `seksi[]`, skrip berhenti — jangan sampai ada kavling hilang
  diam-diam dari daftar harga.
- **PDF hanya dirender kalau HTML-nya berubah.** Chrome menstempel tanggal ke
  tiap PDF, jadi tanpa penjagaan ini tiap kali jalan akan terlihat "berubah".
