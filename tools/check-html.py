#!/usr/bin/env python3
"""Lightweight structural check for the generated pages (no dependencies)."""
import sys
from html.parser import HTMLParser
from pathlib import Path

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Check(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.errors=[]
    def handle_starttag(self, tag, attrs):
        if tag not in VOID: self.stack.append((tag, self.getpos()))
    def handle_endtag(self, tag):
        if tag in VOID: return
        if not self.stack:
            self.errors.append(f'unexpected </{tag}> at {self.getpos()}'); return
        if self.stack[-1][0] != tag:
            self.errors.append(f'</{tag}> at {self.getpos()} closes <{self.stack[-1][0]}> from {self.stack[-1][1]}')
            for i in range(len(self.stack)-1, -1, -1):
                if self.stack[i][0]==tag: del self.stack[i:]; return
        else: self.stack.pop()

def main(paths):
    bad = 0
    for p in paths:
        c = Check(); c.feed(Path(p).read_text(encoding='utf-8'))
        ok = not c.errors and not c.stack
        print(f'  {"OK  " if ok else "FAIL"} {p}: {len(c.errors)} error(s), {len(c.stack)} unclosed')
        for e in c.errors[:4]: print('        ', e)
        bad += 0 if ok else 1
    return bad

if __name__ == '__main__':
    sys.exit(1 if main(sys.argv[1:] or ['index.html']) else 0)
