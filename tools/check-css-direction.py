#!/usr/bin/env python3
"""
Direction gate — proves the layout direction of every generated page.

Why this exists: the `dir` attribute on <html> is only a *presentational hint*.
Any author declaration (e.g. `html { direction: rtl; }`) beats it, so an LTR
page could silently render right-to-left. This tool resolves the cascade for
the `direction` property on <html> for both attribute values and fails if the
winner is not the expected one. No third-party dependency.

    python3 tools/check-css-direction.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "assets/css/style.css"
if len(sys.argv) > 1:                    # optional: check any stylesheet file
    CSS = Path(sys.argv[1])


def rules(css: str):
    """Yield (selector, declarations, media_condition) for every rule."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    out, i = [], 0
    stack: list[str] = []
    while i < len(css):
        brace = css.find("{", i)
        if brace == -1:
            break
        head = css[i:brace].strip()
        depth, j = 1, brace + 1
        while depth and j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        body = css[brace + 1:j - 1]
        if head.startswith("@"):
            stack.append(head)
            sub = rules(body)
            for sel, decls, media in sub:
                out.append((sel, decls, f"{' '.join(stack)} {media}".strip()))
            stack.pop()
        else:
            out.append((head, body, " ".join(stack)))
        i = j
    return out


def specificity(selector: str) -> tuple[int, int, int]:
    ids = len(re.findall(r"#[\w-]+", selector))
    classes = len(re.findall(r"\.[\w-]+", selector)) + len(re.findall(r"\[[^\]]+\]", selector))
    classes += len(re.findall(r":(?!:)[\w-]+", selector))
    elements = len(re.findall(r"(?<![#.:\w-])([a-zA-Z][\w-]*)", selector))
    return (ids, classes, elements)


def matches(selector: str, tag: str, attrs: dict) -> bool:
    """Very small matcher: supports `tag`, `tag[attr="value"]`, `*` and `:root`."""
    for part in [s.strip() for s in selector.split(",")]:
        part = part.split()[-1]                       # ignore ancestor parts
        part = re.sub(r":not\([^)]*\)", "", part)
        if part in ("*", ":root") or part == tag:
            return True
        m = re.fullmatch(rf'{tag}\[([\w-]+)([\^$*]?=)?"?([^"\]]*)"?\]', part)
        if m:
            name, _, value = m.groups()
            if attrs.get(name) == value:
                return True
    return False


def winner(css: str, tag: str, attrs: dict) -> tuple[str, str]:
    best, best_spec, best_media = None, (-1, -1, -1), ""
    for selector, body, media in rules(css):
        if not matches(selector, tag, attrs):
            continue
        decls = [d.strip() for d in body.split(";")]
        for decl in decls:
            if not decl.lower().startswith("direction"):
                continue
            value = decl.split(":", 1)[1].strip().lower()
            value = value.split()[0] if value else value
            spec = specificity(selector)
            if spec >= best_spec:                     # later rule wins on ties
                best, best_spec, best_media = value, spec, media or "(top level)"
    return (best or "ltr"), best_media


def main() -> int:
    css = CSS.read_text(encoding="utf-8")
    checks = [("ltr", {"dir": "ltr"}), ("rtl", {"dir": "rtl"})]
    failures = 0
    print("direction cascade on <html>:")
    for expected, attrs in checks:
        value, where = winner(css, "html", attrs)
        ok = value == expected
        failures += 0 if ok else 1
        print(f"  <html dir=\"{attrs['dir']}\">  →  direction: {value:4} "
              f"[{where}]  {'✓' if ok else f'✗ expected {expected}'}")
    if failures:
        print("\n  ✗ an author rule overrides the dir attribute — the page will "
              "render in the wrong direction")
        return 1
    print("  ✓ both directions resolve correctly next to the dir attribute")
    return 0


if __name__ == "__main__":
    sys.exit(main())
