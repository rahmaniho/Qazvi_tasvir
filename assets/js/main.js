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
      hamburgerBtn.setAttribute('aria-label', 'بستن منوی موبایل');
      mobileDrawer.classList.add('is-open');
      mobileDrawer.setAttribute('aria-hidden', 'false'); // اعلام وضعیت باز به صفحه‌خوان‌ها
      document.body.style.overflow = 'hidden';

      // انتقال فوکوس به اولین لینک منو برای ناوبری کامل با کیبورد
      const firstLink = mobileDrawer.querySelector('.mobile-drawer__link');
      if (firstLink) firstLink.focus({ preventScroll: true });
    } else {
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'باز کردن منوی موبایل');
      mobileDrawer.classList.remove('is-open');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => toggleMobileMenu());

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // بستن منو با دکمه Escape و بازگرداندن فوکوس به دکمه منو
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        toggleMobileMenu(false);
        hamburgerBtn.focus({ preventScroll: true });
      }
    });
  }

  // ۳. (حذف شد) اسکرول‌اسپای — با مسیریابی هشی، هر بخش صفحهٔ مستقل خودش را دارد و
  // لینک فعال منو توسط روتر (بخش ۱۵) بر اساس صفحهٔ جاری تعیین می‌شود. این کار یک
  // شنوندهٔ scroll سراسری را هم حذف می‌کند.

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

  // ۹. اسکلتون لودینگ تصاویر ناوگان (Image Skeleton Loading)
  //    تا پیش از آماده شدن تصویر، پس‌زمینه شیمر نمایش داده می‌شود و پس از
  //    بارگذاری، تصویر با محو شدن ملایم ظاهر می‌شود.
  const fleetImages = document.querySelectorAll('.fleet-card__img');
  fleetImages.forEach(img => {
    const media = img.closest('.fleet-card__media');
    if (!media) return;

    const markLoaded = () => media.classList.add('is-loaded');

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();                       // تصویر از کش مرورگر آماده است
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true }); // جلوگیری از گیر کردن اسکلتون
    }
  });

  // ۱۰. اعتبارسنجی فرم مدال مشاوره
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

  // ۱۱. بخش تأمین غذای پرسنل — تب‌بندی منوی وعده‌ها (Accessible Tabs)
  const foodTabs = Array.from(document.querySelectorAll('.food-tab'));
  const foodPanels = Array.from(document.querySelectorAll('.food-panel'));

  function activateFoodTab(targetTab) {
    foodTabs.forEach(tab => {
      const isTarget = tab === targetTab;
      tab.classList.toggle('is-active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.tabIndex = isTarget ? 0 : -1;
    });

    const targetPanelId = targetTab.getAttribute('aria-controls');
    foodPanels.forEach(panel => {
      const isTarget = panel.id === targetPanelId;
      panel.classList.toggle('is-active', isTarget);
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  if (foodTabs.length) {
    foodTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateFoodTab(tab));

      // ناوبری با کیبورد مطابق الگوی WAI-ARIA (در RTL جهت کلیدها معکوس است)
      tab.addEventListener('keydown', (e) => {
        let nextIndex = null;
        if (e.key === 'ArrowLeft') {
          nextIndex = (index + 1) % foodTabs.length;
        } else if (e.key === 'ArrowRight') {
          nextIndex = (index - 1 + foodTabs.length) % foodTabs.length;
        } else if (e.key === 'Home') {
          nextIndex = 0;
        } else if (e.key === 'End') {
          nextIndex = foodTabs.length - 1;
        }

        if (nextIndex === null) return;
        e.preventDefault();
        activateFoodTab(foodTabs[nextIndex]);
        foodTabs[nextIndex].focus({ preventScroll: true });
      });
    });
  }

  // ۱۲. بخش تأمین غذای پرسنل — انتخاب وعده‌ها و آینه‌سازی برای ارسال
  const mealInputs = Array.from(document.querySelectorAll('.food-meal input[type="checkbox"]'));
  const mealsMirror = document.getElementById('food-meals-mirror');
  const mealsFeedback = document.querySelector('[data-feedback-for="food-meals"]');

  function syncMealSelection() {
    const picked = [];
    mealInputs.forEach(input => {
      const label = input.closest('.food-meal');
      if (label) label.classList.toggle('is-checked', input.checked);
      if (input.checked) picked.push(input.value);
    });

    if (mealsMirror) mealsMirror.value = picked.join('، ');
    if (picked.length && mealsFeedback) mealsFeedback.classList.remove('is-error');
  }

  mealInputs.forEach(input => input.addEventListener('change', syncMealSelection));

  // ۱۳. بخش تأمین غذای پرسنل — اعتبارسنجی و ارسال فرم درخواست قرارداد
  const foodForm = document.getElementById('personnel-food-form');

  if (foodForm) {
    // تبدیل ارقام فارسی/عربی به لاتین برای اعتبارسنجی دقیق شماره و تعداد
    function toLatinDigits(value) {
      const persianDigits = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
      const arabicDigits = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
      return String(value).replace(/[۰-۹٠-٩]/g, d => persianDigits[d] || arabicDigits[d] || d);
    }

    const foodFields = [
      {
        el: foodForm.querySelector('#food-company'),
        validate: v => v.trim().length >= 2
      },
      {
        el: foodForm.querySelector('#food-person'),
        validate: v => v.trim().length >= 2
      },
      {
        el: foodForm.querySelector('#food-phone'),
        validate: v => /^(\+98|0098|0)?9\d{9}$/.test(toLatinDigits(v).replace(/[\s\-()]/g, ''))
      },
      {
        el: foodForm.querySelector('#food-headcount'),
        validate: v => {
          const n = parseInt(toLatinDigits(v).replace(/[^\d]/g, ''), 10);
          return !isNaN(n) && n >= 10 && n <= 50000;
        }
      },
      {
        el: foodForm.querySelector('#food-address'),
        validate: v => v.trim().length >= 5
      }
    ];

    function setFoodFieldState(el, isValid) {
      if (!el) return;
      el.classList.toggle('is-invalid', !isValid);
      el.setAttribute('aria-invalid', isValid ? 'false' : 'true');

      const feedback = foodForm.querySelector(`[data-feedback-for="${el.id}"]`);
      if (feedback) feedback.classList.toggle('is-error', !isValid);
    }

    // پاک شدن خطا هنگام تصحیح فیلد توسط کاربر
    foodFields.forEach(field => {
      if (!field.el) return;
      field.el.addEventListener('input', () => {
        if (field.el.classList.contains('is-invalid')) {
          setFoodFieldState(field.el, field.validate(field.el.value));
        }
      });
    });

    foodForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      let firstInvalid = null;

      foodFields.forEach(field => {
        if (!field.el) return;
        const ok = field.validate(field.el.value);
        setFoodFieldState(field.el, ok);
        if (!ok) {
          isValid = false;
          if (!firstInvalid) firstInvalid = field.el;
        }
      });

      const pickedMeals = mealInputs.filter(input => input.checked);
      if (mealsFeedback) mealsFeedback.classList.toggle('is-error', pickedMeals.length === 0);
      if (!pickedMeals.length) {
        isValid = false;
        if (!firstInvalid) firstInvalid = mealInputs[0];
      }

      if (!isValid) {
        showToast('لطفاً فیلدهای الزامی فرم تأمین غذا را به درستی تکمیل فرمایید.');
        if (firstInvalid) firstInvalid.focus({ preventScroll: true });
        return;
      }

      const submitBtn = foodForm.querySelector('#food-submit-btn');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

      function setFoodBtnLoading(text) {
        if (!submitBtn) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spinner" width="20" height="20" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="31.415, 31.415" stroke-dashoffset="0"></circle>
          </svg>
          ${text}
        `;
      }

      function showFoodFormSuccess() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '✓ درخواست قرارداد شما ثبت شد';
          submitBtn.style.background = '#10B981';
          submitBtn.style.color = '#FFFFFF';
        }

        showToast('درخواست تأمین غذای پرسنل ثبت شد. کارشناس ما حداکثر تا ۲ ساعت کاری تماس می‌گیرد.');

        setTimeout(() => {
          foodForm.reset();
          foodFields.forEach(field => setFoodFieldState(field.el, true));
          if (mealsFeedback) mealsFeedback.classList.remove('is-error');
          syncMealSelection();

          if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.background = '';
            submitBtn.style.color = '';
          }
        }, 4500);
      }

      // ارسال به سرویس فرم آنلاین (Formspree / Netlify Forms) در صورت تنظیم action سازنده
      const isEndpointConfigured = foodForm.action.indexOf('YOUR_FORM_ID') === -1;

      if (!isEndpointConfigured) {
        // حالت پیش‌فرض: سرویس فرم هنوز تنظیم نشده است — پیام موفقیت نمایش داده می‌شود
        // برای اتصال واقعی، مقدار action فرم را در index.html با شناسه فرم خود جایگزین کنید.
        setFoodBtnLoading('در حال ثبت درخواست...');
        setTimeout(showFoodFormSuccess, 1200);
        return;
      }

      setFoodBtnLoading('در حال ثبت درخواست...');

      fetch(foodForm.action, {
        method: foodForm.method || 'POST',
        body: new FormData(foodForm),
        headers: { Accept: 'application/json' }
      })
        .then(response => {
          if (response.ok) {
            showFoodFormSuccess();
            return;
          }
          throw new Error('Form endpoint responded with ' + response.status);
        })
        .catch(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          showToast('ارسال خودکار درخواست انجام نشد؛ لطفاً به صورت تلفنی یا واتساپی درخواست خود را ثبت کنید.');
        });
    });
  }
  // ۱۴. اعتبار انیمیشنی «طراحی و توسعه: کارن سافت» در نوار پایین فوتر (KarenSoft Credit)
  const ksCredit = document.getElementById('ks-credit');
  if (ksCredit) {
    const ksReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // کلیدهای ترجمه (i18n): fa = «طراحی و توسعه:» | en = "Designed & Developed by"
    const KS_LABELS = {
      fa: 'طراحی و توسعه:',
      en: 'Designed & Developed by'
    };
    // زبان فعال سایت؛ fa پیش‌فرض است، در صورت تغییر به en برچسب انگلیسی جایگزین می‌شود
    const ksLang = (document.documentElement.getAttribute('lang') || 'fa')
      .toLowerCase().indexOf('en') === 0 ? 'en' : 'fa';
    const ksActiveLabel = KS_LABELS[ksLang];

    // هر کلمه در یک span جدا (هرگز حرف‌به‌حرف — شکستن حروف فارسی/عربی اتصال حروف را خراب می‌کند)
    function ksSplitLabel(labelEl, delayBase) {
      if (!labelEl) { return; }
      const text = KS_LABELS[labelEl.getAttribute('lang') === 'en' ? 'en' : 'fa'];
      labelEl.textContent = '';
      text.split(' ').forEach((word, index) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'ks-label__word ks-label-gradient';
        wordEl.textContent = word;
        wordEl.style.setProperty('--ks-delay', (delayBase + index * 0.12).toFixed(2) + 's');
        labelEl.appendChild(wordEl);
      });
    }
    ksSplitLabel(ksCredit.querySelector('.ks-label--fa'), 0.1);
    ksSplitLabel(ksCredit.querySelector('.ks-label--en'), 0.1);

    // نام‌گذاری دسترس‌پذیر پیوند + tooltip
    const ksAriaLabel = ksActiveLabel + ' کارن سافت | KarenSoft — www.karen-soft.ir';
    ksCredit.setAttribute('aria-label', ksAriaLabel);
    ksCredit.setAttribute('title', ksAriaLabel);

    // در حالت «کاهش موشن» هیچ انیمیشن پیوسته‌ای لازم نیست؛ لایه‌های تزئینی حذف می‌شوند
    if (ksReduceMotion) {
      ksCredit
        .querySelectorAll('.ks-ring, .ks-shine, .ks-ripple, .ks-logo-ring, .ks-orbit, .ks-particle, .ks-text-shine-mask')
        .forEach(el => el.remove());
    }

    // ورود پله‌ای فقط یک‌بار، وقتی دست‌کم نیمی از اعتبار دیده شود
    if (ksReduceMotion || !('IntersectionObserver' in window)) {
      ksCredit.classList.add('is-visible');
    } else {
      const ksObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      ksObserver.observe(ksCredit);
    }
  }

  // ۱۵. مسیریابی صفحه‌ها با هش (Hash Router)
  // ---------------------------------------------------------------------------
  // هر بخش اصلی سایت یک «صفحه»ی مستقل است و با هش آدرس (#services و…) نمایش
  // داده می‌شود. بدون جاوااسکریپت کلاس js-pages اضافه نمی‌شود و همهٔ بخش‌ها مثل
  // قبل به‌صورت یک صفحهٔ بلند دیده می‌شوند؛ پس این تغییر کاملاً تدریجی است.
  //
  // بهینه‌سازی‌هایی که همین ساختار به همراه دارد:
  //   • فقط صفحهٔ جاری در چیدمان شرکت می‌کند؛ بخش‌های پنهان (display:none) نه
  //     نقاشی می‌شوند و نه انیمیشن‌هایشان اجرا می‌شود.
  //   • تصاویر بخش‌های دیده‌نشده (loading="lazy") تا لحظهٔ ورود به آن صفحه دانلود
  //     نمی‌شوند؛ صفحهٔ غذا با ۱۰ تصویر سنگین‌ترین بخش سایت است.
  //   • عنوان و توضیحات متای صفحه با هر مسیر به‌روز می‌شود.
  const pageEls = Array.from(document.querySelectorAll('.site-page'));
  if (pageEls.length) {
    const HOME_PAGE = pageEls[0];               // #hero نخستین صفحه است
    const BASE_TITLE = document.title;
    const BASE_DESCRIPTION = (document.querySelector('meta[name="description"]') || {}).content || '';

    // عنوان و توضیح هر مسیر.
    // صفحه‌های غیرفارسی یک شیء QT_ROUTE_META تزریق‌شده دارند (ساختهٔ
    // tools/build-i18n-site.py) که همین‌جا جای مقادیر فارسی را می‌گیرد.
    const ROUTE_META = window.QT_ROUTE_META || {
      hero: {
        title: BASE_TITLE,
        desc: BASE_DESCRIPTION
      },
      about: {
        title: 'درباره شرکت قزوین تصویر | بیش از ۳۱ سال بازرگانی، ترابری و تأمین غذای پرسنل',
        desc: 'شرکت قزوین تصویر (با مسئولیت محدود — تأسیس ۱۳۷۴) به مدیریت سعید امین‌زاده؛ بازرگانی، واردات و صادرات، ترابری پرسنل صنایع و تأمین غذای سازمانی.'
      },
      services: {
        title: 'خدمات تخصصی | حمل و نقل مسافربری، تهیه و پخش غذا، واردات و صادرات، خرید و فروش کالا — قزوین تصویر',
        desc: 'چهار حوزه اصلی فعالیت شرکت قزوین تصویر: حمل و نقل مسافربری، خدمات و تشریفات و تهیه و پخش غذا، واردات و صادرات و خرید و فروش کالاهای مجاز.'
      },
      fleet: {
        title: 'ناوگان ترابری | اتوبوس، مینی‌بوس و ون سرویس پرسنل — قزوین تصویر',
        desc: 'ناوگان ملکی اتوبوس، مینی‌بوس و ون با بیمه کامل سرنشین برای سرویس ایاب‌وذهاب پرسنل کارخانه‌ها، ادارات و مدارس استان قزوین.'
      },
      'fleet-specs': {
        title: 'مشخصات فنی ناوگان | موتور D4AL، ۱۷+۱ صندلی و سرویس‌های VIP — قزوین تصویر',
        desc: 'مشخصات فنی کامل مینی‌بوس‌های ۱۷+۱ نفرهٔ ناوگان حمل‌ونقل درون‌شهری قزوین تصویر (موتور توربودیزل D4AL، گیربکس M3S5) و تصاویر واقعی سرویس‌ها؛ برگرفته از رزومه رسمی شرکت.'
      },
      'personnel-food': {
        title: 'تأمین غذای پرسنل و کیترینگ سازمانی | صبحانه، ناهار، شام — قزوین تصویر',
        desc: 'تأمین غذای پرسنل کارخانه‌ها و شرکت‌ها با منوی متنوع، استانداردهای بهداشتی HACCP و توزیع در محل؛ درخواست قرارداد و دریافت پیش‌فاکتور.'
      },
      brands: {
        title: 'برندهای همکار ناوگان | اسکانیا، ولوو، مرسدس بنز و ایویکو — قزوین تصویر',
        desc: 'ناوگان قزوین تصویر از برندهای اسکانیا، ولوو، مرسدس بنز، ایویکو و ایران خودرو دیزل تشکیل شده است.'
      },
      'why-us': {
        title: 'چرا قزوین تصویر؟ | ۳۱+ سال سابقه، ناوگان ملکی و پشتیبانی ۲۴/۷',
        desc: 'سابقه از ۱۳۷۴، مدیریت سعید امین‌زاده، ناوگان ملکی مجهز، شبکه تأمین داخلی و خارجی، قراردادهای منعطف و رضایت بالای مشتریان.'
      },
      clients: {
        title: 'مشتریان و همکاران تجاری | سوابق همکاری با نستله، ال‌جی، یونیلیور و هنکل — قزوین تصویر',
        desc: 'سوابق قراردادی قزوین تصویر با نستله ایران، گلدایران (ال‌جی)، یونیلیور، هنکل، BAT، آلکاپلاستیک، کابل البرز، شیر سحر، AGT و آسان پک؛ جدول ناوگان واگذارشده و بازه‌های همکاری، برگرفته از رزومه رسمی شرکت.'
      },
      trust: {
        title: 'اعتبار و اطلاعات ثبتی | شناسه ملی ۱۰۸۶۱۴۱۵۲۱۵ — قزوین تصویر',
        desc: 'شناسه ملی ۱۰۸۶۱۴۱۵۲۱۵، شماره ثبت ۲۷۴۹، کد اقتصادی ۴۱۱۳۸۶۸۳۷۶۶۵ و تاریخ تأسیس ۱۳۷۴/۰۲/۱۴؛ اطلاعات قابل استعلام شرکت قزوین تصویر.'
      },
      resume: {
        title: 'رزومه شرکت قزوین تصویر | شناسنامه، حوزه‌های فعالیت و سوابق همکاری',
        desc: 'رزومه رسمی شرکت قزوین تصویر: ۳۱+ سال سابقه از ۱۳۷۴، ۸۴ دستگاه خودرو واگذارشده در ۱۰ قرارداد سازمانی، سه حوزه فعالیت و شناسنامه کامل ثبتی؛ قابل دریافت در قالب PDF.'
      },
      contact: {
        title: 'تماس با قزوین تصویر | درخواست مشاوره، استعلام قیمت و عقد قرارداد',
        desc: 'تماس مستقیم ۰۹۱۲ ۲۸۱ ۵۱۸۹، واتساپ و فرم درخواست مشاوره رایگان؛ قزوین، اول خیابان فردوسی، مجتمع آبادگران، طبقه ۶، اتاق ۶۰۴.'
      }
    };

    const metaDescription = document.querySelector('meta[name="description"]');
    // لینک‌های منو (دسکتاپ، موبایل و فوتر) صفحهٔ جاری را نشان می‌دهند؛ لینک‌های
    // لنگرِ داخلی (مثل #food-menu که داخل صفحهٔ غذاست) هیچ‌وقت با شناسهٔ یک صفحه
    // یکی نمی‌شوند، پس وضعیت اشتباه نمی‌گیرند.
    const menuLinks = Array.from(
      document.querySelectorAll('.nav-menu__link, .mobile-drawer__link, .footer__link')
    );

    // اعلام تغییر صفحه برای صفحه‌خوان‌ها
    let liveRegion = document.getElementById('route-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('p');
      liveRegion.id = 'route-announcer';
      liveRegion.className = 'visually-hidden';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }

    // هر صفحه یک بار tabindex می‌گیرد تا بتوان فوکوس را به آن منتقل کرد
    pageEls.forEach(page => {
      if (!page.hasAttribute('tabindex')) page.setAttribute('tabindex', '-1');
    });

    function currentHash() {
      // بدون علامت # و با رمزگشایی درصدی (مثلاً %D8%B4 برای حروف فارسی)
      return decodeURIComponent(window.location.hash.replace(/^#/, ''));
    }

    // هدف هش را به صفحهٔ مربوطه تبدیل می‌کند (لنگرهای داخلی به صفحهٔ والد می‌رسند)
    function resolveRoute(hash) {
      if (!hash) return { page: HOME_PAGE, target: null };
      const el = document.getElementById(hash);
      if (!el) return { page: HOME_PAGE, target: null };
      const page = el.closest('.site-page');
      return { page: page || null, target: el };
    }

    function setActiveMenuLink(page) {
      menuLinks.forEach(link => {
        const isCurrent = link.getAttribute('href') === '#' + page.id;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentPage = null;

    function scrollToTarget(target) {
      if (!target || target === document.getElementById('main-content')) return;
      const top = target.getBoundingClientRect().top + window.pageYOffset - 90; // ارتفاع هدر چسبان
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    function showRoute(hash, options) {
      const opts = options || {};
      const route = resolveRoute(hash);
      const page = route.page || (route.target ? currentPage : HOME_PAGE);

      // پرش فوری به بالا؛ انیمیشن اسکرول نرم برای تعویض صفحه مطلوب نیست
      document.documentElement.classList.add('is-page-switching');

      if (page && page !== currentPage) {
        pageEls.forEach(el => el.classList.remove('is-current'));
        page.classList.add('is-current');
        currentPage = page;

        const meta = ROUTE_META[page.id] || { title: BASE_TITLE, desc: BASE_DESCRIPTION };
        document.title = meta.title;
        if (metaDescription && meta.desc) metaDescription.setAttribute('content', meta.desc);

        // انیمیشن ورود صفحه (با احترام به کاهش حرکت)
        if (!prefersReducedMotion) {
          page.classList.remove('is-entering');
          void page.offsetWidth;             // ری‌استارت انیمیشن
          page.classList.add('is-entering');
        }
      }

      setActiveMenuLink(page || HOME_PAGE);

      if (opts.target && opts.target !== page) {
        // لنگر داخلی همان صفحه: فقط تا همان بخش اسکرول می‌کنیم
        requestAnimationFrame(() => scrollToTarget(opts.target));
      } else {
        window.scrollTo(0, 0);            // تعویض صفحه: همیشه از بالای صفحه شروع می‌شود
      }

      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove('is-page-switching');
      });

      // انتقال فوکوس به صفحهٔ جدید + اعلام برای صفحه‌خوان
      if (page && opts.moveFocus) {
        page.focus({ preventScroll: true });
        const heading = page.querySelector('h1, h2');
        liveRegion.textContent = (heading ? heading.textContent : page.getAttribute('aria-label') || '') .trim();
      }
    }

    // مسیر اولیه: کلاس js-pages در <head> اضافه شده تا پیش از اولین رنگ‌آمیزی
    // بخش‌های غیرجاری پنهان بمانند (بدون پرش محتوا)
    function routeFromHash(options) {
      const hash = currentHash();
      showRoute(hash, Object.assign({ target: hash ? document.getElementById(hash) : null }, options));
    }

    window.addEventListener('hashchange', () => {
      const hash = currentHash();
      const target = hash ? document.getElementById(hash) : null;
      showRoute(hash, { target: target, moveFocus: true });
    });

    // کلیک روی لینکی که هش آن با هش فعلی یکی است، رویداد hashchange تولید
    // نمی‌کند؛ در این حالت کاربر انتظار دارد به بالای همان صفحه برگردد.
    document.addEventListener('click', event => {
      const link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link) return;
      const href = link.getAttribute('href');
      if (href === '#' || href === '#main-content') return;   // لینک پرش به محتوا
      if (href === window.location.hash) {
        event.preventDefault();
        const target = document.getElementById(href.slice(1));
        const page = target ? target.closest('.site-page') : null;
        if (target && page && page !== target) {
          scrollToTarget(target);
        } else {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
      }
    });

    // فعال‌سازی مسیر جاری؛ اگر کاربر روی لینک عمیق آمده باشد، پیش از این لحظه
    // همهٔ صفحه‌ها پنهان بودند (کلاس qt-deeplink در <head>)
    routeFromHash({ moveFocus: false });
    document.documentElement.classList.remove('qt-deeplink');
  }
});

/* پارالاکس ملایم عکس‌های باند تصویری (فقط وقتی کاهش موشن غیرفعال است) */
(function () {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bands = Array.prototype.slice.call(document.querySelectorAll('.photo-band'));
  if (reduceMotion || !bands.length) return;
  let ticking = false;
  function updateParallax() {
    const vh = window.innerHeight;
    bands.forEach(function (band) {
      const r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      band.style.setProperty('--py', (p * -24).toFixed(1) + 'px');
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
  window.addEventListener('resize', updateParallax);
  updateParallax();
})();
