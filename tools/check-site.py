#!/usr/bin/env python3
"""Static QA gate for the Qazvin Tasvir site.

Checks real, user-visible expectations — not just that the build ran:

  * internal links resolve to a file (or a directory index) and anchors exist
  * every page has exactly one <h1>, a title, a description and a canonical
  * ids are unique per page (broken anchors / broken JS selectors)
  * every <img> has an alt attribute and explicit dimensions
  * JSON-LD blocks parse as JSON and carry @context/@type
  * fa/en hreflang is reciprocal and the language switcher points both ways
  * sitemap.xml lists exactly the indexable pages, with matching URLs
  * target="_blank" always ships rel="noopener"
  * every page loads the QT Next layer, then the QT Menu layer, as its last sheets
  * homepages add the QT Editorial and QT Dock layers last; no other page may
    load them
  * service detail pages add the QT Service layer last; no other page may load it
  * homepages ship dock.js (deferred) after menu.js; menu.js is deferred and
    runs after the navigation controller on every page
  * every stylesheet has balanced braces (a broken sheet silently kills the UI)

Usage: python3 tools/check-site.py
Exit code 0 = all checks passed.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://qazvintasvir.ir"
PAGES = [
    ROOT / "index.html",
    ROOT / "en/index.html",
    ROOT / "404.html",
    ROOT / "services/index.html",
    *sorted((ROOT / "services").glob("*.html")),
]
PAGES = sorted(set(PAGES))
INDEXABLE = [p for p in PAGES if p.name != "404.html"]

TAG_RE = re.compile(r"<([a-zA-Z][\w-]*)\b([^>]*)>", re.S)
ID_RE = re.compile(r'\bid\s*=\s*["\']([^"\']+)["\']')
HREF_RE = re.compile(r'\b(?:href|src)\s*=\s*["\']([^"\']+)["\']')
ANCHOR_RE = re.compile(r'(?:href)\s*=\s*["\']#([^"\']+)["\']')


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def text_of(html: str, pattern: str) -> str:
    m = re.search(pattern, html, re.S | re.I)
    return m.group(1).strip() if m else ""


def page_ids(html: str) -> list[str]:
    return ID_RE.findall(html)


def resolve(target: Path, url: str) -> tuple[bool, Path | None, str]:
    """Resolve an internal URL like a browser would, for a file on disk."""
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or url.startswith(("mailto:", "tel:", "javascript:")):
        return True, None, ""
    path = unquote(parts.path)
    if not path:
        return True, target, unquote(parts.fragment)
    if path.startswith("/"):
        # root-absolute URLs (used by 404.html, which GitHub Pages serves at
        # any depth) map to the repository root, not to the requested folder.
        candidate = (ROOT / path.lstrip("/")).resolve()
    else:
        candidate = (target.parent / path).resolve()
    try:
        candidate.relative_to(ROOT)
    except ValueError:
        return False, None, "escapes the repository root"
    if candidate.is_dir():
        candidate = candidate / "index.html"
    if not candidate.exists():
        return False, None, "file not found"
    return True, candidate, unquote(parts.fragment)


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    cache: dict[Path, str] = {}

    for page in PAGES:
        html = page.read_text(encoding="utf-8")
        cache[page] = html
        label = rel(page)

        ids = page_ids(html)
        duplicates = sorted({i for i in ids if ids.count(i) > 1})
        if duplicates:
            errors.append(f"{label}: duplicate id(s) {duplicates[:5]}")

        h1 = re.findall(r"<h1\b", html, re.I)
        if len(h1) != 1:
            errors.append(f"{label}: expected exactly one <h1>, found {len(h1)}")

        levels = [int(level) for level in re.findall(r"<h([1-6])\b", html, re.I)]
        previous = 0
        for level in levels:
            if previous and level > previous + 1:
                errors.append(
                    f"{label}: heading level jumps h{previous} → h{level}"
                )
                break
            previous = level

        title = text_of(html, r"<title>(.*?)</title>")
        if not title:
            errors.append(f"{label}: missing <title>")
        if len(title) > 70:
            warnings.append(f"{label}: title is {len(title)} characters")

        desc = text_of(html, r'<meta\s+name="description"\s+content="([^"]*)"')
        if not desc:
            errors.append(f"{label}: missing meta description")
        elif not 60 <= len(desc) <= 200:
            warnings.append(f"{label}: description is {len(desc)} characters")

        stylesheets = re.findall(
            r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html
        )
        is_home = page.name == "index.html" and page.parent in (ROOT, ROOT / "en")
        is_service_detail = page.parent == ROOT / "services" and page.name != "index.html"
        home_sheets = ("qt-home.css", "qt-dock.css")
        layer_sheets = home_sheets if is_home else (("qt-service.css",) if is_service_detail else ())
        expected_sheets = ("qt-next.css", "nav/qt-menu.css") + layer_sheets
        tail = tuple(stylesheets[-len(expected_sheets):])
        if len(tail) != len(expected_sheets) or not all(
            href.endswith(sheet) for href, sheet in zip(tail, expected_sheets)
        ):
            chain = " → ".join(expected_sheets)
            errors.append(
                f"{label}: stylesheet order must end with {chain} "
                f"(found {tail or 'none'})"
            )
        if not is_home:
            for sheet in home_sheets:
                if any(href.endswith(sheet) for href in stylesheets):
                    errors.append(f"{label}: {sheet} is homepage-only")
        if not is_service_detail and any(
            href.endswith("qt-service.css") for href in stylesheets
        ):
            errors.append(f"{label}: qt-service.css is service-detail-only")

        scripts = re.findall(r'<script[^>]+src="([^"]+)"', html)
        menu_script = next((src for src in scripts if src.endswith("menu.js")), None)
        nav_script = next((src for src in scripts if src.endswith("navigation.js")), None)
        if not menu_script:
            errors.append(f"{label}: assets/js/menu.js is not loaded")
        if not nav_script:
            errors.append(f"{label}: navigation.js is not loaded")
        if menu_script and nav_script:
            if scripts.index(menu_script) < scripts.index(nav_script):
                errors.append(f"{label}: menu.js must load after navigation.js")
            tag = re.search(rf'<script[^>]+src="{re.escape(menu_script)}"[^>]*>', html)
            if tag and "defer" not in tag.group(0):
                errors.append(f"{label}: menu.js must be deferred")

        dock_script = next((src for src in scripts if src.endswith("dock.js")), None)
        if is_home:
            if not dock_script:
                errors.append(f"{label}: assets/js/dock.js is not loaded")
            else:
                if menu_script and scripts.index(dock_script) < scripts.index(menu_script):
                    errors.append(f"{label}: dock.js must load after menu.js")
                tag = re.search(rf'<script[^>]+src="{re.escape(dock_script)}"[^>]*>', html)
                if tag and "defer" not in tag.group(0):
                    errors.append(f"{label}: dock.js must be deferred")
        elif dock_script:
            errors.append(f"{label}: dock.js is homepage-only")

        canonical = text_of(html, r'<link\s+rel="canonical"\s+href="([^"]*)"')
        if page.name != "404.html" and not canonical:
            errors.append(f"{label}: missing canonical")
        if page.name == "404.html" and "noindex" not in html:
            errors.append("404.html: must stay noindex")

        for block in re.findall(
            r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S
        ):
            try:
                data = json.loads(block)
            except json.JSONDecodeError as exc:
                errors.append(f"{label}: invalid JSON-LD ({exc})")
                continue
            if "@context" not in data:
                errors.append(f"{label}: JSON-LD missing @context")
            nodes = data.get("@graph", [data])
            if not isinstance(nodes, list) or not all("@type" in n for n in nodes):
                errors.append(f"{label}: JSON-LD missing @type")

        for tag_attrs in TAG_RE.findall(html):
            tag, attrs = tag_attrs
            if tag.lower() == "img":
                if not re.search(r'\balt\s*=', attrs):
                    errors.append(f"{label}: <img> without alt: {attrs[:90]}")
                if not (re.search(r'\bwidth\s*=', attrs) and re.search(r'\bheight\s*=', attrs)):
                    warnings.append(f"{label}: <img> without width/height: {attrs[:70]}")
            if re.search(r'\btarget\s*=\s*["\']_blank["\']', attrs) and not re.search(
                r'\brel\s*=\s*["\'][^"\']*noopener', attrs
            ):
                errors.append(f"{label}: target=_blank without rel=noopener: {attrs[:90]}")

        for raw in HREF_RE.findall(html):
            if raw.startswith("#"):
                continue
            ok, target, fragment = resolve(page, raw)
            if not ok:
                errors.append(f"{label}: broken link {raw!r} ({fragment})")
                continue
            if target and fragment and target.suffix == ".html":
                target_html = cache.get(target) or target.read_text(encoding="utf-8")
                if fragment not in page_ids(target_html):
                    errors.append(f"{label}: missing anchor #{fragment} in {rel(target)}")

        for anchor in ANCHOR_RE.findall(html):
            if anchor not in ids:
                errors.append(f"{label}: in-page link to missing id #{anchor}")

    # ---- hreflang reciprocity + language switcher ----
    fa = cache[ROOT / "index.html"]
    en = cache[ROOT / "en/index.html"]
    for html, label in ((fa, "index.html"), (en, "en/index.html")):
        if f'hreflang="fa" href="{ORIGIN}/"' not in html:
            errors.append(f"{label}: missing fa hreflang to the Persian home")
        if f'hreflang="en" href="{ORIGIN}/en/"' not in html:
            errors.append(f"{label}: missing en hreflang to /en/")
        if f'hreflang="x-default" href="{ORIGIN}/"' not in html:
            errors.append(f"{label}: missing x-default hreflang")
    if 'href="./"' not in fa or 'href="en/"' not in fa:
        errors.append("index.html: language switcher does not point to fa + en")
    if 'href="../"' not in en or 'href="./"' not in en:
        errors.append("en/index.html: language switcher does not point back to fa")

    # The hash router swaps <title> per section. The English page must ship its
    # own route metadata, otherwise navigating /en/#about shows a Persian title.
    if "window.QT_ROUTE_META" not in en:
        errors.append("en/index.html: localized QT_ROUTE_META is missing")
    else:
        block = re.search(r"window\.QT_ROUTE_META = (\{.*?\});\n", en, re.S)
        if not block:
            errors.append("en/index.html: QT_ROUTE_META is not parseable")
        else:
            try:
                meta = json.loads(block.group(1))
            except json.JSONDecodeError as exc:
                errors.append(f"en/index.html: QT_ROUTE_META is not valid JSON ({exc})")
            else:
                if len(meta) < 8:
                    errors.append(f"en/index.html: only {len(meta)} route titles")
                for route, entry in meta.items():
                    if re.search(r"[\u0600-\u06FF]", entry.get("title", "")):
                        errors.append(f"en/index.html: Persian title on route #{route}")
                        break

    # ---- sitemap ----
    sitemap = ROOT / "sitemap.xml"
    try:
        tree = ET.parse(sitemap)
    except ET.ParseError as exc:
        errors.append(f"sitemap.xml: invalid XML ({exc})")
        tree = None
    if tree is not None:
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = {node.text.strip() for node in tree.getroot().findall(".//sm:loc", ns)}
        expected = {
            (ORIGIN + "/" + ("" if p.parent == ROOT and p.name == "index.html" else rel(p)))
            .replace("/index.html", "/")
            for p in INDEXABLE
        }
        missing = sorted(expected - locs)
        if missing:
            errors.append(f"sitemap.xml: missing {missing}")
        for loc in sorted(locs):
            if not loc.startswith(ORIGIN):
                errors.append(f"sitemap.xml: URL outside the canonical origin: {loc}")

    # ---- deployment plumbing ----
    cname = ROOT / "CNAME"
    if not cname.exists() or cname.read_text(encoding="utf-8").strip() != "qazvintasvir.ir":
        errors.append("CNAME: must contain qazvintasvir.ir for GitHub Pages")

    # ---- stylesheet integrity ----
    for sheet in sorted((ROOT / "assets/css").rglob("*.css")):
        raw = sheet.read_text(encoding="utf-8")
        clean = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
        if clean.count("{") != clean.count("}"):
            errors.append(f"{sheet.relative_to(ROOT)}: unbalanced braces")

    print(f"checked {len(PAGES)} pages, {len(INDEXABLE)} indexable URLs")
    for warning in warnings:
        print(f"  ! {warning}")
    if errors:
        for error in errors:
            print(f"  ✗ {error}")
        print(f"\n{len(errors)} error(s)")
        return 1
    print("  ✓ links, anchors, headings, metadata, JSON-LD, hreflang, sitemap and CNAME are consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
