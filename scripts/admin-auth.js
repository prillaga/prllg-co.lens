(function (global) {
  "use strict";

  var SESSION_KEY = "prillaga_admin_pin_v1";
  var DEFAULT_PIN = "lens2026";

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      t.classList.remove("show");
    }, 2600);
  }

  global.prillagaAdminDefaultPin = function () {
    return DEFAULT_PIN;
  };

  global.prillagaAdminSessionPin = function () {
    try {
      return sessionStorage.getItem(SESSION_KEY) || "";
    } catch (e) {
      return "";
    }
  };

  global.prillagaAdminSetSessionPin = function (pin) {
    try {
      if (pin) sessionStorage.setItem(SESSION_KEY, pin);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (e) { /* ignore */ }
  };

  global.prillagaAdminVerifyPin = function (entered) {
    return String(entered || "") === DEFAULT_PIN;
  };

  global.prillagaAdminToast = toast;

  /**
   * Wire standard gate (#gate, #panel, #adminPin, #btnUnlock, #btnLock).
   * onUnlock(pin) runs after successful unlock.
   */
  global.prillagaAdminInitGate = function (onUnlock, onLock) {
    var gate = document.getElementById("gate");
    var panel = document.getElementById("panel");
    var pinInput = document.getElementById("adminPin");
    var btnUnlock = document.getElementById("btnUnlock");
    var btnLock = document.getElementById("btnLock");
    if (!gate || !panel || !btnUnlock) return;

    function showPanel(pin) {
      global.__prillagaAdminPin = pin;
      global.prillagaAdminSetSessionPin(pin);
      gate.hidden = true;
      panel.hidden = false;
      if (pinInput) pinInput.value = "";
      if (typeof onUnlock === "function") onUnlock(pin);
    }

    function hidePanel() {
      global.__prillagaAdminPin = "";
      global.prillagaAdminSetSessionPin("");
      gate.hidden = false;
      panel.hidden = true;
    }

    btnUnlock.addEventListener("click", function () {
      var entered = pinInput ? pinInput.value : "";
      if (global.prillagaAdminVerifyPin(entered)) {
        showPanel(entered);
        toast("Unlocked.");
      } else {
        toast("Incorrect PIN.");
      }
    });

    if (pinInput) {
      pinInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") btnUnlock.click();
      });
    }

    if (btnLock) {
      btnLock.addEventListener("click", function () {
        hidePanel();
        toast("Locked.");
        if (typeof onLock === "function") onLock();
      });
    }

    var saved = global.prillagaAdminSessionPin();
    if (saved && global.prillagaAdminVerifyPin(saved)) {
      showPanel(saved);
    }
  };
})(window);
