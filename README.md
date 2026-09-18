# Undangan Pernikahan — Yogi & Ratna

Undangan pernikahan digital bertema **Minangkabau** (maroon, emas, motif songket,
siluet rumah gadang, dan marawa). Dibangun sebagai situs statis: HTML, CSS, dan
JavaScript murni — tanpa framework, tanpa proses build.

## Cara menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal agar semua
aset termuat sempurna:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Isi halaman

| Bagian | Keterangan |
| --- | --- |
| Cover | Nama mempelai, nama tamu, tombol **Buka Undangan**, tombol musik |
| Home | Nama lengkap kedua mempelai beserta orang tua dan suku |
| Hitung Mundur | Hari / jam / menit / detik menuju akad |
| Ayat | QS. Ar-Rum : 21 dan moto adat |
| Mempelai | Profil pria dan wanita dalam bingkai gonjong |
| Detail Acara | Akad Nikah dan Resepsi, lengkap tautan Google Maps |
| Galeri | Enam foto dengan geser horizontal dan lightbox |
| RSVP | Form konfirmasi, daftar ucapan & doa, amplop digital |
| Penutup | Ucapan terima kasih |

## Menyesuaikan isi

### Tanggal dan hitung mundur

Buka `assets/js/main.js`, ubah objek `CONFIG` di bagian paling atas:

```js
var CONFIG = {
  eventDate: '2025-10-12T08:00:00+07:00',  // waktu akad, WIB
  defaultGuest: 'Tamu Undangan',
  ...
};
```

### Nama, orang tua, lokasi, rekening

Semuanya ada di `index.html` sebagai teks biasa — cari nama atau nomor yang
ingin diganti. Untuk rekening, ubah juga atribut `data-copy` pada tombol salin
(tulis angkanya tanpa spasi).

### Foto

Ganti berkas di `assets/img/` dengan foto asli. Nama berkas boleh diubah asalkan
`src` pada `index.html` ikut disesuaikan.

| Berkas | Dipakai di | Rasio yang disarankan |
| --- | --- | --- |
| `groom.svg`, `bride.svg` | Bagian Mempelai | 3 : 4 (potret) |
| `gallery-1.svg` … `gallery-6.svg` | Galeri | 3 : 2 (lanskap) |
| `akad.svg`, `resepsi.svg` | Kartu acara | 1 : 1 |
| `og-cover.svg` | Pratinjau saat dibagikan | 1200 × 630 |

### Musik

Letakkan `music.mp3` di `assets/audio/`. Lihat `assets/audio/README.md`.

## Undangan personal per tamu

Tambahkan parameter `?to=` di akhir tautan — namanya akan muncul di cover:

```
https://contoh.com/undangan/?to=Bapak%20Ahmad%20Sekeluarga
```

Parameter `?kepada=` dan `?nama=` juga berfungsi sama.

## Catatan teknis

- **Data RSVP tersimpan di browser tamu** (`localStorage`), bukan di server.
  Artinya ucapan yang dikirim seorang tamu hanya terlihat di perangkatnya
  sendiri. Untuk mengumpulkan RSVP sungguhan, hubungkan form ke layanan seperti
  Google Forms, Formspree, atau Firebase.
- Mendukung `prefers-reduced-motion` dan memiliki gaya cetak sederhana.
- Responsif hingga lebar layar 380 px.

## Struktur berkas

```
.
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   ├── img/
│   └── audio/
└── README.md
```
