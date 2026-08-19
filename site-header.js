(function () {
  "use strict";

  function getCurrentPage() {
    var path = window.location.pathname || "";
    var file = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    if (!file || file === "index.html") return "home";
    if (file === "units.html") return "units";
    if (file === "availability.html") return "availability";
    if (file === "rental-agreement.html") return "agreement";
    if (file === "payment-methods.html") return "payment";
    if (file.indexOf("admin") !== -1) return "admin";
    return "";
  }

  function buildHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;

    var currentPage = getCurrentPage();

    var navLinks = [
      { href: "index.html#home", key: "home", label: "Home" },
      { href: "units.html", key: "units", label: "Units" },
      { href: "index.html#rental-policy", key: "policy", label: "Rental Policy" },
      { href: "rental-agreement.html", key: "agreement", label: "Rental Agreement" },
      { href: "payment-methods.html", key: "payment", label: "Payment" },
      { href: "index.html#contact-page", key: "contact", label: "Contact" },
      { href: "admin/index.html", key: "admin", label: "Admin" }
    ];

    // Build desktop nav
    var desktopNav = document.createElement("nav");
    desktopNav.className = "desktop-nav";
    desktopNav.setAttribute("aria-label", "Main");

    navLinks.forEach(function (link) {
      var a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      a.setAttribute("data-nav", link.key);
      if (link.key === currentPage) a.classList.add("is-active");
      desktopNav.appendChild(a);
    });

    // Build toggle
    var toggle = header.querySelector(".nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      var barsWrap = document.createElement("span");
      barsWrap.className = "nav-toggle__bars";
      for (var i = 0; i < 3; i++) {
        var bar = document.createElement("span");
        bar.className = "nav-toggle__bar";
        barsWrap.appendChild(bar);
      }
      toggle.appendChild(barsWrap);
    }

    // Build mobile nav
    var mobileNav = document.getElementById("mobile-nav");
    if (!mobileNav) {
      mobileNav = document.createElement("nav");
      mobileNav.className = "mobile-nav";
      mobileNav.id = "mobile-nav";
      mobileNav.setAttribute("aria-label", "Mobile navigation");
      navLinks.forEach(function (link) {
        var a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.label;
        a.setAttribute("data-nav", link.key);
        if (link.key === currentPage) a.classList.add("is-active");
        mobileNav.appendChild(a);
      });
      document.body.appendChild(mobileNav);
    }

    // Replace header content (keep brand, add desktop nav + toggle)
    var brand = header.querySelector(".brand-lockup");
    if (brand) {
      // Rewrite brand to new format
      brand.innerHTML = '<span class="brand-name">Prillaga&amp;co</span><span class="brand-sub">LENS</span>';
    }

    // Insert desktop nav before toggle
    if (!header.querySelector(".desktop-nav")) {
      header.appendChild(desktopNav);
    }

    // Ensure toggle is in header
    if (!header.contains(toggle)) {
      header.appendChild(toggle);
    }

    // Toggle logic
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
        mobileNav.classList.remove("is-open");
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    // Scroll effect
    window.addEventListener("scroll", function () {
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildHeader);
  } else {
    buildHeader();
  }
})();
