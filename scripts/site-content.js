(function (global) {
  "use strict";

  var liveCatalog = null;
  var catalogMeta = { source: "loading", message: "" };

  var FALLBACK_CATALOG = {
    updatedAt: 0,
    settings: { reservationFee: 100, longRateMinDays: 3, currency: "PHP" },
    units: [
      { id: "nikon-kit", name: "Nikon DSLR Flipscreen w/ kitlens 15-80mm", description: "", image: "images/nikon-kitlens.jpg", images: ["images/nikon-kitlens.jpg"], pricing: { baseRate: 450, longRate: 400, longRateMinDays: 3 }, sortOrder: 1, bookable: true },
      { id: "nikon-zoom", name: "Nikon DSLR Flipscreen w/ Zoom Lens 70-300mm", description: "", image: "images/nikon-zoomlens.jpg", images: ["images/nikon-zoomlens.jpg"], pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 }, sortOrder: 2, bookable: true },
      { id: "nikon-zoom-kit-battery", name: "Nikon DSLR w/ Zoom Lens + Kitlens + Extra battery", description: "", image: "images/nikon-zoom-kit-battery.jpg", images: ["images/nikon-zoom-kit-battery.jpg"], pricing: { baseRate: 950, longRate: 900, longRateMinDays: 3 }, sortOrder: 3, bookable: true },
      { id: "canon-1200d", name: "Canon 1200D DSLR w/ kitlens 18-55mm", description: "", image: "images/canon-1200d.jpg", images: ["images/canon-1200d.jpg"], pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 }, sortOrder: 4, bookable: true },
      { id: "canon-4000d", name: "Canon 4000D DSLR w/ kitlens 18-55mm", description: "", image: "images/canon-4000d.jpg", images: ["images/canon-4000d.jpg"], pricing: { baseRate: 550, longRate: 500, longRateMinDays: 3 }, sortOrder: 5, bookable: true },
      { id: "g6-thumb", name: "G6 THUMB CAMERA", description: "", image: "images/G6-thumb-camera.jpg", images: ["images/G6-thumb-camera.jpg"], pricing: { baseRate: 200, longRate: 150, longRateMinDays: 3 }, sortOrder: 6, bookable: true },
      { id: "kodak-v603", name: "Kodak EasyShare V603", description: "", image: "images/kodak-v603.jpg", images: ["images/kodak-v603.jpg"], pricing: { baseRate: 250, longRate: 200, longRateMinDays: 3 }, sortOrder: 7, bookable: true },
      { id: "zoom-lens", name: "Zoom Lens 70-300mm", description: "", image: "images/zoom lens.jpg", images: ["images/zoom lens.jpg"], pricing: { baseRate: 300, longRate: 250, longRateMinDays: 3 }, sortOrder: 8, bookable: true },
      { id: "dji-gimbal", name: "DJI OSMO MOBILE 3 GIMBAL", description: "", image: "images/dji-osmo.jpg", images: ["images/dji-osmo.jpg"], pricing: { baseRate: 300, longRate: 250, longRateMinDays: 3 }, sortOrder: 9, bookable: true }
    ],
    addons: [
      { id: "extra-battery", name: "Extra Battery", label: "Extra Battery ₱100", price: 100, sortOrder: 1 },
      { id: "zoom-lens-addon", name: "Zoom Lens", label: "Zoom Lens ₱300", price: 300, sortOrder: 2 }
    ]
  };

  global.prillagaCatalogFallback = function () { return FALLBACK_CATALOG; };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(n) {
    return "₱" + Number(n).toLocaleString("en-PH");
  }

  function formatUnitPriceLine(unit, settings) {
    var p = unit.pricing || {};
    var minDays = (settings && settings.longRateMinDays) || p.longRateMinDays || 3;
    if (p.baseRate === 950 && p.longRate === 900) {
      return p.baseRate + "/day (1-2 days) | " + p.longRate + "/day (" + minDays + " days up)";
    }
    return p.baseRate + "/day | " + p.longRate + "/day (" + minDays + " days up)";
  }

  function formatUnitPriceOption(unit, settings) {
    return unit.name + " (" + formatUnitPriceLine(unit, settings).replace(/\//g, "/") + ")";
  }

  function buildPricingRules(units) {
    var rules = {};
    (units || []).forEach(function (unit) {
      var p = unit.pricing || {};
      rules[unit.id] = {
        name: unit.name,
        baseRate: p.baseRate,
        longRate: p.longRate,
        longRateMinDays: p.longRateMinDays || 3,
        hasLongRate: p.longRate != null && p.longRate !== p.baseRate
      };
    });
    return rules;
  }

  function buildAddonPricingRules(addons) {
    var rules = { None: 0 };
    (addons || []).forEach(function (a) {
      rules[a.label] = a.price;
    });
    return rules;
  }

  function buildUnitIdMap(units) {
    var map = {};
    (units || []).forEach(function (u) {
      map[u.id] = u.id;
      map[u.name] = u.id;
    });
    return map;
  }

  function getUnitName(catalog, unitId) {
    var unit = (catalog.units || []).find(function (u) { return u.id === unitId; });
    return unit ? unit.name : unitId;
  }

  function renderUnitCards(container, catalog, options) {
    if (!container || !catalog) return;
    options = options || {};
    var units = (catalog.units || []).slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; });
    var html = "";
    units.forEach(function (unit) {
      if (unit.bookable === false) return;
      var priceLine = formatUnitPriceLine(unit, catalog.settings);
      var inquireHref = options.inquireMode === "units-page"
        ? "index.html?unit=" + encodeURIComponent(unit.id)
        : "#book-now";
      var preselect = options.inquireMode === "units-page" ? "" : ' data-preselect-unit="' + escapeHtml(unit.id) + '"';
      var desc = unit.description
        ? '<p style="margin: 0 0 10px 0; color: #bdbdbd; font-size: 13px; line-height: 1.45;">' + escapeHtml(unit.description) + "</p>"
        : "";
      html +=
        '<div style="width: 400px; min-width: 400px; background: #101010; border: 1px solid #232323; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);">' +
        '<img src="' + escapeHtml(unit.image) + '" alt="' + escapeHtml(unit.name) + '" loading="lazy" decoding="async" style="width: 100%; height: 260px; object-fit: cover; display: block;">' +
        '<div style="padding: 12px 14px 16px 14px; text-align: left;">' +
        "<h3 style=\"margin: 0 0 10px 0; color: #f5f5f5; font-family: Avenir, 'Avenir Next', 'Century Gothic', Arial, sans-serif; font-size: 18px; line-height: 1.35;\">" + escapeHtml(unit.name) + "</h3>" +
        desc +
        '<p style="margin: 0 0 10px 0; color: #d4af37; font-size: 14px;">' + escapeHtml(priceLine) + "</p>" +
        '<a href="' + inquireHref + '"' + preselect + ' style="display: inline-block; padding: 9px 20px; background: linear-gradient(135deg, #f3d77b 0%, #d4af37 45%, #b8901f 100%); color: #111; text-decoration: none; font-family: Avenir, \'Avenir Next\', \'Century Gothic\', Arial, sans-serif; font-weight: 700; border-radius: 999px; letter-spacing: 1px; font-size: 14px;">Inquire Now</a>' +
        "</div></div>";
    });
    container.innerHTML = html || '<p style="color:#888;padding:12px;">No units available.</p>';
  }

  function fillUnitSelect(select, catalog, emptyLabel) {
    if (!select || !catalog) return;
    var current = select.value;
    select.innerHTML = "";
    var empty = document.createElement("option");
    empty.value = "";
    empty.textContent = emptyLabel || "Select Units";
    select.appendChild(empty);
    (catalog.units || []).forEach(function (unit) {
      if (unit.bookable === false) return;
      var opt = document.createElement("option");
      opt.value = unit.id;
      opt.textContent = formatUnitPriceOption(unit, catalog.settings);
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function fillAddonSelect(select, catalog, emptyLabel) {
    if (!select || !catalog) return;
    var current = select.value;
    select.innerHTML = "";
    var empty = document.createElement("option");
    empty.value = emptyLabel === "optional" ? "" : "None";
    empty.textContent = emptyLabel || "None";
    select.appendChild(empty);
    (catalog.addons || []).forEach(function (addon) {
      var opt = document.createElement("option");
      opt.value = addon.label;
      opt.textContent = addon.label;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function fillCalendarUnitSelect(select, catalog) {
    if (!select || !catalog) return;
    var current = select.value;
    while (select.options.length > 1) select.remove(1);
    (catalog.units || []).forEach(function (unit) {
      var opt = document.createElement("option");
      opt.value = unit.id;
      opt.textContent = unit.name;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function fillAgreementUnitSelect(select, catalog) {
    if (!select || !catalog) return;
    var current = select.value;
    select.innerHTML = '<option value="">Select Units</option>';
    (catalog.units || []).forEach(function (unit) {
      var opt = document.createElement("option");
      opt.value = unit.name;
      opt.textContent = unit.name;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function showCatalogNotice(el, meta) {
    if (!el) return;
    if (meta.source === "error") {
      el.textContent = "Could not load latest product data. Showing backup content. " + (meta.message || "");
      el.className = "catalog-load-notice is-visible is-error";
      return;
    }
    if (meta.source === "fallback") {
      el.textContent = meta.message || "Showing backup product data.";
      el.className = "catalog-load-notice is-visible is-warning";
      return;
    }
    el.textContent = "";
    el.className = "catalog-load-notice";
  }

  function applyCatalog(catalog, meta, hooks) {
    liveCatalog = catalog;
    catalogMeta = meta || { source: "api" };
    hooks = hooks || {};

    if (hooks.onPricing) {
      hooks.onPricing(buildPricingRules(catalog.units), buildAddonPricingRules(catalog.addons), buildUnitIdMap(catalog.units), catalog);
    }

    document.querySelectorAll("[data-units-catalog]").forEach(function (root) {
      var mode = root.getAttribute("data-units-catalog") || "home";
      renderUnitCards(root, catalog, { inquireMode: mode === "units-page" ? "units-page" : "home" });
    });

    fillUnitSelect(document.querySelector('#book-now select[name="units"]'), catalog, "Select Units");
    fillAddonSelect(document.querySelector('#book-now select[name="additionalRent"]'), catalog, "optional");
    fillAddonSelect(document.querySelector('#book-now select[name="additionalRent2"]'), catalog, "optional");
    fillCalendarUnitSelect(document.getElementById("homeUnitSelect"), catalog);
    fillAgreementUnitSelect(document.getElementById("rentedUnit"), catalog);

    document.querySelectorAll(".catalog-load-notice").forEach(function (el) {
      showCatalogNotice(el, catalogMeta);
    });

    if (typeof hooks.afterApply === "function") hooks.afterApply(catalog, catalogMeta);
  }

  function initSiteCatalog(hooks) {
    hooks = hooks || {};
    function load() {
      if (!global.prillagaFetchPublicCatalog) {
        applyCatalog(FALLBACK_CATALOG, { source: "fallback" }, hooks);
        return;
      }
      global.prillagaFetchPublicCatalog(function (err, catalog, meta) {
        if (err || !catalog) {
          applyCatalog(FALLBACK_CATALOG, { source: "error", message: err && err.message }, hooks);
          return;
        }
        applyCatalog(catalog, meta, hooks);
      });
    }
    load();
    if (global.prillagaStartPublicCatalogAutoRefresh) {
      global.prillagaStartPublicCatalogAutoRefresh(load, 60000);
    }
  }

  global.prillagaLiveCatalog = function () { return liveCatalog; };
  global.prillagaFormatPrice = formatPrice;
  global.prillagaFormatUnitPriceLine = formatUnitPriceLine;
  global.prillagaBuildPricingRules = buildPricingRules;
  global.prillagaBuildAddonPricingRules = buildAddonPricingRules;
  global.prillagaBuildUnitIdMap = buildUnitIdMap;
  global.prillagaGetUnitName = getUnitName;
  global.prillagaRenderUnitCards = renderUnitCards;
  global.prillagaApplyCatalog = applyCatalog;
  global.prillagaInitSiteCatalog = initSiteCatalog;
})(window);
