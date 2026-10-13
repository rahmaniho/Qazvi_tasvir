#!/usr/bin/env python3
"""
Qazvin Tasvir — multilingual site generator.

Takes the Persian master page and a translation file per language and writes a
real, crawlable page for each language:

    index.html        fa   (master, gets the switcher + hreflang in place)
    en/index.html     en
    ar/index.html     ar
    prs/index.html    prs
    …

What the generator guarantees — it refuses to write a language that fails any
of these, so a half-translated page can never ship:

    1. coverage       every key of i18n/strings.fa.json is translated
    2. tags           a translated run keeps the exact inline tag sequence
    3. verbatim       protected values (national ID, phone …) survive byte-exact
    4. script         a Latin-script language contains no Persian/Arabic letters
    5. digits         registered data keeps one numeric value; only the glyphs
                      follow the language (Persian digits for fa/prs, ASCII else)

Usage:
    python3 tools/extract-i18n-strings.py        # refresh the string map
    python3 tools/build-i18n-site.py             # build every ready language
    python3 tools/build-i18n-site.py --check     # validate, write nothing
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_core import (apply_jsonld, digits_to_latin, digits_to_persian,
                       normalize_digits, scan, tag_signature)  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "index.html"
I18N = ROOT / "i18n"

# Absolute origin is needed for hreflang/canonical; the switcher links stay
# relative so the site keeps working under the GitHub Pages sub-path.
SITE_ORIGIN = "https://qazvintasvir.ir"

PUBLIC_DIRS = {"assets", "i18n", "tools", ".git", "node_modules"}

STRUCTURED: dict = {}          # jsonld.* keys, filled from strings.fa.json


def fingerprint(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]

# keys the generator writes itself (not present in strings.fa.json)
GENERATED_KEYS = {"chrome.langSwitch", "chrome.brandName"}

# ── language registry ───────────────────────────────────────────────────────
# digits: 'fa' → Persian digits kept, 'latin' → ASCII digits in text nodes
LANGS: "OrderedDict[str, dict]" = OrderedDict([
    ("fa",  dict(name="Persian",  native="فارسی",    dir="rtl", digits="fa",
                 hreflang="fa", label_fa="فارسی")),
    ("en",  dict(name="English",  native="English",  dir="ltr", digits="latin",
                 hreflang="en")),
    ("ar",  dict(name="Arabic",   native="العربية",  dir="rtl", digits="latin",
                 hreflang="ar")),
    ("prs", dict(name="Dari",     native="دری",      dir="rtl", digits="fa",
                 hreflang="fa-AF")),
    ("tr",  dict(name="Turkish",  native="Türkçe",   dir="ltr", digits="latin",
                 hreflang="tr")),
    ("ru",  dict(name="Russian",  native="Русский",  dir="ltr", digits="latin",
                 hreflang="ru")),
    ("de",  dict(name="German",   native="Deutsch",  dir="ltr", digits="latin",
                 hreflang="de")),
    ("fr",  dict(name="French",   native="Français", dir="ltr", digits="latin",
                 hreflang="fr")),
    ("zh",  dict(name="Chinese",  native="中文",      dir="ltr", digits="latin",
                 hreflang="zh-Hans")),
    ("ko",  dict(name="Korean",   native="한국어",    dir="ltr", digits="latin",
                 hreflang="ko")),
    ("ja",  dict(name="Japanese", native="日本語",    dir="ltr", digits="latin",
                 hreflang="ja")),
])
X_DEFAULT = "fa"

RTL_SCRIPTS = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")      # Arabic/Persian block
PERSIAN_LETTERS = re.compile(r"[\u067E\u0686\u0698\u06AF\u06CC\u06A9]")  # پ چ ژ گ ی ک

SWITCH_BEGIN = "<!-- QT:LANG-SWITCH:BEGIN -->"
SWITCH_END = "<!-- QT:LANG-SWITCH:END -->"
HREFLANG_BEGIN = "<!-- QT:HREFLANG:BEGIN -->"
HREFLANG_END = "<!-- QT:HREFLANG:END -->"

GLOBE_SVG = (
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
    '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path>'
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 '
    '15.3 15.3 0 0 1 4-10z"></path></svg>'
)


# ── builders for the generated chrome ───────────────────────────────────────
def depth_prefix(lang: str) -> str:
    """Relative prefix from a language page back to the site root."""
    return "" if lang == "fa" else "../"


def switcher_html(active: str, available: list[str], a11y_label: str) -> str:
    """A JS-free language switcher: <details> + links in the reader's own script."""
    links = []
    for code in [c for c in LANGS if c in available]:
        info = LANGS[code]
        href = f"{depth_prefix(active)}{'' if code == 'fa' else code + '/'}"
        if active == code:
            href = "./" if code != "fa" else "./"
        current = ' aria-current="true"' if code == active else ""
        links.append(
            f'        <a class="lang-switch__item" href="{href}" hreflang="{info["hreflang"]}"'
            f' lang="{code}"{current}>'
            f'<span class="lang-switch__name">{info["native"]}</span>'
            f'<span class="lang-switch__native">{info["name"]}</span></a>'
        )
    return (
        f'{SWITCH_BEGIN}\n'
        f'        <details class="lang-switch">\n'
        f'          <summary class="lang-switch__btn" aria-label="{a11y_label}">\n'
        f'            {GLOBE_SVG}\n'
        f'            <span class="lang-switch__code">{active}</span>\n'
        f'          </summary>\n'
        f'          <nav class="lang-switch__panel" aria-label="{a11y_label}">\n'
        + "\n".join(links) + "\n"
        f'          </nav>\n'
        f'        </details>\n'
        f'        {SWITCH_END}'
    )


