#!/usr/bin/env python3
"""
Qazvin Tasvir — put the brand logo into the social share image.

`assets/images/og-image.jpg` (1200x630) is a fleet photo on the brand navy matte,
but its left third is completely empty. This script centres the gold brand lockup
in that empty band and writes the result back, keeping the filename and the exact
1200x630 size so no <meta> tag has to change.

The lockup itself comes from tools/build-qazvin-logo.py, so the brand artwork is
never re-typed or re-drawn.

Usage:
    python3 tools/build-qazvin-logo.py          # first, build the lockup
    python3 tools/brand-og-image.py [--check]
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OG = ROOT / "assets" / "images" / "og-image.jpg"
LOCKUP = ROOT / "assets" / "images" / "brand" / "qazvin-tasvir-lockup.png"

# Empty matte band measured in the artwork (photo starts at x=380, gold bar at y=626)
FREE_BAND = (0, 0, 380, 626)
LOCKUP_WIDTH = 292          # leaves ~44px of breathing room on each side
SAMPLE_X = 3                # a column that is always matte


def matte_rows(img: Image.Image) -> None:
    """Report the empty band so a swapped-out artwork fails loudly, not silently."""
    px = img.load()
    w, h = img.size
    tol = 14
    photo_left = None
    for x in range(w):
        matte = px[SAMPLE_X, 0]
        if any(
            any(abs(px[x, y][c] - px[SAMPLE_X, y][c]) > tol for c in range(3))
            for y in range(0, h, 3)
        ):
            photo_left = x
            break
    print(f"  artwork {w}x{h}; first non-matte column: {photo_left}")


def main() -> None:
    if not OG.exists():
        raise SystemExit(f"share image not found: {OG}")
    if not LOCKUP.exists():
        raise SystemExit(f"lockup not found: {LOCKUP}\nRun tools/build-qazvin-logo.py first.")

    check_only = "--check" in sys.argv
    base = Image.open(OG).convert("RGB")
    print("before:")
    matte_rows(base)

    lockup = Image.open(LOCKUP)
    target_w = LOCKUP_WIDTH
    target_h = max(1, round(lockup.height * target_w / lockup.width))
    lockup = lockup.resize((target_w, target_h), Image.LANCZOS)

    x0, y0, x1, y1 = FREE_BAND
    x = x0 + (x1 - x0 - target_w) // 2
    y = y0 + (y1 - y0 - target_h) // 2

    out = base.convert("RGBA")
    out.alpha_composite(lockup, (x, y))
    out = out.convert("RGB")
    print(f"  lockup {target_w}x{target_h} placed at ({x}, {y}) in band {FREE_BAND}")

    if check_only:
        out.save("/tmp/og-image-preview.jpg", "JPEG", quality=90, optimize=True)
        print("  --check: wrote /tmp/og-image-preview.jpg, original untouched")
        return

    out.save(OG, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"  wrote {OG.relative_to(ROOT)}  {OG.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
