/**
 * قزوین تصویر — «QT Recovery 11» | جست‌وجوی مسیر در صفحهٔ ۴۰۴
 * ---------------------------------------------------------------------------
 * فقط روی صفحهٔ ۴۰۴ و کاملاً افزایشی. هیچ مقصد، عنوان یا شماره‌ای در این فایل
 * نیست: فهرست مسیرها از همان لینک‌های `.site-nav` موجود در صفحه ساخته می‌شود
 * (ناوبری اصلی + نُه پیوند کشویی خدمات) و عنوان هر مسیر هم متن همان لینک است.
 *
 * سه رفتار:
 *   ۱. جست‌وجوی فیلترشونده با نرمال‌سازی فارسی/عربی و رتبه‌بندی ساده.
 *   ۲. «شاید این را می‌خواستید» بر پایهٔ خودِ نشانی واردشده (اسلاگ آخر مسیر)؛
 *      فقط اگر آن اسلاگ به یکی از لینک‌های واقعی صفحه اشاره کند.
 *   ۳. پیمایش با ↑/↓ میان نتیجه‌ها و پاک‌کردن با Escape.
 *
 * رویدادهای `qt:recovery:filter` و `qt:recovery:select` برای لایهٔ آمار.
 */
(function () {
  'use strict';

  if (window.QTRecovery && window.QTRecovery.version) return;

  const VERSION = '11.0';
  const doc = document;
  const IS_EN = ((doc.documentElement.lang || 'fa').split('-')[0] || 'fa').toLowerCase() === 'en';

  const COPY = IS_EN ? {
    label: 'Find the right page',
    placeholder: 'Service or section name…',
    hintPrefix: 'Did you mean:',
    groupService: 'Service',
    groupPage: 'Page',
    results: n => `${n} result${n === 1 ? '' : 's'}`,
    empty: 'No matching page. Try a shorter word, or open the full services list.',
    clear: 'Clear the search'
  } : {
    label: 'مسیر درست را پیدا کنید',
    placeholder: 'نام خدمت یا بخش…',
    hintPrefix: 'شاید این را می‌خواستید:',
    groupService: 'خدمت',
    groupPage: 'صفحه',
    results: n => `${formatNumber(n)} مسیر`,
    empty: 'مسیری با این نام پیدا نشد؛ واژهٔ کوتاه‌تری امتحان کنید یا فهرست خدمات را باز کنید.',
    clear: 'پاک کردن جست‌وجو'
  };

  const MAX_RESULTS = 6;
  let entries = [];
  let items = [];
  let input = null;
  let list = null;
  let status = null;
  let empty = null;

  let numberFormatter = null;

  function formatNumber(value) {
    try {
      if (!numberFormatter) numberFormatter = new Intl.NumberFormat(IS_EN ? 'en-GB' : 'fa-IR');
      return numberFormatter.format(value);
    } catch (error) {
      return String(value);
    }
  }

  /** نرمال‌سازی همان قاعدهٔ منو: ي/ك/آ/ة، اعراب، کشیده و ارقام فارسی. */
  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\u064A\u06CC\u0649]/g, '\u06CC')
      .replace(/[\u0643]/g, '\u06A9')
      .replace(/[\u0622\u0623\u0625]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, ' ')
      .replace(/[۰-۹٠-٩]/g, ch => {
        const code = ch.charCodeAt(0);
        const base = code >= 0x06F0 ? 0x06F0 : 0x0660;
        return String.fromCharCode(code - base + 48);
      })
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** رتبه‌بندی ساده: کامل > پیشوند > شروع واژه > زیررشته. */
  function score(query, text) {
    if (!query) return 1;
    if (!text) return 0;
    if (text === query) return 100;
    if (text.startsWith(query)) return 80;
    if (text.includes(' ' + query)) return 65;
    if (text.includes(query)) return 45;
    return 0;
  }

  function slugOf(pathname, withHtml) {
    const clean = String(pathname || '').replace(/\/+$/, '');
    const last = clean.split('/').pop() || '';
    return withHtml ? last : last.replace(/\.html?$/i, '');
  }

  /** فهرست مسیرها از همان لینک‌های ناوبری موجود؛ بدون فهرست دستی. */
  function buildIndex() {
    const nav = doc.querySelector('.site-nav');
    if (!nav) return [];

    const seen = new Set();
    const out = [];
    nav.querySelectorAll('a[href]').forEach(link => {
      // لینک‌هایی که خودِ لایه‌های دیگر از دادهٔ موجود می‌سازند (اقدام سریع و
      // کارت پروفایل) مقصد تازه‌ای نیستند؛ اگر خوانده شوند، هم تکراری می‌شوند
      // و هم ترتیب فهرست را به‌هم می‌زنند.
      if (link.closest('.qt-quick, .site-nav__profile')) return;

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      let url;
      try {
        url = new URL(href, doc.baseURI);
      } catch (error) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (seen.has(url.href)) return;

      const title = (link.textContent || '').replace(/\s+/g, ' ').trim()
        || link.getAttribute('aria-label')
        || '';
      if (!title) return;

      seen.add(url.href);
      // گروه از ساختار DOM خوانده می‌شود؛ پیوند پوشه‌ای (مثل فهرست خدمات)
      // حتی اگر داخل کشویی باشد، «صفحه» است نه یک خدمت.
      const isDirectory = /\/$/.test(url.pathname);
      out.push({
        title,
        href,
        group: link.closest('.site-nav__dropdown') && !isDirectory ? 'service' : 'page',
        slug: slugOf(url.pathname, false) || 'home',
        haystack: normalize(title)
      });
    });

    // صفحه‌ها اول، خدمات بعد — همان ترتیبی که ناوبری نشان می‌دهد.
    const order = { page: 0, service: 1 };
    return out.sort((a, b) => order[a.group] - order[b.group]);
  }

  function linkFor(entry) {
    const item = doc.createElement('li');
    item.className = 'qt-recovery__item';

    const link = doc.createElement('a');
    link.className = 'qt-recovery__link';
    link.href = entry.href;
    link.dataset.qtGroup = entry.group;
    link.dataset.qtHref = entry.href;
    link.dataset.qtTitle = entry.title;

    const title = doc.createElement('span');
    title.className = 'qt-recovery__title';
    title.textContent = entry.title;

    const tag = doc.createElement('span');
    tag.className = 'qt-recovery__tag';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = entry.group === 'service' ? COPY.groupService : COPY.groupPage;

    link.append(title, tag);
    link.addEventListener('click', () => {
      doc.dispatchEvent(new CustomEvent('qt:recovery:select', {
        detail: { href: entry.href, title: entry.title }
      }));
    });

    item.append(link);
    return item;
  }

  function render(rawQuery) {
    if (!list) return 0;
    const query = normalize(rawQuery);
    let matches = entries;

    if (query) {
      matches = entries
        .map((entry, index) => ({ entry, index, rank: score(query, entry.haystack) }))
        .filter(hit => hit.rank > 0)
        .sort((a, b) => (b.rank - a.rank) || (a.index - b.index))
        .slice(0, MAX_RESULTS)
        .map(hit => hit.entry);
    }

    list.textContent = '';
    items = matches.map(entry => {
      const node = linkFor(entry);
      list.append(node);
      return node.querySelector('.qt-recovery__link');
    });

    if (empty) empty.hidden = matches.length > 0;
    if (status) {
      status.textContent = matches.length ? COPY.results(matches.length) : COPY.empty;
    }

    doc.dispatchEvent(new CustomEvent('qt:recovery:filter', {
      detail: { query: String(rawQuery || ''), visible: matches.length, total: entries.length }
    }));
    return matches.length;
  }

  function pathHint() {
    const path = window.location.pathname || '';
    const slug = slugOf(path, false);
    if (!slug || slug === '404' || slug === 'home') return null;

    const exact = entries.find(entry => entry.slug === slug);
    if (exact) return exact;

    // نشانی شکسته زیر /services/ است ولی اسلاگش شناخته نیست → فهرست خدمات.
    if (path.indexOf('/services/') === 0) {
      return entries.find(entry => entry.slug === 'services') || null;
    }
    return null;
  }

  function mount() {
    if (!doc.body || !doc.body.classList.contains('error-page')) return false;
    if (doc.querySelector('.qt-recovery')) return true;

    entries = buildIndex();
    if (entries.length < 2) return false;

    const actions = doc.querySelector('#main-content .actions') || doc.querySelector('#main-content');
    if (!actions) return false;

    const box = doc.createElement('section');
    box.className = 'qt-recovery';
    box.setAttribute('aria-labelledby', 'qt-recovery-label');

    const label = doc.createElement('label');
    label.className = 'qt-recovery__label';
    label.id = 'qt-recovery-label';
    label.setAttribute('for', 'qt-recovery-q');
    label.textContent = COPY.label;

    const field = doc.createElement('div');
    field.className = 'qt-recovery__field';

    input = doc.createElement('input');
    input.type = 'search';
    input.id = 'qt-recovery-q';
    input.className = 'qt-recovery__input';
    input.placeholder = COPY.placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-describedby', 'qt-recovery-status');

    const clear = doc.createElement('button');
    clear.type = 'button';
    clear.className = 'qt-recovery__clear';
    clear.setAttribute('aria-label', COPY.clear);
    clear.hidden = true;

    const hintText = pathHint();
    field.append(input, clear);

    status = doc.createElement('p');
    status.className = 'qt-recovery__status';
    status.id = 'qt-recovery-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    list = doc.createElement('ul');
    list.className = 'qt-recovery__list';

    empty = doc.createElement('p');
    empty.className = 'qt-recovery__empty';
    empty.hidden = true;

    box.append(label, field);

    if (hintText) {
      const hint = doc.createElement('p');
      hint.className = 'qt-recovery__hint';
      const prefix = doc.createElement('span');
      prefix.textContent = COPY.hintPrefix + ' ';
      const link = doc.createElement('a');
      link.href = hintText.href;
      link.textContent = hintText.title;
      hint.append(prefix, link);
      box.append(hint);
    }

    // لینک «فهرست خدمات» برای حالت خالی، از همان فهرست DOM.
    const services = entries.find(entry => entry.slug === 'services');
    if (services) {
      const link = doc.createElement('a');
      link.className = 'qt-recovery__all';
      link.href = services.href;
      link.textContent = services.title;
      empty.append(link);
    }

    box.append(status, list, empty);
    actions.insertAdjacentElement('afterend', box);

    function syncClear() {
      clear.hidden = input.value.length === 0;
    }

    input.addEventListener('input', () => {
      render(input.value);
      syncClear();
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        input.value = '';
        render('');
        syncClear();
        return;
      }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length) {
        event.preventDefault();
        const index = event.key === 'ArrowDown' ? 0 : items.length - 1;
        items[index].focus();
      }
    });

    list.addEventListener('keydown', event => {
      const current = items.indexOf(doc.activeElement);
      if (current === -1) return;
      if (event.key === 'ArrowDown' && current < items.length - 1) {
        event.preventDefault();
        items[current + 1].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (current === 0) input.focus();
        else items[current - 1].focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        input.focus();
        input.value = '';
        render('');
        syncClear();
      }
    });

    clear.addEventListener('click', () => {
      input.value = '';
      render('');
      syncClear();
      input.focus();
    });

    doc.body.classList.add('qt-recovery-ready');
    syncClear();
    render('');

    window.QTRecovery = {
      version: VERSION,
      mount,
      filter: render,
      snapshot() {
        return {
          mounted: true,
          query: input ? input.value : '',
          visible: items.length,
          total: entries.length,
          hint: hintText ? hintText.title : null
        };
      }
    };
    return true;
  }

  window.QTRecovery = window.QTRecovery || { version: VERSION, mount };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    window.setTimeout(mount, 0);
  }
})();
