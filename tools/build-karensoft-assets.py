#!/usr/bin/env python3
"""
KarenSoft credit assets builder.

Cuts the three transparent PNGs used by the animated "Designed & Developed by
KarenSoft" footer credit out of the ORIGINAL KarenSoft logo artwork, so the brand
fonts and colours stay exact (no re-typed text).

Source artwork (501x501 RGBA, transparent background), top to bottom:
    y=84..259   blue "KS" mark with a pixel trail
    y=284..352  «کارن سافت»
    y=361..373  thin dotted underline
    y=383..415  "Karensoft"

Output (assets/images/karensoft/):
    mark.png         256x256  square, KS mark only
    wordmark-fa.png   ~383x96 «کارن سافت» + underline
    wordmark-en.png   ~410x48 "Karensoft"

The full logo is deliberately NOT shipped inside the credit: its text is dark
navy and would be unreadable on the dark footer, hence the white card.

Usage:
    python3 tools/build-karensoft-assets.py [path/to/logo.png]

If the logo artwork ever changes, the script re-discovers the vertical bands by
scanning for fully transparent horizontal gaps between the three parts, so the
hard-coded rows below are only a documented fallback.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ALPHA_THRESHOLD = 8          # a pixel counts as "ink" above this alpha value
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "images" / "karensoft"

# Documented fallback rows in the original 501x501 artwork (inclusive, top, bottom)
FALLBACK_BANDS = {
    "mark": (84, 259),
    "wordmark-fa": (280, 375),   # includes the dotted underline
    "wordmark-en": (380, 419),
}


def find_bands(img: Image.Image) -> list[tuple[int, int]]:
    """Return the vertical bands of ink, split by fully transparent gaps."""
    w, h = img.size
    px = img.load()
    bands: list[tuple[int, int]] = []
    start: int | None = None
    for y in range(h):
        has_ink = any(px[x, y][3] > ALPHA_THRESHOLD for x in range(w))
        if has_ink and start is None:
            start = y
        elif not has_ink and start is not None:
            bands.append((start, y - 1))
            start = None
    if start is not None:
        bands.append((start, h - 1))
    return bands


def trim(img: Image.Image) -> Image.Image:
    """Trim to the alpha bounding box (alpha > ALPHA_THRESHOLD)."""
    alpha = img.getchannel("A").point(lambda a: 255 if a > ALPHA_THRESHOLD else 0)
    box = alpha.getbbox()
    if box is None:
        raise SystemExit("crop is fully transparent — check the source rows")
    return img.crop(box)


def resize_to_height(img: Image.Image, height: int) -> Image.Image:
    width = max(1, round(img.width * height / img.height))
    return img.resize((width, height), Image.LANCZOS)


def square_with_margin(img: Image.Image, margin_ratio: float = 0.06) -> Image.Image:
    """Pad the trimmed mark onto a transparent square canvas with a small margin."""
    side = max(img.width, img.height)
    margin = round(side * margin_ratio)
    side += margin * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/logo.png")
    if not src.exists():
        raise SystemExit(
            f"logo not found: {src}\n"
            "Fetch it with:\n"
            '  gh api -H "Accept: application/vnd.github.raw" \\\n'
            "    repos/rahmaniho/karen-soft/contents/public/images/logo.png > logo.png"
        )

    logo = Image.open(src).convert("RGBA")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    bands = [b for b in find_bands(logo) if b[1] - b[0] > 6]
    if len(bands) == 4:                     # text band + its dotted underline → one part
        bands[1] = (bands[1][0], bands[2][1])
        del bands[2]
    if len(bands) != 3:
        print(f"! found {len(bands)} bands, falling back to documented rows")
        names = ("mark", "wordmark-fa", "wordmark-en")
        cuts = {n: logo.crop((0, FALLBACK_BANDS[n][0], logo.width,
                              FALLBACK_BANDS[n][1] + 1)) for n in names}
    else:
        print(f"bands discovered: {bands}  (mark / wordmark-fa / wordmark-en)")
        names = ("mark", "wordmark-fa", "wordmark-en")
        cuts = {
            n: logo.crop((0, band[0], logo.width, band[1] + 1))
            for n, band in zip(names, bands)
        }

    mark = resize_to_height(square_with_margin(trim(cuts["mark"])), 256)
    fa = resize_to_height(trim(cuts["wordmark-fa"]), 96)
    en = resize_to_height(trim(cuts["wordmark-en"]), 48)

    for name, img in (("mark", mark), ("wordmark-fa", fa), ("wordmark-en", en)):
        out = OUT_DIR / f"{name}.png"
        img.save(out, "PNG", optimize=True)
        print(f"  {out.relative_to(ROOT)}  {img.width}x{img.height}  "
              f"{(out.stat().st_size / 1024):.1f} KB")


if __name__ == "__main__":
    main()
