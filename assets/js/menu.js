/**
 * قزوین تصویر — «QT Menu 5» | منوی نسل‌جدید
 * ---------------------------------------------------------------------------
 * یک لایهٔ افزایشی (progressive enhancement) روی ناوبری موجود:
 *
 *   ۱. پنل نتایج زیر فیلد جست‌وجوی ریل/دراور — با الگوی ARIA combobox،
 *      ناوبری کامل با صفحه‌کلید و رتبه‌بندی فازی فارسی/انگلیسی.
 *   ۲. گروه‌بندی سه‌گانهٔ لینک‌های «خدمات» داخل همان پنل کشویی موجود.
 *   ۳. ردیف اقدام سریع در دراور موبایل: تماس/واتساپ وقتی شمارهٔ واقعی
 *      در صفحه هست، وگرنه پیوند «تماس با ما»ی خودِ ریل. هیچ شماره‌ای
 *      ساخته نمی‌شود و هیچ مقصدی خارج از DOM موجود نیست.
 *
 * این فایل هیچ متن ثابتی از محتوای شرکت ندارد و هیچ لینکی نمی‌سازد؛ همهٔ
 * مقصدها از DOM موجود خوانده می‌شوند تا با محتوای واقعی هم‌یشه هم‌خوان بمانند.
 * هر انتخاب یک رویداد «qt:menu:select» (cancelable) منتشر می‌کند تا لایهٔ
 * تحلیل/آمار بتواند بدون دست‌زدن به این فایل آن را بشنود.
 */
