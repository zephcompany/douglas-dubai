/* ==========================================================================
   KRYPTOBIT — interactions
   Modules: preloader → hero entrance, header state, scroll reveals,
   parallax, custom cursor, ticker drift, mobile menu
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const header = $("#header");
  const preloader = $("#preloader");
  const heroTitle = $(".hero__title");
  const heroVisual = $("#heroVisual");
  const heroDevices = $("#heroDevices");

  /* ---------------------------------------------------------------------
     1. Preloader → hero entrance
     --------------------------------------------------------------------- */
  document.body.classList.add("is-loading");

  const revealHero = () => {
    header.classList.add("is-ready");
    if (heroTitle) heroTitle.classList.add("is-in");
    if (heroVisual) heroVisual.classList.add("is-in");
    $$(".page-hero .reveal-up, .page-hero .line__inner").forEach((el) => el.classList.add("is-in"));
    $$(".hero .reveal-up").forEach((el) => {
      const d = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => el.classList.add("is-in"), d);
    });
  };

  const finishLoading = () => {
    preloader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    // give the preloader fade a head start, then reveal
    setTimeout(revealHero, reduceMotion ? 0 : 180);
    setTimeout(() => preloader.remove(), 1200);
  };

  const MIN_LOADER = reduceMotion ? 0 : (document.body.dataset.loader === "short" ? 900 : 1450);
  const start = performance.now();
  const heroImgReady = new Promise((res) => {
    if (!heroDevices || heroDevices.complete) return res();
    heroDevices.addEventListener("load", res, { once: true });
    heroDevices.addEventListener("error", res, { once: true });
    setTimeout(res, 3500); // never block forever
  });
  Promise.all([heroImgReady, document.fonts ? document.fonts.ready : Promise.resolve()]).then(() => {
    const wait = Math.max(0, MIN_LOADER - (performance.now() - start));
    setTimeout(finishLoading, wait);
  });

  /* ---------------------------------------------------------------------
     2. Header scroll state
     --------------------------------------------------------------------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 12);
      updateParallax(y);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------------------
     3. Scroll reveals (everything outside the hero)
     --------------------------------------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const d = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => el.classList.add("is-in"), d);
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  $$(".reveal-up:not(.hero .reveal-up)").forEach((el) => io.observe(el));

  /* ---------------------------------------------------------------------
     4. Hero parallax (very subtle, desktop only)
     --------------------------------------------------------------------- */
  const parallaxEnabled = finePointer && !reduceMotion;
  let heroH = 0;
  const measure = () => { heroH = ($(".hero") && $(".hero").offsetHeight) || 1; };
  measure();
  window.addEventListener("resize", measure, { passive: true });

  function updateParallax(y) {
    if (!parallaxEnabled || !heroDevices) return;
    const p = Math.min(1, y / heroH);
    // devices drift upward by at most ~18px; the whole visual eases slightly
    heroDevices.style.transform = `translate3d(0, ${(-18 * p).toFixed(2)}px, 0)`;
    heroVisual.style.setProperty("--p", p.toFixed(3));
  }

  // tiny pointer-driven tilt on the hero visual (±4px), only once it's revealed
  if (parallaxEnabled && heroVisual && $(".hero")) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 6;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
    function tick() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      heroVisual.style.setProperty("--mx", cx.toFixed(2) + "px");
      heroVisual.style.setProperty("--my", cy.toFixed(2) + "px");
      if (heroVisual.classList.contains("is-in")) {
        heroVisual.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
      }
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(tick) : null;
    }
  }

  /* ---------------------------------------------------------------------
     5. Custom cursor (desktop only)
     --------------------------------------------------------------------- */
  const cursor = $("#cursor");
  if (cursor && finePointer && !reduceMotion) {
    let mx = -100, my = -100, x = -100, y = -100, raf = null;
    const loop = () => {
      x += (mx - x) * 0.32; y += (my - y) * 0.32;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = (Math.abs(mx - x) > 0.1 || Math.abs(my - y) > 0.1) ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
    document.addEventListener("pointerenter", () => cursor.classList.add("is-visible"));

    const hoverables = "a, button, .coin, .feature, .market-row, .earn-card";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(hoverables) && !e.relatedTarget?.closest?.(hoverables)) cursor.classList.remove("is-hover");
    });

  }

  /* ---------------------------------------------------------------------
     6. Ticker — almost imperceptible drift on desktop (pauses on hover)
     --------------------------------------------------------------------- */
  const track = $("#tickerTrack");
  if (track && !reduceMotion) {
    let amp = 0, dir = 1, paused = false, last = performance.now();
    const strip = track.parentElement;
    strip.addEventListener("pointerenter", () => (paused = true));
    strip.addEventListener("pointerleave", () => (paused = false));
    const drift = (now) => {
      const dt = Math.min(48, now - last); last = now;
      if (!paused && window.innerWidth > 1100) {
        amp += dir * dt * 0.0009;              // ~6px over ~7s, back and forth
        if (amp > 6 || amp < -6) dir *= -1;
        track.style.transform = `translate3d(${amp.toFixed(2)}px,0,0)`;
      }
      requestAnimationFrame(drift);
    };
    requestAnimationFrame(drift);
  }

  /* ---------------------------------------------------------------------
     7. Mobile menu
     --------------------------------------------------------------------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  if (burger && menu) {
    const close = () => { burger.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); };
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", close));
    window.addEventListener("resize", () => { if (window.innerWidth > 1100) close(); }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     8. Smooth anchor scrolling with header offset
     --------------------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const target = id && document.getElementById(id);
    if (!target) { e.preventDefault(); return; }
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - (header.offsetHeight - 1);
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
