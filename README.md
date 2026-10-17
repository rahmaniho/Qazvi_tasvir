# قزوین تصویر — وب‌سایت رسمی

سایت ریسپانسیو شرکت **قزوین تصویر (با مسئولیت محدود)** برای معرفی خدمات بازرگانی، ترابری و تأمین غذای سازمانی. سایت برای انتشار استاتیک روی GitHub Pages ساخته شده و از HTML، CSS و JavaScript بدون فریم‌ورک استفاده می‌کند.

> نسخهٔ فعلی، صفحهٔ اصلی را به معرفی و خلاصهٔ خدمات اختصاص می‌دهد و جزئیات اجرایی را در هشت صفحهٔ مستقل خدمات نگه می‌دارد؛ بنابراین محتوای سنگین ناوگان و کیترینگ در صفحهٔ نخست تکرار نمی‌شود.

## معماری اطلاعات

### صفحه‌های اصلی

- [`index.html`](index.html) — صفحهٔ اصلی فارسی، راست‌به‌چپ؛ معرفی شرکت، خدمات خلاصه، ناوگان، اعتبار، مشتریان، رزومه و فرم تماس.
- [`en/index.html`](en/index.html) — نسخهٔ انگلیسی، چپ‌به‌راست.
- [`services/index.html`](services/index.html) — hub خدمات و نقطهٔ ورود به هشت صفحهٔ مستقل.
- [`404.html`](404.html) — صفحهٔ خطای دوزبانه.

### هشت خدمت مشخص

1. [واردات و صادرات کالاهای مجاز](services/import-export.html)
2. [ترخیص گمرکی و امور بندری](services/customs-port.html)
3. [تأمین مواد اولیه و تجهیزات](services/sourcing.html)
4. [ترابری پرسنل کارخانجات](services/factory-transport.html)
5. [حمل‌ونقل درون‌شهری و سرویس‌های VIP](services/urban-vip.html)
6. [سرویس مدارس، ادارات و شرکت‌ها](services/school-office.html)
7. [تأمین غذای پرسنل و وعده‌های سازمانی](services/personnel-food.html) — صفحهٔ کامل غذا با هیرو تصویری، مزایا، فرآیند پنج‌مرحله‌ای، منوی چهار وعده با ۱۶ آیتم تصویری، گالری، فرم قرارداد و FAQ
8. [مشاوره بازرگانی و گشایش](services/trade-consulting.html)

## ناوبری و تجربهٔ کاربری

- منوی اصلی فارسی، منوی خدمات و drawer موبایل با ظاهر شیشه‌ای، backdrop blur، مرز گرادیانی، انیمیشن ورود، hover/focus و breakpoint ریسپانسیو مشترک هستند.
- لایهٔ ناوبری مشترک در [`assets/css/glass-navigation.css`](assets/css/glass-navigation.css) قرار دارد و در صفحهٔ فارسی، نسخهٔ انگلیسی و صفحه‌های مستقل خدمات استفاده می‌شود.
- منوی خدمات، هر هشت خدمت را با لینک مستقیم نمایش می‌دهد؛ drawer موبایل همان معماری را به شکل قابل لمس ارائه می‌کند.
- `Escape`، کلیک روی backdrop، قفل اسکرول، `aria-expanded`، `aria-controls`، `aria-hidden` و `focus-visible` برای منوی موبایل پیاده‌سازی شده‌اند.
- برای `prefers-reduced-motion: reduce` انیمیشن‌های ناوبری و اسکرول نرم غیرفعال یا کوتاه می‌شوند.
- محتوای فارسی با `dir="rtl"` و محتوای انگلیسی با `dir="ltr"` ارائه می‌شود.

## طراحی و دارایی‌ها

- [`assets/css/style.css`](assets/css/style.css) — سیستم طراحی و بخش‌های صفحهٔ اصلی.
- [`assets/css/service-pages.css`](assets/css/service-pages.css) — ظاهر صفحات مستقل خدمات.
- [`assets/css/glass-navigation.css`](assets/css/glass-navigation.css) — ناوبری شیشه‌ای مشترک.
- [`assets/js/main.js`](assets/js/main.js) — تم، فرم تماس، رفتار صفحهٔ اصلی و routeهای hash.
- [`assets/js/service-pages.js`](assets/js/service-pages.js) — کنترل مشترک header، dropdown خدمات، drawer موبایل و اسکرول همهٔ صفحات.
- `assets/fonts/` — فونت‌های محلی Vazirmatn و Inter؛ سایت به CDN وابسته نیست.
- `assets/img/sections/` — تصاویر hero و بخش‌های اصلی.
- `assets/img/fleet-specs/` — تصاویر واقعی ناوگان و VIP که در صفحهٔ مستقل خدمت VIP قابل استفاده‌اند.
- `assets/img/personnel-food/` — تصاویر آشپزخانه و وعده‌های سازمانی برای صفحهٔ غذای پرسنل.
- `assets/images/` و `assets/logos/` — نشان شرکت، آواتار، تصاویر ناوگان و لوگوهای برندها.

