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

Foto prewedding ada di `assets/img/foto/` sebagai WebP, hasil olahan dari
berkas mentah di `assets/img/`:

| Hasil | Dipakai di | Sumber |
| --- | --- | --- |
| `groom.webp` | Mempelai pria | `groom-01.png` |
| `bride.webp` | Mempelai wanita | `bride-01.png` |
| `akad.webp` | Kartu Akad Nikah | `masjid.png` |
| `resepsi.webp` | Kartu Resepsi | `rumah.png` |
| `gallery-1.webp` … `gallery-9.webp` | Galeri | campuran `couple-*`, `bride-*`, `groom-*`, `braide*` |
| `og-cover.svg` | Pratinjau saat dibagikan | 1200 × 630 |

Gambar kartu acara dipotong ke dalam 7–8% supaya tepi putih dan sudut membulat
pada kartunya hilang, sehingga panel maroonnya rapat ke tepi bingkai.

Galeri memakai **tinggi seragam dengan lebar mengikuti bentuk asli**, bukan
rasio 3:2 seragam. Kalau semua dipaksa 3:2, foto tegak akan terpotong di atas
dan bawah — persis di suntiang pengantin wanita, bagian yang justru paling
ingin ditampilkan.

Untuk mengganti foto: taruh berkas baru di `assets/img/`, sesuaikan daftar
`TUGAS` di `tools/optimize-photo.py` (nama sumber dan kotak potongnya), lalu:

```bash
python tools/optimize-photo.py
```

Kotak potong ditulis tangan per foto, bukan otomatis di tengah — pemotongan
otomatis akan memenggal suntiang pengantin wanita yang justru jadi ciri khasnya.
Foto yang sudah tegak sejak sumbernya dipakai apa adanya tanpa dipotong.

### Ornamen

Ornamen tempel ada di `assets/img/ornamen/`, hasil olahan `asset*.png`:

| Berkas | Dipakai di |
| --- | --- |
| `asset1.webp` | Marawa sepasang di Detail Acara |
| `asset2.webp` | Suntiang di atas nama, pada cover |
| `asset3.webp` | Pembatas di bawah judul Hitung Mundur, Galeri, Terima Kasih |
| `asset4.webp` | Sepasang burung di atas judul Mempelai |
| `asset5.webp` | Lambang di atas ayat, dan sudut kartu Amplop Digital |

Marawa sengaja hanya dipasang di Detail Acara: latar bagian itu (`bg8`)
satu-satunya yang tidak menggambarkan marawa, sehingga tidak terlihat dobel.

```bash
python tools/optimize-asset.py
```

Skrip ini juga menghapus latar putih yang menyatu dengan gambar, bila ada —
perambatan dilakukan dari tepi kanvas, bukan "buang semua piksel putih",
supaya sorotan terang di dalam objek tidak ikut hilang.

## Latar bergambar

Tiap bagian punya latar sendiri dari `assets/img/bg/`:

| Bagian | Latar | Bagian | Latar |
| --- | --- | --- | --- |
| Cover | `bg2` | Mempelai | `bg5` |
| Home | `bg1` | Detail Acara | `bg8` |
| Hitung Mundur | `bg3` | Galeri | `bg6` |
| Ayat | `bg7` | RSVP | `bg4` |
| | | Penutup | `bg2` |

### Mengganti latar

Ubah `background-image` pada bagian **LATAR BERGAMBAR** di
`assets/css/style.css`. Ada dua tempat: aturan utama, dan blok
`@media (max-width: 860px)` yang memakai berkas `-sm`.

Sumber PNG aslinya ada di `assets/img/bg1.png` … `bg7.png` (tidak ikut
di-commit, lihat `.gitignore`). Untuk membuat ulang versi WebP setelah
menambah atau mengganti PNG, jalankan skrip pengolahnya:

```bash
python tools/optimize-bg.py
```

Skrip itu menghasilkan dua ukuran per gambar — 1536 px untuk layar besar dan
820 px untuk ponsel — dalam format WebP. Hasilnya **16,5 MB → 0,96 MB**
(hemat 94%), yang penting karena undangan kebanyakan dibuka lewat data seluler.