def hreflang_html(available: list[str]) -> str:
    rows = []
    for code in available:
        info = LANGS[code]
        url = f'{SITE_ORIGIN}/' if code == "fa" else f'{SITE_ORIGIN}/{code}/'
        rows.append(f'  <link rel="alternate" hreflang="{info["hreflang"]}" href="{url}">')
    url = f'{SITE_ORIGIN}/'
    rows.append(f'  <link rel="alternate" hreflang="x-default" href="{url}">')
    return f'{HREFLANG_BEGIN}\n' + "\n".join(rows) + f'\n  {HREFLANG_END}'


def replace_block(html: str, begin: str, end: str, new: str, label: str) -> str:
    i, j = html.find(begin), html.find(end)
    if i == -1 or j == -1:
        raise SystemExit(f'marker not found in master: {label} ({begin})')
    return html[:i] + new + html[j + len(end):]


# ── validation ──────────────────────────────────────────────────────────────
def validate(lang: str, strings: dict, translations: dict,
             snapshot: "dict[str, str] | None" = None) -> list[str]:
    errors: list[str] = []
    info = LANGS[lang]
    missing = [k for k in strings if k not in translations]
    known = set(strings) | set(STRUCTURED) | GENERATED_KEYS
    extra = [k for k in translations if k not in known]
    if missing:
        errors.append(f"{len(missing)} untranslated keys, e.g. {missing[:4]}")
    if extra:
        errors.append(f"{len(extra)} unknown keys, e.g. {extra[:4]}")

    for key in strings:
        if key not in translations:
            continue
        src, tr = strings[key], translations[key]
        if not str(tr).strip():
            errors.append(f"{key}: empty translation")
            continue
        if "html" in src and tag_signature(src["html"]) != tag_signature(str(tr)):
            errors.append(f"{key}: inline tags changed "
                          f"({tag_signature(src['html'])} → {tag_signature(str(tr))})")
        for keep in src.get("keepVerbatim", []):
            if normalize_digits(keep) not in normalize_digits(str(tr)):
                errors.append(f"{key}: protected value {keep} missing from the translation")
        # digits follow the language automatically, so compare (and script-check)
        # with every digit form reduced to ASCII
        if info["dir"] == "ltr" and RTL_SCRIPTS.search(normalize_digits(str(tr))):
            errors.append(f"{key}: Arabic-script letters in an LTR language: {str(tr)[:40]!r}")
    if snapshot is not None:
        changed = []
        for key, src in list(strings.items()) + list(STRUCTURED.items()):
            text = src.get("html") or src["fa"]
            if key in snapshot and snapshot[key] != fingerprint(text) \
                    and key in translations:
                changed.append(key)
        if changed:
            errors.append(f"{len(changed)} string(s) changed since they were translated "
                          f"— re-translate: {changed[:5]}")

    for key, src in STRUCTURED.items():
        tr = translations.get(key)
        if tr is None:
            errors.append(f"{key}: structured data missing")
            continue
        if not str(tr).strip():
            errors.append(f"{key}: empty structured translation")
        elif info["dir"] == "ltr" and RTL_SCRIPTS.search(normalize_digits(str(tr))):
            errors.append(f"{key}: Arabic-script letters in an LTR language")
    if info["dir"] == "rtl" and lang == "ar":
        persian = [k for k, v in translations.items()
                   if (k in strings or k in STRUCTURED) and PERSIAN_LETTERS.search(str(v))]
        if persian:
            errors.append(f"{len(persian)} Arabic strings use Persian letter forms "
                          f"(ی/ک instead of ي/ك), e.g. {persian[:3]}")
    return errors


