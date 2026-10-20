/**
 * قزوین تصویر — «QT Dock 7» | داک اقدام سریع موبایل
 * ---------------------------------------------------------------------------
 * یک لایهٔ افزایشی و فقط برای صفحهٔ اصلی. هیچ شماره، متن یا مقصدی در این فایل
 * ساخته نمی‌شود: مقصدها از لینک‌های واقعی همان صفحه خوانده می‌شوند و اگر
 * لینک تلفن/واتساپ نباشد، آن دکمه ساخته نمی‌شود.
 *
 * سه اقدام: تماس، واتساپ و باز کردن همان دراور ناوبری موجود (منو).
 * داک در دسکتاپ پنهان است، هنگام باز بودن دراور ناپدید می‌شود و با
 * «کاهش حرکت» و چاپ سازگار است.
 */
(function () {
  'use strict';

  if (window.QTDock && window.QTDock.version) return;

  const VERSION = '7.0';
  const doc = document;
  const LANG = (doc.documentElement.lang || 'fa').split('-')[0].toLowerCase();
  const IS_EN = LANG === 'en';

  const COPY = IS_EN ? {
    label: 'Quick actions',
    call: 'Call',
    whatsapp: 'WhatsApp',
    menu: 'Menu',
    openMenu: 'Open the site menu'
  } : {
    label: 'دسترسی سریع',
    call: 'تماس',
    whatsapp: 'واتساپ',
    menu: 'منو',
    openMenu: 'باز کردن منوی سایت'
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(viewBox) {
    const node = doc.createElementNS(SVG_NS, 'svg');
    node.setAttribute('viewBox', viewBox);
    node.setAttribute('width', '20');
    node.setAttribute('height', '20');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
    node.setAttribute('stroke-width', '1.9');
    node.setAttribute('stroke-linecap', 'round');
    node.setAttribute('stroke-linejoin', 'round');
    return node;
  }

  function path(d, attrs) {
    const node = doc.createElementNS(SVG_NS, 'path');
    node.setAttribute('d', d);
    if (attrs) {
      Object.keys(attrs).forEach(key => node.setAttribute(key, attrs[key]));
    }
    return node;
  }

  function phoneIcon() {
    const icon = svg('0 0 24 24');
    icon.append(path('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'));
    return icon;
  }

  function chatIcon() {
    const icon = doc.createElementNS(SVG_NS, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('fill', 'currentColor');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.append(path('M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.746 5.634l-.999 3.648 3.742-.981z'));
    return icon;
  }

  function menuIcon() {
    const icon = svg('0 0 24 24');
    icon.append(
      path('M4 7h16'),
      path('M4 12h16'),
      path('M4 17h10')
    );
    return icon;
  }

  function item(action, label, icon) {
    const node = doc.createElement(action.href ? 'a' : 'button');
    node.className = 'qt-dock__item' + (action.variant ? ' qt-dock__item--' + action.variant : '');
    if (action.href) {
      node.href = action.href;
      if (action.external) {
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
      }
    } else {
      node.type = 'button';
      node.setAttribute('aria-label', COPY.openMenu);
      node.addEventListener('click', action.onClick);
    }
    node.append(icon, doc.createTextNode(label));
    node.dataset.action = action.name;
    return node;
  }

  function mount() {
    if (doc.querySelector('.qt-dock')) return true;

    const phone = doc.querySelector('a[href^="tel:"]');
    const whatsapp = doc.querySelector('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    const toggle = doc.querySelector('.menu-toggle');

    const dock = doc.createElement('nav');
    dock.className = 'qt-dock';
    dock.setAttribute('aria-label', COPY.label);
    dock.dataset.qtDock = 'true';

    let count = 0;
    if (phone) {
      dock.append(item({
        name: 'call',
        variant: 'call',
        href: phone.getAttribute('href')
      }, COPY.call, phoneIcon()));
      count += 1;
    }
    if (whatsapp) {
      dock.append(item({
        name: 'whatsapp',
        variant: 'wa',
        href: whatsapp.getAttribute('href'),
        external: true
      }, COPY.whatsapp, chatIcon()));
      count += 1;
    }
    if (toggle) {
      dock.append(item({
        name: 'menu',
        // کلیک روی داک نباید به شنوندهٔ سراسری ناوبری برسد؛ وگرنه در همان
        // لحظه «کلیک بیرون» تفسیر و دراور تازه‌بازشده بسته می‌شود.
        onClick: event => {
          event.stopPropagation();
          toggle.click();
        }
      }, COPY.menu, menuIcon()));
      count += 1;
    }

    // داک فقط وقتی معنا دارد که دست‌کم دو اقدام واقعی وجود داشته باشد.
    if (count < 2) return false;

    // فاز گرفتن (capture) تا حتی وقتی دکمهٔ منو انتشار رویداد را متوقف می‌کند،
    // لایهٔ آمار همچنان اقدام را ببیند.
    dock.addEventListener('click', event => {
      const target = event.target.closest('.qt-dock__item');
      if (!target) return;
      doc.dispatchEvent(new CustomEvent('qt:dock:action', {
        detail: { action: target.dataset.action, label: target.textContent.trim() }
      }));
    }, true);

    doc.body.append(dock);
    doc.body.classList.add('qt-dock-ready');
    return true;
  }

  window.QTDock = { version: VERSION, mount };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    window.setTimeout(mount, 0);
  }
})();
