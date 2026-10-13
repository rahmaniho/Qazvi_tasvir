#!/usr/bin/env python3
"""
Qazvin Tasvir — i18n string extractor.

Writes the translation artefacts from the Persian master page, using the shared
scanner (tools/i18n_core.py) so that the generator later finds the exact same
key → span mapping:

    i18n/strings.fa.json   key → { fa, html, kind, verbatim }  (machine input)
    i18n/worksheet.csv     one row per string, one column per target language

Registration data (national ID, registration number, economic code, founding
date) and phone numbers are never translated: they are recorded per string under
`verbatim` and flagged in the worksheet so a translator knows to leave them.

Usage:
    python3 tools/extract-i18n-strings.py
"""
from __future__ import annotations

import csv
import json
from collections import OrderedDict
from pathlib import Path

from i18n_core import collect_jsonld, scan

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT_DIR = ROOT / "i18n"

LANGS = OrderedDict([
    ("en", "English"),
    ("ar", "العربية"),
    ("tr", "Türkçe"),
    ("ru", "Русский"),
    ("zh", "中文 (简体)"),
    ("ko", "한국어"),
    ("ja", "日本語"),
    ("de", "Deutsch"),
    ("prs", "دری"),
    ("fr", "Français"),
])


LEDGER = OUT_DIR / "strings.fa.json"


def load_ledger() -> "dict[tuple, str]":
    """Stable ids: a string that already existed keeps the id it had last time,
    so adding one line to the page never invalidates ten translations."""
    if not LEDGER.exists():
        return {}
    try:
        old = json.loads(LEDGER.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    ledger: "dict[tuple, list[str]]" = {}
    for old_id, val in old.get("strings", {}).items():
        sig = (old_id.split(".")[0], val.get("kind", ""), val.get("ctx", ""),
               val.get("fa", ""), val.get("html", ""))
        ledger.setdefault(sig, []).append(old_id)
    for old_id, val in old.get("structured", {}).items():
        sig = ("jsonld", "jsonld", val.get("ctx", ""), val.get("fa", ""), "")
        ledger.setdefault(sig, []).append(old_id)
    return ledger


def max_ids_by_section(ledger: "dict[tuple, list[str]]") -> "dict[str, int]":
    """Highest id already handed out per section — a new string must never mint
    an id that an existing string still holds."""
    highest: dict[str, int] = {}
    for candidates in ledger.values():
        for key in candidates:
            section, _, num = key.rpartition(".")
            if num.isdigit():
                highest[section] = max(highest.get(section, 0), int(num))
    return highest


def next_nid(numbers: "dict[str, int]", section: str, highest: "dict[str, int] | None" = None) -> str:
    if section not in numbers:
        numbers[section] = (highest or {}).get(section, 0)
    numbers[section] += 1
    return f"{section}.{numbers[section]:03d}"


def stable_ids(records, numbers, ledger, highest) -> None:
    """Re-key the freshly scanned records: reuse the previous id when the
    signature matches (duplicates consume their ids in order), otherwise mint
    the next free number in the section."""
    for rec in records:
        sig = (rec.section, rec.kind, f"{rec.tag}.{rec.klass}".strip("."), rec.fa,
               rec.html or "")
        candidates = ledger.get(sig) or []
        rec.key = candidates.pop(0) if candidates else next_nid(numbers, rec.section, highest)


def main() -> None:
    html = SRC.read_text(encoding="utf-8")
    records = scan(html, verify=True)
    structured = collect_jsonld(html)
    OUT_DIR.mkdir(exist_ok=True)

    ledger = load_ledger()
    highest = max_ids_by_section(ledger)
    numbers: dict[str, int] = {}
    stable_ids(records, numbers, ledger, highest)
    strings: dict[str, dict] = {}

    for rec in records:
        entry = {"fa": rec.fa, "kind": rec.kind, "ctx": f"{rec.tag}.{rec.klass}".strip(".")}
        if rec.html:
            entry["html"] = rec.html
        if rec.verbatim:
            entry["keepVerbatim"] = rec.verbatim
        if rec.digit_locked:
            entry["digitLocked"] = True
        strings[rec.key] = entry

    # structured data reuses the same ledger, then the map is written in
    # document order (the generator matches its own scan by position)
    taken = set(strings)
    ordered_structured = OrderedDict()
    for key, val in structured.items():
        sig = ("jsonld", "jsonld", val["ctx"], val["fa"], "")
        candidates = ledger.get(sig) or []
        new_key = candidates.pop(0) if candidates else None
        if not new_key or new_key in taken:
            new_key = next_nid(numbers, "jsonld", highest)
        taken.add(new_key)
        ordered_structured[new_key] = val
    structured = ordered_structured

    all_ids = list(strings) + list(structured)
    if len(all_ids) != len(set(all_ids)):
        dupes = sorted({k for k in all_ids if all_ids.count(k) > 1})
        raise SystemExit(f"duplicate string ids — refusing to write the map: {dupes[:6]}")

    payload = {
        "source": SRC.name,
        "sourceLang": "fa",
        "dir": "rtl",
        "targetLangs": list(LANGS.keys()),
        "count": len(strings),
        "countStructured": len(structured),
        "strings": strings,
        "structured": structured,
    }
    (OUT_DIR / "strings.fa.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (OUT_DIR / "worksheet.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["key", "section", "kind", "context", "flags", "fa (source)"]
                   + [f"{code} — {name}" for code, name in LANGS.items()])
        for key, val in strings.items():
            flags = ("KEEP VERBATIM: " + " ".join(val["keepVerbatim"])) if "keepVerbatim" in val else ""
            if "html" in val:
                flags = (flags + " " if flags else "") + "KEEP TAGS"
            if val.get("digitLocked"):
                flags = (flags + " " if flags else "") + "KEEP DIGITS AS-IS"
            w.writerow([key, key.split(".")[0], val["kind"], val["ctx"], flags,
                        val.get("html", val["fa"])] + [""] * len(LANGS))
        for key, val in structured.items():
            w.writerow([key, "jsonld", "jsonld", val["ctx"], "STRUCTURED DATA (schema.org)",
                        val["fa"]] + [""] * len(LANGS))

    per_section: dict[str, int] = {}
    for key in strings:
        per_section[key.split(".")[0]] = per_section.get(key.split(".")[0], 0) + 1
    words = sum(len(v["fa"].split()) for v in strings.values())
    flagged = sum(1 for v in strings.values() if "keepVerbatim" in v)
    locked = sum(1 for v in strings.values() if v.get("digitLocked"))
    tagged = sum(1 for v in strings.values() if "html" in v)

    print(f"extracted {len(strings)} translatable strings from {SRC.name}"
          f" (self-check: every run is a self-contained slice)")
    print(f"  → {(OUT_DIR / 'strings.fa.json').relative_to(ROOT)}")
    print(f"  → {(OUT_DIR / 'worksheet.csv').relative_to(ROOT)}  ({len(LANGS)} target columns)")
    for sec, n in per_section.items():
        print(f"    {sec:16} {n:>4}")
    print(f"\n  keep-verbatim strings : {flagged}")
    print(f"  strings with inline tags: {tagged}")
    print(f"  mixed/dual-calendar digits kept as-is: {locked}")
    print(f"  structured-data strings : {len(structured)}  (schema.org / JSON-LD)")
    print(f"  words to translate (once): {words:,}")
    sw = sum(len(v["fa"].split()) for v in structured.values())
    print(f"  + structured words      : {sw:,}   (total {(words + sw) * len(LANGS):,} for {len(LANGS)} languages)")


if __name__ == "__main__":
    main()
