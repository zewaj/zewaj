/* =====================================================================
   dhikr.js — أذكار الانتظار والمواسم (ملف مشترك بين الصفحات، نصوص فقط بلا أي طلب شبكة)
   الاستعمال: ضع <div data-dhikr="wait"></div> داخل عنصر التحميل (أو "seek" لشاشات البحث/المطابقة)
   وحمّل هذا الملف. يظهر الذكر بعد نحو 0.7 ث فقط (فلا يومض في الطلبات السريعة)، ويتبدّل كل 5 ث ما دام ظاهراً.
   ملاحظة: كل النصوص هنا اعتمدها صاحب المشروع؛ لا تُضف نصاً بلا مراجعة (آية/حديث ثابت، بلا وعود بفضائل).
   Dhikr.once(ctx) تُرجع {lead, text, src} لسطر واحد لاستعماله في نوافذ النجاح.
   ===================================================================== */
(function (w) {
    "use strict";

    var TZ = "Asia/Riyadh";
    var ROTATE_MS = 5000;

    // ---------- الصلاة على النبي ﷺ ----------
    var SALAWAT = [
        "اللهم صلِّ وسلِّم على نبينا محمد",
        "اللهم صلِّ على محمد وعلى آل محمد",
        "اللهم صلِّ وسلِّم وبارك على نبينا محمد",
        "صلى الله عليه وسلم",
        "اللهم صلِّ على محمد وعلى آل محمد، وبارك على محمد وعلى آل محمد"
    ];
    var SALAWAT_FULL = "اللهم صلِّ على محمد وعلى آل محمد كما صليتَ على إبراهيم وعلى آل إبراهيم إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد كما باركتَ على إبراهيم وعلى آل إبراهيم إنك حميد مجيد";

    // ---------- أذكار الأيام العادية ----------
    var BASE = [
        { t: "سبحان الله وبحمده، سبحان الله العظيم" },
        { t: "سبحان الله وبحمده" },
        { t: "الحمد لله" },
        { t: "الله أكبر" },
        { t: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير" },
        { t: "لا حول ولا قوة إلا بالله" },
        { t: "أستغفر الله وأتوب إليه" },
        { t: "ربِّ اغفر لي وتب عليّ إنك أنت التواب الرحيم" },
        { t: "لا إله إلا أنت سبحانك إني كنت من الظالمين" },
        { t: "حسبنا الله ونعم الوكيل" },
        { t: "سبحان الله والحمد لله ولا إله إلا الله والله أكبر" },
        { t: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾", s: "الرعد" },
        { t: "﴿فَاذْكُرُونِي أَذْكُرْكُمْ﴾", s: "البقرة" },
        { t: "﴿رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي﴾", s: "طه" },
        { t: "﴿رَبِّ زِدْنِي عِلْمًا﴾", s: "طه" },
        { t: "﴿وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا﴾", s: "الطلاق" }
    ];

    // ---------- أدعية تخص موضوع الموقع (للبحث والمطابقة) ----------
    var SEEK = [
        { t: "اللهم إني أستخيرك بعلمك، وأستقدرك بقدرتك، وأسألك من فضلك العظيم، فإنك تقدر ولا أقدر، وتعلم ولا أعلم، وأنت علام الغيوب", s: "البخاري" },
        { t: "﴿رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا﴾", s: "الفرقان" },
        { t: "﴿رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ﴾", s: "القصص" },
        { t: "﴿وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً﴾", s: "الروم" }
    ];

    // ---------- عبارات الربط (صياغتنا نحن) ----------
    var LEADS_WAIT = [
        "استغل وقتك بذكر الله",
        "لحظات انتظار.. اغتنمها بذكر الله",
        "ريثما نجهّز لك الصفحة، اذكر الله",
        "جاري التحميل.. ولسانك رطب بذكر الله",
        "اجعل انتظارك ذكراً"
    ];
    var LEADS_LONG = [
        "تأخر قليلاً؟ هذه فرصة لاستغفار أو تسبيح",
        "استغل وقتك بذكر الله"
    ];
    var LEAD_FRIDAY = "يوم الجمعة.. أكثر من الصلاة على النبي ﷺ";

    // ---------- التوقيت (الرياض) والتقويم الهجري ----------
    function riyadhNow() {
        var d = new Date();
        var out = { dow: d.getDay(), hour: d.getHours(), hMonth: 0, hDay: 0 };
        try {
            var p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(d);
            var map = {};
            p.forEach(function (x) { map[x.type] = x.value; });
            out.dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
            out.hour = parseInt(map.hour, 10) % 24;
        } catch (e) { /* نبقى على توقيت الجهاز */ }
        try {
            var h = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: TZ, day: "numeric", month: "numeric" }).formatToParts(d);
            h.forEach(function (x) {
                if (x.type === "month") out.hMonth = parseInt(x.value, 10);
                if (x.type === "day") out.hDay = parseInt(x.value, 10);
            });
        } catch (e) { /* بلا تقويم هجري: لا مواسم */ }
        return out;
    }

    // الجمعة: من مغرب الخميس تقريباً (18:00) إلى مغرب الجمعة
    function isFridayWindow(n) {
        return (n.dow === 4 && n.hour >= 18) || (n.dow === 5 && n.hour < 18);
    }

    // أذكار المواسم (تُعرض أولاً ثم تُخلط مع بقية الأذكار)
    function seasonal(n) {
        var out = [];
        var m = n.hMonth, d = n.hDay;
        if (m === 9) {
            out.push({ t: "إذا جاء رمضان فُتّحت أبواب الجنة…", s: "متفق عليه" });
            if (d >= 21) out.push({ t: "اللهم إنك عفوٌّ تحب العفو فاعف عني", s: "الترمذي" });
        }
        if (m === 12 && d >= 1 && d <= 10) {
            out.push({ t: "ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام", s: "البخاري" });
            out.push({ t: "الله أكبر الله أكبر لا إله إلا الله، والله أكبر الله أكبر ولله الحمد" });
            if (d === 9) out.push({ t: "خير الدعاء دعاء يوم عرفة…", s: "الترمذي" });
        }
        if (m === 1 && (d === 9 || d === 10)) {
            out.push({ t: "صيام يوم عاشوراء أحتسب على الله أن يكفّر السنة التي قبله", s: "مسلم" });
        }
        if (d >= 13 && d <= 15) {
            out.push({ t: "من الأيام البيض.. صيام ثلاثة أيام من كل شهر (13 و14 و15)", s: "الترمذي والنسائي" });
        }
        if (n.dow === 1 || n.dow === 4) {
            out.push({ t: "تُعرض الأعمال يوم الاثنين والخميس…", s: "الترمذي" });
        }
        if (n.hour >= 1 && n.hour < 4) {
            out.push({ t: "ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا…", s: "متفق عليه" });
        }
        return out;
    }

    function shuffle(a) {
        a = a.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }

    // يبني قائمة العرض لسياق معيّن: { lead, items:[{t,s}] }
    function build(ctx) {
        var n = riyadhNow();
        var friday = isFridayWindow(n);
        var items, lead;
        if (friday) {
            items = shuffle(SALAWAT.map(function (t) { return { t: t }; }));
            // تذكيرات الجمعة تتخلل الصلاة على النبي ﷺ
            items.splice(2, 0, { t: "في الجمعة ساعة إجابة، فأكثر من الدعاء، خاصة بعد العصر", s: "متفق عليه" });
            if (n.dow === 5 && n.hour < 12) items.splice(4, 0, { t: "لا تنس قراءة سورة الكهف" });
            items.push({ t: SALAWAT_FULL });
            lead = LEAD_FRIDAY;
        } else {
            var pool = BASE.slice();
            if (ctx === "seek") pool = pool.concat(SEEK, SEEK); // وزن مضاعف لأدعية الزواج في البحث والمطابقة
            items = seasonal(n).concat(shuffle(pool));
            lead = pickOne(ctx === "long" ? LEADS_LONG : LEADS_WAIT);
        }
        return { lead: lead, items: items };
    }

    // سطر واحد جاهز (لنوافذ النجاح مثلاً)
    function once(ctx) {
        var b = build(ctx);
        var it = b.items[0];
        return { lead: b.lead, text: it.t, src: it.s || "" };
    }

    // ---------- الواجهة: تعبئة عناصر data-dhikr وتدويرها ----------
    var CSS = ".dhikr-box{text-align:center;margin:14px auto 0;max-width:340px;padding:0 12px;opacity:0;animation:dhikrIn .6s ease .7s forwards}" +
        ".dhikr-lead{font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px}" +
        ".dhikr-text{font-size:15px;font-weight:700;color:#047857;line-height:1.9;transition:opacity .45s;min-height:2em}" +
        ".dhikr-text.out{opacity:0}" +
        ".dhikr-src{font-size:10px;color:#94a3b8;font-weight:500;margin-inline-start:6px}" +
        "@keyframes dhikrIn{to{opacity:1}}" +
        "@media (prefers-reduced-motion:reduce){.dhikr-box{animation:none;opacity:1}.dhikr-text{transition:none}}";

    var bound = [];
    var timer = null;

    function injectCss() {
        if (document.getElementById("dhikr-css")) return;
        var st = document.createElement("style");
        st.id = "dhikr-css";
        st.textContent = CSS;
        (document.head || document.documentElement).appendChild(st);
    }

    function show(rec, idx) {
        var it = rec.items[idx % rec.items.length];
        rec.textEl.textContent = it.t;
        if (it.s) {
            var sp = document.createElement("span");
            sp.className = "dhikr-src";
            sp.textContent = "(" + it.s + ")";
            rec.textEl.appendChild(sp);
        }
    }

    function tick() {
        // نُسقط العناصر التي أُزيلت من الصفحة (الهياكل تُستبدل بـinnerHTML عند وصول البيانات)
        bound = bound.filter(function (rec) { return rec.host.isConnected; });
        bound.forEach(function (rec) {
            // getClientRects بدل offsetParent: الأخير يرجع null لعناصر position:fixed (شاشة فتح الرابط السحري)
            if (!rec.host.getClientRects().length) return; // مخفي: لا نعمل شيئاً
            rec.i++;
            rec.textEl.classList.add("out");
            setTimeout(function () { show(rec, rec.i); rec.textEl.classList.remove("out"); }, 450);
        });
    }

    function bind(host) {
        if (!host || host.__dhikr) return;
        host.__dhikr = true;
        var b = build(host.getAttribute("data-dhikr") || "wait");
        host.className = ((host.className || "") + " dhikr-box").trim();
        var lead = document.createElement("div");
        lead.className = "dhikr-lead";
        lead.textContent = b.lead;
        var txt = document.createElement("div");
        txt.className = "dhikr-text";
        host.textContent = "";
        host.appendChild(lead);
        host.appendChild(txt);
        var rec = { host: host, textEl: txt, items: b.items, i: 0 };
        show(rec, 0);
        bound.push(rec);
        if (!timer) timer = setInterval(tick, ROTATE_MS);
    }

    function init() {
        try {
            injectCss();
            var nodes = document.querySelectorAll("[data-dhikr]");
            for (var k = 0; k < nodes.length; k++) bind(nodes[k]);
        } catch (e) { /* الأذكار زينة: لا تُعطّل الصفحة أبداً */ }
    }

    w.Dhikr = { once: once, bind: bind, init: init };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window);
