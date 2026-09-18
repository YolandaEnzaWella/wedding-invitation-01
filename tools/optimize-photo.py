"""Potong dan perkecil foto prewedding untuk dipakai di undangan.

Jalankan dari akar proyek:

    python tools/optimize-photo.py

Membaca  : assets/img/braide*.jpeg dan assets/img/couple-*.png
Menulis  : assets/img/foto/*.webp

Kotak potong ditulis tangan per foto, bukan otomatis, karena letak wajah dan
suntiang berbeda-beda — pemotongan otomatis di tengah akan memenggal hiasan
kepala pengantin wanita yang justru jadi ciri khasnya.

Butuh Pillow:  python -m pip install Pillow
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow belum terpasang. Jalankan: python -m pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "img")
OUT = os.path.join(SRC, "foto")

# nama keluaran -> (berkas sumber, kotak potong kiri/atas/kanan/bawah, lebar maks, kualitas)
# Kotak boleh None bila seluruh gambar dipakai.
TUGAS = [
    # Potret mempelai — dipakai di bingkai 3:4, sudah tegak sejak sumbernya
    ("groom",     "groom-01.png",  None, 620, 84),
    ("bride",     "bride-01.png",  None, 620, 84),

    # Kartu acara — 1:1. Dipotong ke dalam supaya tepi putih dan sudut
    # membulat pada kartunya hilang, sehingga panel maroonnya penuh ke tepi.
    ("akad",      "masjid.png",    ( 67,  64,  826, 822), 420, 82),
    ("resepsi",   "rumah.png",     ( 68,  62,  842, 822), 420, 82),

    # Galeri — tinggi seragam, lebar mengikuti bentuk asli, jadi foto tegak
    # tidak perlu dipotong sampai kehilangan suntiangnya.
    ("gallery-1", "couple-01.png", (  0,  50,  505, 387), 900, 80),
    ("gallery-2", "bride-05.png",  None,                  900, 80),
    ("gallery-3", "couple-03.png", (  0,  40,  505, 377), 900, 80),
    ("gallery-4", "couple-04.png", ( 54,   0,  709, 437), 900, 80),
    ("gallery-5", "groom-02.png",  None,                  900, 80),
    ("gallery-6", "couple-02.png", (  0,  40,  498, 372), 900, 80),
    ("gallery-7", "braide2.jpeg",  None,                  900, 80),
    ("gallery-8", "couple-05.png", ( 50,   0,  705, 437), 900, 80),
    ("gallery-9", "braide1.jpeg",  None,                  900, 80),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    total_src = total_out = 0
    dipakai = set()

    for nama, sumber, kotak, lebar_maks, kualitas in TUGAS:
        path = os.path.join(SRC, sumber)
        if not os.path.exists(path):
            print(f"LEWAT {nama}: {sumber} tidak ditemukan")
            continue

        if sumber not in dipakai:
            total_src += os.path.getsize(path)
            dipakai.add(sumber)

        im = Image.open(path).convert("RGB")
        if kotak:
            im = im.crop(kotak)

        # Tidak diperbesar: memperbesar hanya menambah ukuran berkas
        # tanpa menambah detail, dan hasilnya justru terlihat kabur.
        if im.width > lebar_maks:
            tinggi = round(im.height * lebar_maks / im.width)
            im = im.resize((lebar_maks, tinggi), Image.LANCZOS)

        tujuan = os.path.join(OUT, f"{nama}.webp")
        im.save(tujuan, "WEBP", quality=kualitas, method=6)

        ukuran = os.path.getsize(tujuan)
        total_out += ukuran
        rasio = im.width / im.height
        print(f"{nama}.webp".ljust(17)
              + f"{im.width:>5} x {im.height:<5}"
              + f"rasio {rasio:4.2f}"
              + f"{ukuran / 1024:>8.0f} KB"
              + f"   <- {sumber}")

    print("-" * 66)
    print(f"Sumber : {total_src / 1024 / 1024:.2f} MB")
    print(f"WebP   : {total_out / 1024:.0f} KB")
    if total_src:
        print(f"Hemat  : {(1 - total_out / total_src) * 100:.1f}%")


if __name__ == "__main__":
    main()
