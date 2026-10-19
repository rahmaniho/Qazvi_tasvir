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
const menuJs = fs.readFileSync(path.join(ROOT, 'assets/js/menu.js'), 'utf8');
const dockJs = fs.readFileSync(path.join(ROOT, 'assets/js/dock.js'), 'utf8');

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
  // The old fake inbox (three message rows linking to #contact) was removed:
  // it implied a messaging feature that does not exist.
  check(doc.querySelector('.site-nav__messages') === null, 'fabricated inbox block must not be injected');
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

/**
 * منوی نسل‌جدید — جست‌وجوی کل سایت، گروه‌بندی خدمات و اقدام سریع موبایل.
 */
function bootMenu(rel, width) {
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
  const mobile = width < 1024;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.matchMedia = query => ({
    matches: mobile && /max-width/.test(query),
    media: query,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
  window.scrollTo = () => {};
  window.eval(navigationJs);
  window.eval(menuJs);
  window.eval(dockJs);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return { window, doc: window.document };
}

function testCommandMenu(rel, lang) {
  const { window, doc } = bootMenu(rel, 1440);
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] menu: ${message}`); };

  check(typeof window.QTMenu === 'object', 'QTMenu API missing');
  if (typeof window.QTMenu !== 'object') return;

  const input = doc.querySelector('.site-nav__search-input');
  check(input !== null, 'search field missing');
  check(input?.getAttribute('role') === 'combobox', 'search field is not a combobox');
  check(input?.getAttribute('aria-controls') === 'qt-cmd-list', 'combobox is not wired to the list');
  check(input?.getAttribute('aria-expanded') === 'false', 'combobox starts expanded');

  check(doc.querySelectorAll('.qt-menu-group').length === 3,
        `services panel has ${doc.querySelectorAll('.qt-menu-group').length} groups (expected 3)`);
  check(doc.querySelectorAll('.qt-menu-group a').length === 8,
        'service groups do not hold all eight services');
  check(doc.querySelector('.qt-quick') !== null, 'mobile quick actions missing');
  const dialable = doc.querySelector('a[href^="tel:"]') !== null;
  if (dialable) {
    const call = doc.querySelector('.qt-quick__btn[href^="tel:"]');
    check(call !== null, 'quick call action is not backed by a real tel: link');
  } else {
    const reach = doc.querySelector('.qt-quick__btn[href$="#contact"]');
    check(reach !== null, 'a page without a phone number should fall back to the contact link');
  }

  input?.dispatchEvent(new window.FocusEvent('focus'));
  check(window.QTMenu.isOpen(), 'menu did not open on focus');
  check(doc.querySelector('.qt-cmd')?.dataset.open === 'true', 'panel is not visible');
  check(input?.getAttribute('aria-expanded') === 'true', 'combobox aria-expanded did not follow');

  let snapshot = window.QTMenu.snapshot();
  check(snapshot.items.length > 0 && snapshot.items.length <= 8,
        `suggestions = ${snapshot.items.length} (expected 1…8)`);
  const titles = snapshot.items.map(item => item.title).join(' | ');

  const type = value => {
    input.value = value;
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const key = keyName => input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true })
  );

  type(lang === 'en' ? 'customs' : 'گمرک');
  snapshot = window.QTMenu.snapshot();
  check(snapshot.items.some(item => item.href.includes('customs-port')),
        `search did not find the customs page: ${snapshot.items.map(i => i.title).join(' | ')}`);

  type(lang === 'en' ? 'catering' : 'غذا');
  check(window.QTMenu.snapshot().items.some(item => item.href.includes('personnel-food')),
        'search did not find the staff-catering service');

  type(lang === 'en' ? 'resume' : 'رزومه');
  check(window.QTMenu.snapshot().items.some(item => item.href.endsWith('#resume'))
        || rel !== 'index.html',
        'a homepage section without a rail link is not searchable');

  type('zzzqqq');
  check(window.QTMenu.snapshot().items.length === 0, 'nonsense query returned results');
  check(doc.querySelector('.qt-cmd__empty')?.hidden === false, 'empty state did not appear');
  const status = doc.querySelector('.qt-cmd__status');
  check(status?.getAttribute('role') === 'status', 'result count has no live region');
  check((status?.textContent || '').trim().length > 0,
        'live region stayed silent on an empty result set');

  type('');
  key('ArrowDown');
  check(input.getAttribute('aria-activedescendant') !== null,
        'ArrowDown did not move the active option');
  check(doc.querySelectorAll('[role="option"][aria-selected="true"]').length === 1,
        'exactly one option must be selected');

  let chosen = null;
  const stop = event => { chosen = event.detail; event.preventDefault(); };
  doc.addEventListener('qt:menu:select', stop);
  key('Enter');
  doc.removeEventListener('qt:menu:select', stop);
  check(chosen !== null, 'Enter did not dispatch qt:menu:select');
  check(!window.QTMenu.isOpen(), 'menu stayed open after choosing a destination');

  input.dispatchEvent(new window.FocusEvent('focus'));
  check(window.QTMenu.isOpen(), 'menu did not reopen after closing');
  key('Escape');
  check(!window.QTMenu.isOpen(), 'Escape did not close the menu');
  check(input.getAttribute('aria-expanded') === 'false', 'combobox stayed expanded after Escape');

  if (lang === 'en') {
    check(/result/.test(doc.querySelector('.qt-cmd__count')?.textContent || ''),
          'English result count copy missing');
  } else {
    check(!/[0-9]/.test(doc.querySelector('.qt-cmd__count')?.textContent || ''),
          'Persian result count leaked Latin digits');
  }

  if (rel === 'index.html') {
    check(titles.length > 0, 'suggestions were empty');
  }
}

/**
 * داک اقدام سریع موبایل — فقط صفحهٔ اصلی، متصل به لینک‌های واقعی همان صفحه.
 */
function testDock(rel, lang) {
  const { window, doc } = bootMenu(rel, 390);
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] dock: ${message}`); };
  const dock = doc.querySelector('.qt-dock');
  const isHome = rel === 'index.html' || rel === 'en/index.html';

  if (!isHome) {
    check(dock === null, 'dock was rendered outside the homepage');
    return;
  }

  check(window.QTDock?.version === '7.0', 'QTDock API missing');
  check(dock !== null, 'mobile dock missing');
  if (!dock) return;

  check(dock.getAttribute('aria-label') === (lang === 'en' ? 'Quick actions' : 'دسترسی سریع'),
        'dock landmark has no localized label');

  const pagePhone = doc.querySelector('.hero a[href^="tel:"]');
  const call = dock.querySelector('a[href^="tel:"]');
  check(pagePhone !== null, 'homepage lost its real phone link');
  check(call !== null, 'call action missing');
  if (call && pagePhone) {
    check(call.getAttribute('href') === pagePhone.getAttribute('href'),
          'call action does not reuse the real phone number');
  }

  const wa = dock.querySelector('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
  check(wa !== null, 'WhatsApp action missing');
  check(wa?.getAttribute('rel')?.includes('noopener'), 'WhatsApp link is not rel=noopener');

  const menu = dock.querySelector('button');
  check(menu !== null, 'menu action missing');
  check(menu?.getAttribute('aria-label') === (lang === 'en' ? 'Open the site menu' : 'باز کردن منوی سایت'),
        'menu button has no localized aria-label');

  const labels = Array.from(dock.querySelectorAll('.qt-dock__item')).map(el => el.textContent.trim());
  const expected = lang === 'en' ? ['Call', 'WhatsApp', 'Menu'] : ['تماس', 'واتساپ', 'منو'];
  check(JSON.stringify(labels.slice(0, 3)) === JSON.stringify(expected),
        `dock labels = ${labels.join(' | ')}`);

  let action = null;
  const capture = event => { action = event.detail; };
  doc.addEventListener('qt:dock:action', capture);
  menu?.click();
  doc.removeEventListener('qt:dock:action', capture);
  check(action?.action === 'menu', 'dock did not announce the menu action');
  check(doc.querySelector('.site-nav')?.classList.contains('is-open'),
        'dock menu button did not open the drawer');
  check(doc.body.classList.contains('service-nav-open'),
        'body did not flag the open drawer (dock would stay visible)');
}

