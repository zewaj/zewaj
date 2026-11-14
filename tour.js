/* 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 */
/* ✂️ ---------- [ tour.js: محرك الجولات التعليمية (إضاءة الأزرار + فقاعة الشرح) ] ---------- ✂️ */
/* 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 */
/*
   ملف مشترك بين index.html و search.html (يُرفع مع الصفحات، وعند تعديله ارفع رقم ?v= في وسم السكربت).
   الاستعمال:
     AbuTour.start({ key: 'tour_home_v1', steps: [{ target: '#id' | fn | element, title, text }], onEnd(completed) })
   - key: علم "شوهدت" في localStorage؛ لا تبدأ الجولة إن وُجد (إلا مع force:true). يُكتب عند البدء لا عند الانتهاء،
     فمن أغلق الصفحة في منتصفها لا تتكرر عليه.
   - الخطوة التي هدفها غير ظاهر (مخفي أو غير موجود) تُتخطى تلقائياً.
   - لا يعتمد على أي مكتبة. كل النصوص تُكتب بـ textContent (لا HTML).
*/
(function (w) {
    if (w.AbuTour) return;

    var Z = 9500, cur = null;

    function injectStyle() {
        if (document.getElementById('abuTourStyle')) return;
        var s = document.createElement('style');
        s.id = 'abuTourStyle';
        s.textContent =
            '#abuTourRoot{position:fixed;inset:0;z-index:' + Z + ';direction:rtl;font-family:"Tajawal",system-ui,sans-serif}' +
            '#abuTourHole{position:absolute;border-radius:14px;border:2px solid #fbbf24;box-shadow:0 0 0 9999px rgba(15,23,42,.66);transition:top .32s ease,left .32s ease,width .32s ease,height .32s ease;pointer-events:none}' +
            '#abuTourHole::after{content:"";position:absolute;inset:-2px;border-radius:14px;border:2px solid #fbbf24;animation:abuTourPulse 1.5s ease-out infinite}' +
            '@keyframes abuTourPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.18);opacity:0}}' +
            '#abuTourBub{position:absolute;background:#fff;color:#334155;border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:top .32s ease,left .32s ease,opacity .2s ease;font-size:13px;line-height:1.8}' +
            '#abuTourBub .cnt{font-size:11px;color:#94a3b8;font-weight:700}' +
            '#abuTourBub .ttl{display:block;font-size:15px;font-weight:800;color:#0f172a;margin:1px 0 2px}' +
            '#abuTourBub .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}' +
            '#abuTourBub button{font-family:inherit;cursor:pointer;border:0;border-radius:10px;font-size:13px;font-weight:700;padding:7px 16px}' +
            '#abuTourBub .skip{background:transparent;color:#94a3b8;padding:7px 6px}' +
            '#abuTourBub .prev{background:#f1f5f9;color:#475569}' +
            '#abuTourBub .next{background:#4f46e5;color:#fff}' +
            '#abuTourBub .grp{display:flex;gap:6px}';
        document.head.appendChild(s);
    }

    function resolve(t) {
        if (!t) return null;
        if (typeof t === 'string') return document.querySelector(t);
        if (typeof t === 'function') { try { return t(); } catch (e) { return null; } }
        return t;
    }
    function visible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        var r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        var cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
    }
    function seen(key) { try { return localStorage.getItem(key) === '1'; } catch (e) { return false; } }
    function mark(key) { try { localStorage.setItem(key, '1'); } catch (e) {} }
    function unmark(key) { try { localStorage.removeItem(key); } catch (e) {} }

    function end(completed) {
        if (!cur) return;
        var c = cur; cur = null;
        window.removeEventListener('resize', c.reposition);
        window.removeEventListener('scroll', c.reposition, true);
        document.removeEventListener('keydown', c.onKey, true);
        if (c.root && c.root.parentNode) c.root.parentNode.removeChild(c.root);
        try { if (c.opts.onEnd) c.opts.onEnd(!!completed); } catch (e) {}
    }

    function start(opts) {
        if (cur) end(false);
        if (!opts || !opts.steps || !opts.steps.length) return false;
        if (opts.key && !opts.force && seen(opts.key)) return false;
        injectStyle();

        var steps = opts.steps.filter(function (s) { return visible(resolve(s.target)); });
        if (!steps.length) return false;
        if (opts.key) mark(opts.key);

        var root = document.createElement('div');
        root.id = 'abuTourRoot';
        var hole = document.createElement('div'); hole.id = 'abuTourHole';
        var bub = document.createElement('div'); bub.id = 'abuTourBub';
        bub.setAttribute('role', 'dialog');
        root.appendChild(hole); root.appendChild(bub);
        document.body.appendChild(root);
        root.addEventListener('click', function (e) { e.stopPropagation(); });

        var st = { idx: 0, steps: steps, opts: opts, root: root };
        cur = st;

        function place() {
            var s = steps[st.idx];
            var el = resolve(s.target);
            if (!visible(el)) return;
            var r = el.getBoundingClientRect();
            var vw = window.innerWidth, vh = window.innerHeight, pad = 5;
            hole.style.top = (r.top - pad) + 'px';
            hole.style.left = (r.left - pad) + 'px';
            hole.style.width = (r.width + pad * 2) + 'px';
            hole.style.height = (r.height + pad * 2) + 'px';

            var bw = Math.min(310, vw - 24);
            bub.style.width = bw + 'px';
            var bh = bub.offsetHeight;
            var left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
            var top;
            if (r.bottom + pad + bh + 14 <= vh) top = r.bottom + pad + 12;
            else if (r.top - pad - bh - 14 >= 0) top = r.top - pad - bh - 12;
            else top = Math.max(12, vh - bh - 12);
            bub.style.left = left + 'px';
            bub.style.top = top + 'px';
        }

        function show(i) {
            st.idx = i;
            var s = steps[i];
            var el = resolve(s.target);
            if (!visible(el)) { // الهدف اختفى منذ بدء الجولة: تخطَّ
                if (i < steps.length - 1) return show(i + 1);
                return end(true);
            }
            bub.style.opacity = '0';
            while (bub.firstChild) bub.removeChild(bub.firstChild);
            var cnt = document.createElement('span'); cnt.className = 'cnt';
            cnt.textContent = (i + 1) + ' من ' + steps.length;
            var ttl = document.createElement('span'); ttl.className = 'ttl'; ttl.textContent = s.title || '';
            var txt = document.createElement('div'); txt.textContent = s.text || '';
            var row = document.createElement('div'); row.className = 'row';
            var skip = document.createElement('button'); skip.className = 'skip'; skip.type = 'button'; skip.textContent = 'تخطي';
            skip.onclick = function () { end(false); };
            var grp = document.createElement('div'); grp.className = 'grp';
            if (i > 0) {
                var pv = document.createElement('button'); pv.className = 'prev'; pv.type = 'button'; pv.textContent = 'السابق';
                pv.onclick = function () { show(i - 1); };
                grp.appendChild(pv);
            }
            var nx = document.createElement('button'); nx.className = 'next'; nx.type = 'button';
            nx.textContent = (i === steps.length - 1) ? (opts.doneText || 'فهمت') : 'التالي';
            nx.onclick = function () { if (i === steps.length - 1) end(true); else show(i + 1); };
            grp.appendChild(nx);
            row.appendChild(skip); row.appendChild(grp);
            bub.appendChild(cnt); bub.appendChild(ttl); bub.appendChild(txt); bub.appendChild(row);

            try { el.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {}
            setTimeout(function () { if (cur !== st) return; place(); bub.style.opacity = '1'; }, 60);
        }

        st.reposition = function () { if (cur === st) place(); };
        st.onKey = function (e) { if (e.key === 'Escape') end(false); };
        window.addEventListener('resize', st.reposition);
        window.addEventListener('scroll', st.reposition, true);
        document.addEventListener('keydown', st.onKey, true);
        show(0);
        return true;
    }

    w.AbuTour = {
        start: start,
        stop: function () { end(false); },
        isActive: function () { return !!cur; },
        seen: seen, mark: mark, reset: unmark,
        visible: visible
    };
})(window);
