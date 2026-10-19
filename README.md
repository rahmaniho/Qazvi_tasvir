# قزوین تصویر — وب‌سایت رسمی

سایت رسمی شرکت **قزوین تصویر (با مسئولیت محدود)** برای معرفی خدمات بازرگانی، ترابری و تأمین غذای سازمانی.

سایت کاملاً **استاتیک** است و روی GitHub Pages با دامنهٔ اختصاصی `qazvintasvir.ir` منتشر می‌شود. هیچ فریم‌ورک فرانت‌اند، هیچ فرایند build برای HTML و هیچ وابستگی npm در زمان اجرا وجود ندارد: HTML، CSS و JavaScript ساده در مرورگر اجرا می‌شوند و اسکریپت‌های پایتون فقط محتوای تکراری (صفحات خدمات و نسخهٔ انگلیسی) را تولید می‌کنند.

## ساختار

```
index.html                     صفحهٔ اصلی فارسی (master همهٔ محتوا)
en/index.html                  نسخهٔ انگلیسی — تولیدشده، دستی ویرایش نشود
services/index.html            فهرست خدمات
services/*.html                هشت صفحهٔ مستقل خدمات — تولیدشده
404.html                       صفحهٔ خطای دوزبانه (noindex)
assets/css/style.css           سیستم طراحی صفحهٔ اصلی
assets/css/service-pages.css   طراحی صفحات خدمات
assets/css/nav/*.css           ناوبری مشترک (توکن، ساختار، ریل دسکتاپ)
assets/js/main.js              فرم، تم، مسیریابی هش، تعاملات صفحهٔ اصلی
assets/js/navigation.js        کنترل ناوبری و drawer موبایل
assets/js/service-pages.js     تعاملات سبک صفحات خدمات
assets/fonts/                  Vazirmatn و Inter (محلی، بدون CDN)
i18n/                          منبع ترجمه و ابزار استخراج رشته‌ها
tools/                         تولیدکننده‌ها و دروازه‌های کیفیت
.github/workflows/ci.yml       اعتبارسنجی خودکار (بدون دسترسی نوشتن)
CNAME                          دامنهٔ GitHub Pages
```

## صفحات و معماری اطلاعات

| مسیر | زبان | توضیح |
| --- | --- | --- |
| `/` | fa | صفحهٔ اصلی: معرفی، خدمات، ناوگان، برندها، سوابق، رزومه، اعتبارنامه و تماس |
| `/en/` | en | نسخهٔ انگلیسی با همان ساختار بخش‌ها |
| `/services/` | fa | فهرست هشت خدمت |
| `/services/import-export.html` | fa | واردات و صادرات کالاهای مجاز |
| `/services/customs-port.html` | fa | ترخیص گمرکی و امور بندری |
| `/services/sourcing.html` | fa | تأمین مواد اولیه و تجهیزات |
| `/services/factory-transport.html` | fa | ترابری پرسنل کارخانجات |
| `/services/urban-vip.html` | fa | حمل‌ونقل درون‌شهری و سرویس VIP |
| `/services/school-office.html` | fa | سرویس مدارس، ادارات و شرکت‌ها |
| `/services/personnel-food.html` | fa | تأمین غذای پرسنل و وعده‌های سازمانی |
| `/services/trade-consulting.html` | fa | مشاوره بازرگانی و گشایش |

بخش‌های صفحهٔ اصلی با hash جابه‌جا می‌شوند (`#about`، `#services`، `#fleet`، `#contact` و…). این رفتار عمداً حفظ شده است: بدون JavaScript همهٔ بخش‌ها به‌صورت یک صفحهٔ بلند دیده می‌شوند و با JavaScript فقط بخش جاری نمایش داده می‌شود.

## تولید محتوا

### صفحات خدمات

محتوای هشت صفحه در `tools/build-service-pages.py` نگهداری می‌شود. پس از هر تغییر:

```bash
python3 tools/build-service-pages.py
```

خروجی‌ها را دستی ویرایش نکنید؛ تغییر پایدار را در generator بدهید. CTA هر خدمت پارامتر `?service=` را به فرم تماس می‌فرستد تا نوع خدمت از پیش انتخاب شود.

### نسخهٔ انگلیسی

`en/index.html` از `index.html` + `i18n/en.json` ساخته می‌شود:

```bash
python3 tools/extract-i18n-strings.py   # پس از تغییر متن فارسی
python3 tools/build-i18n-site.py        # ساخت fa و en + sitemap
python3 tools/build-i18n-site.py --check
```

قواعد تولیدکننده: پوشش کامل ترجمه، حفظ تگ‌های درون‌خطی، حفظ اعداد ثبتی و تلفن، و جلوگیری از حروف فارسی در صفحهٔ انگلیسی. اگر رشته‌ای در فارسی تغییر کند و ترجمهٔ آن به‌روز نشود، `--check` شکست می‌خورد.