تصاویر در صورت وجود، با `<picture>` و WebP/ fallback JPG ارائه می‌شوند و تصاویر غیرضروری lazy-load هستند. تصویر hero اصلی و hero صفحات خدمات preload می‌شوند تا زمان نمایش محتوای اصلی کوتاه بماند.

## تولید صفحه‌های خدمات

محتوای هشت صفحهٔ فارسی و hub در [`tools/build-service-pages.py`](tools/build-service-pages.py) نگهداری می‌شود. پس از تغییر داده‌های خدمات، همهٔ خروجی‌ها را یک‌جا بازتولید کنید:

```bash
python3 tools/build-service-pages.py
```

صفحات تولیدشده را به‌صورت دستی ویرایش نکنید؛ تغییرات پایدار را در generator اعمال و سپس همین دستور را اجرا کنید.

## مسیریابی و لینک‌های قدیمی

بخش‌های محتوایی صفحهٔ اصلی همچنان با hashهای داخلی مانند `#about`، `#services`، `#fleet` و `#contact` قابل دسترسی‌اند. جزئیات خدمات دیگر hash صفحهٔ اصلی نیستند و مسیر مستقل دارند.

برای سازگاری با لینک‌های قدیمی، `assets/js/main.js` hashهای زیر را به مقصد canonical هدایت می‌کند:

- `#fleet-specs` → `services/urban-vip.html`
- `#personnel-food`، `#food-menu`، `#food-gallery`، `#food-request` و `#food-faq` → `services/personnel-food.html`

## فرم تماس

فرم تماس صفحهٔ اصلی پس از اعتبارسنجی سمت کاربر، پیام آمادهٔ شامل اطلاعات درخواست را به واتساپ رسمی شرکت هدایت می‌کند. CTAهای صفحات خدمات به فرم تماس مشترک در صفحهٔ اصلی (`../index.html#contact`) می‌رسند و شمارهٔ تلفن/WhatsApp در همان ناحیهٔ تماس در دسترس است.

## تست و بررسی محلی

دستورهای بررسی مورد استفاده در refactor:

```bash
python3 tools/check-html.py index.html en/index.html services/index.html services/*.html
python3 tools/check-css-direction.py
node --check assets/js/main.js
node --check assets/js/service-pages.js
python3 -m py_compile tools/build-service-pages.py
git diff --check
```

برای smoke test زمان اجرا، ابزار [`tools/smoke-test.mjs`](tools/smoke-test.mjs) به `jsdom` نیاز دارد. در محیط توسعه می‌توان آن را موقتاً نصب کرد:

```bash
npm install --no-save --no-package-lock jsdom@24
node tools/smoke-test.mjs
```

اجرای محلی:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

سپس `http://127.0.0.1:4173/` را باز کنید. برای بررسی انتشار GitHub Pages، مسیرهای زیر را نیز مستقیم امتحان کنید:

- `https://rahmaniho.github.io/Qazvi_tasvir/`
- `https://rahmaniho.github.io/Qazvi_tasvir/services/index.html`
- یکی از صفحات مستقل مانند `services/import-export.html`

## دسترس‌پذیری و سئو

- ساختار معنایی `header`، `nav`، `main`، `section`، `article` و `footer`.
- ترتیب heading، متن جایگزین معنادار تصاویر، لینک پرش به محتوا و focus-visible.
- پشتیبانی از کیبورد و صفحه‌خوان برای drawer، dropdown و CTAها.
- متادیتای `title`، description، canonical، Open Graph و hreflang فارسی/انگلیسی.
- JSON-LD سازمان و خدمات با لینک‌های مستقل؛ JSON-LDهای حذف‌شدهٔ مربوط به hashهای قدیمی در صفحهٔ اصلی باقی نمانده‌اند.
- مسیرهای محلی، fragmentها و JSON-LD باید پیش از انتشار با checkerهای بالا بررسی شوند.

## انتشار

مخزن از ساختار استاتیک ریشه استفاده می‌کند؛ `main` و پوشهٔ root در تنظیمات GitHub Pages کافی است. فایل‌های build‌شده، CSS، JavaScript و دارایی‌های تصویری باید همراه خروجی commit شوند. پس از هر تغییر محتوایی، لینک‌های محلی و مسیرهای deep-link را نیز بررسی کنید.
