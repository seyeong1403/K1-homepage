/* (주)케이원 · K1 OCEAN — Redesign v2 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noHover = window.matchMedia('(hover: none)').matches;

  /* hero reveal */
  var hero = document.getElementById('hero');
  if (hero) {
    if (reduce) hero.classList.add('in');
    else requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('in'); }, 120); });
  }

  /* header stuck */
  var head = document.getElementById('head');
  var onScroll = function () { head.classList.toggle('stuck', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* mega menu — hover intent (bridges the gap so it never closes mid-move) */
  var navwrap = document.querySelector('.navwrap');
  if (navwrap && !noHover) {
    var megaT;
    var openMega = function () { clearTimeout(megaT); head.classList.add('mega-open'); };
    var closeMega = function () { megaT = setTimeout(function () { head.classList.remove('mega-open'); }, 220); };
    navwrap.addEventListener('mouseenter', openMega);
    navwrap.addEventListener('mouseleave', closeMega);
    navwrap.addEventListener('focusin', openMega);
    navwrap.addEventListener('focusout', function (e) { if (!navwrap.contains(e.relatedTarget)) head.classList.remove('mega-open'); });
    window.addEventListener('scroll', function () { if (head.classList.contains('mega-open')) head.classList.remove('mega-open'); }, { passive: true });
  }

  /* mobile drawer */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer'), dx = document.getElementById('drawerX');
  var open = function () { drawer.classList.add('open'); document.body.classList.add('lock'); drawer.setAttribute('aria-hidden', 'false'); };
  var close = function () { drawer.classList.remove('open'); document.body.classList.remove('lock'); drawer.setAttribute('aria-hidden', 'true'); };
  if (burger) burger.addEventListener('click', open);
  if (dx) dx.addEventListener('click', close);
  if (drawer) drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  /* reveal / stagger / rule */
  var items = document.querySelectorAll('.reveal, .stagger, .mask, .rule');
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* count up (once) */
  var run = function (el) {
    var t = parseInt(el.getAttribute('data-count'), 10); if (isNaN(t)) return;
    var sfx = el.querySelector('u') || el.querySelector('em'); var suffix = sfx ? sfx.outerHTML : '';
    var dur = 1600, start = null;
    var tick = function (ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1);
      el.innerHTML = Math.round(t * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  var counts = document.querySelectorAll('[data-count]');
  if (!reduce && counts.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { co.observe(el); });
  }

  /* business sticky switch */
  var rows = document.querySelectorAll('#bizList .biz__row');
  var slides = document.querySelectorAll('#bizStage .biz__slide');
  var caps = document.querySelectorAll('#bizCaps .biz__cap');
  var setBiz = function (i) {
    rows.forEach(function (r, k) { r.classList.toggle('active', k === i); });
    slides.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    caps.forEach(function (c, k) { c.classList.toggle('active', k === i); });
  };
  rows.forEach(function (row) {
    var i = parseInt(row.getAttribute('data-i'), 10);
    row.addEventListener('click', function () { setBiz(i); });
    if (!noHover) row.addEventListener('mouseenter', function () { setBiz(i); });
  });

  /* capability: tap to reveal on touch */
  if (noHover) {
    document.querySelectorAll('#capability .cap__row').forEach(function (r) {
      r.addEventListener('click', function () { r.classList.toggle('open'); });
    });
  }
})();
