/* ╔══════════════════════════════════════════════════════════════════════╗
   ║                                                                      ║
   ║        KONTEN.JS — KAWA LIVING LANDING PAGE                         ║
   ║        ✏️  EDIT FILE INI UNTUK UBAH TEKS, GAMBAR & NOMOR WA         ║
   ║                                                                      ║
   ╚══════════════════════════════════════════════════════════════════════╝ */

var KONTEN = {

  /* ══════════════════════════════════════════════════════════════════════
     1. KONTAK & WHATSAPP
  ══════════════════════════════════════════════════════════════════════ */
  wa: {
    fira:  { nomor: '6289506888328', nama: 'Fira',  tampil: '+62 895-0688-8328' },
    okky:  { nomor: '6285643531971', nama: 'Okky',  tampil: '+62 856-4353-1971' },
    dwi:   { nomor: '6288902929571', nama: 'Dwi',   tampil: '+62 889-0292-9571' },
  },

  pesanWA: {
    hero:  'Halo Fira, saya tertarik dengan Kawa Living Sedayu',
    cta:   'Halo Fira, saya mau konsultasi tentang Kawa Living',
    modal: 'Halo Fira, saya mau minta pricelist Kawa Living',
  },

  /* ══════════════════════════════════════════════════════════════════════
     2. PRICELIST
  ══════════════════════════════════════════════════════════════════════ */
  pricelist: {
    pdf:     'pricelist-kawa-living.pdf',
    halaman: '../download/index.html',
  },

  googleForm: {
    url: '', fieldNama: '', fieldPhone: '',
  },

  /* ══════════════════════════════════════════════════════════════════════
     3. HERO
  ══════════════════════════════════════════════════════════════════════ */
  hero: {
    est:       'Sedayu, Bantul · Jln. Wates KM 10',
    judul:     'Hunian Modern<br>di',
    highlight: 'Sedayu',
    desc:      'Konsep terbuka, desain Japandi modern — dekat Ring Road Selatan, fasilitas lengkap, mulai Rp 441 Juta.',
    btn1Label: 'Lihat Tipe Unit →',
    btn2Label: 'Download Pricelist',
    archImage: 'img/Kawa%20Living%20tipe%20Okina.webp',
    archAlt:   'Kawa Living Sedayu — Perumahan Bantul',
    trustNum:   '13+',
    trustLabel: 'TAHUN\nTERPERCAYA',
    hotDeals:   'Unit Tersedia · Harga Mulai Rp 441 Juta',
  },

  /* ══════════════════════════════════════════════════════════════════════
     4. TRUST BAR
  ══════════════════════════════════════════════════════════════════════ */
  trustBar: [
    { nilai: '48+',   label: 'Total unit'       },
    { nilai: '★★★★★', label: 'Google rating', bintang: true },
    { nilai: 'SHM',   label: 'Legalitas terjamin' },
  ],

  /* ══════════════════════════════════════════════════════════════════════
     5. FASILITAS
  ══════════════════════════════════════════════════════════════════════ */
  fasilitas: [
    { ikon: '⚽', nama: 'Mini Soccer'      },
    { ikon: '🛝', nama: 'Playground'       },
    { ikon: '🔐', nama: 'One Gate System'  },
    { ikon: '🕌', nama: 'Musholla'         },
  ],

  fotoFasilitas: [
    { src: 'img/mini%20soccer.webp',               alt: 'Lapangan Mini Soccer Kawa Living' },
    { src: 'img/Kawa%20Living%20tipe%20Hiroi%20Yuri.webp', alt: 'Kawa Living Tipe Hiroi & Yuri' },
    { src: 'img/Kawa%20Living%20tipe%20Okina.webp',        alt: 'Kawa Living Tipe Okina'        },
    { src: '/assets/img/unit-unggulan/okina-10.webp',      alt: 'Okina tampak depan'            },
  ],

  /* ══════════════════════════════════════════════════════════════════════
     6. UNIT — edit harga, spek, foto, dan denah per unit
  ══════════════════════════════════════════════════════════════════════ */
  unit: [
    {
      id:   'hiroi',
      nama: 'Hiroi 36',
      foto: [
        { src: '/assets/img/unit-unggulan/hiroi-15.webp',          alt: 'Hiroi tampak depan'   },
        { src: '/assets/img/unit-unggulan/hiroi-12.webp',           alt: 'Hiroi tampak samping' },
        { src: 'img/Kawa%20Living%20tipe%20Hiroi%20Yuri.webp',     alt: 'Hiroi & Yuri deret'  },
      ],
      spek:       ['1 Lantai', '2 KT', '2 KM', 'LB 36m²', 'LT 75m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 441.000.000',
      hargaKPR:   'KPR mulai Rp 495.000.000',
      terjual:    '',
      pesanWA:    'Halo Fira, saya tertarik unit Hiroi di Kawa Living',
      denah: [],
    },
    {
      id:   'okina',
      nama: 'Okina 61',
      foto: [
        { src: '/assets/img/unit-unggulan/okina-10.webp',    alt: 'Okina tampak depan'    },
        { src: 'img/Kawa%20Living%20tipe%20Okina.webp',      alt: 'Okina tampak kawasan'  },
        { src: 'img/tipe%20okina.webp',                      alt: 'Okina view 2'          },
      ],
      spek:       ['1 Lantai', '3 KT', '2 KM', 'LB 61m²', 'LT 90m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 614.000.000',
      hargaKPR:   'KPR mulai Rp 680.000.000',
      terjual:    '',
      pesanWA:    'Halo Fira, saya tertarik unit Okina di Kawa Living',
      denah: [
        {
          label: 'Denah Tipe Okina',
          src:   '/assets/img/bluprint-okina.png',
          alt:   'Denah Okina Kawa Living',
        },
      ],
    },
    {
      id:   'yuri',
      nama: 'Yuri 40',
      foto: [
        { src: '/assets/img/unit-unggulan/yuri-12.webp',    alt: 'Yuri tampak depan'   },
        { src: '/assets/img/unit-unggulan/yuri-12-13.webp', alt: 'Yuri & Hiroi deret'  },
        { src: 'img/tipe%20yuri.webp',                      alt: 'Yuri view 2'         },
      ],
      spek:       ['1 Lantai', '2 KT', '2 KM', 'LB 40m²', 'LT 80m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 479.000.000',
      hargaKPR:   'KPR mulai Rp 530.000.000',
      terjual:    '',
      pesanWA:    'Halo Fira, saya tertarik unit Yuri di Kawa Living',
      denah: [],
    },
  ],

  /* ══════════════════════════════════════════════════════════════════════
     7. VIDEO TOUR
  ══════════════════════════════════════════════════════════════════════ */
  video: {
    /* Kosongkan jika belum ada video. Isi dengan YouTube embed URL:
       contoh: 'https://www.youtube.com/embed/xxxxx?autoplay=1' */
    youtubeEmbed: '',
    thumbAlt:     'Video Tour Kawa Living Sedayu',
  },

  /* ══════════════════════════════════════════════════════════════════════
     8. MAPS — embed URL Google Maps
  ══════════════════════════════════════════════════════════════════════ */
  maps: {
    embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.456!2d110.2765!3d-7.8512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5b9b2a0a0a0a%3A0x0!2zS2F3YSBMaXZpbmcgU2VkYXl1!5e0!3m2!1sid!2sid!4v1',
    label: 'Jln. Wates KM 10, Sedayu, Bantul, Yogyakarta',
  },

  /* ══════════════════════════════════════════════════════════════════════
     9. SOSIAL / COUNTER
  ══════════════════════════════════════════════════════════════════════ */
  sosial: {
    unitTerjual: '30+',
    labelTerjual: 'Unit sudah terjual',
  },

};