# ── the build ───────────────────────────────────────────────────────────────
def apply_translations(html: str, records, translations: dict, digits: str,
                       locked: "set[str] | None" = None) -> str:
    """Write translations back into the exact spans the scanner recorded."""
    locked = locked or set()
    out, pos, protected = [], 0, []
    for rec in sorted(records, key=lambda r: r.start):
        value = translations.get(rec.key)
        if value is None:
            continue
        if rec.key not in locked and not rec.digit_locked:
            convert = digits_to_persian if digits == "fa" else digits_to_latin
            if rec.kind.startswith(("attr:", "meta:")):
                # attribute values are display text too → same digit rule
                value = convert(str(value))
            else:
                value = text_nodes(str(value), convert)
        out.append(html[pos:rec.start])
        if rec.key in locked or rec.digit_locked:
            start = sum(len(p) for p in out)
            protected.append((start, start + len(str(value))))
        out.append(value)
        pos = rec.end
    out.append(html[pos:])
    built = "".join(out)
    # hard gate: translating text must never move a single tag
    if tag_signature(built) != tag_signature(html):
        raise SystemExit("structure changed while writing translations — "
                         "run offsets are wrong; re-run the extractor")
    # the untranslated remainder (fa/prs) follows the language's digit rule too,
    # except inside spans that are locked to their original digits
    if digits == "fa":
        return text_nodes(built, digits_to_persian, skip=protected)
    return text_nodes(built, digits_to_latin, skip=protected)


def text_nodes(html: str, convert, skip: "list[tuple[int, int]] | None" = None) -> str:
    """Apply `convert` to text nodes only — never to attributes (ids, hrefs,
    CSS values) and never inside <script>/<style>. This is how the digit rule is
    enforced: fa/prs always render Persian digits, every other language ASCII."""
    parts, pos = [], 0
    for m in re.finditer(r"(<(script|style)\b[^>]*>.*?</\2>)|(>[^<]*)", html, re.S):
        if m.group(1):                                  # script/style block: as-is
            continue
        text_start = m.start(3) + 1
        parts.append((text_start, m.end(3)))
    if not parts:
        return html
    skip = skip or []
    built, last = [], 0
    for start, end in parts:
        built.append(html[last:start])
        if any(start < s_end and end > s_start for s_start, s_end in skip):
            built.append(html[start:end])               # protected: leave the digits alone
        else:
            built.append(convert(html[start:end]))
        last = end
    built.append(html[last:])
    return "".join(built)


