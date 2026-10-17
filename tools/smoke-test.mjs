#!/usr/bin/env node
/**
 * Runtime smoke test for the generated pages.
 *
 * The shared navigation is a QT SIDEBAR REFERENCE 4.0 rail on desktop and
 * an accessible drawer on mobile. This test verifies routes, language metadata,
 * stylesheet wiring, injected rail content and the two navigation states.
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
const navigationJs = fs.readFileSync(path.join(ROOT, 'assets/js/navigation.js'), 'utf8');

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

function bootNavigation(window, width) {
  const mobile = width < 1024;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.matchMedia = () => ({
    matches: mobile, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
  window.eval(navigationJs);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
}

function testNavigation(rel) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(`[${rel}] ${error.message}`));
  vc.on('error', (...args) => errors.push(`[${rel}] console.error ${args.join(' ')}`));
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] ${message}`); };
  const legacyNavigationStylesheet = ['glass', 'navigation.css'].join('-');
  check(!html.includes(legacyNavigationStylesheet), 'legacy navigation stylesheet still referenced');
  check(fs.existsSync(path.join(ROOT, 'assets/css/nav/nav-tokens.css')), 'nav-tokens.css missing');
  check(fs.existsSync(path.join(ROOT, 'assets/css/nav/nav-base.css')), 'nav-base.css missing');
  check(fs.existsSync(path.join(ROOT, 'assets/css/nav/nav-sidebar.css')), 'nav-sidebar.css missing');
  check(html.includes('nav/nav-tokens.css') && html.includes('nav/nav-base.css')
    && html.includes('nav/nav-sidebar.css'), 'navigation stylesheet set incomplete');
  check(html.includes('assets/js/navigation.js'), 'navigation controller script missing');

  const desktop = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel}`,
    runScripts: 'outside-only',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  bootNavigation(desktop.window, 1440);
  const doc = desktop.window.document;
  check(doc.querySelector('.site-header') !== null, 'site header missing');
  check(doc.querySelector('.site-nav') !== null, 'site nav missing');
  check(doc.querySelector('.menu-toggle') !== null, 'menu toggle missing');
  check(doc.querySelector('.site-nav__search-input') !== null, 'sidebar search not enhanced');
  check(doc.querySelector('.site-nav__messages') !== null, 'sidebar messages not enhanced');
  check(doc.querySelector('.site-nav__profile') !== null, 'sidebar profile not enhanced');
  const header = doc.querySelector('.site-header');
  const nav = doc.querySelector('.site-nav');
  const toggle = doc.querySelector('.menu-toggle');
  check(header?.dataset.sidebarState === 'expanded', 'desktop sidebar did not start expanded');
  check(toggle?.getAttribute('aria-expanded') === 'true', 'desktop toggle aria state is not expanded');
  toggle?.click();
  check(header?.classList.contains('is-collapsed'), 'desktop collapse state missing');
  check(doc.body.classList.contains('qt-sidebar-collapsed'), 'body collapsed class missing');
  check(toggle?.getAttribute('aria-expanded') === 'false', 'collapsed toggle aria state is wrong');
  const services = nav?.querySelector('.site-nav__item--services .site-nav__link');
  services?.click();
  check(nav?.querySelector('.site-nav__item--services.is-open') !== null,
    'collapsed services flyout did not open');
  toggle?.click();
  check(!header?.classList.contains('is-collapsed'), 'desktop sidebar did not expand');

  const boundary = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel}`,
    runScripts: 'outside-only',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  bootNavigation(boundary.window, 1024);
  check(boundary.window.document.querySelector('.site-header')?.dataset.sidebarState === 'expanded',
    '1024px breakpoint did not keep desktop rail');

  const mobile = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel}`,
    runScripts: 'outside-only',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  bootNavigation(mobile.window, 375);
  const mobileDoc = mobile.window.document;
  const mobileNav = mobileDoc.querySelector('.site-nav');
  const mobileToggle = mobileDoc.querySelector('.menu-toggle');
  mobileToggle?.click();
  check(mobileNav?.classList.contains('is-open'), 'mobile drawer did not open');
  check(mobileDoc.body.classList.contains('service-nav-open'), 'mobile body lock missing');
  check(mobileToggle?.getAttribute('aria-expanded') === 'true', 'mobile aria-expanded did not open');
  mobileDoc.dispatchEvent(new mobile.window.KeyboardEvent('keydown', { key: 'Escape' }));
  check(!mobileNav?.classList.contains('is-open'), 'Escape did not close mobile drawer');
  check(!mobileDoc.body.classList.contains('service-nav-open'), 'mobile body lock did not clear');
}

console.log('runtime smoke test:');
for (const [rel, lang, dir] of pages()) testPage(rel, lang, dir);
console.log('navigation regression check:');
for (const rel of sharedPages()) testNavigation(rel);
console.log(errors.length
  ? `\n  ✗ ${errors.length} problem(s):\n    ${errors.slice(0, 12).join('\n    ')}`
  : '\n  ✓ routes, shared sidebar and mobile drawer passed');
process.exit(errors.length ? 1 : 0);
