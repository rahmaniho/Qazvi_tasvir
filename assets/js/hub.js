/**
 * قزوین تصویر — «QT Hub 9» | فیلتر فهرست خدمات
 * ---------------------------------------------------------------------------
 * یک لایهٔ افزایشی فقط برای services/index.html. فیلتر از همان سه گروه
 * موجود (بازرگانی و تأمین، ترابری و جابه‌جایی، خدمات سازمانی) ساخته می‌شود و
 * کارت‌ها با نسبت دادن فایل مقصدشان به همان گروه شناسایی می‌شوند؛ هیچ
 * عنوان، شماره یا خدمت تازه‌ای اضافه نمی‌شود.
 *
 * بدون جاوااسکریپت هیچ فیلتری ساخته نمی‌شود و هر هشت کارت دیده می‌شوند.
 */
(function () {
  'use strict';

  if (window.QTHub && window.QTHub.version) return;

  const VERSION = '9.0';
  const doc = document;
  const IS_EN = ((doc.documentElement.lang || 'fa').split('-')[0] || 'fa').toLowerCase() === 'en';

  const COPY = IS_EN ? {
    all: 'All',
    groupLabel: 'Filter services',
    count: n => `${n} service${n === 1 ? '' : 's'}`
  } : {
    all: 'همه',
    groupLabel: 'فیلتر خدمات',
    count: n => `${formatNumber(n)} خدمت`
  };

  const GROUPS = [
    {
      key: 'trade',
      label: IS_EN ? 'Trade & sourcing' : 'بازرگانی و تأمین',
      files: ['import-export', 'customs-port', 'sourcing']
    },
    {
      key: 'transport',
      label: IS_EN ? 'Transport & mobility' : 'ترابری و جابه‌جایی',
      files: ['factory-transport', 'urban-vip', 'school-office']
    },
    {
      key: 'corporate',
      label: IS_EN ? 'Corporate services' : 'خدمات سازمانی',
      files: ['personnel-food', 'trade-consulting']
    }
  ];

  let numberFormatter = null;

  function formatNumber(value) {
    try {
      if (!numberFormatter) numberFormatter = new Intl.NumberFormat(IS_EN ? 'en-GB' : 'fa-IR');
      return numberFormatter.format(value);
    } catch (error) {
      return String(value);
    }
  }

  function fileOf(href) {
    try {
      const url = new URL(href, doc.baseURI);
      return url.pathname.split('/').pop().replace(/\.html?$/i, '');
    } catch (error) {
      return '';
    }
  }

  function groupOf(file) {
    return GROUPS.find(group => group.files.includes(file)) || null;
  }

  function mount() {
    if (doc.documentElement.dataset.qtHubMounted === 'true') return true;

    const grid = doc.querySelector('.service-directory__grid');
    const heading = doc.querySelector('.directory-heading');
    if (!grid || !heading) return false;

    const cards = Array.from(grid.querySelectorAll('.service-index-card'));
    if (cards.length < 2) return false;

    const counts = { all: cards.length };
    GROUPS.forEach(group => { counts[group.key] = 0; });

    cards.forEach(card => {
      const link = card.querySelector('a[href]');
      const group = groupOf(link ? fileOf(link.getAttribute('href')) : '');
      card.dataset.qtGroup = group ? group.key : 'other';
      if (group) counts[group.key] += 1;
    });

    const bar = doc.createElement('div');
    bar.className = 'qt-hub-filter';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', COPY.groupLabel);

    const status = doc.createElement('p');
    status.className = 'qt-hub-filter__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const buttons = [];

    function chip(key, label, count) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'qt-hub-filter__chip';
      button.dataset.filter = key;
      button.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');

      const text = doc.createElement('span');
      text.textContent = label;

      const badge = doc.createElement('span');
      badge.className = 'qt-hub-filter__count';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = formatNumber(count);

      button.append(text, badge);
      button.addEventListener('click', () => apply(key));
      buttons.push(button);
      bar.append(button);
      return button;
    }

    let active = 'all';

    function apply(key) {
      active = key;
      let visible = 0;

      cards.forEach(card => {
        const show = key === 'all' || card.dataset.qtGroup === key;
        card.hidden = !show;
        if (show) visible += 1;
      });

      buttons.forEach(button => {
        button.setAttribute('aria-pressed', button.dataset.filter === key ? 'true' : 'false');
      });

      status.textContent = COPY.count(visible);
      doc.dispatchEvent(new CustomEvent('qt:hub:filter', {
        detail: { group: key, visible, total: cards.length }
      }));
      return visible;
    }

    chip('all', COPY.all, counts.all);
    GROUPS.forEach(group => {
      if (counts[group.key] > 0) chip(group.key, group.label, counts[group.key]);
    });

    bar.append(status);
    heading.insertAdjacentElement('afterend', bar);

    doc.documentElement.dataset.qtHubMounted = 'true';
    status.textContent = COPY.count(cards.length);

    window.QTHub = {
      version: VERSION,
      mount,
      filter: apply,
      snapshot() {
        return {
          group: active,
          visible: cards.filter(card => !card.hidden).length,
          total: cards.length,
          chips: buttons.length
        };
      }
    };

    /* فیلتر از ابتدا روی «همه» است؛ رویداد اولیه برای آمار منتشر نمی‌شود. */
    return true;
  }

  window.QTHub = window.QTHub || { version: VERSION, mount };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    window.setTimeout(mount, 0);
  }
})();
