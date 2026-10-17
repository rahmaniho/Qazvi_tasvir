/**
 * قزوین تصویر — کنترل مشترک ناوبری
 *
 * این فایل تنها controller منوی header است و روی صفحهٔ اصلی، hub خدمات،
 * تمام صفحات سرویس و 404 اجرا می‌شود. CSS رفتار hover/focus دسکتاپ را حفظ
 * می‌کند؛ این لایه کلیک/لمس، drawer موبایل، زیرمنو، Escape و ARIA را همگام
 * نگه می‌دارد.
 */
(function () {
  'use strict';

  const MOBILE_QUERY = '(max-width: 1023px)';
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  function directChild(root, selector) {
    if (!root) return null;
    return Array.from(root.children).find(child => child.matches(selector)) || null;
  }

  function findNav(toggle) {
    const controlledId = toggle.getAttribute('aria-controls');
    if (controlledId) {
      const controlled = document.getElementById(controlledId);
      if (controlled && controlled.matches('.site-nav, .nav-menu')) return controlled;
    }
    const header = toggle.closest('.site-header');
    return header ? header.querySelector('.site-nav, .nav-menu') : null;
  }

  function initNavigation() {
    if (document.documentElement.dataset.qtNavigationReady === 'true') return;
    document.documentElement.dataset.qtNavigationReady = 'true';

    const media = window.matchMedia ? window.matchMedia(MOBILE_QUERY) : null;
    const isMobile = () => media ? media.matches : window.innerWidth <= 1023;

    const controllers = Array.from(document.querySelectorAll('.menu-toggle'))
      .map(toggle => ({
        toggle,
        nav: findNav(toggle),
        lastFocusedElement: null,
        openLabel: toggle.getAttribute('aria-label') || 'Open mobile menu',
        closeLabel: toggle.getAttribute('data-menu-close-label') ||
          (document.documentElement.lang === 'en' ? 'Close mobile menu' : 'بستن منوی موبایل')
      }))
      .filter(controller => controller.nav);

    const dropdowns = Array.from(document.querySelectorAll(
      '.nav-menu__item--has-dd, .site-nav__item--services'
    )).map(item => {
      const trigger = directChild(item, '.nav-menu__link, .site-nav__link');
      const panel = directChild(item, '.nav-dropdown, .site-nav__dropdown');
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

    let openDropdown = null;

    function syncBodyLock() {
      const open = controllers.some(controller => controller.nav.classList.contains('is-open'));
      document.body.classList.toggle('service-nav-open', open);
    }

    function setDropdown(instance, open, focusTrigger) {
      dropdowns.forEach(other => {
        const active = other === instance && open;
        other.item.classList.toggle('is-open', active);
        other.trigger.setAttribute('aria-expanded', active ? 'true' : 'false');
        other.panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      openDropdown = open ? instance : null;

      if (open && focusTrigger) {
        instance.trigger.focus({ preventScroll: true });
      }
    }

    function focusDropdownTrigger(instance) {
      if (!instance) return;
      instance.ignoreFocusOpen = true;
      instance.trigger.focus({ preventScroll: true });
      window.setTimeout(() => { instance.ignoreFocusOpen = false; }, 0);
    }

    function closeDropdowns(restoreFocus) {
      const focused = dropdowns.find(instance =>
        instance.item.contains(document.activeElement)
      ) || openDropdown;
      dropdowns.forEach(instance => {
        instance.item.classList.remove('is-open');
        instance.trigger.setAttribute('aria-expanded', 'false');
        instance.panel.setAttribute('aria-hidden', 'true');
      });
      openDropdown = null;
      if (restoreFocus && focused) focusDropdownTrigger(focused);
    }

    function closeDrawer(controller, restoreFocus) {
      if (!controller) return;
      controller.nav.classList.remove('is-open');
      controller.toggle.setAttribute('aria-expanded', 'false');
      controller.toggle.setAttribute('aria-label', controller.openLabel);
      if (restoreFocus) {
        const target = controller.lastFocusedElement || controller.toggle;
        if (target && typeof target.focus === 'function') {
          target.focus({ preventScroll: true });
        }
      }
      controller.lastFocusedElement = null;
      syncBodyLock();
    }

    function closeDrawers(restoreFocus) {
      const openController = controllers.find(controller =>
        controller.nav.classList.contains('is-open')
      );
      controllers.forEach(controller => closeDrawer(controller, false));
      if (restoreFocus && openController) {
        const target = openController.lastFocusedElement || openController.toggle;
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      }
    }

    function closeEverything(restoreFocus) {
      closeDropdowns(false);
      closeDrawers(restoreFocus);
    }

    function openDrawer(controller) {
      closeDrawers(false);
      controller.lastFocusedElement = controller.toggle;
      controller.nav.classList.add('is-open');
      controller.toggle.setAttribute('aria-expanded', 'true');
      controller.toggle.setAttribute('aria-label', controller.closeLabel);
      syncBodyLock();

      const firstLink = controller.nav.querySelector('a[href]');
      if (firstLink) firstLink.focus({ preventScroll: true });
    }

    function toggleDrawer(controller) {
      if (controller.nav.classList.contains('is-open')) {
        closeEverything(false);
      } else {
        closeDropdowns(false);
        openDrawer(controller);
      }
    }

    function focusableInDrawer(controller) {
      return Array.from(controller.nav.querySelectorAll(FOCUSABLE)).filter(element => {
        const panel = element.closest('.site-nav__dropdown, .nav-dropdown');
        return !element.hidden && !(panel && panel.getAttribute('aria-hidden') === 'true');
      });
    }

    controllers.forEach(controller => {
      controller.toggle.setAttribute('aria-expanded', 'false');
      controller.toggle.addEventListener('click', () => toggleDrawer(controller));

      controller.nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          // Dropdown triggers are handled by the submenu controller. Every
          // actual destination closes the mobile drawer before navigation.
          const isDropdownTrigger = link === directChild(
            link.closest('.nav-menu__item--has-dd, .site-nav__item--services'),
            '.nav-menu__link, .site-nav__link'
          );
          if (isDropdownTrigger) return;
          if (isMobile()) {
            closeEverything(false);
          }
        });
      });
    });

    dropdowns.forEach(instance => {
      const { item, trigger, panel } = instance;

      trigger.addEventListener('click', event => {
        event.preventDefault();
        setDropdown(instance, !item.classList.contains('is-open'), false);
      });

      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setDropdown(instance, true, false);
          const firstItem = panel.querySelector('[role="menuitem"], a, button');
          if (firstItem) firstItem.focus({ preventScroll: true });
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setDropdown(instance, false, false);
          focusDropdownTrigger(instance);
        }
      });

      panel.addEventListener('keydown', event => {
        const menuItems = Array.from(panel.querySelectorAll(
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
          event.stopPropagation();
          setDropdown(instance, false, false);
          focusDropdownTrigger(instance);
        }
      });

      item.addEventListener('mouseenter', () => {
        if (!isMobile()) setDropdown(instance, true, false);
      });
      item.addEventListener('focusin', () => {
        if (instance.ignoreFocusOpen) {
          instance.ignoreFocusOpen = false;
          return;
        }
        setDropdown(instance, true, false);
      });
      item.addEventListener('mouseleave', () => {
        if (!isMobile() && !item.contains(document.activeElement)) {
          setDropdown(instance, false, false);
        }
      });
      item.addEventListener('focusout', () => {
        window.setTimeout(() => {
          if (!item.contains(document.activeElement)) setDropdown(instance, false, false);
        }, 0);
      });
    });

    // Tap feedback is shared by the homepage and service navigation.
    document.querySelectorAll(
      '.nav-menu__link, .site-nav__link, .nav-dropdown__link, '
      + '.site-nav__dropdown a, .mobile-drawer__link, .mobile-drawer__service-link'
    ).forEach(link => {
      link.addEventListener('pointerdown', () => {
        link.classList.remove('is-tapped');
        void link.offsetWidth;
        link.classList.add('is-tapped');
      });
      link.addEventListener('animationend', event => {
        if (event.animationName === 'qt-nav-tap') link.classList.remove('is-tapped');
      });
    });

    document.addEventListener('click', event => {
      const insideNavigation = controllers.some(controller =>
        controller.nav.contains(event.target) || controller.toggle.contains(event.target)
      );
      if (!insideNavigation) closeEverything(false);
    });

    document.addEventListener('keydown', event => {
      const openController = controllers.find(controller =>
        controller.nav.classList.contains('is-open')
      );
      if (event.key === 'Escape') {
        event.preventDefault();
        if (openController) {
          closeDropdowns(false);
          closeDrawer(openController, true);
        } else {
          closeDropdowns(true);
        }
        return;
      }

      if (event.key !== 'Tab' || !openController) return;
      const focusable = focusableInDrawer(openController);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    });

    const resetOnResize = () => {
      closeEverything(false);
      controllers.forEach(controller => {
        controller.toggle.setAttribute('aria-expanded', 'false');
        controller.toggle.setAttribute('aria-label', controller.openLabel);
      });
    };
    window.addEventListener('resize', resetOnResize, { passive: true });
    if (media && typeof media.addEventListener === 'function') {
      media.addEventListener('change', resetOnResize);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
  } else {
    initNavigation();
  }
})();
