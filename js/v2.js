/* (주)케이원 · K1 OCEAN — v2 "Signal at Sea" (Redesign v3) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noHover = window.matchMedia('(hover: none)').matches;
  var head = document.getElementById('head');

  /* hero reveal */
  var hero = document.getElementById('hero');
  if (hero) {
    if (reduce) hero.classList.add('in');
    else requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('in'); }, 120); });
  }

  /* adaptive header: stuck state + dark/light based on section under the header line */
  var navSecs = [].slice.call(document.querySelectorAll('[data-nav]'));
  var syncHead = function () {
    head.classList.toggle('stuck', window.scrollY > 40);
    var line = (head.offsetHeight || 80) * 0.5;
    var theme = 'dark', i;
    for (i = 0; i < navSecs.length; i++) {
      var r = navSecs[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { theme = navSecs[i].getAttribute('data-nav'); break; }
    }
    head.classList.toggle('light', theme === 'light');
  };
  syncHead();
  window.addEventListener('scroll', syncHead, { passive: true });
  window.addEventListener('resize', syncHead);

  /* mega menu — hover intent */
  var gnbwrap = document.querySelector('.gnbwrap');
  if (gnbwrap && !noHover) {
    var mt, hovering = false;
    var openM = function () { clearTimeout(mt); head.classList.add('mega-open'); };
    var closeM = function () { mt = setTimeout(function () { head.classList.remove('mega-open'); }, 220); };
    gnbwrap.addEventListener('mouseenter', function () { hovering = true; openM(); });
    gnbwrap.addEventListener('mouseleave', function () { hovering = false; closeM(); });
    /* 스크롤로 닫힌 뒤 커서가 메뉴 위에 그대로 머물러 있으면 mouseenter 가 다시 발생하지 않는다.
       메뉴 영역 안에서 커서가 움직일 때도 다시 열어 준다. */
    gnbwrap.addEventListener('mousemove', function () {
      hovering = true;
      if (!head.classList.contains('mega-open')) openM();
    });
    gnbwrap.addEventListener('focusin', openM);
    gnbwrap.addEventListener('focusout', function (e) { if (!gnbwrap.contains(e.relatedTarget)) head.classList.remove('mega-open'); });
    /* 커서가 메뉴 위에 있는 동안에는 스크롤(관성 포함)로 닫지 않는다 */
    window.addEventListener('scroll', function () {
      if (!hovering && head.classList.contains('mega-open')) head.classList.remove('mega-open');
    }, { passive: true });
  }

  /* mobile drawer */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    var setDrawer = function (open) {
      drawer.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      document.body.classList.toggle('lock', open);
    };
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setDrawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });
  }

  /* SplitText-style word reveal on section headings (ref: 110 Hyundai Transys)
     텍스트 노드만 단어 단위로 감싸므로 <br>·<em> 등 마크업은 그대로 보존된다. */
  var splitWords = function (el, base) {
    if (el.getAttribute('data-split')) return;
    el.setAttribute('data-split', '1');
    var idx = 0, b = base || 0;
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = tok;
            i.style.transitionDelay = (b + idx * 0.05).toFixed(2) + 's'; idx++;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
  };
  if (!reduce) {
    [].slice.call(document.querySelectorAll('.d2')).forEach(function (el) { splitWords(el, 0); });
    /* Business 패널 제목은 01 / ELECTRICAL 뒤에 이어지도록 시작 딜레이를 준다 */
    [].slice.call(document.querySelectorAll('.bizp h3')).forEach(function (el) { splitWords(el, 0.24); });
  }

  /* reveal observer */
  var items = document.querySelectorAll('.rv, .stg, .mask, .d2');
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* scroll parallax on full-bleed image layers (ref: 062 HHI hero · 096 Wonkang) */
  var pxLayers = [].slice.call(document.querySelectorAll('.hero__media, .bizp__viz'));
  if (!reduce && pxLayers.length) {
    /* 레이어는 위아래로 7%씩 확장돼 있다. 진폭을 호스트 높이의 5%로 두면
       어떤 뷰포트에서도 오버스캔을 넘지 않아 여백이 드러나지 않는다. */
    var AMP_RATIO = 0.05, ticking = false;
    var paint = function () {
      var vh = window.innerHeight;
      pxLayers.forEach(function (el) {
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2); // -1..1
        var amp = r.height * AMP_RATIO;
        el.style.transform = 'translate3d(0,' + (-p * amp).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    var onPx = function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onPx, { passive: true });
    window.addEventListener('resize', onPx);
    paint();
  }

  /* smooth scroll — Lenis (refs: 096 Wonkang · 110 Transys · 063 Doosan)
     CDN 실패 시 네이티브 스크롤로 그대로 동작한다. */
  if (!reduce) {
    var ls = document.createElement('script');
    ls.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js';
    ls.async = true;
    ls.onload = function () {
      if (!window.Lenis) return;
      var lenis = new window.Lenis({
        duration: 1.05,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true, touchMultiplier: 1.6
      });
      document.documentElement.style.scrollBehavior = 'auto';
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      /* 앵커 이동은 Lenis로 (고정 헤더 높이만큼 보정) */
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || a.classList.contains('skip')) return;
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -((head && head.offsetHeight) || 80) - 8 });
      });
      window.__lenis = lenis;
    };
    document.head.appendChild(ls);
  }

  /* count up */
  var runCount = function (el) {
    var t = parseFloat(el.getAttribute('data-count')); if (isNaN(t)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var dec = (t % 1 !== 0) ? 1 : 0;
    var dur = 1500, start = null;
    var tick = function (ts) {
      if (!start) start = ts; var p = Math.min((ts - start) / dur, 1);
      var v = t * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  var counts = document.querySelectorAll('[data-count]');
  if (!reduce && counts.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { co.observe(el); });
  }
})();
