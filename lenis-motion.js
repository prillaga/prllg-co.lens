/**
 * Prillaga&Co. Lens — smooth scroll (Lenis) + scroll-up pop animations.
 * Uses CSS + IntersectionObserver (works on file:// and static hosting).
 */
(function () {
  "use strict";

  var HEADER_OFFSET = -80;

  var SCROLL_POP_SELECTORS = [
    "section[id]:not(#home):not(#book-now) h2",
    "section[id]:not(#home):not(#book-now) h3",
    "section[id]:not(#home):not(#book-now) .home-cal-inner > *",
    "section[id]:not(#home) > div > p",
    "section[id]:not(#home) > div > div > div",
    "section[id]:not(#home) li",
    "#rental-policy h3",
    "footer[id] h3",
    "footer[id] > div > div",
    "footer[id] p",
    "#about-main > *",
    "#payment-main > h1",
    "#payment-main > .pay-lead",
    "#payment-main > .pay-card",
    "#payment-main > .pay-cta",
    "#payment-main > .pay-foot",
    "#payment-main .gcash-number-row",
    "#payment-main .pay-btn-row",
    "#availability-main > h2",
    "#availability-main > p",
    "#availability-main .toolbar",
    "#availability-main .cal-wrap",
    "#availability-main .legend",
    "#availability-main .note",
    ".units-page-inner > h2",
    "main > .intro",
    "main .doc > h1",
    "main .doc > h2",
    "main .doc-field",
    "main .late-return-note",
    "main .sig-block",
    "main .id-upload-wrap",
    "main .checkline",
    "main .submit-wrap",
    "main .config-note",
    ".units-scroll > div",
    "section[id]:not(#home) img[loading]",
    "#payment-main img",
    "main .doc img"
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
    if (el.closest(".nav-toggle")) return true;
    return false;
  }

  function reveal(el, delayMs) {
    if (!el || el.classList.contains("is-inview")) return;
    if (delayMs > 0) {
      el.style.animationDelay = delayMs + "ms";
    }
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
    return seen;
  }

  function initScrollPops() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".prillaga-motion-pop").forEach(function (el) {
        reveal(el, 0);
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target, 0);
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -18% 0px", threshold: 0.08 }
    );

    document.querySelectorAll(".prillaga-motion-pop").forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        reveal(el, 0);
        return;
      }
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
      }, 600);
    }, 450);

    var hasHero = !!document.querySelector(".home-hero");
    var openTargets = [];
    var header = document.getElementById("site-header");

    if (header) openTargets.push(header);

    if (!hasHero) {
      document
        .querySelectorAll(
          "#about-main > *, #payment-main > *:not(script), #availability-main > h2, #availability-main > p, .units-page-inner > h2, main > .intro"
        )
        .forEach(function (el) {
          if (el.tagName === "SCRIPT" || shouldExclude(el)) return;
          openTargets.push(el);
        });
    }

    openTargets.forEach(function (el, i) {
      el.classList.add("prillaga-motion-opening");
      window.setTimeout(function () {
        reveal(el, i * 80);
      }, 120);
    });
  }

  function initHeroEntrance() {
    var items = document.querySelectorAll(
      ".home-hero__title, .home-hero__tagline, .home-hero__actions"
    );
    items.forEach(function (el, i) {
      el.classList.add("prillaga-motion-opening");
      window.setTimeout(function () {
        reveal(el, i * 110);
      }, 200);
    });
  }

  function showAllStatic() {
    document.querySelectorAll(".prillaga-motion-pop, .prillaga-motion-opening").forEach(
      function (el) {
        el.classList.add("is-inview");
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    );
  }

  function initLenis() {
    if (location.protocol === "file:") return;

    import("https://cdn.jsdelivr.net/npm/lenis@1.1.22/dist/lenis.mjs")
      .then(function (mod) {
        var Lenis = mod.default || mod.Lenis;
        if (!Lenis) return;

        var lenis = new Lenis({
          lerp: 0.085,
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.1
        });

        document.documentElement.classList.add("lenis");

        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        document.querySelectorAll(".units-scroll, .booking-modal__panel").forEach(function (el) {
          el.setAttribute("data-lenis-prevent", "");
        });

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
          anchor.addEventListener("click", function (e) {
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
            lenis.scrollTo(target, { offset: HEADER_OFFSET, duration: 1.15 });
          });
        });

        var siteHeader = document.getElementById("site-header");
        if (siteHeader) {
          new MutationObserver(function () {
            if (siteHeader.classList.contains("nav-open")) lenis.stop();
            else lenis.start();
          }).observe(siteHeader, { attributes: true, attributeFilter: ["class"] });
        }

        var bookingModal = document.getElementById("booking-modal");
        if (bookingModal) {
          new MutationObserver(function () {
            if (bookingModal.hidden) lenis.start();
            else lenis.stop();
          }).observe(bookingModal, { attributes: true, attributeFilter: ["hidden"] });
        }

        window.prillagaLenis = lenis;
      })
      .catch(function () {
        /* Lenis optional — scroll still works */
      });
  }

  function init() {
    document.documentElement.classList.add("prillaga-motion-init");

    if (prefersReducedMotion()) {
      showAllStatic();
      return;
    }

    document.documentElement.classList.add("prillaga-motion-ready");
    markScrollPopTargets();
    initPageOpening();
    initScrollPops();
    initHeroEntrance();
    initLenis();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
