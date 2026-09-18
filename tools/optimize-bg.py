"""Ubah latar PNG besar menjadi WebP dua ukuran.

Jalankan dari akar proyek:

    python tools/optimize-bg.py

Membaca  : assets/img/bg1.png ... bg7.png  (atau berapa pun yang ada)
Menulis  : assets/img/bg/bgN.webp     1536 px, untuk layar besar
           assets/img/bg/bgN-sm.webp   820 px, untuk ponsel

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


def main():
    os.makedirs(OUT, exist_ok=True)

    sources = sorted(
        f for f in os.listdir(SRC)
        if f.lower().startswith("bg") and f.lower().endswith((".png", ".jpg", ".jpeg"))
    )

    if not sources:
        sys.exit(f"Tidak ada berkas bg*.png di {SRC}")

    total_src = total_out = 0

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

    print("-" * 48)
    print(f"Sumber : {total_src / 1024 / 1024:.1f} MB")
    print(f"WebP   : {total_out / 1024 / 1024:.2f} MB")
    if total_src:
        print(f"Hemat  : {(1 - total_out / total_src) * 100:.1f}%")


if __name__ == "__main__":
    main()
