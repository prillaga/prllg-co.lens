/**
 * Prillaga&Co. Lens — lightweight scroll reveals + native smooth anchor scroll.
 * Lenis disabled (it caused scroll lag on long pages).
 */
(function () {
  "use strict";

  var HEADER_OFFSET = 80;

  /* Animate sections/cards — not every paragraph (much faster while scrolling) */
  var SCROLL_POP_SELECTORS = [
    "section[id]:not(#home):not(#book-now) > div > .lux-heading",
    "section[id]:not(#home):not(#book-now) .home-cal-inner",
    "#about-main",
    "#payment-main > h1",
    "#payment-main > .pay-lead",
    "#payment-main > .pay-card",
    "#payment-main > .pay-cta",
    "#availability-main > h2",
    "#availability-main > p:first-of-type",
    "#availability-main .toolbar",
    "#availability-main .cal-wrap",
    ".units-page-inner > h2",
    ".units-scroll > div",
    "main > .intro",
    "main .doc",
    "footer[id] > div"
  ];

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function shouldExclude(el) {
    if (!el || el.closest("#booking-modal")) return true;
    if (el.closest(".home-hero")) return true;
    if (el.closest("#site-header")) return true;
    if (el.closest(".prillaga-messenger-link")) return true;
    if (el.closest(".skip-link")) return true;
    return false;
  }

  function reveal(el) {
    if (!el || el.classList.contains("is-inview")) return;
    el.classList.add("is-inview");
  }

  function markScrollPopTargets() {
    var seen = new Set();
    SCROLL_POP_SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (shouldExclude(el)) return;
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("prillaga-motion-pop");
      });
    });
  }

  function initScrollPops() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".prillaga-motion-pop").forEach(reveal);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    document.querySelectorAll(".prillaga-motion-pop").forEach(function (el) {
      io.observe(el);
    });
  }

  function initPageOpening() {
    var loader = document.createElement("div");
    loader.className = "prillaga-page-loader";
    loader.setAttribute("aria-hidden", "true");
    document.body.appendChild(loader);

    window.setTimeout(function () {
      loader.classList.add("is-done");
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 400);
    }, 280);

    var header = document.getElementById("site-header");
    var hasHero = !!document.querySelector(".home-hero");
    var openTargets = [];

    if (header) openTargets.push(header);

    if (!hasHero) {
      var mainBlock = document.querySelector(
        "#about-main, #payment-main, #availability-main, .units-page-inner, main"
      );
      if (mainBlock && !shouldExclude(mainBlock)) openTargets.push(mainBlock);
    }

    openTargets.forEach(function (el, i) {
      el.classList.add("prillaga-motion-opening");
      window.setTimeout(function () {
        reveal(el);
      }, 80 + i * 60);
    });
  }

  function initHeroEntrance() {
    document.querySelectorAll(".home-hero__title, .home-hero__tagline, .home-hero__actions").forEach(
      function (el, i) {
        el.classList.add("prillaga-motion-opening");
        window.setTimeout(function () {
          reveal(el);
        }, 100 + i * 70);
      }
    );
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener(
        "click",
        function (e) {
          var href = anchor.getAttribute("href");
          if (!href || href === "#") return;
          var target;
          try {
            target = document.querySelector(href);
          } catch (err) {
            return;
          }
          if (!target) return;
          e.preventDefault();
          var top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({
            top: top,
            behavior: prefersReducedMotion() ? "auto" : "smooth"
          });
        },
        { passive: false }
      );
    });
  }

  function initHeroVideoPerf() {
    var video = document.querySelector(".home-hero__video");
    if (!video || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (video.paused) video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(video);
  }

  function showAllStatic() {
    document.querySelectorAll(".prillaga-motion-pop, .prillaga-motion-opening").forEach(function (el) {
      el.classList.add("is-inview");
    });
  }

  function init() {
    document.documentElement.classList.add("prillaga-motion-init");

    if (prefersReducedMotion()) {
      showAllStatic();
      initSmoothAnchors();
      return;
    }

    document.documentElement.classList.add("prillaga-motion-ready");
    markScrollPopTargets();
    initPageOpening();
    initScrollPops();
    initHeroEntrance();
    initSmoothAnchors();
    initHeroVideoPerf();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
