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

  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'باز کردن منوی موبایل');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'بستن منوی موبایل' : 'باز کردن منوی موبایل');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
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
