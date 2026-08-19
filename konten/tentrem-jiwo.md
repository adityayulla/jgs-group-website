# Tentrem Jiwo — halaman kawasan (dibangun 19 Agustus 2026)

Sebelumnya `/tentrem-jiwo/` isinya **hanya landing page villa**. Padahal yang
dijual di sana ada dua: **Villa Tentrem Jiwo** dan **Abirama 1** (rumah siap
huni yang sekarang dipakai sebagai kantor pemasaran). Atas arahan Direktur
19 Agu, halaman diganti menjadi halaman kawasan bergaya `/tentrem-bhumi/`.

## 1. Struktur URL sesudah perubahan

| URL | Isi |
|---|---|
| `/tentrem-jiwo/` | **BARU** — halaman kawasan: status live, dua unit tersisa, lingkungan, siteplan, lokasi |
| `/tentrem-jiwo/villa/` | Landing page villa yang lama, dipindah utuh (isi & angkanya tidak diubah) |

Tidak ada URL yang mati: `/tentrem-jiwo/` tetap ada, hanya berganti isi.
Tautan di homepage, `/perumahan-jogja/`, dan `sitemap.xml` sudah menyesuaikan.

## 2. Semua angka diambil dari Progress Dashboard

Halaman ini **tidak menuliskan angka unit secara manual.** Sumbernya:

| Yang tampil | Endpoint |
|---|---|
| 13 unit · 11 terjual · 2 tersedia · 1 siap huni · tanggal update | `/api/public/projects?slug=tentrem-jiwo` |
| Foto lingkungan ke-4 dst. | `/api/public/environment-photos?slug=tentrem-jiwo` |
| Foto serah terima Abirama & Baswara | `/api/public/serah-terima` |
| **LT/LB tipe Abirama** | `/api/public/unit-types?slug=tentrem-jiwo` ← **endpoint baru** |

Angka statis yang tertulis di HTML hanya cadangan, dipakai kalau dashboard
tidak terjangkau.

## 3. ⚠️ Endpoint baru menunggu deploy

`/api/public/unit-types` **belum ada di produksi.** Berkasnya sudah dibuat di
repo dashboard:

```
~/Projects/jgs-dashboard/app/api/public/unit-types/route.ts
```

Endpoint ini mengembalikan **tipe, luas tanah, luas bangunan, jumlah unit, dan
jumlah yang belum laku** — batasan yang sama dengan `/api/public/siteplan`:
tidak ada harga, tidak ada nama pembeli.

**Sebelum di-deploy:** baris spesifikasi di kartu Abirama 1 sengaja
tersembunyi. Lebih baik tidak ada angka daripada angka karangan.

**Sesudah di-deploy dan `land_area`/`building_area` unit Abirama diisi di
dashboard:** baris itu muncul sendiri, tanpa perlu menyentuh HTML lagi. Ini
yang diminta Direktur — "nanti saya isi di dashboard, halaman ini otomatis
berubah".

## 4. Harga

→ Keputusan Direktur 19 Agu: **jangan tampilkan angka.** Semua diarahkan ke
WhatsApp dan modal pricelist. Kartu unit tidak memuat baris harga.

## 5. Foto

- **Abirama 1** — diambil dari halaman progres publik unit tersebut
  (`progress.jogjagrahaselaras.com/progress/tentrem-jiwo/abirama-1`), sesuai
  keputusan Direktur 19 Agu. Yang dipilih hanya foto tanpa wajah orang.
- **Lingkungan** — 3 foto dari feed `environment-photos` disimpan lokal supaya
  cepat & tetap tampil kalau feed mati; foto ke-4 dst. ditarik dinamis.
- **Villa** — memakai foto yang sudah ada di `tentrem-jiwo/img/`.

**Yang masih kurang:** foto pemasaran Abirama yang layak (fasad rapi tanpa
scaffolding, interior). Yang ada sekarang adalah foto progres — apa adanya,
bukan foto studio. Kalau ada folder Drive-nya, kirim saja.

## 6. Fakta yang dipakai di halaman

| Isian | Nilai | Sumber |
|---|---|---|
| Lokasi | Sorogenen, Purwomartani, Kalasan, Sleman | dashboard + halaman villa lama |
| Total unit | 13 | dashboard (live) |
| Tipe | Abirama 1–8 · Baswara 1–4 · Villa | dashboard siteplan |
| Sisa | Abirama 1 (siap huni) + Villa | dashboard (live) |
| Tagline | "Setiap rumah, satu babak hidup yang berarti" | dashboard |
| Jarak akses (bandara/tol/ring road/dll.) | dipertahankan dari halaman villa lama | halaman villa (sudah tayang sebelumnya) |
| Keamanan | one-gate, pos jaga | halaman villa lama + foto pos sekuriti |

Belum ada di halaman karena datanya belum saya pegang: daftar fasilitas
kawasan, spesifikasi bangunan Abirama, dan testimoni penghuni Tentrem Jiwo.
