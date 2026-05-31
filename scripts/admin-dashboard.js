(function (global) {
  "use strict";

  var catalog = null;
  var selectedUnitId = null;
  var isCreatingNew = false;
  var adminPin = "";

  var SITE_IMAGES = [
    "images/nikon-kitlens.jpg",
    "images/nikon-zoomlens.jpg",
    "images/nikon-zoom-kit-battery.jpg",
    "images/canon-1200d.jpg",
    "images/canon-4000d.jpg",
    "images/G6-thumb-camera.jpg",
    "images/kodak-v603.jpg",
    "images/zoom lens.jpg",
    "images/dji-osmo.jpg",
    "images/gcash-qr.jpg"
  ];

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

  function normalizeImageUrl(url) {
    url = String(url || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return url.replace(/^\.\//, "").replace(/^\//, "");
  }

  function slugFromName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "product";
  }

  function uniqueUnitId(name) {
    var base = slugFromName(name);
    var id = base;
    var n = 2;
    var ids = new Set((catalog.units || []).map(function (u) { return u.id; }));
    while (ids.has(id)) {
      id = base + "-" + n;
      n += 1;
    }
    return id;
  }

  function nextSortOrder() {
    var max = 0;
    (catalog.units || []).forEach(function (u) {
      if (u.sortOrder > max) max = u.sortOrder;
    });
    return max + 1;
  }

  function pushMedia(url, name, unitId) {
    catalog.media = catalog.media || [];
    if (catalog.media.some(function (m) { return m.url === url; })) return;
    catalog.media.push({
      id: "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      url: url,
      name: name || url.split("/").pop() || url,
      unitId: unitId || "",
      sortOrder: catalog.media.length,
      createdAt: Date.now()
    });
  }

  function uploadFiles(files, unitId, done) {
    if (!files || !files.length) {
      done(null, []);
      return;
    }
    if (!global.prillagaUploadProductImages) {
      done(new Error("Upload API not loaded."));
      return;
    }
    global.prillagaUploadProductImages(adminPin, files, unitId, done);
  }

  function saveCatalog(successMsg, afterSave) {
    if (!adminPin || !global.prillagaSaveAdminCatalog) {
      setCatalogStatus("Cannot save — admin PIN or API missing.", "error");
      return;
    }
    setCatalogStatus("Saving to live site…");
    global.prillagaSaveAdminCatalog(adminPin, catalog, function (err, saved) {
      if (err) {
        setCatalogStatus("Save failed — " + err.message, "error");
        return;
      }
      catalog = saved;
      isCreatingNew = false;
      renderUnitList();
      renderProductPanel();
      renderMediaGrid();
      setCatalogStatus(successMsg || "Saved — live website updated.");
      if (typeof afterSave === "function") afterSave();
    });
  }

  function renderUnitList() {
    var list = document.getElementById("productUnitList");
    if (!list || !catalog) return;
    list.innerHTML = "";
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "primary";
    addBtn.id = "btnAddProduct";
    addBtn.style.width = "100%";
    addBtn.style.marginBottom = "10px";
    addBtn.textContent = "+ Add product";
    addBtn.addEventListener("click", function () {
      isCreatingNew = true;
      selectedUnitId = null;
      renderUnitList();
      renderProductPanel();
    });
    list.appendChild(addBtn);

    catalog.units.slice().sort(function (a, b) { return a.sortOrder - b.sortOrder; }).forEach(function (unit) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-unit" + (!isCreatingNew && selectedUnitId === unit.id ? " is-active" : "");
      btn.textContent = unit.name;
      btn.addEventListener("click", function () {
        isCreatingNew = false;
        selectedUnitId = unit.id;
        renderUnitList();
        renderProductPanel();
      });
      list.appendChild(btn);
    });
  }

  function filePreviewHtml(inputId) {
    return '<div id="' + inputId + 'Preview" class="upload-preview"></div>';
  }

  function wireFilePreview(inputId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(inputId + "Preview");
    if (!input || !preview) return;
    input.addEventListener("change", function () {
      preview.innerHTML = "";
      Array.prototype.forEach.call(input.files || [], function (file) {
        var img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        preview.appendChild(img);
      });
    });
  }

  function renderNewProductForm(panel) {
    panel.innerHTML =
      "<h2 style='margin:0 0 12px 0;font-size:15px;color:#d4af37;'>New product</h2>" +
      "<label>Product name</label>" +
      '<input id="newUnitName" type="text" placeholder="e.g. Sony A6400 kit">' +
      "<label>Description</label>" +
      '<textarea id="newUnitDesc" rows="4" placeholder="Details shown on the card"></textarea>' +
      "<label>Base rate (₱/day)</label>" +
      '<input id="newUnitBase" type="number" min="0" step="1" value="500">' +
      "<label>Long rate (₱/day, 3+ days)</label>" +
      '<input id="newUnitLong" type="number" min="0" step="1" value="450">' +
      "<label>Primary photo</label>" +
      '<input id="newUnitPrimaryFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif">' +
      filePreviewHtml("newUnitPrimaryFile") +
      "<label>Sample photos (optional, multiple)</label>" +
      '<input id="newUnitSampleFiles" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>' +
      filePreviewHtml("newUnitSampleFiles") +
      '<label><input id="newUnitActive" type="checkbox" checked> Show on website</label>' +
      '<label><input id="newUnitBookable" type="checkbox" checked> Allow booking</label>' +
      '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">' +
      '<button type="button" class="primary" id="btnSaveNewUnit">Save new product</button>' +
      '<button type="button" id="btnCancelNewUnit">Cancel</button>' +
      "</div>";

    wireFilePreview("newUnitPrimaryFile");
    wireFilePreview("newUnitSampleFiles");
    document.getElementById("btnSaveNewUnit").addEventListener("click", saveNewProduct);
    document.getElementById("btnCancelNewUnit").addEventListener("click", function () {
      isCreatingNew = false;
      selectedUnitId = catalog.units[0] && catalog.units[0].id;
      renderUnitList();
      renderProductPanel();
    });
  }

  function renderUnitEditor(panel) {
    var unit = catalog.units.find(function (u) { return u.id === selectedUnitId; });
    if (!unit) {
      panel.innerHTML = "<p style='color:#888'>Select a product to edit.</p>";
      return;
    }

    var imageOptions = (catalog.media || []).map(function (m) {
      return '<option value="' + escapeAttr(m.url) + '"' + (unit.image === m.url ? " selected" : "") + ">" + (m.name || m.url) + "</option>";
    }).join("");

    panel.innerHTML =
      "<h2 style='margin:0 0 12px 0;font-size:15px;color:#d4af37;'>Edit product</h2>" +
      "<p style='margin:0 0 10px 0;font-size:12px;color:#888;'>ID: <code>" + escapeHtml(unit.id) + "</code></p>" +
      "<label>Name</label>" +
      '<input id="editUnitName" type="text" value="' + escapeAttr(unit.name) + '">' +
      "<label>Description</label>" +
      '<textarea id="editUnitDesc" rows="4">' + escapeHtml(unit.description || "") + "</textarea>" +
      "<label>Base rate (₱/day)</label>" +
      '<input id="editUnitBase" type="number" min="0" step="1" value="' + unit.pricing.baseRate + '">' +
      "<label>Long rate (₱/day, 3+ days)</label>" +
      '<input id="editUnitLong" type="number" min="0" step="1" value="' + unit.pricing.longRate + '">' +
      "<label>Primary photo (current)</label>" +
      '<img src="' + escapeAttr(unit.image) + '" alt="" style="max-width:160px;border-radius:8px;display:block;margin-bottom:8px;">' +
      '<select id="editUnitImage"><option value="">— library —</option>' + imageOptions + "</select>" +
      '<input id="editUnitImageUrl" type="text" placeholder="Or paste URL" value="' + escapeAttr(unit.image) + '">' +
      "<label>Replace primary photo (upload)</label>" +
      '<input id="editUnitPrimaryFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif">' +
      filePreviewHtml("editUnitPrimaryFile") +
      "<label>Sample photos (one URL per line)</label>" +
      '<textarea id="editUnitSamples" rows="3">' + escapeHtml((unit.images || []).join("\n")) + "</textarea>" +
      "<label>Add sample photos (upload, multiple)</label>" +
      '<input id="editUnitSampleFiles" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>' +
      filePreviewHtml("editUnitSampleFiles") +
      '<label><input id="editUnitActive" type="checkbox"' + (unit.active !== false ? " checked" : "") + "> Show on website</label>" +
      '<label><input id="editUnitBookable" type="checkbox"' + (unit.bookable !== false ? " checked" : "") + "> Allow booking</label>" +
      '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">' +
      '<button type="button" class="primary" id="btnSaveUnit">Save product</button>' +
      '<button type="button" class="reject" id="btnDeleteUnit">Delete product</button>' +
      "</div>";

    wireFilePreview("editUnitPrimaryFile");
    wireFilePreview("editUnitSampleFiles");
    document.getElementById("btnSaveUnit").addEventListener("click", saveSelectedUnit);
    document.getElementById("btnDeleteUnit").addEventListener("click", deleteSelectedUnit);
  }

  function renderProductPanel() {
    var panel = document.getElementById("productEditor");
    if (!panel || !catalog) return;
    if (isCreatingNew) {
      renderNewProductForm(panel);
      return;
    }
    renderUnitEditor(panel);
  }

  function saveNewProduct() {
    var name = document.getElementById("newUnitName").value.trim();
    var description = document.getElementById("newUnitDesc").value.trim();
    var baseRate = Number(document.getElementById("newUnitBase").value) || 0;
    var longRate = Number(document.getElementById("newUnitLong").value) || 0;
    var primaryFile = document.getElementById("newUnitPrimaryFile").files;
    var sampleFiles = document.getElementById("newUnitSampleFiles").files;
    var active = document.getElementById("newUnitActive").checked;
    var bookable = document.getElementById("newUnitBookable").checked;

    if (!name) {
      setCatalogStatus("Enter a product name.", "warn");
      return;
    }
    if (!primaryFile || !primaryFile[0]) {
      setCatalogStatus("Choose a primary photo.", "warn");
      return;
    }

    var unitId = uniqueUnitId(name);
    var btn = document.getElementById("btnSaveNewUnit");
    if (btn) { btn.disabled = true; btn.textContent = "Uploading…"; }

    setCatalogStatus("Uploading photos…");

    uploadFiles([primaryFile[0]], unitId, function (err, primaryUrls) {
      if (err) {
        setCatalogStatus(err.message, "error");
        if (btn) { btn.disabled = false; btn.textContent = "Save new product"; }
        return;
      }
      var primaryUrl = primaryUrls[0];
      var sampleList = primaryUrls.slice();

      uploadFiles(sampleFiles ? Array.prototype.slice.call(sampleFiles) : [], unitId, function (err2, extraUrls) {
        if (err2) {
          setCatalogStatus(err2.message, "error");
          if (btn) { btn.disabled = false; btn.textContent = "Save new product"; }
          return;
        }
        extraUrls.forEach(function (u) {
          if (sampleList.indexOf(u) === -1) sampleList.push(u);
        });

        pushMedia(primaryUrl, primaryFile[0].name, unitId);
        (sampleFiles || []).forEach(function (f, i) {
          if (extraUrls[i]) pushMedia(extraUrls[i], f.name, unitId);
        });

        catalog.units.push({
          id: unitId,
          name: name,
          description: description,
          image: primaryUrl,
          images: sampleList,
          pricing: {
            baseRate: baseRate,
            longRate: longRate,
            longRateMinDays: (catalog.settings && catalog.settings.longRateMinDays) || 3
          },
          sortOrder: nextSortOrder(),
          active: active,
          bookable: bookable
        });

        selectedUnitId = unitId;
        if (btn) { btn.disabled = false; btn.textContent = "Save new product"; }
        saveCatalog("New product saved — live website updated.");
      });
    });
  }

  function saveSelectedUnit() {
    var unit = catalog.units.find(function (u) { return u.id === selectedUnitId; });
    if (!unit) return;

    var btn = document.getElementById("btnSaveUnit");
    if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }

    unit.name = document.getElementById("editUnitName").value.trim();
    unit.description = document.getElementById("editUnitDesc").value.trim();
    unit.pricing.baseRate = Number(document.getElementById("editUnitBase").value) || 0;
    unit.pricing.longRate = Number(document.getElementById("editUnitLong").value) || 0;
    unit.active = document.getElementById("editUnitActive").checked;
    unit.bookable = document.getElementById("editUnitBookable").checked;

    var picked = document.getElementById("editUnitImage").value;
    var urlField = normalizeImageUrl(document.getElementById("editUnitImageUrl").value);
    unit.images = document.getElementById("editUnitSamples").value
      .split("\n")
      .map(normalizeImageUrl)
      .filter(Boolean);

    var primaryFile = document.getElementById("editUnitPrimaryFile").files;
    var sampleFiles = document.getElementById("editUnitSampleFiles").files;

    function finishSave(primaryUrl, extraUrls) {
      if (primaryUrl) {
        unit.image = primaryUrl;
        if (unit.images.indexOf(primaryUrl) === -1) unit.images.unshift(primaryUrl);
        pushMedia(primaryUrl, primaryFile[0].name, unit.id);
      } else {
        unit.image = urlField || picked || unit.image;
        if (unit.images.indexOf(unit.image) === -1) unit.images.unshift(unit.image);
      }
      extraUrls.forEach(function (u) {
        if (unit.images.indexOf(u) === -1) unit.images.push(u);
      });
      if (btn) { btn.disabled = false; btn.textContent = "Save product"; }
      saveCatalog("Product saved — live website updated.");
    }

    function uploadSamplesThenFinish(primaryUrl) {
      if (!sampleFiles || !sampleFiles.length) {
        finishSave(primaryUrl, []);
        return;
      }
      setCatalogStatus("Uploading sample photos…");
      uploadFiles(Array.prototype.slice.call(sampleFiles), unit.id, function (err, urls) {
        if (err) {
          setCatalogStatus(err.message, "error");
          if (btn) { btn.disabled = false; btn.textContent = "Save product"; }
          return;
        }
        (sampleFiles || []).forEach(function (f, i) {
          if (urls[i]) pushMedia(urls[i], f.name, unit.id);
        });
        finishSave(primaryUrl, urls);
      });
    }

    if (primaryFile && primaryFile[0]) {
      setCatalogStatus("Uploading primary photo…");
      uploadFiles([primaryFile[0]], unit.id, function (err, urls) {
        if (err) {
          setCatalogStatus(err.message, "error");
          if (btn) { btn.disabled = false; btn.textContent = "Save product"; }
          return;
        }
        uploadSamplesThenFinish(urls[0]);
      });
      return;
    }

    uploadSamplesThenFinish(null);
  }

  function deleteSelectedUnit() {
    var unit = catalog.units.find(function (u) { return u.id === selectedUnitId; });
    if (!unit) return;
    if (!window.confirm('Delete "' + unit.name + '" from the live website? This cannot be undone.')) return;

    var urlsToRemove = (unit.images || []).slice();
    if (unit.image && urlsToRemove.indexOf(unit.image) === -1) urlsToRemove.push(unit.image);

    catalog.units = catalog.units.filter(function (u) { return u.id !== unit.id; });
    catalog.media = (catalog.media || []).filter(function (m) { return m.unitId !== unit.id; });

    selectedUnitId = catalog.units[0] && catalog.units[0].id;
    setCatalogStatus("Saving deletion…");

    saveCatalog("Product deleted.", function () {
      urlsToRemove.forEach(function (url) {
        if (/supabase\.co\/storage\//i.test(url) && global.prillagaDeleteUploadedImage) {
          global.prillagaDeleteUploadedImage(adminPin, url, function () { /* ignore */ });
        }
      });
    });
  }

  function addMediaFromUrl(url, unitId) {
    url = normalizeImageUrl(url);
    if (!url) {
      setCatalogStatus("Enter an image path or URL first.", "warn");
      return;
    }
    catalog.media = catalog.media || [];
    if (catalog.media.some(function (m) { return m.url === url; })) {
      setCatalogStatus("That image is already in the library.", "warn");
      return;
    }
    pushMedia(url, url.split("/").pop(), unitId);
    if (unitId) {
      var unit = catalog.units.find(function (u) { return u.id === unitId; });
      if (unit) {
        unit.image = url;
        unit.images = unit.images || [];
        if (unit.images.indexOf(url) === -1) unit.images.unshift(url);
      }
    }
    saveCatalog("Photo added.");
  }

  function removeMediaItem(mediaId) {
    var target = catalog.media.find(function (m) { return m.id === mediaId; });
    if (!target) return;
    catalog.media = catalog.media.filter(function (m) { return m.id !== mediaId; });
    catalog.units.forEach(function (unit) {
      if (unit.image === target.url) {
        unit.image = (unit.images || []).find(function (u) { return u !== target.url; }) || unit.image;
      }
      unit.images = (unit.images || []).filter(function (u) { return u !== target.url; });
      if (!unit.images.length && unit.image) unit.images = [unit.image];
    });
    saveCatalog("Photo removed from catalog.");
  }

  function renderMediaGrid() {
    var grid = document.getElementById("mediaGrid");
    if (!grid || !catalog) return;
    grid.innerHTML = "";
    if (!catalog.media || !catalog.media.length) {
      grid.innerHTML = "<p style='color:#888'>No photos yet. Upload when adding or editing a product.</p>";
      return;
    }
    catalog.media.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "media-card";
      card.innerHTML =
        '<img src="' + escapeAttr(item.url) + '" alt="">' +
        "<p>" + escapeHtml(item.name || item.url) + "</p>" +
        "<p style='color:#888;font-size:12px'>" + escapeHtml(item.unitId ? unitLabel(item.unitId) : "Unassigned") + "</p>" +
        '<button type="button" data-del="' + escapeAttr(item.id) + '">Remove</button>';
      card.querySelector("button").addEventListener("click", function () {
        if (!window.confirm("Remove this photo from the catalog?")) return;
        removeMediaItem(item.id);
      });
      grid.appendChild(card);
    });
  }

  function populateSiteImageSelect() {
    var sel = document.getElementById("mediaSiteImageSelect");
    if (!sel) return;
    sel.innerHTML = '<option value="">— pick a site image —</option>';
    SITE_IMAGES.forEach(function (path) {
      var opt = document.createElement("option");
      opt.value = path;
      opt.textContent = path;
      sel.appendChild(opt);
    });
  }

  function wireMediaControls() {
    populateSiteImageSelect();
    var addBtn = document.getElementById("btnAddMedia");
    var urlInput = document.getElementById("mediaUrlInput");
    var siteSelect = document.getElementById("mediaSiteImageSelect");
    var unitSelect = document.getElementById("mediaUnitSelect");

    if (siteSelect && urlInput) {
      siteSelect.addEventListener("change", function () {
        if (siteSelect.value) urlInput.value = siteSelect.value;
      });
    }
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var url = urlInput ? urlInput.value : (siteSelect ? siteSelect.value : "");
        var unitId = unitSelect ? unitSelect.value : "";
        addMediaFromUrl(url, unitId);
        if (urlInput) urlInput.value = "";
        if (siteSelect) siteSelect.value = "";
      });
    }
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
      isCreatingNew = false;
      populateMediaUnitSelect();
      wireMediaControls();
      renderUnitList();
      renderProductPanel();
      renderMediaGrid();
      setCatalogStatus("Products loaded.");
    });
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
        wireMediaControls();
        renderMediaGrid();
      });
      return;
    }
    populateMediaUnitSelect();
    wireMediaControls();
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

  global.prillagaInitAdminContentPage = function (pin) {
    window.__prillagaAdminPin = pin;
    adminPin = pin;
    initProductsTab(pin);
  };
})(window);
