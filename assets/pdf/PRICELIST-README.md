# Pricelist PDF — sumber & cara update

> **Sejak 21 Agu 2026 pricelist tidak lagi disunting di sini.**
> Harga dan status jual dipegang dashboard, dan PDF-nya dibangun ulang
> otomatis. Panduan lengkapnya: **[`tools/pricelist/README.md`](../../tools/pricelist/README.md)**.

## File di folder ini

| File | Fungsi |
|------|--------|
| `pricelist-tentrem-bhumi.html` | **Hasil bangun** — jangan disunting tangan |
| `pricelist-kawa-living.html` | **Hasil bangun** — jangan disunting tangan |
| `pricelist.css` | Style bersama (warna, tabel, header) — ini masih disunting tangan |

Kedua `.html` ditimpa setiap kali `tools/pricelist/build.mjs` jalan.
Yang di-commit cuma supaya perubahan pricelist bisa dibaca di diff.

> ⚠️ Jangan tertukar dengan `kawa-living.pdf` & `tentrem-bhumi.pdf` di folder
> ini — itu **brosur/sales-kit** (dokumen berbeda), bukan pricelist.

## PDF hasil (yang dipakai web)

PDF live yang di-link dari `/download/`:

- `download/PriceList_Kawa_Living.pdf`
- `download/PriceList_Tentrem_Bhumi.pdf`

> PDF hasil **harus tetap di `download/`**, jangan dipindah ke `assets/`.
> Folder `/assets/*` di-cache 1 tahun (immutable) di Vercel — kalau PDF taruh
> di situ, update tidak akan sampai ke pengunjung lama.

## Mau mengubah apa?

| Perubahan | Tempatnya |
|---|---|
| Harga / LT / tipe / hook | Dashboard → **/admin/harga** |
| Unit jadi TERJUAL | Dashboard → **/admin** → panel "Tanda laku" |
| Promo, tagline, catatan kaki, nomor WA | `tools/pricelist/data/<slug>.json` |
| Warna & tata letak | `pricelist.css` di folder ini |

Setelah menyunting `pricelist.css` atau `tools/pricelist/data/*`, bangun ulang:

```bash
node tools/pricelist/build.mjs
```

(Perubahan harga/status jual di dashboard memicu build-nya sendiri lewat
GitHub Actions — lihat `.github/workflows/pricelist.yml`.)

## Catatan desain

- Header sengaja **tanpa bulan** (cukup "PRICE LIST"). Jangan tambahkan tanggal.
- Ukuran halaman A4, margin diatur di `pricelist.css` (`@page`).
- Huruf: Arial (badan) & Georgia (judul) — sengaja disebut lebih dulu supaya
  render di Mac dan di GitHub Actions memakai huruf yang sama.
- Logo diambil dari `assets/img/Logo-Perumahan/`.