(function () {
  'use strict';

  if (window.QTMenu && window.QTMenu.version) return;

  const VERSION = '5.0';
  const doc = document;
  const root = doc.documentElement;
  const LANG = (root.lang || 'fa').split('-')[0].toLowerCase();
  const IS_EN = LANG === 'en';
  const MOBILE_QUERY = '(max-width: 1023px)';

  const COPY = IS_EN ? {
    kicker: 'Search the whole site',
    suggestions: 'Suggestions',
    results: 'Search results',
    emptyTitle: 'Nothing found',
    emptyHint: 'Try a shorter word, or a service name.',
    groupSection: 'Section',
    groupService: 'Service',
    groupPage: 'Page',
    listLabel: 'Search results',
    fieldLabel: 'Search the site',
    count: n => `${n} result${n === 1 ? '' : 's'}`,
    groupLabels: {
      trade: 'Trade & sourcing',
      transport: 'Transport & mobility',
      corporate: 'Corporate services',
      all: 'All services'
    },
    quickCall: 'Call us',
    quickWhatsApp: 'WhatsApp',
    quickContact: 'Contact us',
    hintMove: 'move',
    hintOpen: 'open',
    hintClose: 'close'
  } : {
    kicker: 'جست‌وجو در کل سایت',
    suggestions: 'پیشنهادها',
    results: 'نتایج جست‌وجو',
    emptyTitle: 'نتیجه‌ای پیدا نشد',
    emptyHint: 'واژهٔ کوتاه‌تری یا نام یک خدمت را امتحان کنید.',
    groupSection: 'بخش صفحه',
    groupService: 'خدمت',
    groupPage: 'صفحه',
    listLabel: 'نتایج جست‌وجو',
    fieldLabel: 'جست‌وجو در سایت',
    count: n => `${formatNumber(n)} نتیجه`,
    groupLabels: {
      trade: 'بازرگانی و تأمین',
      transport: 'ترابری و جابه‌جایی',
      corporate: 'خدمات سازمانی',
      all: 'همهٔ خدمات'
    },
    quickCall: 'تماس تلفنی',
    quickWhatsApp: 'واتساپ',
    quickContact: 'تماس با ما',
    hintMove: 'جابه‌جایی',
    hintOpen: 'انتخاب',
    hintClose: 'بستن'
  };

  const SERVICE_GROUPS = [
    { key: 'trade', files: ['import-export.html', 'customs-port.html', 'sourcing.html'] },
    { key: 'transport', files: ['factory-transport.html', 'urban-vip.html', 'school-office.html'] },
    { key: 'corporate', files: ['personnel-food.html', 'trade-consulting.html'] }
  ];

  const DIGIT_MAP = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  let numberFormatter = null;
  function formatNumber(value) {
    try {
      if (!numberFormatter) {
        numberFormatter = new Intl.NumberFormat(IS_EN ? 'en-GB' : 'fa-IR');
      }
      return numberFormatter.format(value);
    } catch (error) {
      return String(value);
    }
  }

  /** نرمال‌سازی فارسی/عربی برای جست‌وجوی مقاوم به صفحه‌کلید و اعراب. */
  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[\u064A\u06CC\u0649]/g, '\u06CC')   // ي / ى → ی
      .replace(/[\u0643]/g, '\u06A9')                // ك → ک
      .replace(/[\u0622\u0623\u0625]/g, '\u0627')   // آ / أ / إ → ا
      .replace(/\u0629/g, '\u0647')                  // ة → ه
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')   // اعراب و کشیده
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, ' ')
      .replace(/[۰-۹٠-٩]/g, ch => DIGIT_MAP[ch] || ch)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** امتیاز تطبیق: پیشوند > شروع واژه > زیررشته > زیردنباله. */
  function score(query, text) {
    if (!query) return 1;
    if (!text) return 0;
    if (text === query) return 140;
    if (text.startsWith(query)) return 120;
    if (text.includes(' ' + query)) return 105;
    if (text.includes(query)) return 85;

    let cursor = 0;
    let gaps = 0;
    let lastMatch = -1;
    for (let index = 0; index < text.length && cursor < query.length; index += 1) {
      if (text[index] === query[cursor]) {
        if (lastMatch >= 0) gaps += index - lastMatch - 1;
        lastMatch = index;
        cursor += 1;
      }
    }
    if (cursor === query.length) return Math.max(20, 55 - gaps);
    return 0;
  }

  function elementText(element) {
    return element ? element.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function absoluteHref(href) {
    try {
      return new URL(href, doc.baseURI);
    } catch (error) {
      return null;
    }
  }

  /* ------------------------------------------------------------------------
     ساخت فهرست مقصدها از DOM
     ------------------------------------------------------------------------ */
  function buildIndex() {
    const entries = [];
    const seen = new Map();
    const nav = doc.querySelector('.site-nav');

    function push(entry) {
      if (!entry.href) return;
      const url = absoluteHref(entry.href);
      if (!url) return;
      const key = url.href;
      const existing = seen.get(key);
      if (existing) {
        if (entry.title && entry.title.length < existing.title.length) {
          existing.alt = existing.alt || existing.title;
          existing.title = entry.title;
        }
        return;
      }
      const record = {
        title: entry.title,
        meta: entry.meta || '',
        group: entry.group,
        href: entry.href,
        weight: entry.weight || 0,
        order: entries.length,
        haystack: normalize([entry.title, entry.meta, entry.group].filter(Boolean).join(' ')),
        titleHay: normalize(entry.title)
      };
      seen.set(key, record);
      entries.push(record);
    }

    if (nav) {
      const links = Array.from(nav.querySelectorAll('a[href]'));
      links.forEach(link => {
        // اقدام‌های سریع (تلفن/واتساپ) و لینک‌های بیرونی مقصد جست‌وجو نیستند
        if (link.closest('.qt-quick')) return;
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;
        const label = elementText(link) || link.getAttribute('aria-label') || '';
        if (!label) return;
        const url = absoluteHref(href);
        if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) return;
        if (url.origin !== window.location.origin) return;
        const isService = /\/services\/[^/]*\.html$/.test(url.pathname);
        const isHash = !isService && Boolean(url.hash);
        const direct = link.parentElement === nav;
        push({
          title: label,
          meta: isService ? COPY.groupService : (isHash ? COPY.groupSection : COPY.groupPage),
          group: isService ? 'service' : (isHash ? 'section' : 'page'),
          weight: direct ? 0 : (isService ? 2 : 1),
          href
        });
      });
    }

    // بخش‌های صفحهٔ اصلی که در ریل لینک ندارند (رزومه، اعتبارنامه، …)
    Array.from(doc.querySelectorAll('.site-page[id]')).forEach(section => {
      const heading = section.querySelector('h1, h2');
      const label = section.querySelector('.section-label');
      const title = elementText(heading);
      if (!title) return;
      push({
        title,
        meta: elementText(label) || COPY.groupSection,
        group: 'section',
        weight: 3,
        href: '#' + section.id
      });
    });

    return entries;
  }

  function rank(entries, rawQuery) {
    const query = normalize(rawQuery);
    if (!query) {
      return entries
        .slice()
        .sort((a, b) => a.weight - b.weight || a.order - b.order)
        .slice(0, 8);
    }
    const tokens = query.split(' ').filter(Boolean);
    return entries
      .map(entry => {
        let total = 0;
        for (const token of tokens) {
          const tokenScore = Math.max(
            score(token, entry.titleHay) * 1.6,
            score(token, entry.haystack)
          );
          if (!tokenScore) return null;
          total += tokenScore;
        }
        return { entry, total };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total || a.entry.order - b.entry.order)
      .slice(0, 12)
      .map(item => item.entry);
  }

  /* ------------------------------------------------------------------------
     ساخت پنل
     ------------------------------------------------------------------------ */
  let input = null;
  let panel = null;
  let list = null;
  let kicker = null;
  let count = null;
  let empty = null;
  let status = null;
  let options = [];
  let activeIndex = -1;
  let opener = null;
  let closing = false;

  function iconArrow() {
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.4');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '19'); line.setAttribute('y1', '12');
    line.setAttribute('x2', '5'); line.setAttribute('y2', '12');
    const head = doc.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    head.setAttribute('points', '12 19 5 12 12 5');
    svg.append(line, head);
    return svg;
  }

  function hint(key, label) {
    const wrap = doc.createElement('span');
    wrap.className = 'qt-cmd__hint';
    const kbd = doc.createElement('kbd');
    kbd.textContent = key;
    const text = doc.createTextNode(label);
    wrap.append(kbd, text);
    return wrap;
  }

  function ensurePanel() {
    if (panel) return panel;

    panel = doc.createElement('div');
    panel.className = 'qt-cmd';
    panel.dataset.open = 'false';

    const head = doc.createElement('div');
    head.className = 'qt-cmd__head';
    kicker = doc.createElement('span');
    kicker.className = 'qt-cmd__kicker';
    kicker.textContent = COPY.suggestions;
    count = doc.createElement('span');
    count.className = 'qt-cmd__count';
    count.setAttribute('aria-hidden', 'true');
    head.append(kicker, count);

    list = doc.createElement('ul');
    list.className = 'qt-cmd__list';
    list.id = 'qt-cmd-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', COPY.listLabel);

    empty = doc.createElement('div');
    empty.className = 'qt-cmd__empty';
    empty.hidden = true;
    const emptyTitle = doc.createElement('strong');
    emptyTitle.textContent = COPY.emptyTitle;
    const emptyHint = doc.createElement('span');
    emptyHint.textContent = COPY.emptyHint;
    empty.append(emptyTitle, emptyHint);

    // ناحیهٔ زندهٔ فقط‌برای‌صفحه‌خوان: تعداد نتیجه‌ها یا پیام «چیزی پیدا نشد»
    status = doc.createElement('p');
    status.className = 'qt-cmd__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const foot = doc.createElement('div');
    foot.className = 'qt-cmd__foot';
    foot.append(
      hint('↑↓', COPY.hintMove),
      hint('↵', COPY.hintOpen),
      hint('Esc', COPY.hintClose)
    );

    panel.append(head, list, empty, status, foot);
    doc.body.append(panel);
    return panel;
  }

  function setActive(index, scroll) {
    if (!input) return;
    if (!options.length) {
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      return;
    }
    const next = ((index % options.length) + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.setAttribute('aria-selected', optionIndex === next ? 'true' : 'false');
    });
    activeIndex = next;
    input.setAttribute('aria-activedescendant', options[next].id);
    if (scroll && typeof options[next].scrollIntoView === 'function') {
      try {
        options[next].scrollIntoView({ block: 'nearest' });
      } catch (error) { /* jsdom و مرورگرهای قدیمی */ }
    }
  }

  function render(rawQuery) {
    ensurePanel();
    const query = String(rawQuery || '').trim();
    const entries = rank(buildIndex(), query);

    list.textContent = '';
    options = [];
    activeIndex = -1;

    kicker.textContent = query ? COPY.results : COPY.suggestions;
    count.textContent = entries.length ? COPY.count(entries.length) : '';
    empty.hidden = entries.length > 0;
    if (status) {
      status.textContent = entries.length
        ? COPY.count(entries.length)
        : COPY.emptyTitle + '. ' + COPY.emptyHint;
    }

    entries.forEach((entry, index) => {
      const option = doc.createElement('li');
      option.className = 'qt-cmd__option';
      option.id = 'qt-cmd-opt-' + index;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.dataset.href = entry.href;
      option.dataset.title = entry.title;

      const arrow = doc.createElement('span');
      arrow.className = 'qt-cmd__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.append(iconArrow());

      const text = doc.createElement('span');
      text.className = 'qt-cmd__text';
      const title = doc.createElement('span');
      title.className = 'qt-cmd__title';
      title.textContent = entry.title;
      const meta = doc.createElement('span');
      meta.className = 'qt-cmd__meta';
      meta.textContent = entry.alt ? entry.alt : entry.meta;
      text.append(title, meta);

      const chip = doc.createElement('span');
      chip.className = 'qt-cmd__chip';
      chip.textContent = entry.group === 'service' ? COPY.groupService
        : entry.group === 'section' ? COPY.groupSection : COPY.groupPage;

      option.append(arrow, text, chip);
      option.addEventListener('mousemove', () => {
        if (activeIndex !== index) setActive(index, false);
      });
      option.addEventListener('click', event => {
        event.preventDefault();
        activate(index);
      });

      list.append(option);
      options.push(option);
    });

    if (entries.length) setActive(0, false);
    if (panel.dataset.open === 'true') position();
  }

  /* ------------------------------------------------------------------------
     جای‌گذاری پنل نسبت به فیلد جست‌وجو (fixed تا از overflow ریل بیرون بزند)
     ------------------------------------------------------------------------ */
  function position() {
    if (!panel || !input) return;
    const rect = input.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const viewportWidth = window.innerWidth || root.clientWidth;
    const viewportHeight = window.innerHeight || root.clientHeight;
    const margin = 12;
    const rtl = root.dir === 'rtl';
    const width = Math.min(560, viewportWidth - margin * 2);

    let left = rtl ? rect.right - width : rect.left;
    left = Math.max(margin, Math.min(left, viewportWidth - width - margin));

    const top = rect.bottom + 8;
    const available = viewportHeight - top - margin;
    const maxHeight = Math.max(200, Math.min(470, available));

    panel.style.width = Math.round(width) + 'px';
    panel.style.left = Math.round(left) + 'px';
    panel.style.top = Math.round(top) + 'px';
    panel.style.maxHeight = Math.round(maxHeight) + 'px';
  }

  function isOpen() {
    return panel ? panel.dataset.open === 'true' : false;
  }

  function open() {
    if (!input) input = doc.querySelector('.site-nav__search-input');
    if (!input) return false;

    // در موبایل اگر دراور بسته است، ابتدا آن را باز می‌کنیم
    if (window.matchMedia && window.matchMedia(MOBILE_QUERY).matches) {
      const nav = input.closest('.site-nav');
      if (nav && !nav.classList.contains('is-open')) {
        const toggle = doc.querySelector('.menu-toggle');
        if (toggle) {
          toggle.click();
          window.setTimeout(position, 60);
        }
      }
    }

    opener = doc.activeElement;
    ensurePanel();
    render(input.value);
    panel.dataset.open = 'true';
    input.setAttribute('aria-expanded', 'true');
    position();
    return true;
  }

  function close(options) {
    const settings = options || {};
    if (!isOpen()) return;
    // هنگام بازگرداندن فوکوس، رویداد focus نباید پنل را دوباره باز کند
    closing = true;
    panel.dataset.open = 'false';
    if (input) {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    activeIndex = -1;
    if (settings.restoreFocus && input) input.focus({ preventScroll: true });
    closing = false;
  }

  function navigate(href) {
    if (!href) return;
    if (href.charAt(0) === '#') {
      window.location.hash = href;
      return;
    }
    window.location.assign(new URL(href, doc.baseURI).href);
  }

  function activate(index) {
    const option = options[index];
    if (!option) return;
    const detail = { href: option.dataset.href, title: option.dataset.title };
    const event = new CustomEvent('qt:menu:select', {
      detail,
      bubbles: true,
      cancelable: true
    });
    const proceed = doc.dispatchEvent(event);
    close({ restoreFocus: false });
    if (!proceed) return;
    navigate(detail.href);
  }

  /* ------------------------------------------------------------------------
     گروه‌بندی پنل «خدمات»
     ------------------------------------------------------------------------ */
  function groupServices() {
    const dropdown = doc.querySelector('.site-nav__item--services .site-nav__dropdown');
    if (!dropdown || dropdown.dataset.qtGrouped === 'true') return;

    const links = Array.from(dropdown.querySelectorAll('a[href]'));
    if (!links.length) return;

    const indexLink = links.find(link => {
      const file = link.getAttribute('href').split('#')[0].split('/').pop();
      return file === 'index.html' || /\/services\/$/.test(link.getAttribute('href'));
    }) || null;

    const buckets = new Map(SERVICE_GROUPS.map(group => [group.key, []]));
    const fallback = [];

    links.forEach(link => {
      if (link === indexLink) return;
      const file = (link.getAttribute('href').split('#')[0].split('/').pop() || '');
      const group = SERVICE_GROUPS.find(item => item.files.includes(file));
      if (group) buckets.get(group.key).push(link);
      else fallback.push(link);
    });

    dropdown.textContent = '';

    if (indexLink) {
      indexLink.classList.add('qt-menu-all');
      dropdown.append(indexLink);
    }

    SERVICE_GROUPS.forEach((group, groupIndex) => {
      const items = buckets.get(group.key);
      if (!items.length) return;
      const wrap = doc.createElement('div');
      wrap.className = 'qt-menu-group';
      wrap.dataset.group = group.key;

      const label = doc.createElement('p');
      label.className = 'qt-menu-group__label';
      label.textContent = COPY.groupLabels[group.key];
      const badge = doc.createElement('span');
      badge.className = 'qt-menu-group__count';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = formatNumber(items.length);
      label.append(badge);
      wrap.append(label);
      items.forEach(item => wrap.append(item));
      dropdown.append(wrap);

      if (groupIndex === SERVICE_GROUPS.length - 1 && fallback.length) {
        fallback.forEach(item => wrap.append(item));
      }
    });

    dropdown.dataset.qtGrouped = 'true';
  }

  /* ------------------------------------------------------------------------
     اقدام سریع در دراور موبایل
     ------------------------------------------------------------------------ */
  function phoneIcon() {
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.22 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.79.66 2.63a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.45-1.23a2 2 0 0 1 2.11-.45c.84.32 1.73.54 2.63.66A2 2 0 0 1 22 16.92z');
    svg.append(path);
    return svg;
  }

  function chatIcon() {
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.746 5.634l-.999 3.648 3.742-.981z');
    svg.append(path);
    return svg;
  }

  function mailIcon() {
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const box = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    box.setAttribute('x', '3');
    box.setAttribute('y', '5');
    box.setAttribute('width', '18');
    box.setAttribute('height', '14');
    box.setAttribute('rx', '2.4');
    const flap = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    flap.setAttribute('d', 'M3.6 6.6 12 13l8.4-6.4');
    svg.append(box, flap);
    return svg;
  }

  function quickActions() {
    const nav = doc.querySelector('.site-nav');
    if (!nav || nav.querySelector('.qt-quick')) return;

    const phone = doc.querySelector('a[href^="tel:"]');
    const whatsapp = doc.querySelector('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    const contact = nav.querySelector('.site-nav__link[href$="#contact"]');
    if (!phone && !whatsapp && !contact) return;

    const row = doc.createElement('div');
    row.className = 'qt-quick';

    if (phone) {
      const call = doc.createElement('a');
      call.className = 'qt-quick__btn';
      call.href = phone.getAttribute('href');
      call.append(phoneIcon(), doc.createTextNode(COPY.quickCall));
      row.append(call);
    }
    if (whatsapp) {
      const chat = doc.createElement('a');
      chat.className = 'qt-quick__btn qt-quick__btn--wa';
      chat.href = whatsapp.getAttribute('href');
      chat.target = '_blank';
      chat.rel = 'noopener noreferrer';
      chat.append(chatIcon(), doc.createTextNode(COPY.quickWhatsApp));
      row.append(chat);
    }
    if (!phone && !whatsapp && contact) {
      const reach = doc.createElement('a');
      reach.className = 'qt-quick__btn';
      reach.href = contact.getAttribute('href');
      reach.append(mailIcon(), doc.createTextNode(COPY.quickContact));
      row.append(reach);
    }

    const search = nav.querySelector('.site-nav__search');
    if (search && search.nextSibling) nav.insertBefore(row, search.nextSibling);
    else if (search) nav.append(row);
    else nav.prepend(row);
  }

  /* ------------------------------------------------------------------------
     اتصال رویدادها
     ------------------------------------------------------------------------ */
  function wire() {
    input = doc.querySelector('.site-nav__search-input');
    if (!input || input.dataset.qtMenuReady === 'true') return;

    input.dataset.qtMenuReady = 'true';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'qt-cmd-list');
    input.setAttribute('aria-label', COPY.fieldLabel);
    input.setAttribute('spellcheck', 'false');

    input.addEventListener('input', () => {
      render(input.value);
      if (!isOpen()) {
        panel.dataset.open = 'true';
        input.setAttribute('aria-expanded', 'true');
        position();
      }
    });

    input.addEventListener('focus', () => {
      if (closing || isOpen()) return;
      open();
    });

    input.addEventListener('keydown', event => {
      const key = event.key;
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        if (!isOpen()) open();
        event.preventDefault();
        event.stopPropagation();
        setActive(activeIndex + (key === 'ArrowDown' ? 1 : -1), true);
        return;
      }
      if (key === 'Home' || key === 'End') {
        if (!isOpen() || !options.length) return;
        event.preventDefault();
        setActive(key === 'Home' ? 0 : options.length - 1, true);
        return;
      }
      if (key === 'Enter') {
        if (!isOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        activate(activeIndex >= 0 ? activeIndex : 0);
        return;
      }
      if (key === 'Escape') {
        if (!isOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        close({ restoreFocus: true });
        return;
      }
      if (key === 'Tab') {
        close({ restoreFocus: false });
      }
    });

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!panel) return;
        if (panel.contains(doc.activeElement)) return;
        close({ restoreFocus: false });
      }, 120);
    });

    doc.addEventListener('mousedown', event => {
      if (!isOpen()) return;
      if (panel.contains(event.target) || input.contains(event.target)) return;
      close({ restoreFocus: false });
    });

    doc.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        if (!input) return;
        if (isOpen()) return;
        event.preventDefault();
        input.focus({ preventScroll: true });
        open();
      }
    });

    const reposition = () => {
      if (!isOpen()) return;
      const rect = input.getBoundingClientRect();
      if (!rect.width) close({ restoreFocus: false });
      else position();
    };
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true, capture: true });
  }

  function mount() {
    if (root.dataset.qtMenuMounted === 'true') return true;
    root.dataset.qtMenuMounted = 'true';
    groupServices();
    quickActions();
    wire();
    doc.body.classList.add('qt-menu-ready');
    return true;
  }

  window.QTMenu = {
    version: VERSION,
    mount,
    open,
    close,
    isOpen,
    // برای آزمون/آمار: فقط خواندن وضعیت
    snapshot() {
      return {
        open: isOpen(),
        query: input ? input.value : '',
        items: options.map(option => ({
          title: option.dataset.title,
          href: option.dataset.href
        }))
      };
    }
  };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    // پس از اسکریپت‌های ناوبری که در همان چرخه اجرا می‌شوند
    window.setTimeout(mount, 0);
  }
})();
