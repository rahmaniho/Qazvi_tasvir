# گزارش بازسازی ناوبری — قزوین تصویر

اجرا بر اساس اسکیل `frontend-nav-refactor` و پرامپت اجرایی فازبندی‌شده.
تاریخ شروع: ۲۰۲۶-۱۰-۱۸ — شاخه: `arena/f1922343-qazvi-tasvir`

---

## فاز ۰ — گزارش کشف (پایه)

### نقشهٔ فایل‌ها و ترتیب لود

**index.html** — `<head>`:
1. `assets/css/style.css` (۱۶۳٬۶۰۲ بایت — لندینگ + نسل قدیمی ناوبری)
2. `assets/css/nav/nav-tokens.css`
3. `assets/css/nav/nav-base.css`
4. `assets/css/nav/nav-sidebar.css`

`<script>` انتهای body (بدون defer): `navigation.js` ← `service-pages.js` ← `main.js`

**404.html** — `service-pages.css` + هر سه فایل nav؛ اسکریپت‌ها با `defer`.

**services/*.html** و **en/** — خارج از محدودهٔ مجاز ویرایش؛ از همان CSS/JS ناوبری تغذیه می‌کنند (هر تغییر باید با آن‌ها سازگار بماند).

### جدول مقادیر پایه

| مورد | مقدار پایه |
|---|---|
| تعداد `!important` در `assets/css/nav/*.css` | **۰** |
| تعداد `html[dir="..."]` در `assets/css/nav/*.css` | **۰** (یک `[dir="ltr"]` برای تعریف `--qt-dir: -1` در nav-base.css:3) |
| تعداد `--qt-*` تعریف‌شده | **۲۶** |
| تعداد `--qt-*` مصرف‌شده | **۲۳** |
| آیکون‌های sprite | **۱۴ فریم `<g>`** (viewBox ‏896×64 = ‎14×64؛ فایل `<symbol>` ندارد) |
| مقدار `--qt-sprite-count` | **۱۴** ✅ سازگار |
| سلکتور JS فعال به عنصر ناموجود | **۱** — `.navbar` در `main.js:11` |
| سلکتورهای JS مرده (fallback نسل‌های قبل) | خانواده‌های `.nav-menu*`، `.nav-dropdown*`، `.mobile-drawer*` در navigation.js و main.js |
| حجم کل CSS ناوبری (gzip) | **۵٬۳۴۴ بایت** |

### شرط توقف sprite — بررسی شد، توقف لازم نیست

`grep -o '<symbol'` صفر برمی‌گرداند چون sprite از ۱۴ قاب `<g transform="translate(N)">` (هر قاب ۶۴px، عرض کل ۸۹۶px) ساخته شده، نه `<symbol>`. نظارت با `--qt-sprite-count: 14` کامل است:
- گرادیان‌ها: ۱۴ (`g-home` … `g-contact`)
- کامنت‌های فریم: `00 home` تا `13 contact`
- افست‌ها: 0, 64, 128 … 832

### یافته‌های کلیدی کشف

1. **باگ `.navbar`**: `main.js:11` به `.navbar` اشاره می‌کند که در هیچ HTML (index/404/services/en) وجود ندارد → کلاس `scrolled` هرگز اعمال نمی‌شود. قوانین `.navbar.scrolled` (style.css:438 و ‏6310) هم کد مرده‌اند.
2. **`is-scrolled` بدون مصرف‌کننده**: `service-pages.js` کلاس `is-scrolled` به `.site-header` اضافه می‌کند اما هیچ قانون CSSی برایش وجود ندارد.
3. **نسل قبلی ناوبری در style.css کاملاً مرده است**: `.navbar*` (L424–450)، `.nav-menu*` + `.nav-dropdown*` + `.navbar__actions` (L491–616)، `.hamburger-btn*` (L618–658)، `.mobile-drawer*` (L660–736)، و overrideهای مربوطه در L5816–5820، L6020–6028 و L6307–6320 — هیچ‌کدام در هیچ HTMLی مصرف نمی‌شوند (اثبات با grep روی هر ۱۲ فایل HTML).
4. **توکن‌های مرده**: `--qt-sidebar-pink`، `--qt-sidebar-surface-3`، `--qt-sidebar-ease` — صفر مصرف در کل مخزن.
5. **وابستگی ترتیب لود**: `.site-header { position: sticky }` در nav-base.css بدون مدیای صریح؛ نسخهٔ دسکتاپ `position: fixed` در nav-sidebar.css (درون `@media (min-width: 1024px)`) چون بعداً لود می‌شود برنده می‌شود.
6. **`--qt-dir` مصرف واقعی دارد** (translateX کشوی موبایل + چرخش chevron دسکتاپ) — نگه‌داری می‌شود.
7. **`role="menu"`/`role="menuitem"`** در index.html:275–285 و 404.html:113–122 هاردکد شده و navigation.js هم `role="menu"` و `aria-haspopup="true"` را با JS ست می‌کند — برخلاف الگوی APG برای ناوبری سایت.
8. **انیمیشن‌های ذکرشده در پرامپت (glass-border-flow, glass-sheen, glass-menu-in, qt-glass-sweep, qt-nav-row-in, qt-nav-tap, qt-sidebar-overlay-in) در CSS موجود نیستند.** `qt-nav-tap` فقط در JS (navigation.js:488) ارجاع می‌شود چون keyframes و استایل `.is-tapped` هر دو مرده‌اند.
9. **جستجوی سایدبار واقعاً فیلتر می‌کند** (navigation.js `updateSearch`) و Escape پاک‌سازی دارد — طبق فاز ۵ نگه می‌ماند.
10. **تصاویر index.html**: همه `width`/`height` دارند؛ hero با `fetchpriority="high"` + `loading="eager"`؛ بقیه `lazy` + `async` — فاز ۴-۱ از قبل برقرار است.
11. **‏`aria-current="page"`** در روتر main.js (`setActiveMenuLink`) با hashchange سینک می‌شود؛ در services/*.html با کلاس `is-active` هاردکد شده اما بدون صفت aria (سرویس‌ها فایل ممنوع‌اند).
12. **‏404.html از قبل موجود است** با همان سایدبار + CTA بازگشت — فاز ۵-۴ برقرار است.
13. **گوشهٔ منفی پرامپت**: git log مخزن فقط یک کامیت دارد (کلون کم‌عمق) — نسل‌ها از تاریخچه قابل بازیابی نیستند و از روی کد مرده بازسازی شدند.

> محدودیت ابزار: اجرای Lighthouse و گرفتن اسکرین‌شات واقعی مرورگر در محیط فعلی (بدون Chromium و با شبکهٔ محدود) ممکن نیست. تأیید تغییرات ظاهری با diff دقیق، تحلیل رندر و chekلیست استاتیک مستند می‌شود؛ این مورد در گزارش نهایی شفاف اعلام خواهد شد.

---

## فاز ۱ — رفع باگ‌های بحرانی

| باگ | رفع | فایل |
|---|---|---|
| ۱-۱. سلکتور مرده `.navbar` | تغییر به `.site-header` + گارد `if (!header) return;`؛ `scrolled` حالا واقعاً با اسکرول > ۴۰px اعمال می‌شود. کلاس فعلاً قلاب حالتی بدون استایل است (قوانین قدیمی `.navbar.scrolled` کد مرده‌اند و در فاز ۲-۴ حذف می‌شوند) | `assets/js/main.js` |
| ۱-۲. سینک وضعیت منو | تابع واحد `setMenuState(controller, open)` در navigation.js: کلاس `is-open`، ‏`aria-hidden` ناوبری (فقط در مد موبایل؛ ریل دسکتاپ هرگز مخفی نمی‌شود)، ‏`aria-expanded`/برچسب دکمه (از مسیر `syncSidebarToggle` برای سازگاری با collapse دسکتاپ)، ‏`body.service-nav-open` و `body.style.overflow` — همه‌جانبه. تمام مسیرها (openDrawer/closeDrawer/closeDrawers/resetOnResize/init) فقط از همین تابع عبور می‌کنند؛ `syncBodyLock` قدیمی حذف شد | `assets/js/navigation.js` |
| ۱-۳. قفل توکن sprite | کامنت تاریخ‌دار بالای `--qt-sprite-count: 14` — تطابق با ۱۴ فریم SVG تأیید شد | `assets/css/nav/nav-tokens.css` |
| ۱-۴. تعارض position | `sticky` فقط در `@media (max-width: 1023px)` (nav-base.css) و `fixed` فقط در `@media (min-width: 1024px)` (nav-sidebar.css) — دیگر هیچ‌کدام به ترتیب لود وابسته نیستند | هر دو فایل nav |
| ۱-۵. ‏`--qt-dir` | مصرف واقعی دارد (translateX دراور موبایل + چرخش chevron دسکتاپ) → نگه‌داری شد | — |

**تست‌ها**: `node --check` برای هر دو فایل JS ⭕ عبور. بدون تغییر ظاهری (هر ۵ ویرایش، رندر را یکسان نگه می‌دارند: sticky/fixed همان رفتار قبلی با قفل مدیاست؛ setMenuState فقط صفات از قبل موجود را از یک نقطه ست می‌کند + دو افزودهٔ غیربصری: `aria-hidden` موبایل و overflow این‌لاین که تکرارِ قاعدهٔ CSS موجود است).

> نکتهٔ فاز ۱-۱: کلاس `scrolled` با طراحی فعلی سایدبار استایل بصری نمی‌گیرد — افزودن استایل برایش تغییر ظاهری بود و در این فاز مجاز نبود.

## فاز ۲ — اصلاحات ساختاری

| مورد | اقدام | فایل |
|---|---|---|
| ۲-۱. تریگر خدمات → `<button>` | تبدیل `<a>` به `<button type="button">` (الگوی Disclosure) در index.html و 404.html. chevron `::after` فعلی حفظ شد (به‌جای span جدید — بدون تغییر ظاهر و با انیمیشن موجود). ریست سبک بومی دکمه در nav-base.css تا رندر دقیقاً همان بماند. کنترلر کیبورد navigation.js حالا دوحالته است: برای `<button>` فعال‌سازی بومی click (بدون دوبل-toggle)، برای `<a>` (صفحات خدمات — فایل ممنوع) همان رهگیری Enter/Space قبلی | index.html, 404.html, nav-base.css, navigation.js |
| ۲-۲. حذف `role="menu/menuitem"` | از هر دو فایل مجاز حذف شد؛ پنل `role="group"` گرفت تا `aria-label` فارسی سنجیده بماند. سِت‌کننده‌های JSِ `role="menu"` و `aria-haspopup="true"` هم حذف شدند. سلکتورهای کیبورد `[role="menuitem"], a, button` → `a[href], button`. services/*.html نقش‌های قدیمی‌شان را نگه می‌دارند (فایل ممنوع) اما JS دیگر القا نمی‌کند | index.html, 404.html, navigation.js |
| ۲-۳. مهاجرت رنگ‌های inline | ۱۷ خط `style=` با رنگ hardcode → توکن. ۵ رنگ به توکن‌های موجود style.css مپ شد (`--surface-white`, `--text-light`, `--amber-light`, `--sky-light`) و ۷ توکن جدید با مقادیر دقیقاً یکسان در nav-tokens.css تعریف شد (`--qt-slate-300`, `--qt-emerald-bright/tint`, `--qt-whatsapp-tint`, `--qt-glass-tint/line`, `--qt-overlay-dim`). رندر بدون هیچ تغییری | index.html, nav-tokens.css |
| ۲-۴. حذف کد مرده | **۳۷۷ خط از style.css**: خانواده‌های `.navbar*`، `.nav-menu*`，`.nav-dropdown*`，`.navbar__actions`，`.hamburger-btn*`，`.mobile-drawer*` + overrideهای ریسپانسیو و تیرهٔشان. بازنویسی قاعدهٔ ترکیبی `.brand-logo__subtitle`(زنده) حفظ شد. بلاک JS بازخورد لمسی `.is-tapped/qt-nav-tap` (بدون هیچ CSS) حذف شد. ۳ توکن CSS بدون مصرف حذف شد. تمام حذف‌ها با کامنت تاریخ‌دار و دلیل ثبت شدند؛ حذف فایل: نداشتیم | style.css, navigation.js, nav-tokens.css |

**تست‌های فاز ۲**:
- ✅ `grep -c '!important' assets/css/nav/*.css` → **۰ ≤ ۲**
- ✅ `grep -c 'html\[dir=' assets/css/nav/*.css` → **۰ ≤ ۲**
- ✅ رنگ hardcode در `style=` های index.html → **۰**
- ✅ brace balance در هر ۴ فایل CSS → ۰؛ `node --check` برای هر دو JS → OK
- ✅ تمام ارجاع‌ها به selectorهای حذف‌شده در HTML: ۰ (از فاز ۰ اثبات شده)
- ⚠️ سلکتورهای fallback قدیمی (`.nav-menu*`، `.mobile-drawer*`) آگاهانه در لیست‌های querySelector جاوااسکریپت **ماندند** — هزینهٔ صفر، سازگاری در برابر هر markup قدیمی؛ حذفشان تغییر رفتاری بدون سود بود.

## فاز ۳ — ارتقای ظاهر

_(در انتظار اجرا)_

## فاز ۴ — عملکرد و لود

_(در انتظار اجرا)_

## فاز ۵ — UX

_(در انتظار اجرا)_

## گزارش نهایی

_(در انتظار پایان فازها)_
