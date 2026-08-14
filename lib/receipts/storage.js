import { STORAGE_KEY } from "./constants.js";
import { formatReceiptNumber, nextSequence, sanitizeReceipt, sanitizeReceiptStore } from "./core.js";
import { readJsonOrSeed, writeJson } from "../storage/supabase-kv.js";

const EMPTY_STORE = {
  updatedAt: Date.now(),
  nextSequence: 1,
  receipts: []
};

export async function getReceiptsStore() {
  const raw = await readJsonOrSeed(STORAGE_KEY, EMPTY_STORE);
  return sanitizeReceiptStore(raw);
}

export async function saveReceiptsStore(store) {
  const payload = sanitizeReceiptStore(store);
  payload.updatedAt = Date.now();
  await writeJson(STORAGE_KEY, payload);
  return payload;
}

export async function peekNextReceiptNumber() {
  const store = await getReceiptsStore();
  return formatReceiptNumber(store.nextSequence || 1);
}

export async function createReceipt(raw) {
  const store = await getReceiptsStore();
  const seq = store.nextSequence || 1;
  const receipt = sanitizeReceipt(
    Object.assign({}, raw, {
      id: "r-" + Date.now(),
      number: formatReceiptNumber(seq),
      createdAt: Date.now()
    })
  );
  if (!receipt) {
    const err = new Error("Invalid receipt data.");
    err.code = "INVALID_RECEIPT";
    throw err;
  }
  store.receipts.unshift(receipt);
  store.nextSequence = nextSequence(seq);
  store.updatedAt = Date.now();
  await saveReceiptsStore(store);
  return { receipt, store };
}

export async function listReceipts() {
  const store = await getReceiptsStore();
  return store.receipts;
}
