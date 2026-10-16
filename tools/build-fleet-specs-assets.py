#!/usr/bin/env python3
"""
Qazvin Tasvir — fleet-specs gallery assets, from the official company resume.

The company resume («رزومه شرکت قزوین تصویر», 13 pages, "حمل و نقل درون شهری")
carries the real photos of the transport fleet and the VIP interior. This tool
extracts those photos from the PDF and writes the optimized JPG + WebP pair the
site's <picture> tags expect under assets/img/fleet-specs/:

    fleet-photo-01..08   fleet photos from the resume (exterior / service shots)
    vip-seats            VIP seats (resume page 11)
    vip-catering         refreshment basket / VIP catering (resume page 11)

Usage:
    python3 tools/build-fleet-specs-assets.py <resume.pdf> [--force]

Requires: pypdf (extraction) and Pillow (resize / re-encode), both optional at
runtime for the site itself — the site only needs the committed output files.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "img" / "fleet-specs"

# (pdf page number, extracted image name) → output basename + max width.
# Page numbers refer to the 1-based page order inside the resume PDF.
SOURCES: list[tuple[int, str, str, int]] = [
    (2,  "Image31.jpg",  "fleet-photo-01", 1024),  # ناوگان — صفحهٔ معرفی
    (5,  "Image76.jpg",  "fleet-photo-02", 1280),  # صفحهٔ مشخصات موتور
    (10, "Image146.jpg", "fleet-photo-03", 1280),  # گالری رزومه
    (11, "Image157.jpg", "vip-seats",      1024),  # صندلی‌های VIP
    (11, "Image158.jpg", "vip-catering",   1024),  # سبد مطبوعاتی و پذیرایی VIP
    (12, "Image161.jpg", "fleet-photo-04", 1280),  # گالری رزومه
    (12, "Image162.jpg", "fleet-photo-05", 1280),  # گالری رزومه
    (13, "Image165.jpg", "fleet-photo-06", 1280),  # گالری رزومه
    (13, "Image167.jpg", "fleet-photo-07", 1280),  # گالری رزومه
    (13, "Image168.jpg", "fleet-photo-08", 1280),  # گالری رزومه
]


def extract(pdf_path: Path, page_no: int, image_name: str) -> bytes:
    """Pull one embedded image (by name) off one page of the resume PDF."""
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    page = reader.pages[page_no - 1]
    for img in page.images:
        if img.name == image_name:
            return img.data
    raise SystemExit(f"{pdf_path}: image {image_name!r} not on page {page_no}")


def optimize(data: bytes, out_base: str, max_width: int, force: bool) -> None:
    jpg_path = OUT_DIR / f"{out_base}.jpg"
    webp_path = OUT_DIR / f"{out_base}.webp"
    if not force and jpg_path.exists() and webp_path.exists():
        print(f"  skip  {out_base} (already built)")
        return
    im = Image.open(__import__("io").BytesIO(data))
    im = im.convert("RGB")
    if im.width > max_width:
        im = im.resize((max_width, round(im.height * max_width / im.width)),
                       Image.LANCZOS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    im.save(jpg_path, "JPEG", quality=85, optimize=True, progressive=True)
    im.save(webp_path, "WEBP", quality=80, method=6)
    kb = (jpg_path.stat().st_size + webp_path.stat().st_size) / 1024
    print(f"  ok    {out_base}.jpg + .webp  ({im.width}x{im.height}, {kb:.0f} KB)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("pdf", type=Path, help="رزومه شرکت قزوین تصویر (PDF)")
    ap.add_argument("--force", action="store_true",
                    help="بازسازی حتی اگر فایل خروجی موجود باشد")
    args = ap.parse_args()
    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 2
    print(f"building fleet-specs assets from {args.pdf} → {OUT_DIR}")
    for page_no, image_name, out_base, max_width in SOURCES:
        optimize(extract(args.pdf, page_no, image_name), out_base, max_width,
                 args.force)
    print("done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
