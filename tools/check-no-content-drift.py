#!/usr/bin/env python3
"""
Content-preservation gate for the Persian master page.

Building the site rewrites index.html (language switcher, hreflang, canonical).
This tool proves the build touched no reader-visible text: it compares the
Persian text of the working file against a reference version, digit-insensitively
(۱۴۰۴ == 1404) and ignoring the generated chrome regions.

    python3 tools/check-no-content-drift.py                 # vs HEAD
    python3 tools/check-no-content-drift.py ref.html        # vs a file
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_core import mask_generated_regions, normalize_digits  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "index.html"


def visible_text(html: str) -> str:
    html = mask_generated_regions(html)
    html = re.sub(r"<(script|style|head)\b[^>]*>.*?</\1>", " ", html, flags=re.S)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = html.replace("&nbsp;", " ").replace("&amp;", "&").replace("&laquo;", "«")
    html = html.replace("&raquo;", "»").replace("&zwnj;", "\u200c").replace("&times;", "×")
    return normalize_digits(" ".join(html.split()))


def main() -> int:
    reference = sys.argv[1] if len(sys.argv) > 1 else None
    if reference:
        ref_html = Path(reference).read_text(encoding="utf-8")
        label = reference
    else:
        ref_html = subprocess.run(["git", "show", "HEAD:index.html"], cwd=ROOT,
                                  capture_output=True, text=True, check=True).stdout
        label = "HEAD:index.html"

    a, b = visible_text(ref_html), visible_text(TARGET.read_text(encoding="utf-8"))
    if a == b:
        print(f"  OK   no content drift vs {label} "
              f"({len(a.split())} words of Persian text, digit forms normalised)")
        return 0

    print(f"  FAIL content drift vs {label}")
    from difflib import SequenceMatcher
    sm = SequenceMatcher(None, a, b, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        print(f"    {tag}: reference {a[i1:i2]!r} → built {b[j1:j2]!r}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
