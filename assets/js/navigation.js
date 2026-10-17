/**
 * قزوین تصویر — تعامل مشترک زیرمنوی خدمات
 *
 * ظاهر منو با CSS در دسکتاپ روی hover/focus هم کار می‌کند؛ این لایهٔ کوچک
 * برای کلیک، لمس، Escape و وضعیت‌های ARIA اضافه شده تا dropdown در تمام
 * دستگاه‌ها بدون وابستگی به hover قابل استفاده باشد.
 */
(function () {
  'use strict';

  function initServiceDropdowns() {
    if (document.documentElement.dataset.qtNavigationReady === 'true') return;

    const items = Array.from(document.querySelectorAll(
      '.nav-menu__item--has-dd, .site-nav__item--services'
    ));

    if (!items.length) return;
    document.documentElement.dataset.qtNavigationReady = 'true';

    const instances = items.map(item => {
      const trigger = item.querySelector(':scope > .nav-menu__link, :scope > .site-nav__link');
      const panel = item.querySelector(':scope > .nav-dropdown, :scope > .site-nav__dropdown');
      if (!trigger || !panel) return null;

      if (!panel.id) {
        panel.id = item.classList.contains('nav-menu__item--has-dd')
          ? 'main-services-menu'
          : 'service-pages-menu';
      }
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-hidden', 'true');

      return { item, trigger, panel, ignoreFocusOpen: false };
    }).filter(Boolean);

    const tapTargets = document.querySelectorAll(
      '.nav-menu__link, .site-nav__link, .nav-dropdown__link, '
      + '.site-nav__dropdown a, .mobile-drawer__link, .mobile-drawer__service-link'
    );
    tapTargets.forEach(link => {
      link.addEventListener('pointerdown', () => {
        link.classList.remove('is-tapped');
        // Force a clean animation cycle even when the same item is tapped twice.
        void link.offsetWidth;
        link.classList.add('is-tapped');
      });
      link.addEventListener('animationend', event => {
        if (event.animationName === 'qt-nav-tap') link.classList.remove('is-tapped');
      });
    });

    function setOpen(instance, open, focusTrigger) {
      instances.forEach(other => {
        const isTarget = other === instance;
        other.item.classList.toggle('is-open', isTarget && open);
        other.trigger.setAttribute('aria-expanded', isTarget && open ? 'true' : 'false');
        other.panel.setAttribute('aria-hidden', isTarget && open ? 'false' : 'true');
      });

      if (open && focusTrigger) {
        instance.trigger.focus({ preventScroll: true });
      }
    }

    function focusTriggerAfterClose(instance) {
      if (!instance) return;
      instance.ignoreFocusOpen = true;
      instance.trigger.focus({ preventScroll: true });
      // In browsers where focus() does not dispatch focusin synchronously,
      // release the guard on the next task without affecting the closed state.
      window.setTimeout(() => { instance.ignoreFocusOpen = false; }, 0);
    }

    function closeAll(restoreFocus) {
      const focusedInstance = instances.find(instance =>
        instance.item.contains(document.activeElement)
      );
      instances.forEach(instance => {
        instance.item.classList.remove('is-open');
        instance.trigger.setAttribute('aria-expanded', 'false');
        instance.panel.setAttribute('aria-hidden', 'true');
      });
      if (restoreFocus && focusedInstance) {
        focusTriggerAfterClose(focusedInstance);
      }
    }

    instances.forEach(instance => {
      const { item, trigger } = instance;

      trigger.addEventListener('click', event => {
        event.preventDefault();
        const willOpen = !item.classList.contains('is-open');
        setOpen(instance, willOpen, false);
      });

      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(instance, true, false);
          const firstItem = instance.panel.querySelector('[role="menuitem"], a, button');
          if (firstItem) firstItem.focus({ preventScroll: true });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeAll();
          focusTriggerAfterClose(instance);
        }
      });

      instance.panel.addEventListener('keydown', event => {
        const menuItems = Array.from(instance.panel.querySelectorAll(
          '[role="menuitem"], a, button'
        )).filter(element => !element.disabled && !element.hidden);
        const currentIndex = menuItems.indexOf(document.activeElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
            event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          if (!menuItems.length) return;
          const delta = event.key === 'ArrowUp' ? -1 : 1;
          const nextIndex = event.key === 'Home' ? 0
            : event.key === 'End' ? menuItems.length - 1
            : (currentIndex + delta + menuItems.length) % menuItems.length;
          menuItems[nextIndex].focus({ preventScroll: true });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          closeAll();
          focusTriggerAfterClose(instance);
        }
      });

      item.addEventListener('mouseenter', () => setOpen(instance, true, false));
      item.addEventListener('focusin', () => {
        // Keep the visual :focus-within state and the accessibility tree in
        // sync, including when Tab lands on the trigger itself. Restoring
        // focus after Escape is deliberately exempt so a closed menu stays
        // closed.
        if (instance.ignoreFocusOpen) {
          instance.ignoreFocusOpen = false;
          return;
        }
        setOpen(instance, true, false);
      });
      item.addEventListener('mouseleave', () => {
        if (!item.contains(document.activeElement)) setOpen(instance, false, false);
      });
      item.addEventListener('focusout', () => {
        window.setTimeout(() => {
          if (!item.contains(document.activeElement)) setOpen(instance, false, false);
        }, 0);
      });
    });

    document.addEventListener('click', event => {
      if (!instances.some(instance => instance.item.contains(event.target))) closeAll();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAll(true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServiceDropdowns, { once: true });
  } else {
    initServiceDropdowns();
  }
})();
