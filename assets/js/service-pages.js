/* تعاملات سبک صفحه‌های مستقل خدمات */
(function () {
  'use strict';

  function initServicePageEnhancements() {
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('.scroll-progress');
    const updateScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-scrolled', scrollY > 12);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      }
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
      const observer = new IntersectionObserver((entries, instance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            instance.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(item => observer.observe(item));
    } else {
      reveals.forEach(item => item.classList.add('is-visible'));
    }

    document.querySelectorAll('[data-year]').forEach(element => {
      element.textContent = '۱۴۰۵';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServicePageEnhancements, { once: true });
  } else {
    initServicePageEnhancements();
  }
})();
