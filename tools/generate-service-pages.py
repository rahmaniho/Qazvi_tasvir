#!/usr/bin/env python3
"""
Qazvin Tasvir — Service page generator.

تولید ۸ صفحهٔ تخصصی خدمات (نسخهٔ فارسی در services/ و انگلیسی در en/services/)
از یک منبع واحد: دیکشنری SERVICES در همین فایل. هر تغییر محتوا فقط اینجا
اعمال و دوباره اجرا می‌شود:

    python3 tools/generate-service-pages.py

صفحات از استایل مشترک سایت (assets/css/style.css — بخش ۲۳ svc-*) استفاده
می‌کنند؛ مسیرها برای نسخهٔ انگلیسی (یک پوشه عمیق‌تر) خودکار اصلاح می‌شوند.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_ORIGIN = "https://qazvintasvir.ir"

# ─── آیکون‌ها (SVG مسیرهای سادهٔ لوسید-گونه) ───────────────────────────────
ICONS = {
    "trade": '<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>',
    "customs": '<rect x="8" y="2" width="8" height="4" rx="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path>',
    "package": '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>',
    "bus": '<path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="17" cy="18" r="2"></circle>',
    "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    "building": '<rect x="4" y="2" width="16" height="20" rx="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path>',
    "utensils": '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
    "briefcase": '<rect width="20" height="14" x="2" y="7" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
}

# ─── دادهٔ محتوایی هر خدمت (fa + en) — منبع واحد صفحات ─────────────────────
SERVICES: list[dict] = [
    {
        "slug": "import-export",
        "icon": "trade",
        "fa": {
            "title": "واردات و صادرات کالاهای مجاز",
            "meta": "واردات و صادرات کالاهای مجاز تجاری و صنعتی با بیش از ۳۱ سال تجربهٔ قزوین تصویر؛ از انتخاب تأمین‌کننده و ثبت سفارش تا حمل بین‌المللی و تحویل درب کارخانه.",
            "lead": "واردات و صادرات انواع کالاهای مجاز تجاری و صنعتی، از انتخاب تأمین‌کنندهٔ معتبر و ثبت سفارش تا حمل بین‌المللی، ترخیص و تحویل درب کارخانه؛ با بیش از سه دهه تجربهٔ بازرگانی قزوین تصویر.",
            "stats": [("+۳۱ سال", "سابقهٔ بازرگانی مستمر"), ("+۱۰۰", "مشتری سازمانی فعال"), ("دریایی، هوایی، زمینی", "مسیرهای حمل بین‌المللی")],
            "intro": [
                "شرکت قزوین تصویر از سال ۱۳۷۴ در حوزهٔ بازرگانی، واردات و صادرات کالاهای مجاز فعالیت می‌کند؛ از تأمین مواد اولیه و ماشین‌آلات صنعتی تا کالاهای تجاری، همهٔ مراحل توسط تیم مجرب ما مدیریت می‌شود.",
                "ما در کنار واردات، مسیر صادرات کالاهای مجاز ایرانی را نیز برای تولیدکنندگان هموار می‌کنیم: از بررسی بازار مقصد و قیمت‌گذاری تا آماده‌سازی اسناد، حمل و تسویه. همکاری طولانی با برندهایی مانند نستله، هنکل و یونیلیور نشان اعتماد به این مسیر است.",
            ],
            "features": [
                ("بررسی و انتخاب تأمین‌کننده", "ارزیابی فروشندگان معتبر در بازارهای جهانی و مذاکره برای بهترین شرایط"),
                ("استعلام و ثبت سفارش", "استعلام قیمت دقیق، ثبت سفارش رسمی و پیگیری تا تأیید پروفرما"),
                ("حمل بین‌المللی", "انتخاب مسیر دریایی، هوایی یا زمینی بر اساس زمان و بودجهٔ شما"),
                ("بیمهٔ باربری", "بیمهٔ کامل بار در طول مسیر برای اطمینان از جبران هر ریسک احتمالی"),
                ("اسناد و تشریفات تجاری", "آماده‌سازی و کنترل پروفرما، بارنامه، گواهی مبدأ و سایر اسناد"),
                ("تحویل درب کارخانه", "حمل داخلی و تحویل کالا در محل کارخانه یا انبار شما"),
            ],
            "steps": [
                ("مشاوره و تعیین نیاز", "بررسی کالای مورد نظر، حجم سفارش و بودجه"),
                ("استعلام و انتخاب مبدأ", "استعلام از تأمین‌کنندگان معتبر و مقایسهٔ شرایط"),
                ("قرارداد و پرداخت", "تنظیم قرارداد، پرداخت امن و ثبت سفارش"),
                ("حمل، ترخیص و تحویل", "حمل بین‌المللی، ترخیص گمرکی و تحویل درب کارخانه"),
            ],
            "faqs": [
                ("کدام کالاها قابل واردات و صادرات هستند؟", "هر کالایی که طبق مقررات جاری جمهوری اسلامی ایران جزو کالاهای مجاز بازرگانی باشد؛ مشخصات دقیق کالای شما را بفرستید تا امکان‌سنجی کنیم."),
                ("حداقل حجم سفارش چقدر است؟", "بسته به نوع کالا و مسیر حمل متفاوت است؛ برای کالاهای خاص حتی سفارش‌های کوچک نیز بررسی می‌شود."),
                ("فرآیند چقدر زمان می‌برد؟", "به مسیر حمل (دریایی، هوایی، زمینی)، مبدأ و فرآیند ترخیص بستگی دارد؛ در جلسهٔ مشاورهٔ اول زمان‌بندی شفاف ارائه می‌شود."),
            ],
            "gallery": [("assets/img/sections/hero-port.webp|assets/img/sections/hero-port.jpg", "بندر کانتینری در غروب؛ نمادی از تجارت بین‌الملل"), ("assets/img/sections/trade-customs.webp|assets/img/sections/trade-customs.jpg", "تشریفات تجاری و گمرکی کالاهای وارداتی")],
        },
        "en": {
            "title": "Import & Export of Authorized Goods",
            "meta": "Import and export of authorized commercial and industrial goods with 31+ years of Qazvin Tasvir experience — from supplier selection and ordering to international freight and factory-door delivery.",
            "lead": "Import and export of authorized commercial and industrial goods — from vetted supplier selection and order placement to international freight, customs clearance and factory-door delivery; backed by three decades of Qazvin Tasvir trading experience.",
            "stats": [("31+ years", "of continuous trading"), ("100+", "active corporate clients"), ("Sea, air, land", "international freight routes")],
            "intro": [
                "Qazvin Tasvir Company has been active in trading, import and export of authorized goods since 1995 — from industrial raw materials and machinery to commercial goods, every stage is managed by our experienced team.",
                "Alongside imports, we also smooth the export path for Iranian manufacturers: from target-market research and pricing to documentation, freight and settlement. Long-term cooperation with brands such as Nestlé, Henkel and Unilever is a testament to this track record.",
            ],
            "features": [
                ("Supplier screening & selection", "Evaluating trusted sellers in global markets and negotiating the best terms"),
                ("Inquiry & order placement", "Accurate price inquiry, formal ordering and follow-up until proforma confirmation"),
                ("International freight", "Sea, air or land routing chosen to match your timeline and budget"),
                ("Cargo insurance", "Full transit insurance covering every risk along the route"),
                ("Trade documentation", "Preparing and verifying proforma invoices, bills of lading, certificates of origin"),
                ("Factory-door delivery", "Domestic haulage and delivery at your plant or warehouse"),
            ],
            "steps": [
                ("Consultation & needs", "Reviewing your target goods, order volume and budget"),
                ("Inquiry & origin selection", "Inquiries from trusted suppliers and comparison of terms"),
                ("Contract & payment", "Drawing up the contract, secure payment and order registration"),
                ("Freight, clearance, delivery", "International freight, customs clearance and factory-door delivery"),
            ],
            "faqs": [
                ("Which goods can be imported or exported?", "Any goods classified as authorized under current Iranian trade regulations; send us your item specifications and we will assess feasibility."),
                ("What is the minimum order volume?", "It depends on the goods and the freight route; small orders for special items are also reviewed."),
                ("How long does the process take?", "It depends on the route (sea, air, land), origin and clearance process; a transparent timeline is provided in the first consultation."),
            ],
            "gallery": [("assets/img/sections/hero-port.webp|assets/img/sections/hero-port.jpg", "A container port at dusk — a symbol of international trade"), ("assets/img/sections/trade-customs.webp|assets/img/sections/trade-customs.jpg", "Trade and customs formalities for imported goods")],
        },
    },
    {
        "slug": "customs",
        "icon": "customs",
        "fa": {
            "title": "ترخیص گمرکی و امور بندری",
            "meta": "ترخیص تخصصی کالا از گمرکات و بنادر کشور، اخذ مجوزها، تشریفات بندری و پیگیری کامل پرونده تا تحویل کالا — با تیم مجرب قزوین تصویر.",
            "lead": "ترخیص سریع و تخصصی کالا از گمرکات و بنادر سراسر کشور؛ اخذ مجوزهای قانونی، انجام تشریفات بندری و پیگیری کامل پرونده تا لحظهٔ تحویل کالا به شما.",
            "stats": [("تیم متخصص", "امور گمرکی و بندری"), ("همهٔ گمرکات", "مرزی، بندری و داخل کشور"), ("پیگیری کامل", "از اظهارنامه تا تحویل")],
            "intro": [
                "ترخیص گمرکی کالا فرآیندی حساس و پرجزئیات است؛ کوچک‌ترین تأخیر یا خطا در اسناد می‌تواند هزینه و زمان شما را چند برابر کند. تیم امور گمرکی قزوین تصویر با تسلط بر تعرفه‌ها، آیین‌نامه‌ها و رویه‌های گمرکی، این مسیر را کوتاه و بی‌دغدغه می‌کند.",
                "از ثبت اظهارنامه و تعیین دقیق تعرفه (HS Code) تا اخذ مجوزهای لازم، پرداخت حقوق ورودی، تخلیه و حمل از بندر — همهٔ امور بندری و گمرکی زیر نظر یک تیم واحد انجام می‌شود تا کالای شما در کوتاه‌ترین زمان ممکن تحویل شود.",
            ],
            "features": [
                ("ترخیص از همهٔ گمرکات", "تجربهٔ عملیاتی در گمرکات مرزی، بندری و سراسری کشور"),
                ("اخذ مجوزهای قانونی", "پیگیری سریع مجوزهای استاندارد، بهداشت و سایر نهادهای مرتبط"),
                ("تعیین تعرفه و HS Code", "طبقه‌بندی صحیح کالا برای جلوگیری از جرائم و عوارض اضافی"),
                ("تشریفات بندری", "تخلیه، انبارداری، اوزان و صدور بارنامه در بنادر"),
                ("محاسبهٔ حقوق ورودی", "برآورد دقیق و شفاف هزینه‌ها پیش از شروع کار"),
                ("پیگیری پرونده و جرائم", "حل اختلافات و پیگیری پرونده‌های معوق گمرکی"),
            ],
            "steps": [
                ("دریافت اسناد", "بررسی اسناد حمل، پروفرما و بارنامهٔ کالا"),
                ("ثبت اظهارنامه", "طبقه‌بندی تعرفه و ثبت اظهارنامهٔ گمرکی"),
                ("پرداخت عوارض", "پرداخت حقوق ورودی و اخذ مجوزها"),
                ("تخلیه و تحویل", ("ترخیص از بندر یا گمرک و حمل تا مقصد")),
            ],
            "faqs": [
                ("برای شروع ترخیص چه اسنادی لازم است؟", "پروفرما، بارنامه، پکینگ‌لیست و گواهی مبدأ پایهٔ کار هستند؛ فهرست کامل بر اساس نوع کالا به شما اعلام می‌شود."),
                ("آیا مجوزهای خاص را هم پیگیری می‌کنید؟", "بله؛ اخذ مجوزهای استاندارد، بهداشت و سایر نهادهای مربوط از ابتدا تا انتها توسط ما انجام می‌شود."),
                ("هزینهٔ ترخیص چگونه محاسبه می‌شود؟", "بر اساس تعرفهٔ کالا، حقوق ورودی و هزینه‌های عملیاتی؛ پیش از شروع، برآورد شفاف کتبی ارائه می‌شود."),
            ],
            "gallery": [("assets/img/sections/trade-customs.webp|assets/img/sections/trade-customs.jpg", "اسناد و مهرهای رسمی امور گمرکی"), ("assets/img/sections/hero-port.webp|assets/img/sections/hero-port.jpg", "اسکلهٔ بندر و کانتینرهای در انتظار ترخیص")],
        },
        "en": {
            "title": "Customs Clearance & Port Affairs",
            "meta": "Specialized cargo clearance from Iranian customs and ports, permits, port formalities and full case follow-up until delivery — by the experienced Qazvin Tasvir team.",
            "lead": "Fast, specialized cargo clearance from customs offices and ports across the country; legal permits, port formalities and complete case follow-up until your goods are delivered.",
            "stats": [("Dedicated team", "for customs & port affairs"), ("All ports of entry", "land borders, seaports & inland customs"), ("Full follow-up", "from declaration to delivery")],
            "intro": [
                "Customs clearance is a sensitive, detail-heavy process; the smallest document error can multiply your costs and delays. Qazvin Tasvir's customs team, fluent in tariffs, regulations and procedures, makes this path short and worry-free.",
                "From filing the declaration and accurate tariff (HS Code) classification to obtaining permits, paying import duties, discharge and port haulage — all customs and port affairs are handled by a single team so your cargo is released in the shortest possible time.",
            ],
            "features": [
                ("Clearance at every customs office", "Hands-on experience at border, seaport and inland customs posts"),
                ("Legal permits", "Fast follow-up of standards, health and other authority permits"),
                ("Tariff & HS Code", "Correct classification that prevents penalties and extra duties"),
                ("Port formalities", "Discharge, warehousing, weighing and bill-of-lading issuance"),
                ("Import-duty calculation", "Accurate, transparent cost estimates before work begins"),
                ("Case & penalty follow-up", "Resolving disputes and following up stalled customs cases"),
            ],
            "steps": [
                ("Document intake", "Reviewing transport documents, proforma and bill of lading"),
                ("Declaration filing", "Tariff classification and filing the customs declaration"),
                ("Duties & permits", "Paying import duties and obtaining the required permits"),
                ("Release & delivery", "Releasing the cargo and hauling it to your destination"),
            ],
            "faqs": [
                ("Which documents are needed to start?", "Proforma invoice, bill of lading, packing list and certificate of origin form the basis; the full list depends on the goods."),
                ("Do you also follow up special permits?", "Yes; standards, health and other authority permits are handled end-to-end by our team."),
                ("How is the clearance cost calculated?", "Based on the goods' tariff, import duties and operating costs; a transparent written estimate is provided before we start."),
            ],
            "gallery": [("assets/img/sections/trade-customs.webp|assets/img/sections/trade-customs.jpg", "Official customs documents and stamps"), ("assets/img/sections/hero-port.webp|assets/img/sections/hero-port.jpg", "Port quay and containers awaiting clearance")],
        },
    },
    {
        "slug": "supply",
        "icon": "package",
        "fa": {
            "title": "تأمین مواد اولیه و تجهیزات",
            "meta": "تأمین به‌موقع مواد اولیه، قطعات و تجهیزات صنعتی برای کارخانه‌ها؛ از استعلام و انتخاب تأمین‌کننده تا کنترل کیفیت و تحویل درب کارخانه با قزوین تصویر.",
            "lead": "تأمین به‌موقع مواد اولیه، قطعات و تجهیزات صنعتی برای کارخانه‌ها و خطوط تولید؛ از استعلام و انتخاب تأمین‌کنندهٔ معتبر تا کنترل کیفیت در مبدأ و تحویل درب کارخانه.",
            "stats": [("یک قرارداد", "برای کل زنجیرهٔ تأمین"), ("کنترل کیفیت", "پیش از حمل از مبدأ"), ("تحویل برنامه‌ریزی‌شده", "متناسب با خط تولید شما")],
            "intro": [
                "توقف خط تولید به‌خاطر کمبود مواد اولیه، پرهزینه‌ترین اتفاق برای هر کارخانه است. قزوین تصویر با قراردادهای تأمین بلندمدت، زنجیرهٔ تأمین شما را قابل پیش‌بینی می‌کند: مشخصات فنی را یک‌بار تعریف می‌کنیم و بعد از آن، تأمین منظم بر عهدهٔ ماست.",
                "تجربهٔ همکاری با کارخانه‌های بزرگ کشور — از صنایع غذایی تا کابل‌سازی و قطعه‌سازی — به ما آموخته که هر صنعت چه الزاماتی دارد: از استانداردهای فنی و گواهی‌های آزمون تا بسته‌بندی و زمان‌بندی تحویل دقیق.",
            ],
            "features": [
                ("شناسایی و ارزیابی تأمین‌کننده", "انتخاب از میان فروشندگان معتبر و باسابقهٔ هر صنعت"),
                ("خرید متمرکز و اقتصادی", "استفاده از قدرت خرید متمرکز برای قیمت‌های بهتر"),
                ("کنترل کیفیت در مبدأ", "بازرسی مشخصات فنی و گواهی‌ها پیش از حمل"),
                ("لجستیک و انبارش", "حمل ایمن، انبارداری و تحویل زمان‌بندی‌شده"),
                ("تأمین قطعات یدکی", "قطعات یدکی ماشین‌آلات و تجهیزات خطوط تولید"),
                ("قرارداد بلندمدت تأمین", "اطمینان از پایداری زنجیرهٔ تأمین در طول سال"),
            ],
            "steps": [
                ("تعریف نیاز", "دریافت مشخصات فنی، حجم و زمان‌بندی مورد نیاز"),
                ("استعلام و انتخاب", "استعلام از تأمین‌کنندگان و مقایسهٔ فنی و مالی"),
                ("خرید و کنترل", "ثبت سفارش، کنترل کیفیت و آماده‌سازی حمل"),
                ("تحویل درب کارخانه", "حمل و تحویل طبق برنامهٔ خط تولید شما"),
            ],
            "faqs": [
                ("چه مواد و تجهیزی را تأمین می‌کنید؟", "انواع مواد اولیهٔ صنعتی، قطعات و تجهیزات مجاز؛ مشخصات فنی کالای مورد نظر را بفرستید تا بررسی کنیم."),
                ("آیا قرارداد سالانهٔ تأمین منعقد می‌کنید؟", "بله؛ قراردادهای بلندمدت تأمین با زمان‌بندی تحویل مشخص، محبوب‌ترین انتخاب کارخانه‌هاست."),
                ("کنترل کیفیت چگونه انجام می‌شود؟", "مشخصات فنی و گواهی‌ها پیش از حمل در مبدأ کنترل می‌شوند تا کالای غیرمنطبق به کارخانهٔ شما نرسد."),
            ],
            "gallery": [],
        },
        "en": {
            "title": "Raw Material & Equipment Supply",
            "meta": "On-time supply of industrial raw materials, parts and equipment for factories — from inquiry and supplier selection to quality control and factory-door delivery with Qazvin Tasvir.",
            "lead": "On-time supply of industrial raw materials, spare parts and equipment for factories and production lines — from inquiries and trusted supplier selection to origin quality control and factory-door delivery.",
            "stats": [("One contract", "for your whole supply chain"), ("Quality control", "at origin before shipping"), ("Scheduled delivery", "matched to your production line")],
            "intro": [
                "A production line halted for lack of raw materials is the costliest event for any factory. With long-term supply contracts, Qazvin Tasvir makes your supply chain predictable: define the technical specifications once, and from then on regular supply is our responsibility.",
                "Working with major Iranian manufacturers — from food industries to cable- and parts-making — has taught us each industry's requirements: technical standards and test certificates through to packaging and precise delivery timing.",
            ],
            "features": [
                ("Supplier identification", "Selecting from established, trusted sellers in each industry"),
                ("Centralized, economic buying", "Leveraging consolidated purchasing power for better prices"),
                ("Origin quality control", "Inspecting technical specs and certificates before shipping"),
                ("Logistics & warehousing", "Safe transport, warehousing and scheduled delivery"),
                ("Spare-parts supply", "Spare parts for machinery and production-line equipment"),
                ("Long-term supply contracts", "Confidence in supply-chain stability all year round"),
            ],
            "steps": [
                ("Define the need", "Receiving technical specs, volume and required timing"),
                ("Inquiry & selection", "Supplier inquiries and technical/financial comparison"),
                ("Purchase & control", "Ordering, quality control and shipping preparation"),
                ("Factory-door delivery", "Transport and delivery in line with your production plan"),
            ],
            "faqs": [
                ("Which materials and equipment do you supply?", "All kinds of authorized industrial raw materials, parts and equipment; send us your specifications for review."),
                ("Do you sign annual supply contracts?", "Yes; long-term supply contracts with defined delivery schedules are the factories' most popular choice."),
                ("How is quality controlled?", "Technical specs and certificates are checked at origin before shipping so non-conforming goods never reach your plant."),
            ],
            "gallery": [],
        },
    },
    {
        "slug": "personnel-transport",
        "icon": "bus",
        "fa": {
            "title": "ترابری پرسنل کارخانجات",
            "meta": "جابه‌جایی منظم و امن پرسنل کارخانه‌ها در تمامی شیفت‌ها با ناوگان ۱۰۱ دستگاهی قزوین تصویر؛ قراردادهای سازمانی با گزارش‌دهی منظم و مدیریت اختصاصی ناوگان.",
            "lead": "جابه‌جایی منظم و امن پرسنل کارخانه‌ها در تمامی شیفت‌ها؛ با ناوگان ۱۰۱ دستگاهی، رانندگان مجرب و قراردادهای سازمانی شفاف با گزارش‌دهی منظم به کارفرما.",
            "stats": [("۱۰۱ دستگاه", "خودرو در ۱۱ قرارداد فعال"), ("+۵۰۰ پرسنل", "جابه‌جا شده در هر روز"), ("هر ۳ شیفت", "صبح، عصر و شب")],
            "intro": [
                "برای کارخانه‌ها، سرویس ایاب‌وذهاب پرسنل فقط یک حمل‌ونقل نیست؛ بخشی از انضباط تولید است. تأخیر سرویس صبح یعنی شروع دیر خط تولید، و سرویس نامنظم شب یعنی خستگی نیروی شیفت بعد. قزوین تصویر با ناوگان ۱۰۱ دستگاهی خود، این چرخه را دقیق و قابل اتکا نگه می‌دارد.",
                "از سال‌ها پیش، کارخانه‌هایی مانند گلدایران، آسان پک و شیر سحر سرویس پرسنل خود را به ما سپرده‌اند؛ با قراردادهای سالانهٔ شفاف، مسیرهای بهینه، رانندگان بیمه‌شده و گزارش‌دهی منظم به مسئولان کارفرما.",
            ],
            "features": [
                ("سرویس‌های شیفت‌شده", "پوشش کامل شیفت‌های صبح، عصر و شب بدون وقفه"),
                ("ناوگان متنوع", "مینی‌بوس و اتوبوس متناسب با تعداد و مسیر هر کارخانه"),
                ("رانندگان مجرب و بیمه‌شده", "گزینش، آموزش و بیمهٔ کامل رانندگان و مسافران"),
                ("گزارش‌دهی منظم", "گزارش حضور، زمان‌بندی و وضعیت سرویس به کارفرما"),
                ("مدیریت تعمیرات و آماده‌به‌کاری", "سرویس دوره‌ای ناوگان برای صفر بودن خرابی غیرمنتظره"),
                ("انعطاف در تعداد و مسیر", ("افزایش ظرفیت یا تغییر مسیر با رشد کارخانهٔ شما")),
            ],
            "steps": [
                ("بررسی شیفت‌ها و مسیرها", "تحلیل نقاط سکونت پرسنل و برنامهٔ شیفت‌های کارخانه"),
                ("پیشنهاد ناوگان", "ارائهٔ ترکیب بهینهٔ خودروها و مسیرهای پیشنهادی"),
                ("قرارداد و شروع سرویس", "تنظیم قرارداد شفاف و آغاز سرویس‌دهی منظم"),
                ("پایش و گزارش", "پایش مستمر عملکرد و ارائهٔ گزارش دوره‌ای به کارفرما"),
            ],
            "faqs": [
                ("حداقل تعداد پرسنل برای قرارداد چقدر است؟", "سرویس‌های کارخانه‌ای معمولاً از یک مسیر کامل (ظرفیت یک خودرو) آغاز می‌شوند؛ برای طرح دقیق با ما تماس بگیرید."),
                ("آیا سرویس شیفت شب هم دارید؟", "بله؛ پوشش هر سه شیفت صبح، عصر و شب بخش ثابت قراردادهای کارخانگی است."),
                ("اگر تعداد پرسنل ما افزایش یابد چه می‌شود؟", "ظرفیت و تعداد خودروها در طول قرارداد به‌سادگی افزایش می‌یابد؛ قرارداد ما انعطاف‌پذیر طراحی شده است."),
            ],
            "gallery": [("assets/img/fleet-specs/fleet-photo-02.webp|assets/img/fleet-specs/fleet-photo-02.jpg", "مینی‌بوس سرویس پرسنل در محل کارخانه"), ("assets/img/fleet-specs/fleet-photo-05.webp|assets/img/fleet-specs/fleet-photo-05.jpg", "ناوگان سرویس در شیفت عصر")],
        },
        "en": {
            "title": "Factory Personnel Transport",
            "meta": "Regular, safe commuting for factory personnel across all shifts with Qazvin Tasvir's 101-vehicle fleet; transparent corporate contracts with regular reporting.",
            "lead": "Regular, safe commuting for factory personnel across every shift; with a 101-vehicle fleet, experienced drivers and transparent corporate contracts with regular reporting.",
            "stats": [("101 vehicles", "across 11 active contracts"), ("500+ personnel", "transported every day"), ("All 3 shifts", "morning, afternoon and night")],
            "intro": [
                "For factories, personnel commuting is not mere transport — it is part of production discipline. A late morning service means a late production start, and an unreliable night service means a tired next shift. Qazvin Tasvir's 101-vehicle fleet keeps this cycle precise and dependable.",
                "For years, factories such as Goldiran, Asan Pack and Shir Sahar have entrusted their personnel services to us; through transparent annual contracts, optimized routes, insured drivers and regular reporting to employer supervisors.",
            ],
            "features": [
                ("Shift-based services", "Full coverage of morning, afternoon and night shifts"),
                ("Varied fleet", "Minibuses and buses matched to each factory's headcount and routes"),
                ("Experienced, insured drivers", "Screened, trained drivers with full passenger insurance"),
                ("Regular reporting", "Attendance, timing and service-status reports to the employer"),
                ("Maintenance & readiness", "Scheduled fleet servicing for zero unexpected breakdowns"),
                ("Flexible capacity & routes", "Scaling vehicles or routes as your factory grows"),
            ],
            "steps": [
                ("Shift & route analysis", "Mapping personnel residence clusters and your shift schedule"),
                ("Fleet proposal", "The optimal vehicle mix and proposed routes"),
                ("Contract & start", "A transparent contract and the start of regular service"),
                ("Monitoring & reporting", "Continuous performance monitoring and periodic reports"),
            ],
            "faqs": [
                ("What is the minimum headcount for a contract?", "Factory services usually start from one full route (one vehicle's capacity); contact us for a precise plan."),
                ("Do you cover night shifts?", "Yes; covering all three shifts — morning, afternoon and night — is a standard part of factory contracts."),
                ("What if our headcount grows?", "Vehicle capacity and count can easily be increased during the contract term; our agreements are designed to be flexible."),
            ],
            "gallery": [("assets/img/fleet-specs/fleet-photo-02.webp|assets/img/fleet-specs/fleet-photo-02.jpg", "A personnel-service minibus at the plant"), ("assets/img/fleet-specs/fleet-photo-05.webp|assets/img/fleet-specs/fleet-photo-05.jpg", "Service fleet on the afternoon shift")],
        },
    },
    {
        "slug": "vip-transport",
        "icon": "star",
        "fa": {
            "title": "حمل‌ونقل درون‌شهری و سرویس‌های VIP",
            "meta": "حمل‌ونقل مسافربری درون‌شهری و سرویس‌های ویژه VIP با اتوبوس‌ها و مینی‌بوس‌های خاص قزوین تصویر؛ مناسب مدیران، میهمانان سازمانی، رویدادها و سرویس فرودگاهی.",
            "lead": "حمل‌ونقل مسافربری درون‌شهری و سرویس‌های ویژهٔ VIP با اتوبوس‌ها و مینی‌بوس‌های خاص؛ مناسب مدیران ارشد، میهمانان سازمانی، همایش‌ها و سرویس فرودگاهی.",
            "stats": [("ناوگان VIP", "اتوبوس و مینی‌بوس خاص"), ("رانندگان حرفه‌ای", "آموزش‌دیدهٔ میزبانی سازمانی"), ("سرویس رویداد", "همایش‌ها، گشت‌ها و ورود/خروج فرودگاهی")],
            "intro": [
                "سفر مدیران و میهمانان سازمانی، از قابلیت اهمال‌بردار نیست؛ خودرو باید در لحظهٔ مقرر، تمیز و آماده باشد و راننده، ترکیب احترام و حرفه‌ای‌گری را به نمایش بگذارد. ناوگان VIP قزوین تصویر دقیقاً برای همین استاندارد آماده شده است.",
                "از ترانسفر فرودگاهی میهمانان تا جابه‌جایی شرکت‌کنندگان همایش‌ها و گشت‌های سازمانی؛ برنامهٔ سفر شما را یک‌بار بگویید، بقیهٔ مسیر با ماست.",
            ],
            "features": [
                ("اتوبوس و مینی‌بوس VIP", "خودروهای خاص با صندلی‌های راحت و امکانات ویژه"),
                ("سرویس مدیران و میهمانان", "ترانسفر محترم و دقیق برای مدیران ارشد و میهمانان"),
                ("حمل‌ونقل رویدادها", "جابه‌جایی شرکت‌کنندگان همایش‌ها، نمایشگاه‌ها و گشت‌ها"),
                ("سرویس فرودگاهی", "استقبال و بدرقهٔ منظم در فرودگاه‌های منطقه"),
                ("رانندگان حرفه‌ای", "آموزش‌دیدهٔ اصول میزبانی و محرمانگی سازمانی"),
                ("آماده‌باش برنامه‌ریزی‌شده", "حضور خودرو پیش از موعد در هر نقطهٔ شهر"),
            ],
            "steps": [
                ("اعلام برنامه", "دریافت زمان، مسیر و تعداد مسافران"),
                ("تخصیص خودرو", "انتخاب خودروی مناسب و معرفی راننده"),
                ("اجرا و پایش", "انجام سفر طبق برنامه با پایش زمان‌بندی"),
                ("گزارش و تسویه", "گزارش سفر و تسویهٔ شفاف"),
            ],
            "faqs": [
                ("سرویس VIP برای چه تعداد نفر امکان‌پذیر است؟", "از سدان‌های سازمانی و مینی‌بوس‌های کوچک تا اتوبوس؛ بسته به تعداد گروه، خودروی مناسب تخصیص می‌یابد."),
                ("آیا رزرو بلندمدت (مثلاً ماهانه) ممکن است؟", "بله؛ برای شرکت‌هایی که ترنسفر مداوم دارند، قرارداد ماهانه با تعرفهٔ بهتر ارائه می‌شود."),
                ("پوشش جغرافیایی سرویس چیست؟", "حمل‌ونقل درون‌شهری و برون‌شهری از قزوین و مناطق همجوار؛ مسیر دقیق خود را با ما در میان بگذارید."),
            ],
            "gallery": [("assets/img/fleet-specs/vip-seats.webp|assets/img/fleet-specs/vip-seats.jpg", "صندلی‌های ویژهٔ اتوبوس VIP"), ("assets/img/fleet-specs/vip-catering.webp|assets/img/fleet-specs/vip-catering.jpg", "سرویس پذیرایی در سفرهای VIP")],
        },
        "en": {
            "title": "Urban Transport & VIP Services",
            "meta": "Urban passenger transport and premium VIP services with Qazvin Tasvir's executive buses and minibuses — for executives, corporate guests, events and airport transfers.",
            "lead": "Urban passenger transport and premium VIP services with executive buses and minibuses; suited to senior executives, corporate guests, conferences and airport transfers.",
            "stats": [("VIP fleet", "executive buses & minibuses"), ("Professional drivers", "trained in corporate hospitality"), ("Event service", "conferences, tours & airport transfers")],
            "intro": [
                "Executive and guest travel leaves no room for improvisation; the vehicle must be clean and ready at the agreed minute, and the driver must combine courtesy with professionalism. Qazvin Tasvir's VIP fleet is prepared for exactly this standard.",
                "From airport transfers for guests to moving conference attendees and corporate tours — share your itinerary once and the rest is on us.",
            ],
            "features": [
                ("VIP buses & minibuses", "Executive vehicles with comfortable seating and amenities"),
                ("Executive & guest service", "Punctual, respectful transfers for senior executives and guests"),
                ("Event transport", "Moving attendees of conferences, exhibitions and tours"),
                ("Airport service", "Orderly pickups and drop-offs at regional airports"),
                ("Professional drivers", "Trained in hospitality and corporate confidentiality"),
                ("Planned readiness", "The vehicle on location ahead of schedule, anywhere in the city"),
            ],
            "steps": [
                ("Share your plan", "Receiving the time, route and passenger count"),
                ("Vehicle assignment", "Selecting the right vehicle and introducing the driver"),
                ("Execution & monitoring", "Running the trip to plan with timing oversight"),
                ("Report & settlement", "Trip report and transparent settlement"),
            ],
            "faqs": [
                ("For how many passengers is VIP service available?", "From corporate sedans and small minibuses to full-size buses; the right vehicle is assigned to your group size."),
                ("Is long-term (e.g. monthly) booking possible?", "Yes; companies with continuous transfer needs get monthly contracts at better rates."),
                ("What is the service coverage area?", "Urban and intercity transport from Qazvin and neighboring regions; just share your exact route."),
            ],
            "gallery": [("assets/img/fleet-specs/vip-seats.webp|assets/img/fleet-specs/vip-seats.jpg", "Executive seating inside the VIP bus"), ("assets/img/fleet-specs/vip-catering.webp|assets/img/fleet-specs/vip-catering.jpg", "Catering service on VIP trips")],
        },
    },
    {
        "slug": "school-office",
        "icon": "building",
        "fa": {
            "title": "سرویس مدارس، ادارات و شرکت‌ها",
            "meta": "سرویس ایاب‌وذهاب منظم و امن برای مدارس، ادارات و شرکت‌ها با زمان‌بندی دقیق، رانندگان معتمد و قرارداد سالانه — قزوین تصویر، بیش از ۳۱ سال تجربه.",
            "lead": "سرویس ایاب‌وذهاب منظم، امن و دقیق برای مدارس، ادارات و شرکت‌ها؛ با رانندگان گزینش‌شده، زمان‌بندی دقیق و قرارداد سالانهٔ شفاف.",
            "stats": [("زمان‌بندی دقیق", "هماهنگ با برنامهٔ آموزشی و اداری"), ("رانندگان معتمد", "گزینش‌شده و دارای سابقهٔ سالم"), ("قرارداد سالانه", "با امکان تنظیم ظرفیت و مسیر")],
            "intro": [
                "برای مدرسه، دقت ساعت سرویس یعنی نظم کلاس‌ها؛ برای اداره و شرکت، یعنی شروع به‌موقع روز کاری. قزوین تصویر با بیش از سه دهه تجربهٔ حمل‌ونقل مسافربری، سرویس‌های سازمانی را با همان استانداردی اجرا می‌کند که کارخانه‌های بزرگ کشور به آن اعتماد کرده‌اند.",
                "هر مؤسسه برنامهٔ خاص خود را دارد: مدارس با تعطیلات و ساعات امتحانات، ادارات با شیفت‌های اداری و شرکت‌ها با سرویس پرسنل. قرارداد ما متناسب با همان برنامهٔ شما تنظیم می‌شود و در طول سال، با تغییر نیازها هماهنگ می‌گردد.",
            ],
            "features": [
                ("هماهنگی با برنامهٔ مؤسسه", "تطبیق کامل سرویس با ساعات آموزشی یا اداری شما"),
                ("ایمنی ویژهٔ مدارس", "رانندگان دارای سابقهٔ سالم و قواعد سخت‌گیرانهٔ ایمنی مسافران"),
                ("قرارداد سالانهٔ شفاف", "تعرفه، مسیر و تعهدات از ابتدا روشن و کتبی"),
                ("امکان تغییر مسیر و ظرفیت", "تطبیق سرویس با تغییرات سال تحصیلی یا سازمانی"),
                ("پایش زمان‌بندی", "کنترل مستمر حضور و ساعت‌ها برای اطمینان کارفرما"),
                ("پشتیبانی و پاسخ‌گویی", "راه ارتباطی مستقیم برای پیگیری‌های روزانه"),
            ],
            "steps": [
                ("شناسایی نیاز", "بررسی تعداد مسافران، نقاط برداشت و برنامهٔ زمانی"),
                ("طرح سرویس", "ارائهٔ مسیر، خودرو و زمان‌بندی پیشنهادی"),
                ("قرارداد و اجرا", "تنظیم قرارداد سالانه و آغاز سرویس"),
                ("پایش و بهبود", "بازبینی دوره‌ای و اصلاح مسیر در صورت نیاز"),
            ],
            "faqs": [
                ("سرویس مدارس چه تضمین‌های ایمنی دارد؟", "رانندگان گزینش‌شده با سابقهٔ سالم، خودروهای بازرسی‌شده و بیمهٔ کامل مسافران، پایهٔ سرویس مدارس ماست."),
                ("برای تعطیلات و امتحانات چه می‌شود؟", "برنامهٔ سرویس با تقویم آموزشی شما هماهنگ می‌شود و در دوره‌های امتحانات تغییر می‌یابد."),
                ("آیا برای شرکت‌های خصوصی هم قرارداد می‌بندید؟", "بله؛ ادارات دولتی، شرکت‌های خصوصی و مدارس، هر سه بخشی از مشتریان سازمانی ما هستند."),
            ],
            "gallery": [("assets/img/fleet-specs/fleet-photo-01.webp|assets/img/fleet-specs/fleet-photo-01.jpg", "سرویس صبح در مسیر مؤسسه"), ("assets/img/fleet-specs/fleet-photo-07.webp|assets/img/fleet-specs/fleet-photo-07.jpg", "ناوگان سازمانی آماده‌به‌کار")],
        },
        "en": {
            "title": "School, Office & Company Services",
            "meta": "Regular, safe commuting for schools, public offices and companies — precise scheduling, vetted drivers and transparent annual contracts by Qazvin Tasvir, 31+ years of experience.",
            "lead": "Regular, safe and punctual commuting for schools, public offices and companies; with vetted drivers, precise scheduling and a transparent annual contract.",
            "stats": [("Precise scheduling", "aligned with academic and office hours"), ("Vetted drivers", "screened, with clean records"), ("Annual contract", "with adjustable capacity and routes")],
            "intro": [
                "For a school, service punctuality means orderly classes; for an office, it means the workday starts on time. With more than three decades of passenger transport experience, Qazvin Tasvir runs institutional services to the same standard trusted by the country's largest factories.",
                "Every institution has its own rhythm: schools with holidays and exam hours, offices with administrative shifts, companies with personnel services. Our contract is drawn to match your rhythm and adapts as your needs change through the year.",
            ],
            "features": [
                ("Aligned with your schedule", "Service times matched precisely to your academic or office hours"),
                ("School-safety focus", "Drivers with clean records and strict passenger-safety rules"),
                ("Transparent annual contract", "Rates, routes and obligations clear and in writing from day one"),
                ("Route & capacity changes", "Adapting the service to academic or organizational changes"),
                ("Timing oversight", "Continuous attendance and schedule monitoring for employer peace of mind"),
                ("Support & responsiveness", "A direct line for day-to-day follow-ups"),
            ],
            "steps": [
                ("Needs assessment", "Passenger count, pickup points and daily timetable"),
                ("Service plan", "Proposed routes, vehicles and timing"),
                ("Contract & launch", "Annual contract and the start of service"),
                ("Monitoring & improvement", "Periodic reviews and route refinements"),
            ],
            "faqs": [
                ("What safety guarantees do school services have?", "Screened drivers with clean records, inspected vehicles and full passenger insurance form the basis of our school services."),
                ("What about holidays and exams?", "The service plan follows your academic calendar and adapts during exam periods."),
                ("Do you contract with private companies too?", "Yes; government offices, private companies and schools are all part of our institutional clientele."),
            ],
            "gallery": [("assets/img/fleet-specs/fleet-photo-01.webp|assets/img/fleet-specs/fleet-photo-01.jpg", "Morning service on the way to the institution"), ("assets/img/fleet-specs/fleet-photo-07.webp|assets/img/fleet-specs/fleet-photo-07.jpg", "The corporate fleet ready for duty")],
        },
    },
    {
        "slug": "catering",
        "icon": "utensils",
        "fa": {
            "title": "تأمین غذای پرسنل و وعده‌های سازمانی",
            "meta": "تهیه و توزیع غذای گرم و بهداشتی برای کارخانه‌ها، ادارات و سازمان‌ها؛ منوی چرخشی هفتگی، توزیع در تمامی شیفت‌ها و قرارداد سالانه با قزوین تصویر.",
            "lead": "تهیه و توزیع غذای گرم، بهداشتی و متنوع برای کارخانه‌ها، ادارات و سازمان‌ها؛ از منوی چرخشی هفتگی تا توزیع منظم در تمامی شیفت‌ها با خودروهای کیترینگ.",
            "stats": [("۴ وعدهٔ کامل", "صبحانه، ناهار، شام و میان‌وعده"), ("۲۸ آیتم", "منوی چرخشی هفتگی بدون تکرار"), ("حداقل ۵۰ پرس", "در هر وعده")],
            "intro": [
                "غذای باکیفیت، مستقیم‌ترین پیام مراقبت به پرسنل شماست. قزوین تصویر با آشپزخانه‌های مجاز و رعایت کامل نکات بهداشتی، وعده‌های سازمانی را از مرحلهٔ طراحی منو تا توزیع گرم در محل شما مدیریت می‌کند.",
                "منوی ما هفتگی و چرخشی است و بر اساس فصل، سلیقهٔ پرسنل و بودجهٔ شما تنظیم می‌شود؛ از غذاهای اصیل ایرانی تا گزینه‌های رژیمی، گیاهی و کم‌نمک. پرس‌ها با خودروهای کیترینگ مسلح و طبق برنامهٔ شیفت‌های شما توزیع می‌شوند.",
            ],
            "features": [
                ("منوی چرخشی هفتگی و فصلی", "تنوع کامل بدون تکرار در طول هفته"),
                ("آشپزخانه‌های مجاز و بهداشتی", "طبخ در آشپزخانه‌های دارای مجوز رسمی بهداشت"),
                ("توزیع گرم با خودروی کیترینگ", "حفظ دما و بهداشت تا لحظهٔ سرو در شیفت‌های شما"),
                ("گزینه‌های رژیمی و گیاهی", "پوشش نیازهای غذایی خاص پرسنل هر سازمان"),
                ("غذاهای مناسبتی", "سرو ویژه در مناسبت‌ها و ایام خاص سال"),
                ("پایش کیفیت مستمر", "بازخورد‌گیری منظم از پرسنل و اصلاح منو"),
            ],
            "steps": [
                ("بررسی نیازها", "تعداد پرسنل، شیفت‌ها و بودجهٔ هر وعده"),
                ("پیشنهاد منو", "ارائهٔ منوی نمونهٔ هفتگی و برنامهٔ توزیع"),
                ("شروع تأمین", "قرارداد سالانه و آغاز طبخ و توزیع منظم"),
                ("پایش و بهبود", "گزارش‌گیری از پرسنل و اصلاح منو در طول قرارداد"),
            ],
            "faqs": [
                ("حداقل تعداد پرس چقدر است؟", "قراردادهای تأمین غذا از حداقل ۵۰ پرس در هر وعده آغاز می‌شوند."),
                ("منو چگونه تعیین می‌شود؟", "منوی نمونهٔ هفتگی به شما ارائه می‌شود و بر اساس سلیقهٔ پرسنل و بودجه نهایی می‌گردد؛ آیتم‌های غیرمحبوب حذف یا جایگزین می‌شوند."),
                ("آیا غذای رژیمی و گیاهی هم دارید؟", "بله؛ گزینه‌های رژیمی، گیاهی و کم‌نمک بخش ثابت منوی سازمانی ما هستند."),
            ],
            "gallery": [("assets/img/personnel-food/hygienic-kitchen.webp|assets/img/personnel-food/hygienic-kitchen.jpg", "آشپزخانهٔ صنعتی بهداشتی با پرسنل متخصص"), ("assets/img/personnel-food/food-delivery.webp|assets/img/personnel-food/food-delivery.jpg", "توزیع پرس غذای گرم در محل کارخانه")],
        },
        "en": {
            "title": "Personnel Catering & Corporate Meals",
            "meta": "Hot, hygienic meal preparation and distribution for factories, offices and organizations — weekly rotating menus, all-shift distribution and annual contracts with Qazvin Tasvir.",
            "lead": "Hot, hygienic and varied meal preparation and distribution for factories, offices and organizations; from the weekly rotating menu to regular distribution across every shift with catering vehicles.",
            "stats": [("4 full meals", "breakfast, lunch, dinner and snacks"), ("28 items", "in the weekly rotating menu"), ("50+ portions", "per meal, minimum")],
            "intro": [
                "Quality food is the most direct message of care to your personnel. With licensed kitchens and full hygiene compliance, Qazvin Tasvir manages corporate meals from menu design all the way to hot on-site distribution.",
                "Our menu rotates weekly and is tuned to the season, your personnel's tastes and your budget; from authentic Persian dishes to diet, vegetarian and low-salt options. Portions are distributed by catering vehicles on your own shift schedule.",
            ],
            "features": [
                ("Weekly & seasonal rotation", "Full variety with no repeats through the week"),
                ("Licensed, hygienic kitchens", "Cooking in kitchens holding official health licenses"),
                ("Hot catering-vehicle delivery", "Temperature and hygiene preserved until serving on your shifts"),
                ("Diet & vegetarian options", "Covering special dietary needs in every organization"),
                ("Occasion meals", "Special service for celebrations and notable dates"),
                ("Continuous quality monitoring", "Regular personnel feedback and menu refinement"),
            ],
            "steps": [
                ("Needs review", "Headcount, shifts and per-meal budget"),
                ("Menu proposal", "A sample weekly menu and distribution plan"),
                ("Supply launch", "Annual contract and the start of regular cooking & delivery"),
                ("Monitoring & improvement", "Personnel feedback and menu refinement through the contract"),
            ],
            "faqs": [
                ("What is the minimum portion count?", "Catering contracts start from 50 portions per meal."),
                ("How is the menu decided?", "A sample weekly menu is presented and finalized by your personnel's tastes and budget; unpopular items are replaced."),
                ("Do you offer diet and vegetarian meals?", "Yes; diet, vegetarian and low-salt options are a standard part of our corporate menu."),
            ],
            "gallery": [("assets/img/personnel-food/hygienic-kitchen.webp|assets/img/personnel-food/hygienic-kitchen.jpg", "The hygienic industrial kitchen and its staff"), ("assets/img/personnel-food/food-delivery.webp|assets/img/personnel-food/food-delivery.jpg", "Hot meal distribution at the plant")],
        },
    },
    {
        "slug": "consulting",
        "icon": "briefcase",
        "fa": {
            "title": "مشاوره بازرگانی و گشایش",
            "meta": "مشاوره تخصصی بازرگانی، گشایش اعتبار اسنادی (LC) و امور ارزی؛ از تحلیل بازار و مذاکره تا مدیریت اسناد و ریسک‌های تجاری با قزوین تصویر.",
            "lead": "مشاورهٔ تخصصی بازرگانی، گشایش اعتبار اسنادی (LC) و امور ارزی؛ از تحلیل بازار و مذاکره با طرف مقابل تا مدیریت اسناد و کاهش ریسک‌های تجاری.",
            "stats": [("+۳۱ سال", "تجربهٔ عملیاتی بازرگانی"), ("کل زنجیره", "از تحلیل تا تسویه"), ("مدیریت ریسک", "پیش‌بینی و کاهش ریسک‌های تجاری")],
            "intro": [
                "تجربهٔ گران‌بهاترین سرمایهٔ تجارت است؛ به‌جای آزمون و خطای پرهزینه، از مسیر آزموده عبور کنید. تیم مشاورهٔ قزوین تصویر با بیش از سه دهه حضور عملیاتی در واردات، صادرات و قراردادهای بین‌المللی، کنار شماست.",
                "از تحلیل بازار و قیمت تا ساختار قرارداد، گشایش اعتبار و امور ارزی؛ نگاه ما پروژه‌ای و تمام‌عیار است: نه فقط پاسخ به پرسش امروز، بلکه ساختن توانمندی تصمیم‌گیری برای تیم شما.",
            ],
            "features": [
                ("مشاورهٔ واردات و صادرات", "نقشهٔ راه روشن بر اساس مقررات جاری و تجربهٔ عملی"),
                ("گشایش اعتبار (LC)", "همراهی کامل در فرآیند اعتبار اسنادی و اسناد بانکی"),
                ("امور ارزی", "مدیریت تعهدات ارزی و پیگیری‌های بانکی مطابق مقررات"),
                ("مذاکره و تنظیم قرارداد", "ساختاردهی قرارداد برای منافع و امنیت طرف شما"),
                ("تحلیل بازار و قیمت", "بررسی مبدأ/مقصد و پایش روند قیمت‌ها"),
                ("مدیریت ریسک تجاری", "شناسایی پیشاپیش ریسک‌ها و طراحی راه کاهش آن‌ها"),
            ],
            "steps": [
                ("جلسهٔ شناخت", "درک دقیق کسب‌وکار، هدف و محدودیت‌های شما"),
                ("تحلیل و نقشهٔ راه", "ارائهٔ گزینه‌ها، هزینه‌ها و ریسک‌ها به‌صورت شفاف"),
                ("اجرا و همراهی", "همراهی گام‌به‌گام در اجرای تصمیم‌های تجاری"),
                ("بازبینی و گزارش", "ارزیابی نتایج و تنظیم مسیر ادامه"),
            ],
            "faqs": [
                ("گشایش اعتبار چگونه انجام می‌شود؟", "پس از قرارداد با طرف خارجی، فرآیند گشایش LC و آماده‌سازی اسناد بانکی به‌طور کامل توسط ما همراهی می‌شود."),
                ("هزینهٔ مشاوره چگونه محاسبه می‌شود؟", "بسته به نوع و حجم پروژه؛ پس از جلسهٔ شناخت اولیه، طرح و هزینهٔ شفاف کتبی ارائه می‌شود."),
                ("آیا مشاورهٔ موردی و کوتاه‌مدت هم دارید؟", "بله؛ برای موضوعات مشخص (مثلاً بررسی یک قرارداد یا تعرفه) جلسات موردی نیز برگزار می‌شود."),
            ],
            "gallery": [("assets/img/sections/about-office.webp|assets/img/sections/about-office.jpg", "دفتر شرکت قزوین تصویر؛ محل جلسات مشاوره")],
        },
        "en": {
            "title": "Trade Consulting & LC Services",
            "meta": "Specialized trade consulting, letter-of-credit (LC) opening and currency affairs — from market analysis and negotiation to document management and commercial risk reduction with Qazvin Tasvir.",
            "lead": "Specialized trade consulting, letter-of-credit (LC) opening and currency affairs; from market analysis and counterparty negotiation to document management and reduced commercial risk.",
            "stats": [("31+ years", "of hands-on trading experience"), ("The full chain", "from analysis to settlement"), ("Risk management", "anticipating and reducing commercial risks")],
            "intro": [
                "Experience is trade's most valuable asset; instead of costly trial and error, take the proven route. Qazvin Tasvir's consulting team, with more than three decades of hands-on presence in imports, exports and international contracts, stands beside you.",
                "From market and price analysis to contract structure, LC opening and currency affairs — our approach is project-based and thorough: not just answering today's question, but building your team's decision-making capability.",
            ],
            "features": [
                ("Import & export consulting", "A clear roadmap based on current regulations and practice"),
                ("LC opening", "End-to-end guidance through letters of credit and bank documents"),
                ("Currency affairs", "Managing currency obligations and bank follow-ups under the rules"),
                ("Negotiation & contracts", "Structuring agreements for your interests and security"),
                ("Market & price analysis", "Origin/destination research and price-trend monitoring"),
                ("Commercial risk management", "Identifying risks up front and designing mitigation"),
            ],
            "steps": [
                ("Discovery session", "A precise understanding of your business, goals and limits"),
                ("Analysis & roadmap", "Options, costs and risks presented transparently"),
                ("Execution support", "Step-by-step accompaniment in carrying out decisions"),
                ("Review & reporting", "Evaluating outcomes and setting the course ahead"),
            ],
            "faqs": [
                ("How does LC opening work?", "After the contract with the foreign party, we accompany the entire LC opening process and preparation of bank documents."),
                ("How is the consulting fee calculated?", "It depends on the project's type and scale; after the initial discovery session, a transparent written proposal is provided."),
                ("Do you offer short-term advisory?", "Yes; single-topic sessions (e.g. reviewing one contract or tariff) are also available."),
            ],
            "gallery": [("assets/img/sections/about-office.webp|assets/img/sections/about-office.jpg", "Qazvin Tasvir's office — where consulting sessions take place")],
        },
    },
]

# ─── رشته‌های مشترک رابط (هر دو زبان) ────────────────────────────────────────
UI = {
    "fa": {
        "dir": "rtl", "locale": "fa_IR",
        "brand_sub": "بازرگانی • ترابری • تأمین غذای پرسنل",
        "nav": [("خانه", "#hero"), ("درباره ما", "#about"), ("خدمات", "#services"), ("ناوگان", "#fleet"), ("تماس", "#contact")],
        "home": "صفحهٔ اصلی", "services_all": "همهٔ خدمات تخصصی",
        "skip": "پرش به محتوای اصلی",
        "theme_label": "تغییر تم سایت", "theme_panel": "انتخاب تم رنگی سایت",
        "theme_light": "روشن", "theme_dark": "تیره", "theme_ocean": "اقیانوسی",
        "lang_other": "English", "lang_label": "تغییر زبان",
        "cta_nav": "درخواست مشاوره",
        "breadcrumb_root": "خانه", "breadcrumb_section": "خدمات تخصصی",
        "stats_label": "در یک نگاه",
        "intro_title": "معرفی خدمت",
        "features_title": "مزیت‌های این خدمت",
        "steps_title": "فرآیند همکاری",
        "gallery_title": "نگاهی به عملکرد",
        "faq_title": "سوالات متداول",
        "cta_title": "برای شروع همکاری با ما در تماس باشید",
        "cta_text": "مشخصات نیاز خود را بفرستید؛ کارشناسان قزوین تصویر در اولین فرصت پاسخ می‌دهند.",
        "cta_call": "تماس تلفنی", "cta_whatsapp": "ارسال درخواست در واتساپ",
        "cta_services": "مشاهدهٔ سایر خدمات",
        "footer_about": "ارائه‌دهندهٔ خدمات تخصصی بازرگانی، واردات و صادرات کالا، ترابری و سرویس ایاب‌وذهاب پرسنل و تأمین غذای پرسنل و وعده‌های سازمانی کارخانه‌ها و شرکت‌های صنعتی؛ با بیش از ۳۱ سال سابقهٔ درخشان.",
        "footer_services": "خدمات تخصصی", "footer_contact": "راه‌های تماس",
        "footer_phone": "تلفن تماس مستقیم", "footer_whatsapp": "گفتگو در واتساپ",
        "footer_est": "با مسئولیت محدود — تأسیس ۱۳۷۴",
        "footer_copy": "کلیه حقوق برای شرکت قزوین تصویر محفوظ است.",
        "hero_img_alt": "تصویر شاخص خدمت",
    },
    "en": {
        "dir": "ltr", "locale": "en_US",
        "brand_sub": "Trading • Transport • Personnel Catering",
        "nav": [("Home", "#hero"), ("About", "#about"), ("Services", "#services"), ("Fleet", "#fleet"), ("Contact", "#contact")],
        "home": "Home", "services_all": "All specialty services",
        "skip": "Skip to main content",
        "theme_label": "Change site theme", "theme_panel": "Choose site color theme",
        "theme_light": "Light", "theme_dark": "Dark", "theme_ocean": "Ocean",
        "lang_other": "فارسی", "lang_label": "Change language",
        "cta_nav": "Request consultation",
        "breadcrumb_root": "Home", "breadcrumb_section": "Specialty services",
        "stats_label": "At a glance",
        "intro_title": "Service overview",
        "features_title": "Advantages of this service",
        "steps_title": "How we work together",
        "gallery_title": "A look at our work",
        "faq_title": "Frequently asked questions",
        "cta_title": "Get in touch to start",
        "cta_text": "Send us the details of your need; Qazvin Tasvir's experts will respond at the first opportunity.",
        "cta_call": "Call now", "cta_whatsapp": "Send request on WhatsApp",
        "cta_services": "View other services",
        "footer_about": "Provider of specialized trading, import & export, staff transport and corporate catering services for factories and industrial companies — with more than 31 years of outstanding track record.",
        "footer_services": "Specialty services", "footer_contact": "Contact",
        "footer_phone": "Direct phone line", "footer_whatsapp": "Chat on WhatsApp",
        "footer_est": "LLC — established 1995",
        "footer_copy": "All rights reserved by Qazvin Tasvir Company.",
        "hero_img_alt": "Service featured image",
    },
}

PHONE = "+989122815189"
PHONE_FA = "۰۹۱۲ ۲۸۱ ۵۱۸۹"
WA = "https://wa.me/989122815189"

THEME_BLOCK = """<details class="theme-switch">
          <summary class="theme-switch__btn" aria-label="{theme_label}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="13.5" cy="6.5" r="1.5"></circle><circle cx="17.5" cy="10.5" r="1.5"></circle><circle cx="8.5" cy="7.5" r="1.5"></circle><circle cx="6.5" cy="12.5" r="1.5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
            </svg>
          </summary>
          <div class="theme-switch__panel" role="group" aria-label="{theme_panel}">
            <button type="button" class="theme-option" data-theme-value="light" aria-pressed="true"><span class="theme-option__swatch theme-option__swatch--light" aria-hidden="true"></span><span class="theme-option__name">{theme_light}</span></button>
            <button type="button" class="theme-option" data-theme-value="dark" aria-pressed="false"><span class="theme-option__swatch theme-option__swatch--dark" aria-hidden="true"></span><span class="theme-option__name">{theme_dark}</span></button>
            <button type="button" class="theme-option" data-theme-value="ocean" aria-pressed="false"><span class="theme-option__swatch theme-option__swatch--ocean" aria-hidden="true"></span><span class="theme-option__name">{theme_ocean}</span></button>
          </div>
        </details>"""

PAGE_JS = """(function () {
  var sw = document.querySelector('.theme-switch');
  function syncUI() {
    var cur = document.documentElement.getAttribute('data-theme') || 'light';
    document.querySelectorAll('.theme-option').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-value') === cur ? 'true' : 'false');
    });
  }
  document.querySelectorAll('.theme-option').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-theme-value');
      if (t === 'light') { document.documentElement.removeAttribute('data-theme'); }
      else { document.documentElement.setAttribute('data-theme', t); }
      try { localStorage.setItem('qt-theme', t); } catch (e) {}
      syncUI();
      if (sw) sw.removeAttribute('open');
    });
  });
  syncUI();
  document.addEventListener('click', function (e) {
    if (sw && !sw.contains(e.target)) sw.removeAttribute('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sw) sw.removeAttribute('open');
  });
  var nb = document.querySelector('.navbar');
  function onScroll() { if (nb) nb.classList.toggle('is-scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-revealed'); });
  }
})();"""


def svg_icon(name: str, size: int = 22) -> str:
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


def picture(webp_jpg: str, alt: str, prefix: str, cls: str, eager: bool = False) -> str:
    webp, jpg = webp_jpg.split("|")
    loading = "eager" if eager else "lazy"
    return (f'<picture class="{cls}">\n'
            f'<source srcset="{prefix}{webp}" type="image/webp">\n'
            f'<img src="{prefix}{jpg}" alt="{alt}" loading="{loading}" decoding="async">\n'
            f'</picture>')


def build_page(lang: str, svc: dict) -> str:
    ui = UI[lang]
    c = svc[lang]
    slug = svc["slug"]
    en = lang == "en"
    P = "../../" if en else "../"                      # پیشوند مسیر دارایی‌ها
    HOME = "../index.html"                             # صفحهٔ اصلی هم‌زبان
    # از صفحهٔ en به fa: ../../services/… | از fa به en: ../en/services/…
    lang_href = f"../../services/{slug}.html" if en else f"../en/services/{slug}.html"
    url = f"{SITE_ORIGIN}/{'en/' if en else ''}services/{slug}.html"
    brand = "Qazvin Tasvir Company" if en else "قزوین تصویر"
    title = f"{c['title']} | {brand}"

    nav_links = "".join(
        f'<li><a class="svc-nav__link" href="{HOME}#{anchor}">{label}</a></li>'
        for label, anchor in ui["nav"])

    theme = (THEME_BLOCK
             .replace("{theme_label}", ui["theme_label"])
             .replace("{theme_panel}", ui["theme_panel"])
             .replace("{theme_light}", ui["theme_light"])
             .replace("{theme_dark}", ui["theme_dark"])
             .replace("{theme_ocean}", ui["theme_ocean"]))

    stats = "".join(
        f'<div class="svc-stat"><div class="svc-stat__num">{v}</div>'
        f'<div class="svc-stat__label">{l}</div></div>' for v, l in c["stats"])

    intro = "\n            ".join(f"<p>{p}</p>" for p in c["intro"])

    feats = "".join(
        f'<div class="svc-feature reveal">{svg_icon(svc["icon"])}'
        f'<h3>{t}</h3><p>{d}</p></div>' for t, d in c["features"])

    steps = "".join(
        f'<div class="svc-step reveal"><span class="svc-step__num">{i + 1}</span>'
        f'<div><h3>{t}</h3><p>{d}</p></div></div>'
        for i, (t, d) in enumerate(c["steps"]))

    gallery = ""
    if c["gallery"]:
        items = "".join(
            f'<figure class="svc-gallery__item reveal">{picture(src, alt, P, "svc-gallery__pic")}'
            f'<figcaption>{alt}</figcaption></figure>' for src, alt in c["gallery"])
        gallery = f"""
      <section class="svc-section" aria-labelledby="{slug}-gallery">
        <div class="container">
          <h2 class="svc-section__title" id="{slug}-gallery">{ui["gallery_title"]}</h2>
          <div class="svc-gallery">{items}</div>
        </div>
      </section>"""

    faqs = "".join(
        f'<details class="svc-faq reveal"><summary>{q}</summary><p>{a}</p></details>'
        for q, a in c["faqs"])

    others = "".join(
        f'<a class="svc-others__link" href="{s["slug"]}.html">{svg_icon(s["icon"], 18)}<span>{s[lang]["title"]}</span></a>'
        for s in SERVICES if s["slug"] != slug)

    others_block = f"""
      <section class="svc-section svc-section--soft" aria-labelledby="{slug}-others">
        <div class="container">
          <h2 class="svc-section__title" id="{slug}-others">{ui["cta_services"]}</h2>
          <div class="svc-others">{others}</div>
        </div>
      </section>"""

    return f"""<!DOCTYPE html>