/**
 * نوار درخواست چسبان صفحات خدمات — لینک هر صفحه به فرم همان خدمت.
 */
function testServiceBar(rel, expectedService) {
  const { doc } = bootMenu(rel, 1440);
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] service bar: ${message}`); };
  const bar = doc.querySelector('.qt-service-bar');

  if (!expectedService) {
    check(bar === null, 'service bar was rendered outside a service detail page');
    return;
  }

  check(bar !== null, 'sticky inquiry bar missing');
  if (!bar) return;

  check(bar.getAttribute('aria-label') === 'اقدام سریع', 'bar landmark has no label');
  const cta = bar.querySelector('.qt-service-bar__cta');
  check(cta !== null, 'primary inquiry action missing');
  const href = cta?.getAttribute('href') || '';
  check(href.includes(`?service=${expectedService}#contact`),
        `inquiry link does not preselect ${expectedService}: ${href}`);
  check((cta?.textContent || '').includes('درخواست بررسی نیاز'), 'inquiry copy changed');

  const back = bar.querySelector('.qt-service-bar__link');
  check(back?.getAttribute('href') === 'index.html', 'back-to-services link is wrong');
}

function testCommandMenuMobile(rel) {
  const { window, doc } = bootMenu(rel, 375);
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] menu: ${message}`); };
  const nav = doc.querySelector('.site-nav');
  check(!nav.classList.contains('is-open'), 'drawer should start closed');
  window.QTMenu.open();
  check(nav.classList.contains('is-open'), 'opening the menu on mobile did not open the drawer');
  check(window.QTMenu.isOpen(), 'menu did not open on mobile');
  check(doc.querySelector('.qt-quick') !== null, 'quick actions missing on mobile');
  check(doc.querySelectorAll('.qt-quick__btn').length >= 1, 'quick row is empty');
}

function testContactForm(rel, lang) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const vc = new VirtualConsole();
  const local = [];
  vc.on('jsdomError', error => local.push(error.message));
  const dom = new JSDOM(html, {
    url: `https://qazvintasvir.ir/${rel}?service=food`,
    runScripts: 'outside-only',
    virtualConsole: vc,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = window.matchMedia || (query => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
  }));
  window.HTMLAnchorElement.prototype.click = function () { /* navigation stub */ };
  try { window.eval(mainJs); } catch (error) {
    errors.push(`[${rel}] main.js threw: ${error.message}`);
  }
  // main.js initialises on DOMContentLoaded; jsdom may already be past it.
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  const doc = window.document;
  const check = (ok, message) => { if (!ok) errors.push(`[${rel}] form: ${message}`); };
  const form = doc.getElementById('contact-form');
  check(form !== null, 'contact form missing');
  if (!form) return;

  const controls = [...form.querySelectorAll('input, select, textarea')];
  check(controls.every(el => el.getAttribute('name')),
        'every form control needs a name attribute');
  check(doc.getElementById('contact-service')?.value === 'food',
        'service type was not preselected from ?service=food');

  const submit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true, bubbles: true }));
  submit();
  check(doc.getElementById('contact-name')?.getAttribute('aria-invalid') === 'true',
        'empty name did not mark the field invalid');
  check((doc.getElementById('contact-name-error')?.textContent || '').length > 0,
        'empty name did not render a readable error message');
  check(doc.getElementById('contact-name')?.classList.contains('is-invalid'),
        'invalid field has no visual state');

  const name = doc.getElementById('contact-name');
  const phone = doc.getElementById('contact-phone');
  name.value = 'کاربر آزمایشی';
  name.dispatchEvent(new window.Event('input', { bubbles: true }));
  phone.value = '۰۹۱۲۱۲۳۴۵۶۷';
  phone.dispatchEvent(new window.Event('input', { bubbles: true }));
  submit();
  check(!name.classList.contains('is-invalid'), 'valid name kept the invalid state');
  check(phone.getAttribute('aria-invalid') === 'false',
        'valid Persian-digit phone was rejected');

  check(local.filter(message => !/navigation|not implemented/i.test(message)).length === 0,
        `runtime errors: ${local.slice(0, 2).join(' | ')}`);
}

