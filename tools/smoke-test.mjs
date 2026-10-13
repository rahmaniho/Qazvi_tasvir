#!/usr/bin/env node
/**
 * Runtime smoke test for the generated pages.
 *
 * Loads the Persian master and every built language page in jsdom, runs the
 * site script, walks all hash routes and asserts that each route actually
 * switches the visible page, that <html lang/dir> is right, that the language
 * switcher highlights exactly one language and that hreflang is complete.
 *
 *   cd /tmp && npm i jsdom && node <repo>/tools/smoke-test.mjs
 *
 * (jsdom is not vendored: the site itself has no build step.)
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// the repo root: either the script's parent (tools/ in the repo) or $QT_ROOT
const ROOT = process.env.QT_ROOT
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  || process.cwd();
const LANGS = { fa: 'rtl', en: 'ltr', ar: 'rtl', prs: 'rtl', tr: 'ltr', ru: 'ltr',
                de: 'ltr', fr: 'ltr', zh: 'ltr', ko: 'ltr', ja: 'ltr' };

function pages() {
  const out = [['index.html', 'fa', 'rtl']];
  for (const [code, dir] of Object.entries(LANGS)) {
    if (code === 'fa') continue;
    const p = path.join(ROOT, code, 'index.html');
    if (fs.existsSync(p)) out.push([`${code}/index.html`, code, dir]);
  }
  return out;
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`site not found at ${ROOT} — run with QT_ROOT=<repo> or from the repo copy`);
  process.exit(2);
}

const errors = [];
const js = fs.readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');

function testPage(rel, lang, dir) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(`[${rel}] ${e.message}`));
  vc.on('error', (...a) => errors.push(`[${rel}] console.error ${a.join(' ')}`));
  const dom = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel.replace('index.html', '')}`,
    runScripts: 'dangerously', virtualConsole: vc, pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = window.matchMedia || (q => ({
    matches: false, media: q, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  }));
  try { window.eval(js); } catch (e) { errors.push(`[${rel}] main.js threw: ${e.message}`); }

  const doc = window.document;
  const check = (ok, msg) => { if (!ok) errors.push(`[${rel}] ${msg}`); };
  check(doc.documentElement.lang === lang, `lang=${doc.documentElement.lang} expected ${lang}`);
  check(doc.documentElement.dir === dir, `dir=${doc.documentElement.dir} expected ${dir}`);

  const routes = [...new Set([...doc.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href').slice(1)).filter(h => doc.getElementById(h)))];
  let visible = 0;
  for (const r of routes) {
    window.location.hash = r;
    window.dispatchEvent(new window.Event('hashchange'));
    const page = doc.getElementById(r);
    if (window.getComputedStyle(page).display !== 'none') visible++;
  }
  check(visible === routes.length, `${routes.length - visible}/${routes.length} hash routes stayed hidden`);

  // there are two switchers (navbar dropdown + mobile drawer): each must mark
  // exactly one language as current, and it must be this page's language
  const items = doc.querySelectorAll('.lang-switch__item');
  const navbarSwitch = doc.querySelector('details.lang-switch');
  const active = navbarSwitch.querySelectorAll('.lang-switch__item[aria-current="true"]');
  check(active.length === 1, `navbar switcher marks ${active.length} languages as active`);
  check(active[0]?.getAttribute('lang') === lang,
        `navbar switcher marks ${active[0]?.getAttribute('lang')} as active`);

  const alt = [...doc.querySelectorAll('link[rel=alternate]')].map(l => l.hreflang);
  check(alt.includes('x-default'), 'hreflang x-default missing');
  check(alt.length >= 2, 'hreflang set incomplete');

  // the navbar switcher must be a native, JS-free disclosure element
  const det = doc.querySelector('details.lang-switch > summary.lang-switch__btn');
  check(det !== null, 'navbar language switcher (<details><summary>) missing');

  // every language link must be typed in its own language *and* direction
  const RTL_LANGS = ['fa', 'ar', 'prs'];
  for (const a of doc.querySelectorAll('.lang-switch__item')) {
    const l = a.getAttribute('lang');
    check(l !== null, `switcher item without lang: ${a.textContent.trim()}`);
    check(a.getAttribute('hreflang') !== null, `switcher item without hreflang: ${l}`);
    const want = RTL_LANGS.includes(l) ? 'rtl' : 'ltr';
    check(a.getAttribute('dir') === want,
          `switcher item lang=${l} has dir=${a.getAttribute('dir')} (expected ${want})`);
  }

  // the mobile drawer must offer the same languages (the navbar row is cramped there)
  const drawer = doc.querySelector('.mobile-drawer');
  check(drawer !== null, 'mobile drawer missing');
  const drawerActive = drawer ? drawer.querySelectorAll('.lang-switch__item[aria-current="true"]') : [];
  check(drawerActive.length === 1,
        `mobile drawer marks ${drawerActive.length} languages as active`);
  check(drawerActive[0]?.getAttribute('lang') === lang,
        `mobile drawer marks the wrong language as active`);

  const drawerItems = doc.querySelectorAll('.mobile-drawer .lang-switch__item').length;
  console.log(`  ${rel.padEnd(14)} lang=${lang} dir=${dir} routes=${visible}/${routes.length} ` +
              `switcher=${items.length}(drawer ${drawerItems}) hreflang=${alt.join(',')} ` +
              `title="${doc.title.slice(0, 40)}…"`);
}

console.log('runtime smoke test:');
for (const [rel, lang, dir] of pages()) testPage(rel, lang, dir);
console.log(errors.length ? `\n  ✗ ${errors.length} problem(s):\n    ` + errors.slice(0, 12).join('\n    ')
                          : '\n  ✓ all pages behave correctly');
process.exit(errors.length ? 1 : 0);