<html lang="{lang}" dir="{ui['dir']}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>
    /* اعمال تم ذخیره‌شدهٔ کاربر پیش از رندر — جلوگیری از فلش رنگی (FOUC) */
    (function () {{
      try {{
        var t = localStorage.getItem('qt-theme');
        if (t === 'dark' || t === 'ocean') {{
          document.documentElement.setAttribute('data-theme', t);
        }}
      }} catch (e) {{}}
    }})();
  </script>
  <title>{title}</title>
  <meta name="description" content="{c['meta']}">
  <link rel="canonical" href="{url}">
  <link rel="alternate" hreflang="fa" href="{SITE_ORIGIN}/services/{slug}.html">
  <link rel="alternate" hreflang="en" href="{SITE_ORIGIN}/en/services/{slug}.html">
  <link rel="alternate" hreflang="x-default" href="{SITE_ORIGIN}/services/{slug}.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{c['meta']}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE_ORIGIN}/assets/img/services/{slug}.jpg">
  <meta property="og:locale" content="{ui['locale']}">
  <link rel="icon" type="image/png" sizes="32x32" href="{P}assets/images/brand/qazvin-tasvir-icon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="{P}assets/images/brand/qazvin-tasvir-apple-touch.png">
  <link rel="stylesheet" href="{P}assets/css/style.css">
