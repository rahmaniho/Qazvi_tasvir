#!/usr/bin/env python3
"""
Qazvin Tasvir — i18n positional renumberer.

tools/build-i18n-site.py writes translations back by FRESH SCAN POSITION: the
i-th record of a section always receives the key `<section>.<i>`. The
extractor's stable-id ledger, however, keeps an old id for an unchanged string
and mints new ids at the END of its section — so inserting records in the
MIDDLE of a section (or anything that changes a record's ctx fingerprint)
leaves the map ids out of sync with the positions the build uses. The symptom
is silent: counts still match, but every translation after the insertion point
shifts onto the wrong element.

This tool restores the invariant  map-id == scan-position:

    1. scan index.html with the very same scanner the build uses;
    2. re-key i18n/strings.fa.json entries in document order → <section>.NNN
       (index-by-index, asserting the Persian text matches the scan);
    3. carry every i18n/<lang>.json across the re-keying by index, keeping the
       per-key source snapshots (sha1 fingerprints) in step;
    4. jsonld.* keys are semantic paths and never renumbered.

Run it after tools/extract-i18n-strings.py whenever records were inserted,
removed or reordered inside an existing section, then build:

    python3 tools/extract-i18n-strings.py
    python3 tools/renumber-i18n.py
    python3 tools/build-i18n-site.py

    python3 tools/renumber-i18n.py --check   # report drift only, write nothing
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from i18n_core import scan  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "index.html"
I18N = ROOT / "i18n"


def fingerprint(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="only report drift; exit 1 if the map is out of sync")
    args = ap.parse_args()

    master = MASTER.read_text(encoding="utf-8")
    records = scan(master, verify=True)
    payload = json.loads((I18N / "strings.fa.json").read_text(encoding="utf-8"))
    strings = payload["strings"]

    if len(records) != len(strings):
        raise SystemExit(
            f"string map is stale: {len(records)} runs in index.html vs "
            f"{len(strings)} keys — run tools/extract-i18n-strings.py first")

    # positional ids from the scan, checked against the map entry by entry
    old_ids = list(strings)
    new_ids: list[str] = []
    for i, (rec, old_id) in enumerate(zip(records, old_ids)):
        entry = strings[old_id]
        if entry.get("html") or rec.fa != entry["fa"]:
            if rec.fa != entry["fa"] and not entry.get("html"):
                raise SystemExit(
                    f"record {i} ({rec.key}) does not match map entry {old_id}:\n"
                    f"    scan: {rec.fa[:60]!r}\n    map : {entry['fa'][:60]!r}")
        new_ids.append(rec.key)

    changes = [(o, n) for o, n in zip(old_ids, new_ids) if o != n]
    if not changes:
        print(f"  ✓ map ids already positional ({len(strings)} keys, no change)")
        return
    if args.check:
        print(f"  ✗ {len(changes)} id(s) out of positional order, e.g.:")
        for o, n in changes[:6]:
            print(f"      {o} → {n}")
        raise SystemExit(1)
    print(f"  · renumbering {len(changes)} of {len(strings)} keys "
          f"(map-id ← scan-position)")

    # 1) the master map, re-keyed in document order
    renumbered = {n: strings[o] for o, n in zip(old_ids, new_ids)}
    payload["strings"] = renumbered
    (I18N / "strings.fa.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 2) every language file follows its Persian source across the re-keying
    for path in sorted(I18N.glob("*.json")):
        if path.name == "strings.fa.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if "strings" not in data:
            continue                      # worksheet/glossary-style file
        trans, snap = data["strings"], data.get("source", {})
        new_trans, new_snap, carried, dropped = {}, {}, 0, []
        for o, n in zip(old_ids, new_ids):
            if o in trans:
                new_trans[n] = trans[o]
                new_snap[n] = fingerprint(renumbered[n].get("html")
                                          or renumbered[n]["fa"])
                carried += 1
            else:
                dropped.append(n)
        for k, v in trans.items():        # jsonld.* and generated keys stay put
            if k not in old_ids:
                new_trans[k] = v
                if k in snap:
                    new_snap[k] = snap[k]
        data["strings"] = new_trans
        data["source"] = new_snap
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
        note = f", {len(dropped)} untranslated → {dropped[:4]}" if dropped else ""
        print(f"  ✓ {path.name}: {carried} translations carried{note}")

    print("  → run tools/build-i18n-site.py next")


if __name__ == "__main__":
    main()
