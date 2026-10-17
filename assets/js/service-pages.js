/* تعاملات سبک صفحه‌های مستقل خدمات */
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  function updateScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', scrollY > 12);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  let lastFocusedElement = null;

  function closeMenu(restoreFocus) {
    if (!toggle || !nav) return;
    nav.classList.remove('is-open');
    nav.querySelectorAll('.site-nav__item--services.is-open').forEach(function (item) {
      item.classList.remove('is-open');
      const trigger = item.querySelector(':scope > .site-nav__link');
      const panel = item.querySelector(':scope > .site-nav__dropdown');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('service-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'باز کردن منوی موبایل');
    if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    }
    lastFocusedElement = null;
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'بستن منوی موبایل' : 'باز کردن منوی موبایل');
      document.body.classList.toggle('service-nav-open', isOpen);
      if (isOpen) {
        lastFocusedElement = document.activeElement;
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        lastFocusedElement = null;
      }
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        // زیرمنوی «خدمات» با navigation.js باز و بسته می‌شود؛ این trigger
        // نباید بلافاصله توسط handler بستن drawer reset شود.
        if (link.matches('.site-nav__item--services > .site-nav__link')) return;
        closeMenu(false);
      });
    });

    nav.addEventListener('click', function (event) {
      if (event.target === nav && nav.classList.contains('is-open')) closeMenu(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
    });

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(function (entries, instance) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (item) { observer.observe(item); });
  } else {
    reveals.forEach(function (item) { item.classList.add('is-visible'); });
  }

  document.querySelectorAll('[data-year]').forEach(function (element) {
    element.textContent = '۱۴۰۵';
  });
})();
