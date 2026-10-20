/**
 * قزوین تصویر — «QT Contact 10» | شمارندهٔ کاراکتر پیام
 * ---------------------------------------------------------------------------
 * یک لایهٔ افزایشی روی فرم تماس موجود. هیچ قاعدهٔ اعتبارسنجی یا ارسالی را
 * تغییر نمی‌دهد و هیچ داده‌ای را ذخیره نمی‌کند؛ فقط تعداد کاراکترهای فیلد
 * «توضیحات تکمیلی» را کنار خودش نشان می‌دهد.
 *
 * - سقف از خود `maxlength` خوانده می‌شود، نه از عدد ثابت در جاوااسکریپت.
 * - ارقام fa/en هم‌خوان با زبان صفحه‌اند و با `font-variant-numeric` جا
 *   نمی‌جهند.
 * - شمارنده از درخت دسترس‌پذیری بیرون است (`aria-hidden`) چون `maxlength`
 *   خودش سقف را به صفحه‌خوان اعلام می‌کند و اعلام هر کلید آزاردهنده است.
 * - پس از `form.reset()` (که main.js بعد از آماده‌سازی پیام صدا می‌زند) به
 *   صفر برمی‌گردد.
 */
(function () {
  'use strict';

  if (window.QTContact && window.QTContact.version) return;

  const VERSION = '10.0';
  const doc = document;
  const IS_EN = ((doc.documentElement.lang || 'fa').split('-')[0] || 'fa').toLowerCase() === 'en';
  const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let form = null;
  let field = null;
  let counter = null;
  let max = 0;

  function digits(value) {
    const text = String(value);
    if (IS_EN) return text;
    return text.replace(/[0-9]/g, digit => PERSIAN_DIGITS[Number(digit)]);
  }

  function lengthOf(value) {
    // هم‌خوان با شمارش مرورگر برای maxlength (واحد کد UTF-16)
    return String(value || '').length;
  }

  function render() {
    if (!counter || !field) return;
    const used = lengthOf(field.value);
    counter.textContent = digits(used) + ' / ' + digits(max);
    counter.classList.toggle('is-near', max > 0 && max - used <= 120 && used < max);
    counter.classList.toggle('is-max', max > 0 && used >= max);
    counter.dataset.qtCount = String(used);
  }

  function mount() {
    form = doc.getElementById('contact-form');
    field = form ? form.querySelector('#contact-message') : null;
    if (!form || !field) return false;
    if (field.dataset.qtCounter === 'true') return true;

    max = Number(field.getAttribute('maxlength')) || 0;
    if (max <= 0) return false;

    counter = doc.createElement('span');
    counter.className = 'qt-form-counter';
    counter.setAttribute('aria-hidden', 'true');
    counter.dataset.qtCounterFor = field.id;

    const hint = doc.getElementById('contact-message-hint');
    const anchor = hint && hint.parentElement === field.parentElement ? hint : field;
    anchor.insertAdjacentElement('afterend', counter);

    field.dataset.qtCounter = 'true';
    field.addEventListener('input', render);
    form.addEventListener('reset', () => window.setTimeout(render, 0));

    render();
    doc.documentElement.dataset.qtContactMounted = 'true';
    return true;
  }

  window.QTContact = {
    version: VERSION,
    mount,
    snapshot() {
      if (!field) return { mounted: false };
      return {
        mounted: true,
        count: lengthOf(field.value),
        max,
        text: counter ? counter.textContent : '',
        near: counter ? counter.classList.contains('is-near') : false,
        atMax: counter ? counter.classList.contains('is-max') : false
      };
    }
  };

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    window.setTimeout(mount, 0);
  }
})();
