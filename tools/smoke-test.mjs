#!/usr/bin/env node
/**
 * Runtime smoke test for the generated pages.
 *
 * The site intentionally has no header/sidebar menu. This test therefore
 * verifies the normal hash routes, language metadata and the absence of the
 * removed navigation shell on every shared route.
 *
 *   cd /tmp && npm i jsdom && node <repo>/tools/smoke-test.mjs
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = process.env.QT_ROOT
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  || process.cwd();
const LANGS = { fa: 'rtl', en: 'ltr', ar: 'rtl', prs: 'rtl', tr: 'ltr', ru: 'ltr',
                de: 'ltr', fr: 'ltr', zh: 'ltr', ko: 'ltr', ja: 'ltr' };

function pages() {
  const out = [['index.html', 'fa', 'rtl']];
  for (const [code, dir] of Object.entries(LANGS)) {
    if (code === 'fa') continue;
    const file = path.join(ROOT, code, 'index.html');
    if (fs.existsSync(file)) out.push([`${code}/index.html`, code, dir]);
  }
  return out;
}

function sharedPages() {
  const services = fs.readdirSync(path.join(ROOT, 'services'))
    .filter(name => name.endsWith('.html'))
    .sort()
    .map(name => `services/${name}`);
  return [...new Set(['index.html', 'en/index.html', '404.html', ...services])]
    .filter(rel => fs.existsSync(path.join(ROOT, rel)));
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`site not found at ${ROOT} — run with QT_ROOT=<repo> or from the repo copy`);
  process.exit(2);
}

const errors = [];
const mainJs = fs.readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');
const servicePagesJs = fs.readFileSync(path.join(ROOT, 'assets/js/service-pages.js'), 'utf8');

function testPage(rel, lang, dir) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(`[${rel}] ${error.message}`));
  vc.on('error', (...args) => errors.push(`[${rel}] console.error ${args.join(' ')}`));
  const dom = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel.replace('index.html', '')}`,
    runScripts: 'dangerously',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = window.matchMedia || (query => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  }));
  try { window.eval(mainJs); } catch (error) {
    errors.push(`[${rel}] main.js threw: ${error.message}`);
  }

  const doc = window.document;
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] ${message}`); };
  check(doc.documentElement.lang === lang, `lang=${doc.documentElement.lang} expected ${lang}`);
  check(doc.documentElement.dir === dir, `dir=${doc.documentElement.dir} expected ${dir}`);

  const routes = [...new Set([...doc.querySelectorAll('a[href^="#"]')]
    .map(anchor => anchor.getAttribute('href').slice(1))
    .filter(hash => doc.getElementById(hash)))];
  let visible = 0;
  for (const route of routes) {
    window.location.hash = route;
    window.dispatchEvent(new window.Event('hashchange'));
    if (window.getComputedStyle(doc.getElementById(route)).display !== 'none') visible++;
  }
  check(visible === routes.length,
        `${routes.length - visible}/${routes.length} hash routes stayed hidden`);

  const switcher = doc.querySelector('details.lang-switch');
  const items = doc.querySelectorAll('.lang-switch__item');
  check(switcher !== null, 'footer language switcher missing');
  const active = switcher ? switcher.querySelectorAll('.lang-switch__item[aria-current="true"]') : [];
  check(active.length === 1, `language switcher marks ${active.length} languages as active`);
  check(active[0]?.getAttribute('lang') === lang,
        `language switcher marks ${active[0]?.getAttribute('lang')} as active`);

  const alternate = [...doc.querySelectorAll('link[rel=alternate]')].map(link => link.hreflang);
  check(alternate.includes('x-default'), 'hreflang x-default missing');
  check(alternate.length >= 2, 'hreflang set incomplete');

  for (const anchor of doc.querySelectorAll('.lang-switch__item')) {
    const code = anchor.getAttribute('lang');
    check(code !== null, `switcher item without lang: ${anchor.textContent.trim()}`);
    check(anchor.getAttribute('hreflang') !== null,
          `switcher item without hreflang: ${code}`);
    const expected = ['fa', 'ar', 'prs'].includes(code) ? 'rtl' : 'ltr';
    check(anchor.getAttribute('dir') === expected,
          `switcher item lang=${code} has dir=${anchor.getAttribute('dir')} (expected ${expected})`);
  }

  console.log(`  ${rel.padEnd(14)} lang=${lang} dir=${dir} routes=${visible}/${routes.length} `
              + `switcher=${items.length} hreflang=${alternate.join(',')} `
              + `title="${doc.title.slice(0, 40)}…"`);
}

function testMenuRemoved(rel) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(`[${rel}] ${error.message}`));
  vc.on('error', (...args) => errors.push(`[${rel}] console.error ${args.join(' ')}`));
  const dom = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel}`,
    runScripts: 'outside-only',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = () => ({
    matches: false, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
  try { window.eval(servicePagesJs); } catch (error) {
    errors.push(`[${rel}] service-pages.js threw: ${error.message}`);
  }
  const doc = window.document;
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] ${message}`); };
  for (const selector of ['.site-header', '.site-nav', '.menu-toggle', '.nav-menu', '.mobile-drawer']) {
    check(doc.querySelector(selector) === null, `${selector} still exists after menu removal`);
  }
  check(!html.includes('assets/js/navigation.js'), 'navigation controller script still referenced');
  check(!html.includes('glass-navigation.css'), 'navigation stylesheet still referenced');
}

console.log('runtime smoke test:');
for (const [rel, lang, dir] of pages()) testPage(rel, lang, dir);
console.log('menu removal check:');
for (const rel of sharedPages()) testMenuRemoved(rel);
console.log(errors.length
  ? `\n  ✗ ${errors.length} problem(s):\n    ${errors.slice(0, 12).join('\n    ')}`
  : '\n  ✓ all pages have no header/sidebar menu');
process.exit(errors.length ? 1 : 0);
