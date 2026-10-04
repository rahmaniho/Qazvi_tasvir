/**
 * قزوین تصویر — اسکریپت اصلی و تعاملات لندینگ پیج (Vanilla JS)
 * Brand: شرکت قزوین تصویر (با مسئولیت محدود — تأسیس ۱۳۷۴)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ۱. نوار پیشرفت اسکرول و هدر چسبان
  const scrollProgress = document.getElementById('scroll-progress');
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('back-to-top');

  function handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // پیشرفت اسکرول
    if (scrollProgress && docHeight > 0) {
      const progress = scrollY / docHeight;
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    // هدر چسبان
    if (navbar) {
      if (scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // دکمه بازگشت به بالا
    if (backToTopBtn) {
      if (scrollY > 500) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // مقدار اولیه

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ۲. منوی موبایل (Mobile Drawer)
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerLinks = document.querySelectorAll('.mobile-drawer__link');

  function toggleMobileMenu(forceState) {
    const isOpen = typeof forceState === 'boolean' ? forceState : !mobileDrawer.classList.contains('is-open');
    if (isOpen) {
      hamburgerBtn.classList.add('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      mobileDrawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    } else {
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      mobileDrawer.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => toggleMobileMenu());

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // بستن منو با دکمه Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        toggleMobileMenu(false);
      }
    });
  }

  // ۳. اسکرول‌اسپای و لینک فعال منو (Scrollspy)
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu__link');

  function updateActiveNavLink() {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  // ۴. انیمیشن ورود بخش‌ها با Intersection Observer
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // ۵. انیمیشن شمارش اعداد آماری (Count-up Animation)
  const statNumbers = document.querySelectorAll('.hero__stat-number[data-count]');
  let hasAnimatedStats = false;

  function toPersianDigits(n) {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/[0-9]/g, w => farsiDigits[+w]);
  }

  function startCountUp() {
    if (hasAnimatedStats) return;
    hasAnimatedStats = true;

    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-count'), 10);
      const prefix = stat.getAttribute('data-prefix') || '';
      const suffix = stat.getAttribute('data-suffix') || '';
      const duration = 1800; // ms
      const startTime = performance.now();

      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * target);

        stat.textContent = `${suffix}${toPersianDigits(currentVal)}${prefix}`;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          stat.textContent = `${suffix}${toPersianDigits(target)}${prefix}`;
        }
      }
      requestAnimationFrame(updateNumber);
    });
  }

  const statsSection = document.querySelector('.hero__stats');
  if (statsSection && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        startCountUp();
        statsObserver.disconnect();
      }
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  } else {
    startCountUp();
  }

  // ۶. کپی شماره تلفن و نمایش Toast
  const toastNotice = document.getElementById('toast-notice');
  const toastText = document.getElementById('toast-text');
  let toastTimer = null;

  function showToast(message) {
    if (!toastNotice) return;
    if (toastText) toastText.textContent = message;
    toastNotice.classList.add('is-active');
    
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('is-active');
    }, 3500);
  }

  const copyButtons = document.querySelectorAll('[data-copy-phone]');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const phoneNum = '09122815189';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(phoneNum).then(() => {
          showToast('شماره ۰۹۱۲۲۸۱۵۱۸۹ در کلیپ‌بورد کپی شد!');
        }).catch(() => {
          showToast('شماره رسمی: ۰۹۱۲ ۲۸۱ ۵۱۸۹');
        });
      } else {
        showToast('شماره رسمی: ۰۹۱۲ ۲۸۱ ۵۱۸۹');
      }
    });
  });

  // ۷. مدال مشاوره رایگان (Consultation Modal)
  const modalOverlay = document.getElementById('consultation-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const openModalButtons = document.querySelectorAll('[data-open-modal]');

  function openConsultationModal(serviceType = '') {
    if (!modalOverlay) return;
    modalOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (serviceType) {
      const modalSelect = modalOverlay.querySelector('#modal-service');
      if (modalSelect) modalSelect.value = serviceType;
    }
  }

  function closeConsultationModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  openModalButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openConsultationModal(service);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeConsultationModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeConsultationModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
        closeConsultationModal();
      }
    });
  }

  // ۸. اعتبارسنجی و ارسال فرم تماس اصلی (Contact Form)
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = contactForm.querySelector('#contact-name');
      const phoneInput = contactForm.querySelector('#contact-phone');
      const serviceSelect = contactForm.querySelector('#contact-service');
      const messageInput = contactForm.querySelector('#contact-message');
      const submitBtn = contactForm.querySelector('#contact-submit-btn');
      let isValid = true;

      // اعتبارسنجی نام
      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        nameInput.classList.add('is-invalid');
        isValid = false;
      } else {
        nameInput.classList.remove('is-invalid');
      }

      // اعتبارسنجی تلفن همراه (شروع با ۰۹ یا +989 یا 09)
      const phoneVal = phoneInput.value.trim();
      const phoneRegex = /^(\+98|0)?9\d{9}$/;
      if (!phoneRegex.test(phoneVal.replace(/\s+/g, ''))) {
        phoneInput.classList.add('is-invalid');
        isValid = false;
      } else {
        phoneInput.classList.remove('is-invalid');
      }

      if (!isValid) {
        showToast('لطفاً فیلدهای الزامی را به درستی تکمیل فرمایید.');
        return;
      }

      // وضعیت لودینگ ارسال فرم
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-dashoffset="0"></circle>
        </svg>
        در حال ثبت درخواست...
      `;

      // شبیه‌سازی ارسال موفق
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `✓ درخواست شما ثبت شد`;
        submitBtn.style.background = '#10B981';
        submitBtn.style.color = '#FFFFFF';

        showToast('پیام شما با موفقیت دریافت شد. کارشناسان قزوین تصویر به زودی تماس خواهند گرفت.');

        setTimeout(() => {
          contactForm.reset();
          submitBtn.innerHTML = originalBtnText;
          submitBtn.style.background = '';
          submitBtn.style.color = '';
        }, 4000);
      }, 1200);
    });
  }

  // ۹. اعتبارسنجی فرم مدال مشاوره
  const modalForm = document.getElementById('modal-form');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneInput = modalForm.querySelector('#modal-phone');
      const submitBtn = modalForm.querySelector('#modal-submit-btn');

      const phoneVal = phoneInput.value.trim();
      const phoneRegex = /^(\+98|0)?9\d{9}$/;
      if (!phoneRegex.test(phoneVal.replace(/\s+/g, ''))) {
        phoneInput.classList.add('is-invalid');
        showToast('لطفاً یک شماره همراه معتبر وارد فرمایید.');
        return;
      }
      phoneInput.classList.remove('is-invalid');

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'در حال ارسال...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✓ درخواست ثبت شد';
        submitBtn.style.background = '#10B981';
        submitBtn.style.color = '#FFFFFF';

        showToast('مشاوره رایگان برای شما ثبت شد. به زودی با شما تماس می‌گیریم.');
        setTimeout(() => {
          modalForm.reset();
          closeConsultationModal();
          submitBtn.innerHTML = 'ثبت درخواست مشاوره رایگان';
          submitBtn.style.background = '';
          submitBtn.style.color = '';
        }, 2000);
      }, 1000);
    });
  }
});