def build_language(lang: str, master: str, strings: dict,
                   translations: dict, available: list[str]) -> str:
    info = LANGS[lang]
    html = master

    # 1) chrome first — these edits change the document's length, so the string
    #    substitution happens afterwards, against a fresh scan of THIS document.
    html = re.sub(r'<html lang="[^"]*" dir="[^"]*">',
                  f'<html lang="{lang}" dir="{info["dir"]}">', html, count=1)

    # switcher + hreflang (both are generated for every language, fa included)
    label = translations.get("chrome.langSwitch") or "Change language"
    html = replace_block(html, SWITCH_BEGIN, SWITCH_END,
                         switcher_html(lang, available, label), "language switcher")
    html = replace_block(html, HREFLANG_BEGIN, HREFLANG_END,
                         hreflang_html(available), "hreflang")

    # canonical for this language
    url = f'{SITE_ORIGIN}/' if lang == "fa" else f'{SITE_ORIGIN}/{lang}/'
    html = re.sub(r'<link rel="canonical" href="[^"]*">',
                  f'<link rel="canonical" href="{url}">', html, count=1)

    # og:url + og:locale
    locale = {"fa": "fa_IR", "en": "en_US", "ar": "ar_SA", "prs": "fa_AF"}.get(
        lang, f"{lang}_{lang.upper()}")
    if '<meta property="og:url"' in html:
        html = re.sub(r'<meta property="og:url" content="[^"]*">',
                      f'<meta property="og:url" content="{url}">', html, count=1)
    if '<meta property="og:locale"' in html:
        html = re.sub(r'<meta property="og:locale" content="[^"]*">',
                      f'<meta property="og:locale" content="{locale}">', html, count=1)

    # 2) translate — a fresh scan of the document we are about to edit, so the
    #    recorded byte offsets are exact (the map only supplies the key → text).
    records = scan(html, verify=True)
    if len(records) != len(strings):
        raise SystemExit(f"{lang}: {len(records)} runs after chrome edits, "
                         f"expected {len(strings)} — string map is stale")
    locked_keys = {k for k, v in strings.items() if v.get("digitLocked")}
    for key, value in STRUCTURED.items():
        if str(value.get("fa", "")).strip():
            pass
    html = apply_translations(html, records, translations, info["digits"], locked_keys)
    html = apply_jsonld(html, translations,
                        digits_to_persian if info["digits"] == "fa" else digits_to_latin)

    # per-page <title>/description for the hash routes, in this language.
    # Persian keeps the hand-written copy in main.js; every other language gets
    # titles derived from its own translated headings.
    if lang != "fa":
        route_meta = route_meta_for(lang, strings, translations)
        script = ("<script>\n  /* عنوان و توضیح هر مسیر به زبان این صفحه — "
                  "ساختهٔ tools/build-i18n-site.py */\n"
                  "  window.QT_ROUTE_META = "
                  + json.dumps(route_meta, ensure_ascii=False, indent=4) + ";\n</script>\n  ")
        html = html.replace('<script src="assets/js/main.js"></script>',
                            script + '<script src="assets/js/main.js"></script>', 1)

    # asset paths are relative → one level deeper needs a prefix
    if lang != "fa":
        html = re.sub(r'(href|src)="assets/', rf'\1="../assets/', html)
        html = html.replace('href="robots.txt"', 'href="../robots.txt"')
        html = html.replace("url('../images/karensoft/", "url('../../assets/images/karensoft/")
    return html


def route_meta_for(lang: str, strings: dict, translations: dict) -> dict:
    """Title/description per section, derived from the translated headings —
    no extra translation work, and every route gets a real localized title."""
    brand = translations.get("chrome.brandName") or "Qazvin Tasvir Company"
    sections: dict[str, dict] = {}
    for key, value in strings.items():
        section = key.split(".")[0]
        if section == "chrome":
            continue
        tr = translations.get(key)
        if not tr:
            continue
        entry = sections.setdefault(section, {})
        ctx = value.get("ctx", "")
        # the section H1/H2 is the page title source; the first paragraph the description
        text = re.sub(r"<[^>]+>", "", str(tr)).strip()
        if ctx.startswith(("h1.", "h2.")) and "title" not in entry:
            entry["title"] = text
        elif value.get("kind") == "text" and len(text) > 60:
            # prefer a real paragraph over a stray heading or list item
            score = 2 if ctx.startswith("p.") else 1
            if score > entry.get("desc_score", 0):
                entry["desc"], entry["desc_score"] = text, score
    out = {}
    for section, entry in sections.items():
        title = entry.get("title") or section.replace("-", " ").title()
        out[section] = {
            "title": f"{title} | {brand}",
            "desc": entry.get("desc") or title,
        }
    return out


