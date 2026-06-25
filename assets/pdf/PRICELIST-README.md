# Pricelist PDF — Sumber & Cara Update

File sumber ada di folder ini: **`assets/pdf/`**.
Edit HTML di sini, lalu render ulang ke PDF — **jangan** edit PDF-nya langsung.

## File

| File | Fungsi |
|------|--------|
| `pricelist-kawa-living.html` | Sumber pricelist Kawa Living |
| `pricelist-tentrem-bhumi.html` | Sumber pricelist Tentrem Bhumi |
| `pricelist.css` | Style bersama (warna, tabel, header, dll) untuk keduanya |

## PDF hasil (yang dipakai web)

PDF live yang di-link dari halaman download (`/download/`) ada di folder `download/`:

- `download/PriceList_Kawa_Living.pdf`
- `download/PriceList_Tentrem_Bhumi.pdf`

> PDF hasil **harus tetap di `download/`**, jangan dipindah ke `assets/`.
> Folder `/assets/*` di-cache 1 tahun (immutable) di Vercel — kalau PDF taruh di
> situ, update tidak akan sampai ke pengunjung lama. Yang di `assets/pdf/` cukup
> file sumbernya (`.html`/`.css`), bukan PDF live-nya.

> ⚠️ Jangan tertukar dengan `assets/pdf/kawa-living.pdf` & `tentrem-bhumi.pdf` —
> itu **brosur/sales-kit** (dokumen berbeda), bukan pricelist.

## Cara update harga / unit

1. Buka file `.html` proyek yang mau diubah.
2. Edit baris tabel yang sesuai. Format satu baris normal:
   ```html
   <tr><td class="c-kav">Mizu 2 & 3</td><td class="c-mid">36</td><td class="c-mid">71</td><td class="c-cash">Rp 414.900.000</td><td class="c-kpr">Rp 454.900.000</td></tr>
   ```
   - `c-kav` = nama kavling · `c-mid` = Tipe & LT · `c-cash` = harga Cash Keras (merah) · `c-kpr` = harga KPR/Tempo
3. Untuk unit **TERJUAL**, pakai baris sold (harga diganti satu kolom "TERJUAL"):
   ```html
   <tr class="sold"><td class="c-kav">Mizu 8</td><td class="c-mid">36</td><td class="c-mid">73</td><td class="terjual" colspan="2">TERJUAL</td></tr>
   ```
4. Render ulang ke PDF (lihat di bawah).
5. Commit & push → Vercel auto-deploy. URL PDF tidak berubah, jadi web langsung pakai versi baru.

> Kalau spek unit (KT/KM/LT) ikut berubah, sinkronkan juga di:
> `assets/js/konten.js` (kartu unit homepage) dan halaman proyek terkait.

## Render HTML → PDF (macOS, pakai Google Chrome)

Jalankan dari folder ini (`assets/pdf/`). PDF hasil ditulis ke folder `download/`:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
  --print-to-pdf="../../download/PriceList_Kawa_Living.pdf" \
  "file://$PWD/pricelist-kawa-living.html"

"$CHROME" --headless --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
  --print-to-pdf="../../download/PriceList_Tentrem_Bhumi.pdf" \
  "file://$PWD/pricelist-tentrem-bhumi.html"
```

Cek hasil: buka PDF-nya, pastikan tata letak rapi dan tidak ada baris tabel yang
terpotong aneh antar halaman.

## Catatan desain

- Header sengaja **tanpa bulan** (cukup "PRICE LIST"). Jangan tambahkan tanggal/bulan.
- Ukuran halaman A4, margin diatur di `pricelist.css` (`@page`).
- Logo diambil dari `assets/img/Logo-Perumahan/`.