### Cara latar menyesuaikan layar

Latarnya lanskap 3:2 dengan ornamen di keempat tepi dan ruang kosong di tengah.
Di layar potret, `background-size: cover` memotong sisi kiri dan kanan — dan itu
memang yang diinginkan, karena bagian paling khas (ornamen atas dan deretan
rumah gadang di bawah) tetap utuh. Tiap bagian juga punya kabut radial di
tengah supaya teks tetap terbaca tanpa meredam ornamen tepinya.

### Musik

Letakkan `music.mp3` di `assets/audio/`. Lihat `assets/audio/README.md`.

## Undangan personal per tamu

Tambahkan parameter `?to=` di akhir tautan — namanya akan muncul di cover:

```
https://contoh.com/undangan/?to=Bapak%20Ahmad%20Sekeluarga
```

Parameter `?kepada=` dan `?nama=` juga berfungsi sama.

## Ucapan & RSVP yang dinamis (Firebase)

Undangan ini punya dua mode, dan berpindah sendiri:

| Kondisi | Yang terjadi |
| --- | --- |
| `firebase-config.js` masih kosong | Ucapan disimpan di browser tamu masing-masing (`localStorage`). Anda tidak menerima datanya. |
| Config sudah diisi | Ucapan tersimpan di Firestore, muncul **real-time** di semua perangkat tanpa muat ulang. |

Kalau Firestore tidak merespons dalam 8 detik (salah config, offline, diblokir
jaringan), halaman otomatis kembali ke mode lokal supaya bagian ucapan tidak
terlihat rusak di mata tamu.

### Langkah pemasangan

1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Setelah project jadi, klik ikon web **`</>`** untuk menambah aplikasi web.
3. Salin objek `firebaseConfig` yang ditampilkan ke `assets/js/firebase-config.js`.
4. Menu kiri → **Build → Firestore Database → Create database**.
   Pilih mode **production**, lokasi **asia-southeast2 (Jakarta)**.
5. Buka tab **Rules**, tempel seluruh isi [`firestore.rules`](firestore.rules), lalu **Publish**.

Selesai. Ucapan masuk ke koleksi `wishes` dan bisa Anda baca kapan saja lewat
Firebase Console.

### Soal keamanan

`apiKey` Firebase memang tampil di kode dan aman dilihat siapa pun — itu
pengenal project, bukan kata sandi. Yang benar-benar melindungi data adalah
`firestore.rules`, yang mengatur:

- siapa pun boleh membaca dan menambah ucapan (memang begitu sifat buku tamu);
- tidak ada yang boleh mengubah atau menghapus ucapan — termasuk miliknya sendiri;
- panjang nama dan pesan dibatasi, dan waktunya memakai jam server agar tidak bisa dipalsukan;
- koleksi lain di project Anda tertutup rapat.

Di sisi halaman, ada jeda 20 detik antar pengiriman dari satu perangkat sebagai
penahan spam sederhana. Untuk menghapus ucapan yang tidak pantas, hapus
dokumennya lewat Firebase Console.

## Catatan teknis

- Mendukung `prefers-reduced-motion` dan memiliki gaya cetak sederhana.
- Responsif hingga lebar layar 380 px.
- Input tamu di-escape sebelum dirender, jadi HTML atau skrip yang diketik
  di form tampil sebagai teks biasa.

## Struktur berkas

```
.
├── index.html
├── firestore.rules              aturan keamanan Firebase
├── tools/                       skrip pengolah gambar
│   ├── optimize-bg.py
│   ├── optimize-asset.py
│   └── optimize-photo.py
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── firebase-config.js   isi config Firebase di sini
│   │   └── main.js
│   ├── img/
│   │   ├── bg/                  latar tiap bagian (WebP)
│   │   ├── ornamen/             ornamen tempel (WebP)
│   │   ├── foto/                foto prewedding (WebP)
│   │   └── *.png, *.jpeg        berkas sumber, tidak ikut di-commit
│   └── audio/
└── README.md
```