console.log('runtime smoke test:');
for (const [rel, lang, dir] of pages()) testPage(rel, lang, dir);
console.log('contact form validation:');
for (const [rel] of [[ 'index.html', 'fa' ], [ 'en/index.html', 'en' ]]) testContactForm(rel, 'fa');
console.log('navigation regression check:');
for (const rel of sharedPages()) testNavigation(rel);
console.log('command menu:');
for (const [rel, lang] of [['index.html', 'fa'], ['en/index.html', 'en'],
  ['404.html', 'fa'], ['services/sourcing.html', 'fa']]) {
  testCommandMenu(rel, lang);
}
testCommandMenuMobile('index.html');
console.log('mobile dock:');
for (const [rel, lang] of [['index.html', 'fa'], ['en/index.html', 'en'],
  ['404.html', 'fa'], ['services/sourcing.html', 'fa']]) {
  testDock(rel, lang);
}
console.log('service inquiry bar:');
for (const [rel, service] of [['services/import-export.html', 'trade'],
  ['services/sourcing.html', 'sourcing'], ['services/personnel-food.html', 'food'],
  ['services/index.html', null], ['index.html', null], ['404.html', null]]) {
  testServiceBar(rel, service);
}
console.log(errors.length
  ? `\n  ✗ ${errors.length} problem(s):\n    ${errors.slice(0, 12).join('\n    ')}`
  : '\n  ✓ routes, shared sidebar and mobile drawer passed');
process.exit(errors.length ? 1 : 0);
