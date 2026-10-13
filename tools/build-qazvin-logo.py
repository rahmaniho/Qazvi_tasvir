#!/usr/bin/env python3
"""
Qazvin Tasvir brand-logo assets builder.

Master artwork (transparent, preferred):
    assets/images/qazvin_tasvir.png   1254x1254 RGBA, alpha already present

Legacy master (kept as a fallback):
    assets/images/logo_qazvin_tasvir.jpg   1512x1512, opaque gold-on-black JPEG

The JPEG is opaque, so its transparency has to be recovered; the PNG already has
a real alpha channel and is simply used as-is. Either way this script only crops
and rescales — the brand fonts and gold colour are never re-drawn or re-typed.

Source layout (identical stacking in both masters), top to bottom:
    gold "Q" monogram with the pixel-trail arrow
    «شرکت قزوین تصویر»
    ornamental divider
    "QAZVIN TASVIR CO."

Outputs (assets/images/brand/):
    qazvin-tasvir-mark.png       160x160  transparent, square-padded monogram
                                          (displayed at 38-44px → ~3.6x DPI headroom)
    qazvin-tasvir-lockup.png     full stacked lockup, transparent, height 512
    qazvin-tasvir-favicon.png    512x512  gold mark on the brand navy chip
    qazvin-tasvir-apple-touch.png 180x180 same chip at apple-touch-icon size
    qazvin-tasvir-icon-32.png     32x32  same chip at browser-tab size

The favicon sits on the brand navy chip (the same gradient as the site's
.brand-logo__emblem) because an unbacked gold mark loses contrast in a light
browser tab bar.

Usage:
    python3 tools/build-qazvin-logo.py [path/to/logo_qazvin_tasvir.jpg]

Requires Pillow only (no numpy) — the alpha ramp is applied with PIL point()
lookups so 2.3 MP is processed in well under a second.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC_PNG = ROOT / "assets" / "images" / "qazvin_tasvir.png"
SRC_JPG = ROOT / "assets" / "images" / "logo_qazvin_tasvir.jpg"
OUT_DIR = ROOT / "assets" / "images" / "brand"

LUM_LO, LUM_HI = 10, 50      # luminance ramp that becomes the alpha channel
ALPHA_FLOOR = 20             # below this alpha the pixel is treated as background
EDGE_GAMMA = 0.75            # speeds up the anti-aliased edge ramp (crisper gold)

# Documented fallback rows (inclusive), measured in both masters:
#   qazvin_tasvir.png (1254px):  mark 85..604,  lockup 85..1053
#   logo_qazvin_tasvir.jpg:      mark 120..725, lockup 120..1215
FALLBACK = {
    "mark": (85, 604),
    "lockup": (85, 1053),
}


def black_to_alpha(img: Image.Image) -> Image.Image:
    """Turn a gold-on-black artwork into gold-on-transparent.

    The master is a JPEG, so 'transparent' has to be recovered: luminance drives
    the alpha channel and the colour is un-premultiplied (C_true = C / alpha),
    which keeps the gold saturated instead of turning it into grey haze.
    """
    rgb = img.convert("RGB")
    r, g, b = rgb.split()

    # luminance = per-pixel max channel (gold is bright in one channel, black is ~0)
    lum = ImageChops.lighter(ImageChops.lighter(r, g), b)

    ramp = [0] * 256
    for v in range(256):
        a = (v - LUM_LO) / (LUM_HI - LUM_LO)
        a = 0.0 if a < 0 else (1.0 if a > 1 else a)
        ramp[v] = round(255 * (a ** EDGE_GAMMA))
    alpha = lum.point(ramp)

    # un-premultiply the colour so the gold keeps its hue where alpha < 1
    def unpremultiply(channel: Image.Image) -> Image.Image:
        out = [0] * 256
        for v in range(256):
            a = ramp[v] / 255 if v else 0
            out[v] = min(255, round(v / a)) if a > 0.004 else 0
        return channel.point(out)

    colour = Image.merge("RGB", (unpremultiply(r), unpremultiply(g), unpremultiply(b)))
    out = colour.convert("RGBA")
    out.putalpha(alpha.point(lambda v: 0 if v < ALPHA_FLOOR else v))
    return out


def trim(img: Image.Image) -> Image.Image:
    box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box is None:
        raise SystemExit("crop is fully transparent — check the source rows")
    return img.crop(box)


def find_bands(img: Image.Image, min_height: int = 40) -> list[tuple[int, int]]:
    """Vertical bands of ink, split by fully transparent gaps."""
    alpha = img.getchannel("A")
    w, h = alpha.size
    px = alpha.load()
    bands: list[tuple[int, int]] = []
    start = None
    for y in range(h):
        row_ink = any(px[x, y] > 8 for x in range(w))
        if row_ink and start is None:
            start = y
        elif not row_ink and start is not None:
            if y - start >= min_height:
                bands.append((start, y - 1))
            start = None
    if start is not None and h - start >= min_height:
        bands.append((start, h - 1))
    return bands


def pad_square(img: Image.Image, margin_ratio: float = 0.04) -> Image.Image:
    side = max(img.width, img.height)
    side += round(side * margin_ratio) * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return canvas


def has_alpha(img: Image.Image) -> bool:
    """True when the file ships a real alpha channel (some pixel is see-through)."""
    if img.mode not in ("RGBA", "LA", "PA"):
        return False
    return img.convert("RGBA").getchannel("A").getextrema()[0] < 250


def main() -> None:
    if len(sys.argv) > 1:
        src = Path(sys.argv[1])
    else:
        src = SRC_PNG if SRC_PNG.exists() else SRC_JPG
    if not src.exists():
        raise SystemExit(f"master logo not found: {src}")

    master = Image.open(src)
    if has_alpha(master):
        transparent = master.convert("RGBA")
        print(f"source: {src.name} (real alpha channel — used as-is)")
    else:
        transparent = black_to_alpha(master)
        print(f"source: {src.name} (opaque JPEG — alpha recovered from luminance)")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    bands = find_bands(transparent)
    print("ink bands:", bands)

    top = min(b[0] for b in bands) if bands else FALLBACK["lockup"][0]
    bottom = max(b[1] for b in bands) if bands else FALLBACK["lockup"][1]
    # the isolated monogram is everything above the gap that precedes the wordmark
    mark_band = bands[0] if bands else FALLBACK["mark"]
    mark_bottom = bands[1][0] - 1 if len(bands) > 1 else FALLBACK["mark"][1]

    w, h = transparent.size
    lockup = trim(transparent.crop((0, top - 8, w, bottom + 8)))
    mark = trim(transparent.crop((0, mark_band[0] - 8, w, mark_bottom + 8)))

    mark_sq = pad_square(mark)
    # 160px is deliberate: the mark is rendered at 38-44px CSS, so this keeps
    # ~3.6x DPI headroom while staying ~26 KB instead of 53 KB on every page load.
    mark_160 = mark_sq.resize((160, 160), Image.LANCZOS)
    lockup_h512 = lockup.resize(
        (max(1, round(lockup.width * 512 / lockup.height)), 512), Image.LANCZOS
    )

    def chip(side: int, fill: float = 0.82) -> Image.Image:
        """Gold mark on the brand navy chip — mirrors .brand-logo__emblem.

        `fill` is the share of the tile the mark occupies. Small icons need a
        bigger fill: at 32px a 0.82 fill leaves the ring too few pixels to read.
        """
        grad = Image.new("RGB", (side, side))
        gpx = grad.load()
        navy, teal = (0x0A, 0x25, 0x40), (0x0E, 0x4B, 0x6E)
        for y in range(side):
            for x in range(side):
                f = (x + y) / (2 * (side - 1))          # 135deg gradient
                gpx[x, y] = tuple(round(a + (b - a) * f) for a, b in zip(navy, teal))
        outline = Image.new("L", (side, side), 0)
        ImageDraw.Draw(outline).rounded_rectangle(
            [0, 0, side - 1, side - 1], radius=round(side * 0.22), fill=255
        )
        out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        out.paste(grad, (0, 0), outline)
        inner = round(side * fill)
        out.alpha_composite(mark_sq.resize((inner, inner), Image.LANCZOS),
                            ((side - inner) // 2, (side - inner) // 2))
        return out

    for name, img in (
        ("qazvin-tasvir-mark", mark_160),
        ("qazvin-tasvir-lockup", lockup_h512),
        ("qazvin-tasvir-favicon", chip(512)),
        ("qazvin-tasvir-apple-touch", chip(180)),
        ("qazvin-tasvir-icon-32", chip(32, fill=0.96)),
    ):
        out = OUT_DIR / f"{name}.png"
        img.save(out, "PNG", optimize=True)
        print(f"  {out.relative_to(ROOT)}  {img.width}x{img.height}  "
              f"{(out.stat().st_size / 1024):.1f} KB")


if __name__ == "__main__":
    main()
