/* ╔══════════════════════════════════════════════════════════════════════╗
   ║                                                                      ║
   ║        KONTEN.JS — TENTREM BHUMI LANDING PAGE                       ║
   ║        ✏️  EDIT FILE INI UNTUK UBAH TEKS, GAMBAR & NOMOR WA         ║
   ║                                                                      ║
   ║   Setelah diedit, simpan file ini. Refresh browser untuk melihat    ║
   ║   hasilnya. Tidak perlu buka atau ubah file index.html.             ║
   ║                                                                      ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

var KONTEN = {


  /* ══════════════════════════════════════════════════════════════════════
     1. KONTAK & WHATSAPP
     ── Ganti nomor di sini, semua tombol WA di halaman otomatis ikut ──
  ══════════════════════════════════════════════════════════════════════ */
  wa: {
    //          nomor : format 62xxx (tanpa + atau 0)  |  nama : nama agen  |  tampil : tampilan di layar
    fira:  { nomor: '6289506888328',  nama: 'Fira',  tampil: '+62 895-0688-8328'  },
    okky:  { nomor: '6285643531971', nama: 'Okky',  tampil: '+62 856-4353-1971' },
    dwi:   { nomor: '6288902929571', nama: 'Dwi',   tampil: '+62 889-0292-9571' },
  },

  /* Pesan default yang muncul saat user klik tombol Chat WA */
  pesanWA: {
    hero:   'Halo Fira, saya tertarik dengan Tentrem Bhumi',
    cta:    'Halo Fira, saya mau konsultasi tentang Tentrem Bhumi',
    modal:  'Halo Fira, saya mau minta pricelist Tentrem Bhumi',
  },


  /* ══════════════════════════════════════════════════════════════════════
     2. PRICELIST & HALAMAN DOWNLOAD
  ══════════════════════════════════════════════════════════════════════ */
  pricelist: {
    /* Path atau URL file PDF pricelist.
       - File lokal : 'pricelist-tentrem-bhumi.pdf'
       - Google Drive: paste link "Anyone with link can view" */
    pdf:     'pricelist-tentrem-bhumi.pdf',

    /* Halaman yang terbuka setelah user isi form */
    halaman: 'download.html',
  },

  /* Google Form untuk menyimpan leads ke spreadsheet (opsional).
     Biarkan kosong ('') jika tidak pakai Google Form. */
  googleForm: {
    url:        '',   /* 'https://docs.google.com/forms/d/e/xxxxx/formResponse' */
    fieldNama:  '',   /* 'entry.123456789' */
    fieldPhone: '',   /* 'entry.987654321' */
  },


  /* ══════════════════════════════════════════════════════════════════════
     3. SECTION HERO (bagian atas / banner utama)
  ══════════════════════════════════════════════════════════════════════ */
  hero: {
    /* ── Teks kecil di atas judul ── */
    est:        'Jl. Kaliurang · 10 menit ke UII · Aktif',

    /* ── Headline utama (baris 1–2, sebelum highlight box) ── */
    judul:      'Saatnya Menetap',

    /* ── Teks di dalam highlight box (latar amber) ── */
    highlight:  'dengan Tentram.',

    /* ── Paragraf deskripsi ── */
    desc:       'Keamanan 24 jam. Lingkungan eksklusif yang terjaga, bukan tempat sembarang orang lalu-lalang. Udara sejuk Jogja Utara. Tentrem Bhumi dirancang bukan hanya sebagai rumah—tapi sebagai tempat ketentraman hidup Anda, setiap hari.',

    /* ── Label tombol ── */
    btn1Label:  'Lihat Tipe Unit →',
    btn2Label:  'Download Pricelist',

    /* ── Gambar arch (kanan) — ganti src sesuai foto terbaik ── */
    archImage:  'gate%20Tentrem%20Bhumi(2).webp',
    archAlt:    'Tentrem Bhumi — Perumahan Yogyakarta',

    /* ── Badge lingkaran "13 TAHUN TERPERCAYA" ── */
    trustNum:   '13+',
    trustLabel: 'TAHUN\nTERPERCAYA',

    /* ── Pill bawah gambar ── */
    hotDeals:   'Stok Terbatas · 10 dari 35 Unit Terjual',
  },


  /* ══════════════════════════════════════════════════════════════════════
     4. TRUST BAR (baris angka di bawah hero)
     ── Tambah/hapus baris sesuai kebutuhan ──
  ══════════════════════════════════════════════════════════════════════ */
  trustBar: [
    { nilai: '35',    label: 'Total unit'    },
    { nilai: '★★★★★', label: 'Google rating', bintang: true },
    { nilai: '5P',  label: 'Legalitas terjamin' },
  ],


  /* ══════════════════════════════════════════════════════════════════════
     5. FASILITAS
     ── Tambah/hapus fasilitas, ganti emoji dan nama ──
     full: true  →  card melebar full row
  ══════════════════════════════════════════════════════════════════════ */
  fasilitas: [
    { ikon: '🏊', nama: 'Kolam Renang'                             },
    { ikon: '🏀', nama: 'Basket Court'                             },
    { ikon: '🛝', nama: 'Playground'                               },
    { ikon: '🔐', nama: 'One Gate System'                          },
  ],

  /* Foto-foto kawasan (photo scroll di bawah fasilitas)
     ── Tambah/hapus/ganti src foto ──
     Nama file dengan spasi → ganti spasi dengan %20 */
  fotoFasilitas: [
    { src: 'photos/kawasan/tentrem%20pool.webp',                              alt: 'Kolam Renang Tentrem Bhumi'  },
    { src: 'photos/kawasan/tentrem%20pool%20dalam.webp',                      alt: 'Kolam Renang dalam'           },
    { src: 'photos/kawasan/tentrem%20pool%20n%20jalan.webp',                  alt: 'Pool dan jalan kawasan'       },
    { src: 'photos/kawasan/Lapangan%20Baseket%20Render%20Baru%201%20Ai.webp', alt: 'Basket Court'                 },
    { src: 'photos/kawasan/Lapangan%20Baseket%20Render%20Baru%202%20Ai.webp', alt: 'Basket Court view 2'          },
    { src: 'photos/kawasan/taman%20bermain%20.webp',                          alt: 'Taman Bermain Anak'           },
  ],


  /* ══════════════════════════════════════════════════════════════════════
     6. TIPE UNIT
     ── Edit harga, spek, foto, denah, dan status sold per unit ──
     ── Urutan unit di sini = urutan tampil di halaman ──
  ══════════════════════════════════════════════════════════════════════ */
  unit: [
    {
      id:   'andrawina',         /* jangan diubah — ID internal */
      nama: 'Andrawina 68',

      /* Foto-foto unit (slide kiri-kanan di mobile) */
      foto: [
        { src: '/assets/img/Proyek-Kami/Tentrem-Bhumi/andrawina(1).webp', alt: 'Andrawina depan'   },
        { src: '/assets/img/Proyek-Kami/Tentrem-Bhumi/andrawina.webp',    alt: 'Andrawina tampak'  },
        { src: 'photos/andrawina/andrawina%207.webp',                  alt: 'Andrawina tampak'      },
        { src: 'photos/andrawina/andrawina%20deret.webp',              alt: 'Andrawina deret'       },
        { src: 'photos/andrawina/andrawina%20sore.webp',               alt: 'Andrawina sore'        },
      ],

      /* Spesifikasi singkat — tampil sebagai chip/badge */
      spek: ['2 Lantai', '3 KT', '2 KM', 'LB 68m²', 'LT 99–133m²', 'Balkon'],

      /* Harga */
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 965.500.000',
      hargaKPR:   'KPR mulai Rp 1.040.500.000',

      /* Status unit yang sudah terjual — kosongkan ('') jika semua tersedia */
      terjual: '',

      /* Pesan WA khusus untuk unit ini */
      pesanWA: 'Halo Fira, saya tertarik unit Andrawina di Tentrem Bhumi',

      /* Denah — bisa 1 atau 2 gambar */
      denah: [
        {
          label: 'Denah 2 Lantai — Type 68',
          src:   'Denah%20Rumah/webp/DENAH%202%20LANTAI%20TYPE%2068.webp',
          alt:   'Denah Andrawina 2 Lantai',
        },
      ],
    },

    /* ── UNIT: BHAMA ─────────────────────────────────────────────── */
    {
      id:   'bhama',
      nama: 'Bhama 48',
      foto: [
        { src: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-bhama.webp', alt: 'Bhama tampak depan' },
        { src: 'photos/bhama/bhama%203d%201.webp', alt: 'Bhama 3D view 1' },
        { src: 'photos/bhama/bhama%203d.webp',     alt: 'Bhama 3D view'   },
      ],
      spek: ['1 Lantai', '2 KT', '1 KM', 'LB 48m²', 'LT 92–100m²', 'Lebar 8m'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 646.900.000',
      hargaKPR:   'KPR mulai Rp 721.900.000',
      terjual:    '',
      pesanWA:    'Halo Fira, saya tertarik unit Bhama di Tentrem Bhumi',
      denah: [
        {
          label: 'Denah 1 Lantai — Lebar 8m Type 48',
          src:   'Denah%20Rumah/webp/DENAH%201%20LANTAI%20LEBAR%208%20M%20TYPE%2048.webp',
          alt:   'Denah Bhama 48',
        },
      ],
    },

    /* ── UNIT: CANTYA ────────────────────────────────────────────── */
    {
      id:   'cantya',
      nama: 'Cantya 32.5 & 48',
      foto: [
        { src: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-cantya.webp',   alt: 'Cantya tampak depan' },
        { src: '/assets/img/Proyek-Kami/Tentrem-Bhumi/tipe-cantya 2.webp', alt: 'Cantya tampak 2'     },
        { src: 'photos/cantya/cantya%20berjejer%202.webp',              alt: 'Cantya berjejer' },
        { src: 'photos/cantya/cantya%20berjejer%20miring%20sore.webp',  alt: 'Cantya sore'     },
        { src: 'photos/cantya/cantya%20berjejer%20miring%20taman.webp', alt: 'Cantya taman'    },
      ],
      spek: ['1 Lantai', '2 KT', '1 KM', 'LB 32–48m²', 'Lebar 6m'],
      hargaJenis: 'Tipe 32.5 — Cash Keras mulai',
      hargaPokok: 'Rp 630.900.000',
      hargaKPR:   'Tipe 48 mulai Rp 695.900.000',
      terjual:    '',
      pesanWA:    'Halo Fira, saya tertarik unit Cantya di Tentrem Bhumi',
      denah: [
        {
          label: 'Denah Tipe 32.5',
          src:   'Denah%20Rumah/webp/Photoshop%20type%2032.5_1.webp',
          alt:   'Denah Cantya 32.5',
        },
        {
          label: 'Denah Tipe 48 — Lebar 6m',
          src:   'Denah%20Rumah/webp/DENAH%201%20LANTAI%20LEBAR%206%20M%20TYPE%2048.webp',
          alt:   'Denah Cantya 48',
        },
      ],
    },
  ], /* end unit */


  /* ══════════════════════════════════════════════════════════════════════
     7. FOTO INTERIOR
     ── Tambah/hapus/ganti foto interior ──
  ══════════════════════════════════════════════════════════════════════ */
  interior: [
    { src: 'photos/cantya/Interior%20AI/Ruang%20Keluarga/ruang%20keluarga.webp',                        alt: 'Ruang Keluarga',    label: 'Ruang Keluarga'    },
    { src: 'photos/cantya/Interior%20AI/Ruang%20Makan/dapur%20dan%20ruang%20makan.webp',                alt: 'Dapur & R. Makan',  label: 'Dapur & R. Makan'  },
    { src: 'photos/cantya/Interior%20AI/Kamar%20Tidur/kamar%20depan.webp',                              alt: 'Kamar Tidur Utama', label: 'Kamar Tidur Utama' },
    { src: 'photos/cantya/Interior%20AI/Kamar%20Tidur/kamar%20belakang.webp',                           alt: 'Kamar Tidur 2',     label: 'Kamar Tidur 2'     },
    { src: 'photos/cantya/Interior%20AI/Kamar%20Mandi/kamar%20mandi.webp',                              alt: 'Kamar Mandi',       label: 'Kamar Mandi'       },
    { src: 'photos/cantya/Interior%20AI/Teras/Teras%201.webp',                                          alt: 'Teras',             label: 'Teras'             },
    { src: 'photos/cantya/Interior%20AI/Dapur/beda%20desain%20dishwash%20nya.webp',                     alt: 'Dapur',             label: 'Dapur'             },
    { src: 'photos/cantya/Interior%20AI/Halaman%20Belakang/area%20mencuci%20sederhana%202.webp',        alt: 'Halaman Belakang',  label: 'Halaman Belakang'  },
  ],


  /* ══════════════════════════════════════════════════════════════════════
     8. SPESIFIKASI BANGUNAN
     ── Edit baris per baris: ['Nama Item', 'Nilai/Keterangan'] ──
     ── Kolom 1 = kiri, Kolom 2 = kanan (di desktop) ──
  ══════════════════════════════════════════════════════════════════════ */
  spesifikasi: [
    /* Kolom kiri */
    [
      ['Pondasi',      'Pasangan batu kali'             ],
      ['Dinding',      'Batu bata merah plesteran/aci'  ],
      ['Konstruksi',   'Beton bertulang'                ],
      ['Lantai utama', 'Granit 60×60'                   ],
      ['Dinding KM',   'Granit'                	        ],
      ['Closet',       'Standar TOTO'                   ],
      ['Cat',          'Jotun atau setara (dalam & luar)'],
    ],
    /* Kolom kanan */
    [
      ['Rangka atap',  'Baja ringan 5/7 tebal 0.75mm'                ],
      ['Plafon',       'Gypsum 4mm'                                  ],
      ['Kusen',        'Aluminium'                                   ],
      ['Pintu utama',  'Multiplek finishing HPL'                     ],
      ['Listrik',      '1300W (1 lantai) / 2200W (2 lantai)'         ],
      ['Air',          'PDAM'                                        ],
      ['Meja dapur',   'Ceramic + kitchen sink'     	             ],
    ],
  ],


  /* ══════════════════════════════════════════════════════════════════════
     9. LOKASI — JARAK & AKSES
     ── Tambah/hapus/ganti baris waktu tempuh ──
  ══════════════════════════════════════════════════════════════════════ */
  akses: [
    { waktu: '2 mnt',  tujuan: 'Pom Bensin'                        },
    { waktu: '3 mnt',  tujuan: 'Pasar Tradisional Jangkang'        },
    { waktu: '5 mnt',  tujuan: 'Universitas Islam Indonesia (UII)' },
    { waktu: '7 mnt',  tujuan: 'Budi Mulia International School'   },
    { waktu: '9 mnt',  tujuan: 'Kopi Klotok Yogyakarta'            },
    { waktu: '15 mnt', tujuan: 'RS JIH & Pakuwon Mall'             },
  ],

  /* Google Maps embed URL — salin dari Google Maps → Share → Embed */
  mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.86238093926!2d110.4306170749189!3d-7.697914492319535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5d2781b7f58b%3A0x5b1fa95f2222dc20!2sPerumahan%20Tentrem%20Bhumi!5e0!3m2!1sen!2sid!4v1777038476472!5m2!1sen!2sid',
  mapsLink: 'https://maps.google.com/?q=Perumahan+Tentrem+Bhumi+Ngaglik+Sleman',


  /* ══════════════════════════════════════════════════════════════════════
     10. SITEPLAN
  ══════════════════════════════════════════════════════════════════════ */
  siteplan: {
    gambar: 'photos/kawasan/Siteplan%20Tentrem%20Bhumi%20Berwarna_page-0001.webp',
    alt:    'Siteplan Tentrem Bhumi 2025',
  },


  /* ══════════════════════════════════════════════════════════════════════
     11. SOCIAL PROOF (angka pencapaian)
  ══════════════════════════════════════════════════════════════════════ */
  sosial: {
    unitTerjual:  '10+',
    labelTerjual: 'Unit sudah terjual',
    totalUnit:    '35',
    labelTotal:   'dari 35 unit tersedia',
    labelStok:    'Stok terbatas!',
    labelRating:  'Rating Google — 5 bintang',

    /* Teks paragraf (boleh pakai HTML tag <strong>, <em>, <br>) */
    cerita:  'JGS Group berpengalaman sejak <strong>2013</strong> dan telah membangun ratusan hunian berkualitas di Yogyakarta. Tentrem Bhumi hadir sebagai kawasan modern dengan konsep <em>tentrem</em> — tenang, aman, dan produktif untuk keluarga Indonesia.',
    devInfo: 'Developer: <strong style="color:#2d4a2b;">PT Jogja Graha Selaras</strong> · jogjagrahaselaras.com<br>Kantor: 0274-2840726',
  },


  /* ══════════════════════════════════════════════════════════════════════
     12. CTA FINAL (section bawah sebelum footer)
  ══════════════════════════════════════════════════════════════════════ */
  cta: {
    judul:    'Temukan Rumah yang Tepat untuk Keluarga',
    sub:      'Konsultasi gratis bersama Fira — tanpa tekanan, tanpa komitmen.',
    btnLabel: '💬 Chat Fira Sekarang',
    btnPricelist: '📄 Download Pricelist',
  },


  /* ══════════════════════════════════════════════════════════════════════
     13. FOOTER
  ══════════════════════════════════════════════════════════════════════ */
  footer: {
    nama:      'Tentrem Bhumi · JGS Group',
    copyright: '© 2025 PT Jogja Graha Selaras · jogjagrahaselaras.com',
    igUrl:     'https://instagram.com/perumahan.tentrem',
    igLabel:   '📸 @perumahan.tentrem',
    telpUrl:   'tel:02742840726',
    telpLabel: '📞 0274-2840726',
  },


}; /* end KONTEN */
