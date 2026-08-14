import { DEFAULT_BUSINESS } from "./constants.js";

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.round(v * 100) / 100;
}

export function formatReceiptNumber(seq) {
  const n = Math.max(1, Math.floor(Number(seq) || 1));
  return "REC-" + String(n).padStart(4, "0");
}

export function nextSequence(seq) {
  return Math.max(1, Math.floor(Number(seq) || 1)) + 1;
}

export function sanitizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const description = String(raw.description || "").trim().slice(0, 200);
  const qty = Number(raw.quantity);
  const unitPrice = money(raw.unitPrice);
  if (!description || !Number.isFinite(qty) || qty <= 0) return null;
  const quantity = Math.round(qty * 100) / 100;
  return {
    description,
    quantity,
    unitPrice,
    total: money(quantity * unitPrice)
  };
}

export function computeTotals(items, discount, amountPaid) {
  const subtotal = money(
    (items || []).reduce(function (sum, item) {
      return sum + (item.total || 0);
    }, 0)
  );
  const disc = money(Math.min(discount || 0, subtotal));
  const grandTotal = money(subtotal - disc);
  const paid = money(amountPaid || 0);
  const balance = money(Math.max(0, grandTotal - paid));
  return { subtotal, discount: disc, grandTotal, amountPaid: paid, balance };
}

export function sanitizeReceipt(raw) {
  if (!raw || typeof raw !== "object") return null;
  const number = String(raw.number || "").trim();
  const customerName = String(raw.customerName || "").trim().slice(0, 120);
  if (!number || !customerName) return null;

  const items = [];
  (Array.isArray(raw.items) ? raw.items : []).forEach(function (item) {
    const s = sanitizeItem(item);
    if (s) items.push(s);
  });
  if (!items.length) return null;

  const totals = computeTotals(items, raw.discount, raw.amountPaid);
  const business = Object.assign({}, DEFAULT_BUSINESS, raw.business || {});

  return {
    id: String(raw.id || "").trim() || "r-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    number: number.slice(0, 32),
    date: String(raw.date || "").trim().slice(0, 32),
    customerName,
    customerContact: String(raw.customerContact || "").trim().slice(0, 200),
    transactionDetails: String(raw.transactionDetails || "").trim().slice(0, 500),
    rentalStart: String(raw.rentalStart || "").trim().slice(0, 32),
    rentalEnd: String(raw.rentalEnd || "").trim().slice(0, 32),
    paymentMethod: String(raw.paymentMethod || "").trim().slice(0, 80),
    notes: String(raw.notes || "").trim().slice(0, 1000),
    items,
    discount: totals.discount,
    amountPaid: totals.amountPaid,
    subtotal: totals.subtotal,
    grandTotal: totals.grandTotal,
    balance: totals.balance,
    business: {
      name: String(business.name || DEFAULT_BUSINESS.name).slice(0, 120),
      tagline: String(business.tagline || "").slice(0, 160),
      email: String(business.email || "").slice(0, 120),
      phone: String(business.phone || "").slice(0, 60),
      address: String(business.address || "").slice(0, 200),
      thankYou: String(business.thankYou || DEFAULT_BUSINESS.thankYou).slice(0, 200)
    },
    createdAt: Number(raw.createdAt) || Date.now()
  };
}

export function sanitizeReceiptStore(raw) {
  const receipts = [];
  const seen = new Set();
  (raw && Array.isArray(raw.receipts) ? raw.receipts : []).forEach(function (r) {
    const s = sanitizeReceipt(r);
    if (!s) return;
    if (seen.has(s.number)) return;
    if (s.id && seen.has("id:" + s.id)) return;
    seen.add(s.number);
    if (s.id) seen.add("id:" + s.id);
    receipts.push(s);
  });

  let next = Number(raw && raw.nextSequence);
  if (!Number.isFinite(next) || next < 1) next = 1;

  receipts.forEach(function (r) {
    const m = /^REC-(\d+)$/i.exec(r.number || "");
    if (m) {
      const n = parseInt(m[1], 10) + 1;
      if (n > next) next = n;
    }
  });

  return {
    updatedAt: Number(raw && raw.updatedAt) || Date.now(),
    nextSequence: next,
    receipts: receipts.slice(0, 500)
  };
}
