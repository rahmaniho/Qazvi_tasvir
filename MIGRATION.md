# ناوبری مشترک قزوین تصویر

## مقصد

ناوبری مشترک از نسل‌های قدیمی Glass Nav، `QT GLASS NAV 2.0` و geometry مشترک هدر جدا شد و ظاهر نهایی **QT SIDEBAR REFERENCE 4.0** حفظ شد: rail سرمه‌ای، active state آبی، حالت collapsed و flyout خدمات.

سه stylesheet مجاز ناوبری:

1. `nav-tokens.css` — tokenهای عرض rail، gap، رنگ، motion و sprite؛ فقط `:root`.
2. `nav-base.css` — ساختار مشترک، icon mapping، drawer موبایل، dropdown و focus state.
3. `nav-sidebar.css` — rail دسکتاپ، collapsed rail، flyout و edge toggle.

Markup، کلاس‌ها و controller عمومی دست‌نخورده مانده‌اند؛ از جمله `body.service-nav-open`، `body.qt-sidebar-shell`، `body.qt-sidebar-collapsed`، `is-collapsed`، `is-open` و `aria-expanded`.

## مسیرهای مهاجرت

- ریشه و `en/`: ابتدا `nav-tokens.css`، سپس `nav-base.css` و در پایان `nav-sidebar.css`.
- `services/` و `404.html`: همان سه فایل با prefix نسبی `../` یا بدون prefix برای 404.
- `tools/build-service-pages.py` همین ترتیب را در صفحات تولیدی می‌نویسد.
- `assets/css/service-pages.css` دیگر geometry هدر/ناوبری مشترک را تعریف نمی‌کند.

## گزارش بایت

مبنای مقایسه، snapshot پیشین در commit `2dfdee1181c460db69094c9625a970db8fce6d52` است:

| مورد | بایت |
| --- | ---: |
| `assets/css/glass-navigation.css` قدیمی | 107,308 |
| `nav-tokens.css` | 1,690 |
| `nav-base.css` | 15,486 |
| `nav-sidebar.css` | 13,680 |
| مجموع جدید | 30,856 |
| کاهش خالص | 76,452 (71.25٪) |

در refactor جدید، ۶۳ مورد `!important`، دو `counter()` و keyframe/selectorهای مربوط به نسل‌های حذف‌شده در stylesheetهای ناوبری باقی نمانده‌اند.

## checklist اجراشده

- [x] دقیقاً سه فایل CSS ناوبری در `assets/css/nav/`.
- [x] stylesheet قدیمی و linkهای آن حذف شده‌اند.
- [x] sprite واقعی ۱۴ icon (`00` تا `13`) با `--qt-sprite-count: 14` همسان است.
- [x] موقعیت همه iconهای sprite به token تبدیل شده است.
- [x] کمینه font-size dropdown برابر `0.72rem` و ارتفاع آیتم‌های sidebar/dropdown حداقل `42px` است.
- [x] RTL/LTR با logical properties و token جهت مشترک پیاده شده است.
- [x] در `prefers-reduced-motion: reduce` animation و transition حرکتی ناوبری خاموش است.
- [x] drawer موبایل، قفل body، Escape، focus trap، dropdown خدمات و `aria-expanded` حفظ شده‌اند.
- [x] smoke test مسیرهای 375px، 1024px و 1440px را از نظر حالت mobile/desktop controller بررسی می‌کند؛ CSS breakpoint در 1024px است.
- [x] `python3 tools/build-i18n-site.py --check` و `node tools/smoke-test.mjs` (با jsdom) موفق بودند.

## rollback محدود

برای rollback، فقط سه link جدید را از shell/generator حذف و stylesheet قبلی را برنگردانید؛ rollback کامل نسل قدیمی عمداً پشتیبانی نمی‌شود. تغییرات رفتاری controller در `assets/js/navigation.js` عمومی است و نباید نام کلاس‌های عمومی یا متغیرهای ARIA آن تغییر کند.
