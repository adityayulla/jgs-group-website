# Siteplan Tentrem Bhumi — dari CAD ke gambar tayang

Siteplan berwarna di `/tentrem-bhumi/` **dibuat ulang dari PDF CAD-nya**, bukan
digambar tangan. Alasannya satu: bentuk kavling di gambar dipakai juga sebagai
area klik status jual (`tentrem-bhumi/siteplan-kavling.json`), yang dipinjam
Progress Dashboard lewat `getSiteplanMap()`. Kalau artwork dan koordinat dibuat
terpisah, keduanya pasti melenceng.

Versi tayang sekarang: **CAD 20 Agustus 2026, 33 kavling**
(Andrawina 1–11, Bhama 1–7, Cantya 1–15).

## Jalankan

```bash
pip install pymupdf shapely pillow

python3 tools/siteplan/tentrem-bhumi/1-muka-dari-cad.py "siteplan ... .pdf"
python3 tools/siteplan/tentrem-bhumi/2-gambar-siteplan.py
./tools/siteplan/tentrem-bhumi/5-render.sh          # SVG -> PNG -> WEBP
python3 tools/siteplan/tentrem-bhumi/3-kavling-json.py
python3 tools/siteplan/tentrem-bhumi/4-periksa.py   # WAJIB dilihat mata
```

Lalu buka `tools/siteplan/_periksa-tentrem-bhumi.png` dan pastikan **tiap
poligon merah menutupi tepat satu blok berlabel yang sama**. Kalau ada yang
meleset, jangan dilanjutkan — perbaiki dulu.

## Kenapa langkah 1 begitu rumit

Gambar CAD-nya bukan kumpulan poligon tertutup, tapi ~140 ruas garis lepas.
Banyak ujung yang menggantung 1–3 titik dari garis tetangganya, jadi
penelusuran muka polos akan menggabung beberapa kavling jadi satu. Karena itu
tiap ruas **dipanjangkan `EXT` titik di kedua ujungnya** sebelum dipotong di
perpotongan; ranting yang tetap menggantung dipangkas. Sebelum trik ini,
Bhama 3+4 dan FASUM+Cantya 2 menempel jadi satu muka.

Skala terbukti benar lewat luas: 1 m² = 21,05 satuan PDF² — luas poligon
Bhama 3 = 93 m², Cantya 7 = 134 m², persis angka yang tercetak di gambar.
Lebar jalan (7 M / 6,75 M / 6,42 M) juga diukur dari CAD, bukan disalin.

## Yang perlu diketahui

- **Prefiks tipe di CAD tidak sama dengan tipe pemasaran.** CAD menulis
  `48/134` untuk semua Cantya, padahal pricelist menyebut Cantya tipe 32,5.
  Karena itu gambar tayang hanya mencetak kode kavling, tanpa angka LT.
- **Nama fasilitas tidak ada di CAD** — hanya "FASUM"/"FASOS". Nama yang
  tampil (Area Parkir, Swimming Pool, Playground, Lap. Basket, Mini
  Playground, Pos Jaga, Gate) dibawa dari siteplan lama ke lokasi yang setara
  dan sudah dikonfirmasi marketing, 20 Agu 2026.
- **Ganti gambar = ganti nama berkas.** Nama lama di-cache lama di CDN.
  Perbarui `tentrem-bhumi/index.html`, `tentrem-bhumi/konten.js`, dan
  `GAMBAR` di `3-kavling-json.py`.
- **Dashboard menyusul.** `getSiteplanMap()` mem-fetch JSON ini dari
  jogjagrahaselaras.com dengan `revalidate: 3600`, jadi siteplan di dashboard
  baru ikut berubah setelah situs utama dideploy — paling lama sejam.
- Kalau jumlah kavling berubah, unit di dashboard ikut disesuaikan
  (lihat `supabase/migrations/0031_tentrem_bhumi_siteplan_2026_08.sql`
  di repo jgs-dashboard) dan angka "33 unit" di halaman proyek diperbarui.

## Berkas

| Berkas | Isi |
|---|---|
| `1-muka-dari-cad.py` | PDF → `muka.json` (poligon + teks di dalamnya) |
| `2-gambar-siteplan.py` | `muka.json` → `siteplan.svg` + `kavling-kanvas.json` |
| `3-kavling-json.py` | kanvas → `tentrem-bhumi/siteplan-kavling.json` (persen) |
| `4-periksa.py` | gambar poligon berlabel di atas siteplan tayang |
| `5-render.sh` | `siteplan.svg` → PNG → WEBP siap pasang |
| `muka.json` | hasil langkah 1, disimpan supaya bisa render ulang tanpa PDF |
