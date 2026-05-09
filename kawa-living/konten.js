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
    hero:  'Halo Dwi, saya tertarik dengan Kawa Living Sedayu',
    cta:   'Halo Dwi, saya mau konsultasi tentang Kawa Living',
    modal: 'Halo Dwi, saya mau minta pricelist Kawa Living',
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
    desc:      'Konsep Japandi modern di kawasan tenang Sedayu — lapangan futsal, basket, playground & masjid. Mulai Rp 479 Juta.',
    btn1Label: 'Lihat Tipe Unit →',
    btn2Label: 'Download Pricelist',
    archImage: 'img/Kawa%20Living%20tipe%20Okina.webp',
    archAlt:   'Kawa Living Sedayu — Perumahan Bantul',
    trustNum:   '14+',
    trustLabel: 'TAHUN\nTERPERCAYA',
    hotDeals:   'Unit Tersedia · Harga Mulai Rp 479 Juta',
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
    { ikon: '⚽', nama: 'Lapangan Futsal'   },
    { ikon: '🏀', nama: 'Basket 3 on 3'     },
    { ikon: '🛝', nama: 'Playground'        },
    { ikon: '🕌', nama: 'Masjid'            },
    { ikon: '🔐', nama: 'One Gate System'   },
    { ikon: '📹', nama: 'CCTV Security'     },
  ],

  fotoFasilitas: [
    { src: 'img/mini%20soccer.webp',               alt: 'Lapangan Mini Soccer Kawa Living' },
    { src: 'img/Lapangan%20bola.webp',             alt: 'Lapangan Futsal Kawa Living'      },
    { src: 'img/masjid.webp',                      alt: 'Masjid Kawa Living'               },
    { src: 'img/gate.webp',                        alt: 'Gerbang Utama Kawa Living'        },
  ],

  /* ══════════════════════════════════════════════════════════════════════
     6. UNIT — edit harga, spek, foto, dan denah per unit
  ══════════════════════════════════════════════════════════════════════ */
  unit: [
    {
      id:   'yuri',
      nama: 'Yuri 40',
      foto: [
        { src: 'img/tipe%20yuri.webp',                          alt: 'Yuri tampak depan'   },
        { src: 'img/Kawa%20Living%20tipe%20Hiroi%20Yuri.webp',  alt: 'Yuri & Hiroi deret'  },
        { src: '/assets/img/unit-unggulan/yuri-12.webp',        alt: 'Yuri tampak depan 2' },
      ],
      spek:       ['1 Lantai', '2 KT', '1 KM', 'LB 40m²', 'LT 81m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 479.000.000',
      hargaKPR:   'KPR mulai Rp 530.000.000',
      terjual:    '',
      pesanWA:    'Halo Dwi, saya tertarik unit Yuri di Kawa Living',
      denah: [
        {
          label: 'Denah Tipe Yuri',
          src:   'img/denah%20yuri.webp',
          alt:   'Denah Yuri Kawa Living',
        },
      ],
    },
    {
      id:   'himawari',
      nama: 'Himawari 51',
      foto: [
        { src: 'img/Kawa%20Living%20tipe%20Hiroi%20Yuri.webp',  alt: 'Himawari tampak depan'   },
        { src: '/assets/img/unit-unggulan/hiroi-15.webp',        alt: 'Himawari tampak samping' },
      ],
      spek:       ['1 Lantai', '2 KT', '1 KM', 'LB 51m²', 'LT 72m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 540.000.000',
      hargaKPR:   'KPR mulai Rp 595.000.000',
      terjual:    '',
      pesanWA:    'Halo Dwi, saya tertarik unit Himawari di Kawa Living',
      denah: [
        {
          label: 'Denah Tipe Himawari',
          src:   'img/denah%20himawari.webp',
          alt:   'Denah Himawari Kawa Living',
        },
      ],
    },
    {
      id:   'mizu',
      nama: 'Mizu 53',
      foto: [
        { src: 'img/yuri%20n%20hiroi.webp',                     alt: 'Mizu tampak depan'   },
        { src: '/assets/img/unit-unggulan/hiroi-12.webp',        alt: 'Mizu tampak samping' },
      ],
      spek:       ['1 Lantai', '2 KT', '2 KM', 'LB 53m²', 'LT 72m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 550.000.000',
      hargaKPR:   'KPR mulai Rp 605.000.000',
      terjual:    '',
      pesanWA:    'Halo Dwi, saya tertarik unit Mizu di Kawa Living',
      denah: [],
    },
    {
      id:   'okina',
      nama: 'Okina Himawari 61',
      foto: [
        { src: '/assets/img/unit-unggulan/okina-10.webp',    alt: 'Okina Himawari tampak depan'   },
        { src: 'img/Kawa%20Living%20tipe%20Okina.webp',      alt: 'Okina Himawari tampak kawasan' },
        { src: 'img/tipe%20okina.webp',                      alt: 'Okina Himawari view 2'         },
      ],
      spek:       ['1 Lantai', '3 KT', '2 KM', 'LB 61m²', 'LT 82m²'],
      hargaJenis: 'Cash Keras mulai',
      hargaPokok: 'Rp 614.000.000',
      hargaKPR:   'KPR mulai Rp 680.000.000',
      terjual:    '',
      pesanWA:    'Halo Dwi, saya tertarik unit Okina Himawari di Kawa Living',
      denah: [
        {
          label: 'Denah Tipe Okina Himawari',
          src:   '/assets/img/bluprint-okina.png',
          alt:   'Denah Okina Himawari Kawa Living',
        },
      ],
    },
  ],

  /* ══════════════════════════════════════════════════════════════════════
     7. VIDEO TOUR
  ══════════════════════════════════════════════════════════════════════ */
  video: {
    youtubeEmbed: '',
    thumbAlt:     'Video Tour Kawa Living Sedayu',
  },

  /* ══════════════════════════════════════════════════════════════════════
     8. MAPS — embed URL Google Maps
  ══════════════════════════════════════════════════════════════════════ */
  maps: {
    embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.456!2d110.2765!3d-7.8512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5b9b2a0a0a0a%3A0x0!2zS2F3YSBMaXZpbmcgU2VkYXl1!5e0!3m2!1sid!2sid!4v1',
    label: 'Dusun Surobayan RT 09, Argomulyo, Sedayu, Bantul, Yogyakarta',
  },

  /* ══════════════════════════════════════════════════════════════════════
     9. SOSIAL / COUNTER
  ══════════════════════════════════════════════════════════════════════ */
  sosial: {
    unitTerjual: '30+',
    labelTerjual: 'Unit sudah terjual',
  },

};