</head>
<body class="svc-body">
  <a class="skip-link" href="#main">{ui['skip']}</a>

  <header class="navbar" aria-label="{'Service page navigation' if en else 'ناوبری صفحهٔ خدمت'}">
    <div class="container">
      <div class="navbar__inner svc-nav__inner">
        <a href="{HOME}#hero" class="brand-logo" aria-label="{ui['home']} — {brand}">
          <div class="brand-logo__emblem">
            <img class="brand-logo__mark" src="{P}assets/images/brand/qazvin-tasvir-mark.png" width="44" height="44" alt="" decoding="async">
          </div>
          <div class="brand-logo__text">
            <span class="brand-logo__title">{brand}</span>
            <span class="brand-logo__subtitle">{ui['brand_sub']}</span>
          </div>
        </a>
        <nav class="svc-nav" aria-label="{ui['nav'][2][0]}">
          <ul class="svc-nav__menu">{nav_links}</ul>
        </nav>
        <div class="navbar__actions svc-nav__actions">
          {theme}
          <a class="svc-lang" href="{lang_href}" hreflang="{'fa' if en else 'en'}" lang="{'fa' if en else 'en'}" aria-label="{ui['lang_label']}">{ui["lang_other"]}</a>
          <a class="btn btn-primary svc-nav__cta" href="tel:{PHONE}">{ui['cta_nav']}</a>
        </div>
      </div>
    </div>
  </header>

  <main id="main">
    <!-- هیرو خدمت -->
    <section class="svc-hero">
      <div class="container svc-hero__grid">
        <div class="svc-hero__content">
          <nav class="svc-breadcrumb" aria-label="{'Breadcrumb' if en else 'مسیر صفحه'}">
            <a href="{HOME}#hero">{ui['breadcrumb_root']}</a>
            <span aria-hidden="true">›</span>
            <a href="{HOME}#services">{ui['breadcrumb_section']}</a>
            <span aria-hidden="true">›</span>
            <strong>{c['title']}</strong>
          </nav>
          <h1 class="svc-hero__title">{c['title']}</h1>
          <p class="svc-hero__lead">{c['lead']}</p>
          <div class="svc-hero__actions">
            <a class="btn btn-primary btn-lg" href="{WA}" target="_blank" rel="noopener noreferrer">{ui['cta_whatsapp']}</a>
            <a class="btn btn-outline-glass btn-lg" href="tel:{PHONE}">{'0912 281 5189' if en else PHONE_FA}</a>
          </div>
        </div>
        <div class="svc-hero__media reveal">
          {picture(f"assets/img/services/{slug}.webp|assets/img/services/{slug}.jpg", c.get('hero_alt', ui['hero_img_alt']), P, "svc-hero__pic", eager=True)}
        </div>
      </div>
    </section>

    <!-- آمار کلی -->
    <section class="svc-stats-band" aria-label="{ui['stats_label']}">
      <div class="container svc-stats">{stats}</div>
    </section>

    <!-- معرفی -->
    <section class="svc-section" aria-labelledby="{slug}-intro">
      <div class="container">
        <h2 class="svc-section__title" id="{slug}-intro">{ui['intro_title']}</h2>
        <div class="svc-intro">
            {intro}
        </div>
      </div>
    </section>

    <!-- مزیت‌ها -->
    <section class="svc-section svc-section--soft" aria-labelledby="{slug}-features">
      <div class="container">
        <h2 class="svc-section__title" id="{slug}-features">{ui['features_title']}</h2>
        <div class="svc-features">{feats}</div>
      </div>
    </section>

    <!-- فرآیند -->
    <section class="svc-section" aria-labelledby="{slug}-steps">
      <div class="container">
        <h2 class="svc-section__title" id="{slug}-steps">{ui['steps_title']}</h2>
        <div class="svc-steps">{steps}</div>
      </div>
    </section>
{gallery}
    <!-- سوالات متداول -->
    <section class="svc-section svc-section--soft" aria-labelledby="{slug}-faq">
      <div class="container">
        <h2 class="svc-section__title" id="{slug}-faq">{ui['faq_title']}</h2>
        <div class="svc-faqs">{faqs}</div>
      </div>
    </section>

    <!-- CTA -->
    <section class="svc-cta" aria-labelledby="{slug}-cta">
      <div class="container">
        <h2 class="svc-cta__title" id="{slug}-cta">{ui['cta_title']}</h2>
        <p class="svc-cta__text">{ui['cta_text']}</p>
        <div class="svc-hero__actions">
          <a class="btn btn-primary btn-lg" href="{WA}" target="_blank" rel="noopener noreferrer">{ui['cta_whatsapp']}</a>
          <a class="btn btn-outline-glass btn-lg" href="tel:{PHONE}">{ui['cta_call']} — {'0912 281 5189' if en else PHONE_FA}</a>
        </div>
      </div>
    </section>
{others_block}
  </main>

  <footer class="footer" aria-label="{'Site footer' if en else 'پاورقی سایت'}">
    <div class="container">
      <div class="footer__grid svc-footer">
        <div>
          <div class="brand-logo" style="margin-bottom: 12px;">
            <div class="brand-logo__emblem brand-logo__emblem--plain">
              <img class="brand-logo__mark" src="{P}assets/images/brand/qazvin-tasvir-mark.png" width="44" height="44" alt="" loading="lazy" decoding="async">
            </div>
            <div class="brand-logo__text">
              <span class="brand-logo__title" style="color: #FFFFFF;">{brand}</span>
              <span class="brand-logo__subtitle" style="color: #94A3B8;">{ui['footer_est']}</span>
            </div>
          </div>
          <p class="footer__about-text">{ui['footer_about']}</p>
        </div>
        <div>
          <h4 class="footer__col-title">{ui['footer_services']}</h4>
          <ul class="footer__links">
            {''.join(f'<li><a href="{s["slug"]}.html" class="footer__link">{s[lang]["title"]}</a></li>' for s in SERVICES)}
          </ul>
        </div>
        <div>
          <h4 class="footer__col-title">{ui['footer_contact']}</h4>
          <ul class="footer__links">
            <li><a href="tel:{PHONE}" class="footer__link" style="direction: ltr;">{'0912 281 5189' if en else PHONE_FA}</a></li>
            <li><a href="{WA}" target="_blank" rel="noopener noreferrer" class="footer__link">{ui['footer_whatsapp']}</a></li>
            <li><a href="{HOME}#contact" class="footer__link">{ui['home']}</a></li>
          </ul>
        </div>
      </div>
      <p class="footer__copy" style="text-align: center; margin-top: 24px; font-size: 0.8rem; color: #94A3B8;">{ui['footer_copy']}</p>
    </div>
  </footer>

  <script>
{PAGE_JS}
  </script>
</body>
</html>
"""


def main() -> None:
    made = []
    for svc in SERVICES:
        fa_html = build_page("fa", svc)
        en_html = build_page("en", svc)
        (ROOT / "services").mkdir(exist_ok=True)
        (ROOT / "en" / "services").mkdir(exist_ok=True)
        (ROOT / "services" / f"{svc['slug']}.html").write_text(fa_html, encoding="utf-8")
        (ROOT / "en" / "services" / f"{svc['slug']}.html").write_text(en_html, encoding="utf-8")
        made.append(svc["slug"])
    print(f"تولید شد: {len(made)} خدمت × ۲ زبان = {len(made) * 2} صفحه")
    for s in made:
        print(f"  • services/{s}.html + en/services/{s}.html")


if __name__ == "__main__":
    main()
