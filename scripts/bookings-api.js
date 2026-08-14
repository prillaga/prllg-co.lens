(function (global) {
  "use strict";

  var STORAGE_KEY = "prillaga_lens_bookings_v1";

  function publicApiUrl() {
    if (global.prillagaBookingsPublicApiUrl) return global.prillagaBookingsPublicApiUrl();
    return "/api/bookings/public";
  }

  function adminApiUrl() {
    if (global.prillagaBookingsAdminApiUrl) return global.prillagaBookingsAdminApiUrl();
    return "/api/bookings";
  }

  function parsePublicPayload(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.bookings)) return data.bookings;
    return [];
  }

  /**
   * @param {function(Error|null, Array, {source:string, message?:string})} done
   */
  function fetchPublicBookings(done) {
    fetch(publicApiUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { error: "Invalid JSON response" };
        }).then(function (data) {
          if (!res.ok) {
            var err = new Error((data && data.error) || "Could not load availability (HTTP " + res.status + ").");
            err.status = res.status;
            throw err;
          }
          if (data && data.error) {
            var apiErr = new Error(data.error);
            apiErr.status = res.status;
            throw apiErr;
          }
          done(null, parsePublicPayload(data), { source: "api" });
        });
      })
      .catch(function (err) {
        fetch("./availability-public.json", { cache: "no-store" })
          .then(function (res) {
            if (!res.ok) throw err;
            return res.json();
          })
          .then(function (data) {
            done(null, parsePublicPayload(data), {
              source: "fallback",
              message: "Live API unavailable — showing last published snapshot."
            });
          })
          .catch(function () {
            done(err || new Error("Could not load availability."), [], { source: "error" });
          });
      });
  }

  function fetchAdminBookings(pin, done) {
    fetch(adminApiUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Pin": pin
      }
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { error: "Invalid JSON response" };
        }).then(function (data) {
          if (res.status === 401) throw new Error("Incorrect admin PIN.");
          if (!res.ok) throw new Error((data && data.error) || "Could not load admin data (HTTP " + res.status + ").");
          var list = data && Array.isArray(data.bookings) ? data.bookings : [];
          done(null, list, data.updatedAt || Date.now());
        });
      })
      .catch(done);
  }

  function saveAdminBookings(pin, bookings, done) {
    fetch(adminApiUrl(), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Pin": pin
      },
      body: JSON.stringify({ bookings: bookings })
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { error: "Invalid JSON response" };
        }).then(function (data) {
          if (res.status === 401) throw new Error("Incorrect admin PIN.");
          if (!res.ok) throw new Error((data && data.error) || "Could not save availability.");
          done(null, data);
        });
      })
      .catch(done);
  }

  function startPublicBookingsAutoRefresh(refreshFn, intervalMs) {
    var ms = intervalMs || 45000;
    var timer = window.setInterval(refreshFn, ms);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refreshFn();
    });
    return function stop() {
      window.clearInterval(timer);
    };
  }

  global.PRILLAGA_BOOKINGS_STORAGE_KEY = STORAGE_KEY;
  global.prillagaFetchPublicBookings = fetchPublicBookings;
  global.prillagaFetchAdminBookings = fetchAdminBookings;
  global.prillagaSaveAdminBookings = saveAdminBookings;
  global.prillagaStartPublicBookingsAutoRefresh = startPublicBookingsAutoRefresh;
})(window);
