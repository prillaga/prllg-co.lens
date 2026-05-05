/** Facebook Page ID for Messenger (m.me/<this>). Edit once for the whole site. */
window.PRILLAGA_MESSENGER_PAGE_ID = "966778496516486";

/** Trimmed Page ID, or "" if unset. */
window.prillagaMessengerPageId = function () {
  var id = typeof window.PRILLAGA_MESSENGER_PAGE_ID === "string" ? window.PRILLAGA_MESSENGER_PAGE_ID.trim() : "";
  return id || "";
};

/** Base https://m.me/<id> URL, or "" if ID missing. */
window.prillagaMessengerBaseUrl = function () {
  var id = window.prillagaMessengerPageId();
  return id ? "https://m.me/" + id : "";
};

/** m.me URL with optional prefilled ?text= (encoded). */
window.prillagaMessengerUrlWithText = function (text) {
  var base = window.prillagaMessengerBaseUrl();
  if (!base) return "";
  if (text == null || String(text) === "") return base;
  return base + "?text=" + encodeURIComponent(String(text));
};

/**
 * GCash for ₱100 reservation fee — shown on payment-methods.html (copy + QR).
 * Set your real number, e.g. "09171234567" or "0917 123 4567".
 */
window.PRILLAGA_GCASH_NUMBER = "09947552646";

/**
 * GCash QR image: relative path (e.g. "images/gcash-qr.jpg") or full URL.
 * Leave "" to hide the QR block until you add the file and set this.
 */
window.PRILLAGA_GCASH_QR_SRC = "images/gcash-qr.jpg";

/** Business email for booking and agreement submissions. */
window.PRILLAGA_BUSINESS_EMAIL = "hjsescabarte2021@gmail.com";

/** Trimmed business email, or "" if unset. */
window.prillagaBusinessEmail = function () {
  var email = typeof window.PRILLAGA_BUSINESS_EMAIL === "string" ? window.PRILLAGA_BUSINESS_EMAIL.trim() : "";
  return email || "";
};
