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
        header: toggle.closest('.site-header'),
        lastFocusedElement: null,
        openLabel: toggle.getAttribute('aria-label') || 'Open mobile menu',
        closeLabel: toggle.getAttribute('data-menu-close-label') ||
          (document.documentElement.lang === 'en' ? 'Close mobile menu' : 'بستن منوی موبایل'),
        collapseLabel: document.documentElement.lang === 'en'
          ? 'Collapse sidebar' : 'بستن نوار کناری',
        expandLabel: document.documentElement.lang === 'en'
          ? 'Expand sidebar' : 'باز کردن نوار کناری'
      }))
      .filter(controller => controller.nav);

    function pageCopy() {
      return document.documentElement.lang === 'en' ? {
        searchLabel: 'Search',
        searchPlaceholder: 'Search site',
        main: 'Main',
        messages: 'Messages',
        addMessage: 'New message',
        profileRole: 'Managing Director',
        profileAction: 'Open contact section',
        messagesList: [
          ['QT', 'Consultation requests'],
          ['FL', 'Fleet coordination'],
          ['FO', 'Catering operations']
        ]
      } : {
        searchLabel: 'جستجو',
        searchPlaceholder: 'جستجو در سایت',
        main: 'اصلی',
        messages: 'پیام‌ها',
        addMessage: 'پیام جدید',
        profileRole: 'مدیریت شرکت',
        profileAction: 'رفتن به بخش تماس',
        messagesList: [
          ['ق', 'درخواست‌های مشاوره'],
          ['ن', 'هماهنگی ناوگان'],
          ['غ', 'عملیات غذای سازمانی']
        ]
      };
    }

    function assetUrl(relativePath) {
      const nested = /\/(?:services|en)(?:\/|$)/.test(window.location.pathname);
      return new URL((nested ? '../' : './') + relativePath, document.baseURI).href;
    }

    function enhanceSidebar(controller) {
      const nav = controller.nav;
      const copy = pageCopy();
      const contact = nav.querySelector('a[href*="#contact"]');
      const contactHref = contact ? contact.getAttribute('href') : '#contact';

      let searchInput = nav.querySelector('.site-nav__search-input');
      if (!searchInput) {
        const search = document.createElement('div');
        search.className = 'site-nav__search';
        search.setAttribute('role', 'search');
        const label = document.createElement('label');
        label.className = 'visually-hidden';
        label.setAttribute('for', `${nav.id || 'site-nav'}-search`);
        label.textContent = copy.searchLabel;
        searchInput = document.createElement('input');
        searchInput.className = 'site-nav__search-input';
        searchInput.id = `${nav.id || 'site-nav'}-search`;
        searchInput.type = 'search';
        searchInput.placeholder = copy.searchPlaceholder;
        searchInput.setAttribute('autocomplete', 'off');
        const shortcut = document.createElement('span');
        shortcut.className = 'site-nav__search-shortcut';
        shortcut.setAttribute('aria-hidden', 'true');
        shortcut.innerHTML = '<kbd>⌘</kbd><kbd>K</kbd>';
        search.append(label, searchInput, shortcut);
        nav.prepend(search);
      }

      if (!nav.querySelector('.site-nav__section-label')) {
        const label = document.createElement('div');
        label.className = 'site-nav__section-label';
        label.textContent = copy.main;
        const firstLink = nav.querySelector('.site-nav__link');
        if (firstLink) nav.insertBefore(label, firstLink);
        else nav.append(label);
      }

      if (!nav.querySelector('.site-nav__messages')) {
        const messages = document.createElement('section');
        messages.className = 'site-nav__messages';
        messages.setAttribute('aria-label', copy.messages);
        const heading = document.createElement('div');
        heading.className = 'site-nav__messages-heading';
        const title = document.createElement('span');
        title.textContent = copy.messages;
        const add = document.createElement('a');
        add.className = 'site-nav__message-add';
        add.href = contactHref;
        add.setAttribute('aria-label', copy.addMessage);
        add.textContent = '+';
        heading.append(title, add);
        const list = document.createElement('div');
        list.className = 'site-nav__message-list';
        copy.messagesList.forEach(([initials, text], index) => {
          const message = document.createElement('a');
          message.className = 'site-nav__message';
          message.href = contactHref;
          message.innerHTML = `<span class="site-nav__avatar site-nav__avatar--${index + 1}" aria-hidden="true">${initials}</span>`
            + `<span class="site-nav__message-text">${text}</span>`
            + '<span class="site-nav__message-status" aria-hidden="true"></span>';
          list.append(message);
        });
        messages.append(heading, list);
        nav.append(messages);
      }

      if (!nav.querySelector('.site-nav__profile')) {
        const profile = document.createElement('a');
        profile.className = 'site-nav__profile';
        profile.href = contactHref;
        profile.setAttribute('aria-label', copy.profileAction);
        profile.innerHTML = `<img src="${assetUrl('assets/images/saeed-aminzadeh-avatar.webp')}" alt="" width="38" height="38">`
          + `<span class="site-nav__profile-copy"><strong>${document.documentElement.lang === 'en' ? 'Saeed Aminzadeh' : 'سعید امین‌زاده'}</strong><small>${copy.profileRole}</small></span>`
          + '<span class="site-nav__profile-chevron" aria-hidden="true">⌄</span>';
        nav.append(profile);
      }

      const primaryLinks = Array.from(nav.querySelectorAll(
        ':scope > .site-nav__link, :scope > .site-nav__cta'
      ));
      const serviceItem = nav.querySelector(':scope > .site-nav__item--services');
      const serviceLinks = serviceItem
        ? Array.from(serviceItem.querySelectorAll('.site-nav__dropdown a'))
        : [];
      const messages = nav.querySelector('.site-nav__messages');
      const messageLinks = messages ? Array.from(messages.querySelectorAll('a')) : [];
      const profile = nav.querySelector('.site-nav__profile');

      const matches = element => element && element.textContent
        .toLocaleLowerCase()
        .includes(searchInput.value.trim().toLocaleLowerCase());

      const updateSearch = () => {
        const query = searchInput.value.trim();
        primaryLinks.forEach(link => {
          link.hidden = Boolean(query) && !matches(link);
        });
        if (serviceItem) {
          const serviceTrigger = serviceItem.querySelector('.site-nav__link');
          const servicePanel = serviceItem.querySelector('.site-nav__dropdown');
          const serviceMatch = !query || matches(serviceTrigger) || serviceLinks.some(matches);
          const matchingService = query && serviceLinks.some(matches);
          serviceItem.hidden = !serviceMatch;
          serviceLinks.forEach(link => {
            link.hidden = Boolean(query) && !matches(link);
          });
          if (serviceTrigger && servicePanel && matchingService) {
            serviceItem.classList.add('is-open');
            serviceTrigger.setAttribute('aria-expanded', 'true');
            servicePanel.setAttribute('aria-hidden', 'false');
          } else if (serviceTrigger && servicePanel && (!query || !matchingService)) {
            serviceItem.classList.remove('is-open');
            serviceTrigger.setAttribute('aria-expanded', 'false');
            servicePanel.setAttribute('aria-hidden', 'true');
          }
        }
        if (messages) {
          messages.hidden = Boolean(query) && !messageLinks.some(matches);
        }
        if (profile) {
          profile.hidden = Boolean(query) && !matches(profile);
        }
      };

      searchInput.addEventListener('input', updateSearch);
      searchInput.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          searchInput.value = '';
          updateSearch();
          searchInput.blur();
        }
      });
      return searchInput;
    }

    controllers.forEach(enhanceSidebar);
    document.body.classList.add('qt-sidebar-shell');

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

    function syncSidebarToggle(controller) {
      if (!controller.header || isMobile()) {
        controller.toggle.setAttribute('aria-expanded',
          controller.nav.classList.contains('is-open') ? 'true' : 'false');
        controller.toggle.setAttribute('aria-label', controller.nav.classList.contains('is-open')
          ? controller.closeLabel : controller.openLabel);
        return;
      }
      const collapsed = controller.header.classList.contains('is-collapsed');
      controller.toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      controller.toggle.setAttribute('aria-label', collapsed
        ? controller.expandLabel : controller.collapseLabel);
    }

    // فاز ۱-۲: تابع واحد وضعیت منو. کلاس is-open، صفت aria-hidden ناوبری
    // (فقط در حالت drawer موبایل؛ ریل دسکتاپ همیشه در دسترس است)، وضعیت
    // aria-expanded/برچسب دکمه (از طریق syncSidebarToggle تا حالت collapse
    // دسکتاپ هم درست بماند)، کلاس قفل body و overflow این‌لاین — همه در یک
    // نقطه و هم‌زمان. هر مسیر باز/بسته کردن منو فقط همین تابع را صدا می‌زند.
    function setMenuState(controller, open) {
      const nav = controller.nav;
      nav.classList.toggle('is-open', open);
      if (isMobile()) {
        nav.setAttribute('aria-hidden', String(!open));
      } else {
        nav.removeAttribute('aria-hidden');
      }
      syncSidebarToggle(controller);
      const anyOpen = controllers.some(item => item.nav.classList.contains('is-open'));
      document.body.classList.toggle('service-nav-open', anyOpen);
      document.body.style.overflow = anyOpen && isMobile() ? 'hidden' : '';
    }

    function toggleSidebar(controller) {
      if (!controller.header) return;
      closeDropdowns(false);
      controller.header.classList.toggle('is-collapsed');
      controller.header.setAttribute('data-sidebar-state',
        controller.header.classList.contains('is-collapsed') ? 'collapsed' : 'expanded');
      document.body.classList.toggle('qt-sidebar-collapsed',
        controller.header.classList.contains('is-collapsed'));
      syncSidebarToggle(controller);
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
      setMenuState(controller, false);
      if (restoreFocus) {
        const target = controller.lastFocusedElement || controller.toggle;
        if (target && typeof target.focus === 'function') {
          target.focus({ preventScroll: true });
        }
      }
      controller.lastFocusedElement = null;
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
      setMenuState(controller, true);

      const firstLink = controller.nav.querySelector('a[href]');
      if (firstLink) firstLink.focus({ preventScroll: true });
    }

    function toggleDrawer(controller) {
      if (!isMobile()) {
        toggleSidebar(controller);
        return;
      }
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
      if (controller.header && !isMobile()) {
        controller.header.classList.remove('is-collapsed');
        controller.header.setAttribute('data-sidebar-state', 'expanded');
      }
      document.body.classList.remove('qt-sidebar-collapsed');
      // وضعیت اولیه: منو بسته است؛ aria-hidden/aria-expanded همین‌جا سینک می‌شود
      setMenuState(controller, false);
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const search = controllers[0] && controllers[0].nav.querySelector('.site-nav__search-input');
        if (search) {
          event.preventDefault();
          search.focus({ preventScroll: true });
        }
        return;
      }

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
      document.body.classList.remove('qt-sidebar-collapsed');
      controllers.forEach(controller => {
        if (controller.header) {
          if (isMobile()) {
            controller.header.classList.remove('is-collapsed');
            controller.header.setAttribute('data-sidebar-state', 'mobile');
          } else {
            controller.header.classList.remove('is-collapsed');
            controller.header.setAttribute('data-sidebar-state', 'expanded');
          }
        }
        syncSidebarToggle(controller);
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