def load_translations(lang: str) -> "tuple[dict, dict] | None":
    """→ (translations, source snapshot). The snapshot records, per key, which
    Persian text the translation was made from, so a later edit to the source
    cannot silently keep a stale translation."""
    path = I18N / f"{lang}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    if "strings" in data:
        return data["strings"], data.get("source", {})
    return data, {}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    ap.add_argument("--langs", help="comma separated subset, e.g. en,ar")
    ap.add_argument("--scaffold", metavar="LANG",
                    help="create/refresh i18n/<LANG>.json with the source snapshot")
    args = ap.parse_args()

    if args.scaffold:
        scaffold(args.scaffold)
        return

    master = MASTER.read_text(encoding="utf-8")
    for marker, label in ((SWITCH_BEGIN, "switcher"), (HREFLANG_BEGIN, "hreflang")):
        if marker not in master:
            raise SystemExit(f"index.html is missing the {label} markers — add them first")

    payload = json.loads((I18N / "strings.fa.json").read_text(encoding="utf-8"))
    strings = payload["strings"]
    STRUCTURED.clear()
    STRUCTURED.update(payload.get("structured", {}))
    if len(scan(master)) != len(strings):
        raise SystemExit(f"string map is stale ({len(scan(master))} runs vs {len(strings)} keys)"
                         f" — re-run tools/extract-i18n-strings.py")

    wanted = [l.strip() for l in args.langs.split(",")] if args.langs else list(LANGS)
    available, failures = ["fa"], []
    for lang in wanted:
        if lang == "fa":
            continue
        loaded = load_translations(lang)
        if loaded is None:
            print(f"  · {lang:4} — no i18n/{lang}.json yet (skipped)")
            continue
        translations, snapshot = loaded
        errors = validate(lang, strings, translations, snapshot)
        if errors:
            failures.append((lang, errors))
            print(f"  ✗ {lang:4} — {len(errors)} problem(s): {errors[0]}")
            continue
        available.append(lang)

    available = [c for c in LANGS if c in available]
    print(f"\n  ready languages: {', '.join(available)}")

    if failures and not args.check:
        print("\n  refusing to write languages that failed validation:")
        for lang, errs in failures:
            for e in errs[:6]:
                print(f"    {lang}: {e}")
        sys.exit(1)

    if args.check:
        print("  --check: nothing written")
        return

    # fa is the master itself: regenerate its switcher + hreflang in place
    fa_html = build_language("fa", master, strings, {}, available)
    MASTER.write_text(fa_html, encoding="utf-8")
    print(f"  ✓ fa   → index.html")
    master = fa_html                                     # other languages build from it

    for lang in available:
        if lang == "fa":
            continue
        translations, _snapshot = load_translations(lang)
        html = build_language(lang, master, strings, translations, available)
        out_dir = ROOT / lang
        out_dir.mkdir(exist_ok=True)
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        size = (out_dir / "index.html").stat().st_size / 1024
        print(f"  ✓ {lang:4} → {lang}/index.html  ({size:.0f} KB)")

    write_sitemap(available)
    print(f"  ✓ sitemap.xml updated ({len(available)} languages)")


def write_sitemap(available: list[str]) -> None:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
             '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for code in available:
        url = f'{SITE_ORIGIN}/' if code == "fa" else f'{SITE_ORIGIN}/{code}/'
        lines.append("  <url>")
        lines.append(f"    <loc>{url}</loc>")
        for alt in available:
            alt_url = f'{SITE_ORIGIN}/' if alt == "fa" else f'{SITE_ORIGIN}/{alt}/'
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{LANGS[alt]["hreflang"]}" href="{alt_url}"/>')
        lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_ORIGIN}/"/>')
        lines.append("    <lastmod>2026-10-13</lastmod>")
        lines.append("    <changefreq>monthly</changefreq>")
        lines.append(f'    <priority>{"1.0" if code == "fa" else "0.9"}</priority>')
        lines.append("  </url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def scaffold(lang: str) -> None:
    """Create i18n/<lang>.json pre-filled with the source snapshot, so a
    translator starts from an exact, verifiable list."""
    payload = json.loads((I18N / "strings.fa.json").read_text(encoding="utf-8"))
    source = {}
    for key, val in payload["strings"].items():
        source[key] = fingerprint(val.get("html") or val["fa"])
    for key, val in payload.get("structured", {}).items():
        source[key] = fingerprint(val["fa"])
    out = I18N / f"{lang}.json"
    existing = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
    existing.update({"lang": lang, "source": source,
                     "strings": existing.get("strings", {})})
    out.write_text(json.dumps(existing, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"  scaffolded {out.relative_to(ROOT)} — {len(source)} keys, "
          f"{len(existing.get('strings', {}))} translated")


if __name__ == "__main__":
    main()
