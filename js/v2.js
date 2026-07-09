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
    var mt;
    var openM = function () { clearTimeout(mt); head.classList.add('mega-open'); };
    var closeM = function () { mt = setTimeout(function () { head.classList.remove('mega-open'); }, 220); };
    gnbwrap.addEventListener('mouseenter', openM);
    gnbwrap.addEventListener('mouseleave', closeM);
    gnbwrap.addEventListener('focusin', openM);
    gnbwrap.addEventListener('focusout', function (e) { if (!gnbwrap.contains(e.relatedTarget)) head.classList.remove('mega-open'); });
    window.addEventListener('scroll', function () { if (head.classList.contains('mega-open')) head.classList.remove('mega-open'); }, { passive: true });
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

  /* reveal observer */
  var items = document.querySelectorAll('.rv, .stg, .mask');
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
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
