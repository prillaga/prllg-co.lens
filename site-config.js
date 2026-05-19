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

/**
 * Web3Forms access key — required for reliable automatic agreement emails with PNG attachments.
 * Get a free key at https://web3forms.com (use the same inbox as PRILLAGA_BUSINESS_EMAIL).
 */
window.PRILLAGA_WEB3FORMS_ACCESS_KEY = "c8ad8552-1857-4f6f-ba5f-3f259a076538";
/**
 * Gmail relay URL for agreement PNG attachments (recommended).
 * Deploy scripts/agreement-email-relay.gs — see scripts/AGREEMENT-EMAIL-SETUP.md
 */
window.PRILLAGA_AGREEMENT_SEND_URL = "";
https://script.google.com/macros/s/AKfycbzGizXEaxfv8VeAFwbbgoTco1zQPolP8890HGKvULC2KfYI7V8WiAk-2Mvb49n2zOSy/exec
/** Trimmed business email, or "" if unset. */
window.prillagaBusinessEmail = function () {
  var email = typeof window.PRILLAGA_BUSINESS_EMAIL === "string" ? window.PRILLAGA_BUSINESS_EMAIL.trim() : "";
  return email || "";
};

window.prillagaWeb3FormsAccessKey = function () {
  var key = typeof window.PRILLAGA_WEB3FORMS_ACCESS_KEY === "string" ? window.PRILLAGA_WEB3FORMS_ACCESS_KEY.trim() : "";
  return key || "";
};

window.prillagaAgreementSendUrl = function () {
  var url = typeof window.PRILLAGA_AGREEMENT_SEND_URL === "string" ? window.PRILLAGA_AGREEMENT_SEND_URL.trim() : "";
  return url || "";
};
