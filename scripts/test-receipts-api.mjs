import {
  computeTotals,
  formatReceiptNumber,
  nextSequence,
  sanitizeItem,
  sanitizeReceipt,
  sanitizeReceiptStore
} from "../lib/receipts/core.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(formatReceiptNumber(1) === "REC-0001", "format 1");
assert(formatReceiptNumber(12) === "REC-0012", "format 12");
assert(nextSequence(1) === 2, "next seq");

const item = sanitizeItem({ description: "Nikon kit", quantity: 2, unitPrice: 450 });
assert(item && item.total === 900, "item total");

const totals = computeTotals(
  [
    { total: 900 },
    { total: 300 }
  ],
  100,
  500
);
assert(totals.subtotal === 1200, "subtotal");
assert(totals.discount === 100, "discount");
assert(totals.grandTotal === 1100, "grand");
assert(totals.amountPaid === 500, "paid");
assert(totals.balance === 600, "balance");

const receipt = sanitizeReceipt({
  number: "REC-0001",
  date: "2026-05-31",
  rentalStart: "2026-05-31",
  rentalEnd: "2026-06-02",
  customerName: "Juan",
  paymentMethod: "GCash",
  discount: 50,
  amountPaid: 1000,
  items: [{ description: "Canon 4000D", quantity: 1, unitPrice: 550 }]
});
assert(receipt && receipt.grandTotal === 500, "receipt grand after discount");
assert(receipt.balance === 0, "fully paid balance");
assert(receipt.rentalStart === "2026-05-31", "rental start saved");
assert(receipt.rentalEnd === "2026-06-02", "rental end saved");

const store = sanitizeReceiptStore({
  nextSequence: 1,
  receipts: [
    receipt,
    {
      number: "REC-0005",
      customerName: "Ana",
      date: "2026-05-30",
      items: [{ description: "X", quantity: 1, unitPrice: 10 }]
    }
  ]
});
assert(store.nextSequence === 6, "next sequence from highest receipt");

console.log("receipts core tests passed.");
