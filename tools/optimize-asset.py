"""Siapkan ornamen tempel (asset*.png) untuk dipakai di halaman.

Jalankan dari akar proyek:

    python tools/optimize-asset.py

Yang dikerjakan:
  1. Menghapus latar putih yang menyatu dengan gambar, bila ada.
     Penghapusan memakai perambatan dari tepi kanvas, bukan "buang semua
     piksel putih" — supaya sorotan terang di dalam objek tidak ikut hilang.
  2. Memangkas kanvas ke batas isi, agar penempatan lewat CSS lebih mudah.
  3. Menyimpan sebagai WebP beralpha di assets/img/ornamen/.

Butuh Pillow:  python -m pip install Pillow
"""

import os
import sys
from collections import deque

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow belum terpasang. Jalankan: python -m pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "img")
OUT = os.path.join(SRC, "ornamen")

MAX_WIDTH = 800
QUALITY = 84

# Latar dianggap putih bila ketiga kanalnya terang DAN nyaris netral
# (selisih antar kanal kecil). Emas paling terang pun masih jelas berwarna,
# jadi tidak akan tersentuh.
TERANG_MIN = 218
SELISIH_MAX = 16


def latar_menyatu(im):
    """True bila gambar sama sekali tidak punya piksel transparan."""
    alpha = im.getchannel("A")
    return alpha.getextrema()[0] >= 250


def mirip_latar(p):
    r, g, b = p[0], p[1], p[2]
    return min(r, g, b) >= TERANG_MIN and (max(r, g, b) - min(r, g, b)) <= SELISIH_MAX


def hapus_latar(im):
    """Rambatkan dari tepi kanvas, jadikan transparan tiap piksel latar."""
    w, h = im.size
    px = im.load()
    antre = deque()
    sudah = bytearray(w * h)

    def coba(x, y):
        i = y * w + x
        if not sudah[i]:
            sudah[i] = 1
            if mirip_latar(px[x, y]):
                antre.append((x, y))

    for x in range(w):
        coba(x, 0)
        coba(x, h - 1)
    for y in range(h):
        coba(0, y)
        coba(w - 1, y)

    dihapus = 0
    while antre:
        x, y = antre.popleft()
        px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
        dihapus += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                coba(nx, ny)

    return dihapus


def haluskan_tepi(im):
    """Piksel sisa yang masih pucat dan bersinggungan dengan area transparan
    dibuat separuh tembus, supaya tepinya tidak bergerigi."""
    w, h = im.size
    px = im.load()
    ubah = []
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] < 250 or not mirip_latar(p):
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    ubah.append((x, y))
                    break
    for x, y in ubah:
        p = px[x, y]
        px[x, y] = (p[0], p[1], p[2], 90)
    return len(ubah)


def main():
    os.makedirs(OUT, exist_ok=True)

    sumber = sorted(
        f for f in os.listdir(SRC)
        if f.lower().startswith("asset") and f.lower().endswith(".png")
    )
    if not sumber:
        sys.exit(f"Tidak ada berkas asset*.png di {SRC}")

    total_src = total_out = 0

    for nama in sumber:
        path = os.path.join(SRC, nama)
        stem = os.path.splitext(nama)[0]
        total_src += os.path.getsize(path)

        im = Image.open(path).convert("RGBA")
        catatan = []

        if latar_menyatu(im):
            n = hapus_latar(im)
            m = haluskan_tepi(im)
            catatan.append(f"latar dihapus {n:,} px, tepi dihaluskan {m:,} px")

        kotak = im.getbbox()
        if kotak and kotak != (0, 0, im.width, im.height):
            im = im.crop(kotak)
            catatan.append(f"dipangkas ke {im.width}x{im.height}")

        if im.width > MAX_WIDTH:
            tinggi = round(im.height * MAX_WIDTH / im.width)
            im = im.resize((MAX_WIDTH, tinggi), Image.LANCZOS)

        tujuan = os.path.join(OUT, f"{stem}.webp")
        im.save(tujuan, "WEBP", quality=QUALITY, method=6, exact=True)

        ukuran = os.path.getsize(tujuan)
        total_out += ukuran
        print(f"{stem}.webp".ljust(16)
              + f"{im.width:>4} x {im.height:<4}"
              + f"{ukuran / 1024:>7.0f} KB"
              + ("   " + "; ".join(catatan) if catatan else ""))

    print("-" * 64)
    print(f"Sumber : {total_src / 1024 / 1024:.2f} MB")
    print(f"WebP   : {total_out / 1024:.0f} KB")
    if total_src:
        print(f"Hemat  : {(1 - total_out / total_src) * 100:.1f}%")


if __name__ == "__main__":
    main()
