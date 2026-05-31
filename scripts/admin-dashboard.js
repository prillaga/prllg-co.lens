(function (global) {
  "use strict";

  var catalog = null;
  var selectedUnitId = null;
  var adminPin = "";

  function setCatalogStatus(text, tone) {
    var el = document.getElementById("catalogSyncStatus");
    if (!el) return;
    el.textContent = text;
    el.style.color = tone === "error" ? "#e8a0a0" : tone === "warn" ? "#e8d080" : "#8ecf9a";
  }

  function unitLabel(id) {
    if (!catalog || !catalog.units) return id;
    var u = catalog.units.find(function (x) { return x.id === id; });
    return u ? u.name : id;
  }

  function renderUnitList() {
    var list = document.getElementById("productUnitList");
    if (!list || !catalog) return;
    list.innerHTML = "";
    catalog.units.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; }).forEach(function (unit) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-unit" + (selectedUnitId === unit.id ? " is-active" : "");
      btn.textContent = unit.name;
      btn.addEventListener("click", function () {
        selectedUnitId = unit.id;
        renderUnitList();
        renderUnitEditor();
      });
      list.appendChild(btn);
    });
  }

  function renderUnitEditor() {
    var panel = document.getElementById("productEditor");
    if (!panel || !catalog) return;
    var unit = catalog.units.find(function (u) { return u.id === selectedUnitId; });
    if (!unit) {
      panel.innerHTML = "<p style='color:#888'>Select a product to edit.</p>";
      return;
    }

    var imageOptions = (catalog.media || []).map(function (m) {
      return '<option value="' + m.url + '"' + (unit.image === m.url ? " selected" : "") + ">" + (m.name || m.url) + "</option>";
    }).join("");

    panel.innerHTML =
      "<label>Name</label>" +
      '<input id="editUnitName" type="text" value="' + escapeAttr(unit.name) + '">' +
      "<label>Description</label>" +
      '<textarea id="editUnitDesc" rows="4" placeholder="Product details shown on the card">' + escapeHtml(unit.description || "") + "</textarea>" +
      "<label>Base rate (₱/day)</label>" +
      '<input id="editUnitBase" type="number" min="0" step="1" value="' + unit.pricing.baseRate + '">' +
      "<label>Long rate (₱/day, 3+ days)</label>" +
      '<input id="editUnitLong" type="number" min="0" step="1" value="' + unit.pricing.longRate + '">' +
      "<label>Primary photo</label>" +
      '<select id="editUnitImage"><option value="">— choose —</option>' + imageOptions + "</select>" +
      '<input id="editUnitImageUrl" type="text" placeholder="Or paste image URL" value="' + escapeAttr(unit.image) + '">' +
      "<label>Sample photos (one URL per line)</label>" +
      '<textarea id="editUnitSamples" rows="4" placeholder="https://...">' + escapeHtml((unit.images || []).join("\n")) + "</textarea>" +
      '<label><input id="editUnitActive" type="checkbox"' + (unit.active !== false ? " checked" : "") + "> Show on website</label>" +
      '<label><input id="editUnitBookable" type="checkbox"' + (unit.bookable !== false ? " checked" : "") + "> Allow booking</label>" +
      '<div style="margin-top:12px"><button type="button" class="primary" id="btnSaveUnit">Save product</button></div>';

    document.getElementById("btnSaveUnit").addEventListener("click", saveSelectedUnit);
  }

  function saveSelectedUnit() {
    var unit = catalog.units.find(function (u) { return u.id === selectedUnitId; });
    if (!unit) return;
    unit.name = document.getElementById("editUnitName").value.trim();
    unit.description = document.getElementById("editUnitDesc").value.trim();
    unit.pricing.baseRate = Number(document.getElementById("editUnitBase").value) || 0;
    unit.pricing.longRate = Number(document.getElementById("editUnitLong").value) || 0;
    var picked = document.getElementById("editUnitImage").value;
    var url = document.getElementById("editUnitImageUrl").value.trim();
    unit.image = url || picked || unit.image;
    unit.images = document.getElementById("editUnitSamples").value
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (unit.images.indexOf(unit.image) === -1) unit.images.unshift(unit.image);
    unit.active = document.getElementById("editUnitActive").checked;
    unit.bookable = document.getElementById("editUnitBookable").checked;
    saveCatalog("Product saved.");
  }

  function saveCatalog(successMsg) {
    if (!adminPin || !global.prillagaSaveAdminCatalog) {
      setCatalogStatus("Cannot save — admin PIN or API missing.", "error");
      return;
    }
    setCatalogStatus("Saving products…");
    global.prillagaSaveAdminCatalog(adminPin, catalog, function (err, saved) {
      if (err) {
        setCatalogStatus("Save failed — " + err.message, "error");
        return;
      }
      catalog = saved;
      renderUnitList();
      renderUnitEditor();
      renderMediaGrid();
      setCatalogStatus(successMsg || "Saved — live website updated.");
    });
  }

  function renderMediaGrid() {
    var grid = document.getElementById("mediaGrid");
    if (!grid || !catalog) return;
    grid.innerHTML = "";
    if (!catalog.media || !catalog.media.length) {
      grid.innerHTML = "<p style='color:#888'>No uploaded photos yet.</p>";
      return;
    }
    catalog.media.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "media-card";
      card.innerHTML =
        '<img src="' + escapeAttr(item.url) + '" alt="">' +
        "<p>" + escapeHtml(item.name || item.url) + "</p>" +
        "<p style='color:#888;font-size:12px'>" + escapeHtml(item.unitId ? unitLabel(item.unitId) : "Unassigned") + "</p>" +
        '<button type="button" data-del="' + escapeAttr(item.id) + '">Delete</button>';
      card.querySelector("button").addEventListener("click", function () {
        if (!window.confirm("Delete this photo from storage and catalog?")) return;
        global.prillagaDeleteCatalogMedia(adminPin, item.id, function (err, data) {
          if (err) {
            setCatalogStatus(err.message, "error");
            return;
          }
          catalog = data.catalog;
          renderMediaGrid();
          renderUnitEditor();
          setCatalogStatus("Photo deleted.");
        });
      });
      grid.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function initProductsTab(pin) {
    adminPin = pin;
    setCatalogStatus("Loading products…");
    global.prillagaFetchAdminCatalog(pin, function (err, data) {
      if (err) {
        setCatalogStatus(err.message, "error");
        return;
      }
      catalog = data;
      selectedUnitId = catalog.units[0] && catalog.units[0].id;
      populateMediaUnitSelect();
      renderUnitList();
      renderUnitEditor();
      setCatalogStatus("Products loaded.");
    });

    var uploadBtn = document.getElementById("btnUploadMedia");
    var fileInput = document.getElementById("mediaFileInput");
    var unitSelect = document.getElementById("mediaUnitSelect");
    if (unitSelect && catalog) {
      catalog.units.forEach(function (u) {
        var opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        unitSelect.appendChild(opt);
      });
    }

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
          setCatalogStatus("Choose an image file first.", "warn");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setCatalogStatus("Image must be 5 MB or smaller.", "error");
          return;
        }
        setCatalogStatus("Uploading…");
        var unitId = unitSelect ? unitSelect.value : "";
        global.prillagaUploadCatalogImage(adminPin, file, unitId, function (err, data) {
          if (err) {
            setCatalogStatus(err.message, "error");
            return;
          }
          catalog = data.catalog;
          fileInput.value = "";
          renderMediaGrid();
          renderUnitEditor();
          setCatalogStatus("Photo uploaded and saved.");
        });
      });
    }
  }

  function initMediaTab(pin) {
    adminPin = pin;
    if (!catalog) {
      global.prillagaFetchAdminCatalog(pin, function (err, data) {
        if (err) {
          setCatalogStatus(err.message, "error");
          return;
        }
        catalog = data;
        populateMediaUnitSelect();
        renderMediaGrid();
      });
      return;
    }
    populateMediaUnitSelect();
    renderMediaGrid();
  }

  function populateMediaUnitSelect() {
    var unitSelect = document.getElementById("mediaUnitSelect");
    if (!unitSelect || !catalog) return;
    unitSelect.innerHTML = '<option value="">— optional: assign to product —</option>';
    catalog.units.forEach(function (u) {
      var opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      unitSelect.appendChild(opt);
    });
  }

  function initAdminTabs() {
    var tabs = document.querySelectorAll("[data-admin-tab]");
    var panels = document.querySelectorAll("[data-admin-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-admin-tab");
        tabs.forEach(function (t) { t.classList.toggle("is-active", t === tab); });
        panels.forEach(function (p) {
          p.hidden = p.getAttribute("data-admin-panel") !== name;
        });
        if (name === "products") initProductsTab(window.__prillagaAdminPin || "");
        if (name === "media") initMediaTab(window.__prillagaAdminPin || "");
      });
    });
  }

  global.prillagaInitAdminDashboard = function (pin) {
    window.__prillagaAdminPin = pin;
    initAdminTabs();
    initProductsTab(pin);
  };

  /** Standalone admin/content.html — products + photos on one page. */
  global.prillagaInitAdminContentPage = function (pin) {
    window.__prillagaAdminPin = pin;
    adminPin = pin;
    initProductsTab(pin);
    initMediaTab(pin);
  };
})(window);