## اجرای محلی

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

سپس `http://127.0.0.1:4173/` و `http://127.0.0.1:4173/en/`.

## دروازه‌های کیفیت

همهٔ این دستورها بدون وابستگی خارجی اجرا می‌شوند و در CI هم اجرا می‌شوند:

```bash
python3 tools/check-html.py index.html en/index.html 404.html services/*.html
python3 tools/check-site.py              # لینک، لنگر، هدینگ، متادیتا، JSON-LD، hreflang، sitemap، CNAME
python3 tools/check-css-direction.py      # RTL/LTR
python3 tools/build-i18n-site.py --check
python3 -m py_compile tools/*.py
node --check assets/js/main.js
node --check assets/js/navigation.js
node --check assets/js/service-pages.js
```

`tools/smoke-test.mjs` آزمون زمان اجرا با jsdom است (اختیاری، چون jsdom جزو وابستگی‌های پروژه نیست):

```bash
npm install --no-save --no-package-lock jsdom@24
node tools/smoke-test.mjs
```

این آزمون مسیرهای هش، سوییچر زبان، ریل دسکتاپ، drawer موبایل، Escape، فوکوس‌تراپ و اعتبارسنجی فرم را بررسی می‌کند.

## انتشار

- GitHub Pages از شاخهٔ `main` و پوشهٔ ریشه منتشر می‌شود.
- فایل `CNAME` دامنهٔ `qazvintasvir.ir` را تثبیت می‌کند و `.nojekyll` پردازش Jekyll را خاموش می‌کند.
- گردش‌کار `.github/workflows/ci.yml` فقط اعتبارسنجی است (`permissions: contents: read`) و هیچ deploy یا secret ندارد. انتشار همان مسیر تنظیمات Pages باقی می‌ماند.
- پیش از merge، CI باید سبز باشد. اگر ترجمه، لینک، ساختار HTML یا خروجی generator خراب باشد، انتشار نسخهٔ جدید توصیه نمی‌شود.

## فرم تماس و حریم خصوصی

فرم صفحهٔ اصلی داده‌ای را در سرور ذخیره نمی‌کند. پس از اعتبارسنجی سمت مرورگر، متن درخواست در WhatsApp باز می‌شود و کاربر خودش ارسال نهایی را تأیید می‌کند. این رفتار در متن فرم و در پیام موفقیت صریح بیان شده است. شمارهٔ رسمی: `+989122815189`.

هیچ Backend، پایگاه داده، شمارهٔ پیگیری یا ابزار تحلیل وب در پروژه وجود ندارد؛ بنابراین هیچ ادعایی دربارهٔ ثبت درخواست در سرور یا اندازه‌گیری نرخ تبدیل مطرح نمی‌شود.

## سئو و داده‌های ساختاریافته

- هر صفحه `title`، `description`، `canonical` و `robots` مستقل دارد.
- `hreflang` فارسی/انگلیسی و `x-default` در هر دو نسخه متقابل است.
- JSON-LD شامل `Organization`/`LocalBusiness` در صفحهٔ اصلی و `Service` + `BreadcrumbList` در صفحات خدمات است. هیچ `Review`، `AggregateRating`، مختصات جغرافیایی یا دادهٔ تأییدنشده در Schema نیست.
- `sitemap.xml` و `robots.txt` با ساختار واقعی سایت هم‌خوان‌اند.

## نکات محتوایی که نیاز به تأیید شرکت دارد

این موارد در `docs/content-review.md` فهرست شده‌اند: تاریخ/سرمایهٔ ثبتی، تعداد سهام، ادعای عضویت اتاق بازرگانی و پروانهٔ ترابری، آمار مطالعهٔ موردی، و برخی اعداد سوابق. تا تأیید رسمی، از افزودن دادهٔ جدید به Schema یا متن خودداری کنید.

## محدودیت‌ها

- اندازه‌گیری میدانی Core Web Vitals (LCP/INP/CLS) بدون دادهٔ واقعی کاربران انجام نشده است؛ اعداد هدف در گزارش فنی آمده‌اند، نه به‌عنوان نتیجهٔ اندازه‌گیری.
- GitHub Pages امکان تنظیم هدرهای امنیتی (CSP سمت سرور، HSTS، X-Frame-Options) را نمی‌دهد. هرگونه CSP باید با میزبانی واسط یا ارائه‌دهندهٔ دیگر اعمال شود.
- صفحات خدمات فقط فارسی هستند؛ نسخهٔ انگلیسی آن‌ها وجود ندارد و `hreflang` آن‌ها نیز همین را منعکس می‌کند.
