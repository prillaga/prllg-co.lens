(function () {
  function init() {
    var header = document.getElementById("site-header");
    var toggle = header && header.querySelector(".nav-toggle");
    var nav = document.getElementById("site-main-nav");
    if (!header || !toggle || !nav) return;

    function syncAria() {
      var open = header.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    }

    function setOpen(open) {
      var isOpen = !!open;
      header.classList.toggle("nav-open", isOpen);
      syncAria();
    }

    function close() {
      setOpen(false);
    }

    function onToggleClick(e) {
      e.stopPropagation();
      setOpen(!header.classList.contains("nav-open"));
    }

    /* Capture: run before bubbling handlers on page content */
    toggle.addEventListener("click", onToggleClick, true);

    nav.addEventListener("click", function (e) {
      if (e.target === nav) {
        close();
        return;
      }
      if (e.target && e.target.closest && e.target.closest("a")) {
        close();
      }
    });

    document.addEventListener(
      "click",
      function (e) {
        if (!header.classList.contains("nav-open")) return;
        if (header.contains(e.target)) return;
        close();
      },
      true
    );

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    function onResizeNav() {
      syncAria();
    }

    window.addEventListener("resize", onResizeNav);

    syncAria();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
