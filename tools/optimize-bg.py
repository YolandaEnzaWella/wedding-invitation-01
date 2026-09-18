"""Ubah latar PNG besar menjadi WebP siap pakai.

Jalankan dari akar proyek:

    python tools/optimize-bg.py

Membaca  : assets/img/bg1.png ... bg8.png  (atau berapa pun yang ada)
Menulis  : assets/img/bg/bgN.webp      1536 px, layar besar
           assets/img/bg/bgN-sm.webp    820 px, layar kecil melintang
           assets/img/bg/bgN-top.webp   760 px, pita atas untuk layar tegak
           assets/img/bg/bgN-bot.webp   760 px, pita bawah untuk layar tegak

Kenapa ada pita terpisah
------------------------
Latar aslinya melintang 3:2, sedangkan tinggi tiap bagian di ponsel berbeda
jauh — dari rasio 0,85 (Hitung Mundur yang pendek) sampai 0,27 (RSVP yang
panjang). Dipaksa `background-size: cover`, satu-satunya cara gambar menutupi
bagian yang tinggi adalah diperbesar sampai sisi kiri-kanannya terpotong habis
dan pikselnya melar. Tidak ada satu rasio gambar pun yang cocok untuk semua.

Karena itu di layar tegak gambarnya dipakai selebar penuh sebagai pita atas dan
pita bawah, dan ruang di antaranya diisi warna. Lebar penuh berarti ornamen
tepinya utuh, dan karena tidak pernah diperbesar melebihi ukuran aslinya,
ketajamannya terjaga berapa pun tinggi bagiannya.

Skrip ini juga mencetak warna rata-rata bagian tengah tiap gambar, untuk
dipakai sebagai `background-color` pengisi ruang di antara kedua pita.

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
OUT = os.path.join(SRC, "bg")

# (akhiran nama, lebar maksimum, kualitas WebP)
VARIANTS = [("", 1536, 82), ("-sm", 820, 78)]

# Pita untuk layar tegak
LEBAR_PITA = 760
KUALITAS_PITA = 80
# Bagian gambar yang diambil jadi pita, diukur dari tepi atas dan tepi bawah.
# 46% dipilih supaya seluruh ornamen tepi ikut terbawa, tapi kedua pita tidak
# saling menindih pada bagian halaman yang paling pendek.
PORSI_PITA = 0.46


def warna_tengah(im):
    """Warna rata-rata pita tengah gambar, untuk mengisi ruang antara kedua
    pita. Diambil dari sepertiga bagian tengah karena di situlah bidang
    kosongnya — bukan dari seluruh gambar, yang akan tertarik gelap oleh
    ornamen tepi."""
    h = im.height
    tengah = im.crop((0, round(h * 0.38), im.width, round(h * 0.62)))
    r, g, b = tengah.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    return "#%02X%02X%02X" % (r, g, b)


def buat_pita(im, stem, out_dir):
    """Simpan pita atas dan bawah selebar penuh. Tidak pernah diperbesar:
    kalau sumbernya lebih sempit dari LEBAR_PITA, dipakai apa adanya."""
    lebar = min(LEBAR_PITA, im.width)
    tinggi = round(im.height * lebar / im.width)
    kecil = im.resize((lebar, tinggi), Image.LANCZOS)

    potong = round(tinggi * PORSI_PITA)
    hasil = []
    for akhiran, kotak in (
        ("-top", (0, 0, lebar, potong)),
        ("-bot", (0, tinggi - potong, lebar, tinggi)),
    ):
        dest = os.path.join(out_dir, f"{stem}{akhiran}.webp")
        kecil.crop(kotak).save(dest, "WEBP", quality=KUALITAS_PITA, method=6)
        hasil.append((f"{stem}{akhiran}.webp", lebar, potong, os.path.getsize(dest)))
    return hasil


def main():
    os.makedirs(OUT, exist_ok=True)

    sources = sorted(
        f for f in os.listdir(SRC)
        if f.lower().startswith("bg") and f.lower().endswith((".png", ".jpg", ".jpeg"))
    )

    if not sources:
        sys.exit(f"Tidak ada berkas bg*.png di {SRC}")

    total_src = total_out = 0
    warna = {}

    for name in sources:
        path = os.path.join(SRC, name)
        stem = os.path.splitext(name)[0]
        total_src += os.path.getsize(path)

        with Image.open(path) as im:
            im = im.convert("RGB")

            for suffix, width, quality in VARIANTS:
                if im.width > width:
                    height = round(im.height * width / im.width)
                    out_im = im.resize((width, height), Image.LANCZOS)
                else:
                    out_im = im.copy()

                dest = os.path.join(OUT, f"{stem}{suffix}.webp")
                out_im.save(dest, "WEBP", quality=quality, method=6)

                size = os.path.getsize(dest)
                total_out += size
                print(f"{stem}{suffix}.webp".ljust(18)
                      + f"{out_im.width:>5} x {out_im.height:<5}"
                      + f"{size / 1024:>8.0f} KB")

            for nama_pita, lw, lh, size in buat_pita(im, stem, OUT):
                total_out += size
                print(f"{nama_pita}".ljust(18)
                      + f"{lw:>5} x {lh:<5}"
                      + f"{size / 1024:>8.0f} KB")

            warna[stem] = warna_tengah(im)

    print("-" * 48)
    print(f"Sumber : {total_src / 1024 / 1024:.1f} MB")
    print(f"WebP   : {total_out / 1024 / 1024:.2f} MB")
    if total_src:
        print(f"Hemat  : {(1 - total_out / total_src) * 100:.1f}%")

    print()
    print("Warna pengisi antara kedua pita (salin ke style.css):")
    for stem in sorted(warna):
        print(f"  {stem}: {warna[stem]}")


if __name__ == "__main__":
    main()
