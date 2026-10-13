#!/usr/bin/env python3
"""
Qazvin Tasvir — i18n core.

One scanner, shared by the extractor and the site generator, so a key can never
mean two different things: the extractor writes `key → Persian text` and the
generator writes `key → translated text` back into the very same span it came
from.

The scanner records, for every translatable string:
    key       stable id, `<section>.<running index within section>`
    fa        plain text (inline markup stripped) — what a translator reads
    html      exact source slice, tags included (for runs with inline markup)
    verbatim  protected substrings (registration data / phone) that must survive
    start/end byte offsets of the whole run in the source document

Runs are contiguous slices of the source: text, `<strong>`…`</strong>`, more
text. Replacing [start, end) with the translated HTML is therefore exact and
cannot disturb the surrounding markup.

Usage:
    from i18n_core import scan
    records = scan(html)
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
import json
from html.parser import HTMLParser

# ── what gets translated ────────────────────────────────────────────────────
ATTRS = ("alt", "aria-label", "title", "placeholder")
META_NAMES = ("description", "keywords", "author")
META_PREFIXES = ("og:", "twitter:")
# meta values that are machine tokens, not reader-facing text
META_SKIP = {"og:locale", "og:type", "og:image", "og:image:type", "og:url",
             "og:image:width", "og:image:height", "og:video", "og:audio",
             "twitter:card", "twitter:image", "twitter:url", "twitter:site",
             "twitter:creator"}
INLINE_TAGS = {"span", "strong", "b", "em", "i", "small", "code", "sup", "sub", "a", "br"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
             "meta", "param", "source", "track", "wbr"}

# ── never translated ────────────────────────────────────────────────────────
KEEP_VERBATIM = [
    "۱۰۸۶۱۴۱۵۲۱۵", "۲۷۴۹", "۴۱۱۳۸۶۸۳۷۶۶۵", "۱۳۷۴/۰۲/۱۴",
    "۰۹۱۲۲۸۱۵۱۸۹", "۰۹۱۲ ۲۸۱ ۵۱۸۹",
]
SKIP_TEXT = re.compile(
    r"^[\s\u200c\d۰-۹.,;:!\?\-–—|•/\\()\[\]{}+%×]+$"          # numbers / punctuation
    r"|^www\.|^https?://|@|\.(ir|com|co|net)\b"                # urls / e-mails
    r"|^(\+?\d[\d\s\-]+)$"                                     # phone numbers
)

# tag sequence + structure of a run, used to validate translations
TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)")


@dataclass
class Record:
    key: str
    section: str
    kind: str                      # text | attr:alt | meta:og:title …
    tag: str
    klass: str
    fa: str
    start: int
    end: int
    html: str = ""                 # filled when the run carries inline markup
    verbatim: list[str] = field(default_factory=list)
    attr: str = ""                 # for attribute records
    digit_locked: bool = False     # digits stay exactly as typed

    @property
    def tag_sequence(self) -> list[tuple[str, str]]:
        return TAG_RE.findall(self.html or self.fa)


class _Scanner(HTMLParser):
    def __init__(self, html: str) -> None:
        super().__init__(convert_charrefs=False)
        self.html = html
        self.last_end = 0            # end offset of the last consumed piece
        self.records: list[Record] = []
        self.stack: list[tuple[str, dict]] = []
        self.section = "chrome"
        self.skip_depth = 0
        self.buf: list[tuple[str, str]] = []      # (kind, payload)
        self.buf_start = -1
        self.ctx: dict | None = None
        self.nested = 0
        # line-start offsets for fast (line, col) → index conversion
        self._line_starts = [0]
        for m in re.finditer(r"\n", html):
            self._line_starts.append(m.end())

    # ---------- position helpers ----------
    def pos(self) -> int:
        line, col = self.getpos()
        return self._line_starts[line - 1] + col

    def tag_span(self, start: int) -> tuple[int, int]:
        """Raw extent of the tag that begins at `start` (quote-aware)."""
        i, n = start, len(self.html)
        quote = ""
        while i < n:
            c = self.html[i]
            if quote:
                if c == quote:
                    quote = ""
            elif c in "\"'":
                quote = c
            elif c == ">":
                return start, i + 1
            i += 1
        return start, n

    def attr_span(self, tag_start: int, tag_end: int, name: str) -> tuple[int, int] | None:
        raw = self.html[tag_start:tag_end]
        m = re.search(rf'\b{re.escape(name)}\s*=\s*("([^"]*)"|\'([^\']*)\')', raw)
        if not m:
            return None
        body = m.group(2) if m.group(2) is not None else m.group(3)
        return tag_start + m.start(2 if m.group(2) is not None else 3), \
               tag_start + m.start(2 if m.group(2) is not None else 3) + len(body)

    # ---------- record helpers ----------
    def _ensure_ctx(self, tag: str | None = None, attrs: dict | None = None) -> None:
        if self.ctx is not None:
            return
        if tag is None:
            tag, attrs = self.stack[-1] if self.stack else ("body", {})
        attrs = attrs or {}
        hint = ""
        for t, a in reversed(self.stack):
            if a.get("class"):
                hint = f"{t}." + ".".join(a["class"].split()[:2])
                break
        if not hint and attrs.get("class"):
            hint = f"{tag}." + ".".join(attrs["class"].split()[:2])
        self.ctx = {"tag": tag, "klass": hint}

    def _emit(self, fa: str, kind: str, start: int, end: int, html: str = "") -> None:
        fa = " ".join(fa.split())
        if not fa or SKIP_TEXT.search(fa):
            return
        protected = sorted({k for k in KEEP_VERBATIM if k in fa})
        if protected and len(fa) < 60 and len(fa.split()) <= 2:
            return                                  # a bare protected value
        # a string that mixes Persian and ASCII digits on purpose (e.g. the
        # dual-calendar copyright ۱۴۰۴ / 2026) keeps its digits exactly as typed
        digit_locked = bool(re.search(r"[۰-۹٠-٩]", fa)) and bool(re.search(r"[0-9]", fa))
        tag = self.ctx["tag"] if self.ctx else "?"
        rec = Record(
            key="", section=self.section, kind=kind, tag=tag,
            klass=self.ctx["klass"] if self.ctx else "",
            fa=fa, start=start, end=end, verbatim=protected,
        )
        if html and any(k != "text" for k, _ in self.buf):
            rec.html = " ".join(html.split())
        if kind.startswith("attr:") or kind.startswith("meta:"):
            rec.attr = kind.split(":", 1)[1]
        rec.digit_locked = digit_locked
        self.records.append(rec)

    def _flush(self) -> None:
        if not self.buf:
            return
        html = "".join(p for _, p in self.buf)
        text = "".join(p for k, p in self.buf if k == "text")
        self._emit(text, "text", self.buf_start, self.last_end, html)
        self.buf, self.ctx, self.nested, self.buf_start = [], None, 0, -1

    # ---------- parser hooks ----------
    def handle_starttag(self, tag, attrs):
        start = self.pos()
        a = dict(attrs)
        if tag == "section" and a.get("id"):
            self.section = a["id"]
        if tag in ("script", "style"):
            self.skip_depth += 1
        if self.skip_depth:
            self.stack.append((tag, a))
            return
        if tag not in INLINE_TAGS or tag in ("br", "img"):
            self._flush()                            # block boundary ends the run
        if self.buf:
            parts = "".join(f' {k}="{v}"' for k, v in attrs if v is not None)
            self.buf.append(("markup", f"<{tag}{parts}>"))
            self.nested += 1
            self.last_end = self.tag_span(start)[1]
        elif self.ctx is None:
            self.ctx = None
            self._ensure_ctx(tag, a)
        self.stack.append((tag, a))
        tag_end = self.tag_span(start)[1]
        # attributes worth translating
        for name in ATTRS:
            if a.get(name):
                span = self.attr_span(start, tag_end, name)
                if span:
                    saved, self.ctx = self.ctx, self.ctx or {"tag": tag, "klass":
                        (f'{tag}.' + ".".join(a["class"].split()[:2])) if a.get("class") else tag}
                    self._emit(a[name], f"attr:{name}", span[0], span[1])
                    self.ctx = saved
        if tag == "meta" and a.get("content"):
            mname = a.get("name") or a.get("property") or ""
            if (mname in META_NAMES or mname.startswith(META_PREFIXES)) \
                    and mname not in META_SKIP:
                span = self.attr_span(start, tag_end, "content")
                if span:
                    saved, self.ctx = self.ctx, {"tag": "meta", "klass": mname}
                    self._emit(a["content"], f"meta:{mname}", span[0], span[1])
                    self.ctx = saved
        if tag in VOID_TAGS:
            names = [t for t, _ in self.stack]
            if names and names[-1] == tag:
                self.stack.pop()

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip_depth:
            self.skip_depth -= 1
        if self.buf and tag not in INLINE_TAGS:
            self._flush()                      # a block boundary ends the run
        if self.buf and tag in INLINE_TAGS and tag != "br":
            if self.nested > 0:
                self.buf.append(("markup", f"</{tag}>"))
                self.nested -= 1
                self.last_end = self.tag_span(self.pos())[1]
            else:
                self._flush()
        names = [t for t, _ in self.stack]
        if names and names[-1] == tag:
            self.stack.pop()
        elif tag in names:
            self.stack = self.stack[: names.index(tag)]

    def handle_data(self, data):
        if self.skip_depth or not data.strip():
            return
        if not self.buf:
            self.buf_start = self.pos()
            self._ensure_ctx()
        self.buf.append(("text", data))
        self.last_end = self.pos() + len(data)

    def handle_entityref(self, name):
        if self.skip_depth:
            return
        if not self.buf:
            self.buf_start = self.pos()
            self._ensure_ctx()
        self.buf.append(("text", f"&{name};"))
        self.last_end = self.pos() + len(name) + 2

    def handle_charref(self, name):
        if self.skip_depth:
            return
        if not self.buf:
            self.buf_start = self.pos()
            self._ensure_ctx()
        self.buf.append(("text", f"&#{name};"))
        self.last_end = self.pos() + len(name) + 3

    def finish(self) -> list[Record]:
        self._flush()
        self.close()
        counters: dict[str, int] = {}
        for rec in self.records:
            counters[rec.section] = counters.get(rec.section, 0) + 1
            rec.key = f"{rec.section}.{counters[rec.section]:03d}"
        return self.records


QT_REGION = re.compile(
    r"<!--\s*QT:[A-Z-]+:BEGIN\s*-->.*?<!--\s*QT:[A-Z-]+:END\s*-->", re.S)


def mask_generated_regions(html: str) -> str:
    """Blank out regions that the generator writes itself (language switcher,
    hreflang links, route meta). Replaced by spaces of the same length so every
    offset in the document stays valid for write-back."""
    def blank(m: re.Match) -> str:
        return re.sub(r"\S", " ", m.group(0))
    return QT_REGION.sub(blank, html)


def scan(html: str, verify: bool = False) -> list[Record]:
    masked = mask_generated_regions(html)
    s = _Scanner(masked)
    s.feed(masked)
    records = s.finish()
    if verify:
        self_check(masked, records)
    return records


def self_check(html: str, records: "list[Record]") -> None:
    """A run must be a self-contained slice: text plus the inline tags recorded
    for it, nothing else. Violations mean write-back would misplace text."""
    for rec in records:
        slice_ = html[rec.start:rec.end]
        if tag_signature(slice_) != rec.tag_sequence:
            raise AssertionError(
                f"{rec.key}: slice carries tags the record does not own\n"
                f"    slice: {slice_[:90]!r}\n    run  : {(rec.html or rec.fa)[:90]!r}")
        if rec.end > rec.start and rec.fa and rec.fa.split()[0] not in slice_ \
                and rec.kind == "text":
            raise AssertionError(f"{rec.key}: slice does not start at the text")


# ── structured data (schema.org / JSON-LD) ──────────────────────────────────
JSONLD_RE = re.compile(r'(<script type="application/ld\+json"[^>]*>)(.*?)(</script>)', re.S)

# leaves that stay as-is: identifiers, urls, machine values
JSONLD_KEEP = {
    "@context", "@type", "@id", "@language", "url", "logo", "image", "sameAs",
    "telephone", "faxNumber", "email", "taxID", "identifier", "foundingDate",
    "postalCode", "addressCountry", "dayOfWeek", "opens", "closes",
    "latitude", "longitude", "priceCurrency", "price", "priceRange",
    "availableChannel", "serviceUrl", "target",
    "bestRating", "worstRating", "ratingValue", "reviewCount", "duration",
}


def _jsonld_walk(node, path=(), out=None):
    out = [] if out is None else out
    if isinstance(node, dict):
        for key, val in node.items():
            if key in JSONLD_KEEP:
                continue
            _jsonld_walk(val, path + (key,), out)
    elif isinstance(node, list):
        for i, val in enumerate(node):
            _jsonld_walk(val, path + (str(i),), out)
    elif isinstance(node, str) and node.strip() and "://" not in node \
            and not node.startswith("www."):
        out.append(path)
    return out


def collect_jsonld(html: str) -> "dict[str, dict]":
    """Translatable leaves of every JSON-LD block, keyed jsonld.<block>.<path>."""
    found: "dict[str, dict]" = {}
    for block_i, m in enumerate(JSONLD_RE.finditer(html)):
        try:
            data = json.loads(m.group(2))
        except json.JSONDecodeError:
            continue
        for path in _jsonld_walk(data):
            value = data
            for step in path:
                value = value[int(step)] if isinstance(value, list) else value[step]
            key = f"jsonld.{block_i}." + ".".join(path)
            found[key] = {"fa": value, "path": list(path), "block": block_i,
                          "ctx": path[-1]}
    return found


def apply_jsonld(html: str, structured: "dict[str, dict]", translations: "dict[str, str]",
                 convert_digits=None) -> str:
    """Write translated structured data back, block by block.

    `structured` is the jsonld section of i18n/strings.fa.json: each entry knows
    which block it belongs to and its path inside that block.
    """
    blocks = list(JSONLD_RE.finditer(html))
    if not blocks:
        return html
    pieces = []
    for block_i, m in enumerate(blocks):
        try:
            data = json.loads(m.group(2))
        except json.JSONDecodeError:
            continue
        touched = False
        for key, meta in structured.items():
            if meta.get("block") != block_i:
                continue
            value = translations.get(key)
            if not value or not str(value).strip():
                continue
            steps = list(meta["path"])
            node = data
            try:
                for step in steps[:-1]:
                    node = node[int(step)] if isinstance(node, list) else node[step]
                leaf = steps[-1]
                new_value = str(value)
                if convert_digits:
                    new_value = convert_digits(new_value)
                if isinstance(node, list):
                    node[int(leaf)] = new_value
                else:
                    node[leaf] = new_value
                touched = True
            except (KeyError, IndexError, TypeError, ValueError):
                continue
        if touched:
            dumped = json.dumps(data, ensure_ascii=False, indent=4)
            pieces.append((m.start(), m.end(), f'{m.group(1)}\n  {dumped}\n  {m.group(3)}'))
    if not pieces:
        return html
    out, last = [], 0
    for start, end, replacement in sorted(pieces):
        out.append(html[last:start])
        out.append(replacement)
        last = end
    out.append(html[last:])
    return "".join(out)


def tag_signature(html: str) -> list[tuple[str, str]]:
    """Ordered (closing?, name) list — translations must not change it."""
    return TAG_RE.findall(html)


def digits_to_persian(text: str) -> str:
    """ASCII digits → Persian digits (۰-۹)."""
    return "".join(chr(ord(c) - ord("0") + 0x06F0) if "0" <= c <= "9" else c
                   for c in text)


def normalize_digits(text: str) -> str:
    """Any digit form (ASCII / Persian / Arabic-Indic) → ASCII, for comparisons."""
    return digits_to_latin(text).translate(str.maketrans("٠١٢٣٤٥٦٧٨٩",
                                                         "0123456789"))


def digits_to_latin(text: str) -> str:
    """Persian and Arabic-Indic digits → ASCII digits."""
    out = []
    for ch in text:
        code = ord(ch)
        if 0x06F0 <= code <= 0x06F9:              # ۰-۹
            out.append(chr(code - 0x06F0 + ord("0")))
        elif 0x0660 <= code <= 0x0669:            # ٠-٩
            out.append(chr(code - 0x0660 + ord("0")))
        else:
            out.append(ch)
    return "".join(out)
