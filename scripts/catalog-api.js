(function (global) {
  "use strict";

  function publicApiUrl() {
    if (global.prillagaCatalogPublicApiUrl) return global.prillagaCatalogPublicApiUrl();
    return "/api/catalog/public";
  }

  function adminApiUrl() {
    if (global.prillagaCatalogAdminApiUrl) return global.prillagaCatalogAdminApiUrl();
    return "/api/catalog";
  }

  function uploadApiUrl() {
    if (global.prillagaUploadApiUrl) return global.prillagaUploadApiUrl();
    return "/api/upload";
  }

  function fetchPublicCatalog(done) {
    fetch(publicApiUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        return res.json().catch(function () { return { error: "Invalid JSON" }; }).then(function (data) {
          if (!res.ok || (data && data.error)) {
            throw new Error((data && data.error) || "Could not load catalog (HTTP " + res.status + ").");
          }
          done(null, data, { source: "api" });
        });
      })
      .catch(function (err) {
        if (global.prillagaCatalogFallback) {
          done(null, global.prillagaCatalogFallback(), { source: "fallback", message: err.message });
          return;
        }
        done(err, null, { source: "error" });
      });
  }

  function fetchAdminCatalog(pin, done) {
    fetch(adminApiUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json", "X-Admin-Pin": pin }
    })
      .then(function (res) {
        return res.json().catch(function () { return { error: "Invalid JSON" }; }).then(function (data) {
          if (res.status === 401) throw new Error("Incorrect admin PIN.");
          if (!res.ok) throw new Error((data && data.error) || "Could not load catalog.");
          done(null, data);
        });
      })
      .catch(done);
  }

  function saveAdminCatalog(pin, catalog, done) {
    fetch(adminApiUrl(), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Pin": pin
      },
      body: JSON.stringify(catalog)
    })
      .then(function (res) {
        return res.json().catch(function () { return { error: "Invalid JSON" }; }).then(function (data) {
          if (res.status === 401) throw new Error("Incorrect admin PIN.");
          if (!res.ok) throw new Error((data && data.error) || "Could not save catalog.");
          done(null, data);
        });
      })
      .catch(done);
  }

  function uploadProductImages(pin, files, unitId, done) {
    if (!files || !files.length) {
      done(null, []);
      return;
    }

    var results = [];
    var index = 0;

    function next() {
      if (index >= files.length) {
        done(null, results);
        return;
      }
      var file = files[index];
      index += 1;
      var fd = new FormData();
      fd.append("file", file);
      if (unitId) fd.append("unitId", unitId);

      fetch(uploadApiUrl(), {
        method: "POST",
        headers: { "X-Admin-Pin": pin },
        body: fd
      })
        .then(function (res) {
          return res.json().catch(function () { return { error: "Invalid JSON" }; }).then(function (data) {
            if (res.status === 401) throw new Error("Incorrect admin PIN.");
            if (!res.ok) throw new Error((data && data.error) || "Upload failed.");
            if (data.files && data.files.length) {
              data.files.forEach(function (f) { results.push(f.url); });
            } else if (data.url) {
              results.push(data.url);
            }
            next();
          });
        })
        .catch(done);
    }

    next();
  }

  function deleteUploadedImage(pin, url, done) {
    fetch(uploadApiUrl() + "?url=" + encodeURIComponent(url), {
      method: "DELETE",
      headers: { Accept: "application/json", "X-Admin-Pin": pin }
    })
      .then(function (res) {
        return res.json().catch(function () { return { error: "Invalid JSON" }; }).then(function (data) {
          if (res.status === 401) throw new Error("Incorrect admin PIN.");
          if (!res.ok) throw new Error((data && data.error) || "Delete failed.");
          done(null, data);
        });
      })
      .catch(done);
  }

  function startPublicCatalogAutoRefresh(refreshFn, intervalMs) {
    var ms = intervalMs || 60000;
    var timer = window.setInterval(refreshFn, ms);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refreshFn();
    });
    return function () { window.clearInterval(timer); };
  }

  global.prillagaFetchPublicCatalog = fetchPublicCatalog;
  global.prillagaFetchAdminCatalog = fetchAdminCatalog;
  global.prillagaSaveAdminCatalog = saveAdminCatalog;
  global.prillagaUploadProductImages = uploadProductImages;
  global.prillagaDeleteUploadedImage = deleteUploadedImage;
  global.prillagaStartPublicCatalogAutoRefresh = startPublicCatalogAutoRefresh;
})(window);
