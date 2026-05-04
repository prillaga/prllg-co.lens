(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var selector = [
    "section[id]:not(#home):not(#book-now)",
    "footer[id]",
    "main",
    "#about-main",
    "#payment-main",
    "#availability-main"
  ].join(", ");

  function init() {
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("prillaga-scroll-reveal--in");
          io.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px 28vh 0px",
        threshold: 0.02
      }
    );

    nodes.forEach(function (el) {
      el.classList.add("prillaga-scroll-reveal");
      io.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
