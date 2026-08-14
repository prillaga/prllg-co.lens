import { isAuthorizedAdmin } from "../../lib/auth.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";
import { createReceipt, listReceipts, peekNextReceiptNumber } from "../../lib/receipts/storage.js";

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (!isAuthorizedAdmin(req)) {
    sendError(res, 401, "Unauthorized admin PIN.");
    return;
  }

  try {
    if (req.method === "GET") {
      const nextNumber = await peekNextReceiptNumber();
      const receipts = await listReceipts();
      res.status(200).json({ nextNumber, receipts: receipts.slice(0, 50) });
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const result = await createReceipt(body);
      res.status(200).json(result);
      return;
    }

    sendError(res, 405, "Method not allowed.");
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    if (err && err.code === "INVALID_RECEIPT") {
      sendError(res, 400, err.message);
      return;
    }
    console.error("Receipts API failed:", err);
    sendError(res, 500, err.message || "Could not process receipt.");
  }
}
