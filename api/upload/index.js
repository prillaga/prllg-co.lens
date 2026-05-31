import { isAuthorizedAdmin } from "../../lib/auth.js";
import { handleOptions, sendError, setJsonCors, storageErrorResponse } from "../../lib/bookings/http.js";
import { uploadProductImage, deleteProductImageByUrl } from "../../lib/upload/supabase-storage.js";
import { validateUploadFile, safeFileName } from "../../lib/upload/validate.js";

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from("--" + boundary);
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;

  while (start < buffer.length) {
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const headerText = part.slice(0, headerEnd).toString("utf8");
    const body = part.slice(headerEnd + 4);
    const nameMatch = /name="([^"]+)"/.exec(headerText);
    const fileMatch = /filename="([^"]+)"/.exec(headerText);
    const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
    parts.push({
      name: nameMatch ? nameMatch[1] : "",
      filename: fileMatch ? fileMatch[1] : "",
      contentType: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
      body: body
    });
    start = end + boundaryBuffer.length + 2;
  }

  return parts;
}

async function handleUpload(req, res) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    sendError(res, 400, "Expected multipart form upload.");
    return;
  }

  const boundaryMatch = /boundary=(.+)$/i.exec(contentType);
  if (!boundaryMatch) {
    sendError(res, 400, "Invalid multipart boundary.");
    return;
  }

  const raw = await readRawBody(req);
  const parts = parseMultipart(raw, boundaryMatch[1].trim());
  const fileParts = parts.filter(function (p) { return p.name === "file" && p.filename; });
  const unitIdPart = parts.find(function (p) { return p.name === "unitId"; });
  const unitId = unitIdPart ? unitIdPart.body.toString("utf8").trim() : "";

  if (!fileParts.length) {
    sendError(res, 400, "Missing file field.");
    return;
  }

  const uploaded = [];

  for (let i = 0; i < fileParts.length; i++) {
    const filePart = fileParts[i];
    const pseudoFile = {
      size: filePart.body.length,
      type: filePart.contentType
    };
    const validation = validateUploadFile(pseudoFile);
    if (!validation.ok) {
      sendError(res, 400, validation.error);
      return;
    }

    const result = await uploadProductImage(
      filePart.body,
      safeFileName(filePart.filename),
      filePart.contentType,
      unitId
    );

    uploaded.push({
      url: result.url,
      path: result.path,
      name: filePart.filename
    });
  }

  res.status(200).json({
    files: uploaded,
    url: uploaded[0] ? uploaded[0].url : ""
  });
}

async function handleDelete(req, res) {
  let url = "";
  if (req.query && req.query.url) {
    url = String(req.query.url);
  } else {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    url = body && body.url ? String(body.url) : "";
  }
  if (!url) {
    sendError(res, 400, "Provide url to delete.");
    return;
  }

  await deleteProductImageByUrl(url);
  res.status(200).json({ deleted: url });
}

export default async function handler(req, res) {
  setJsonCors(res);
  if (handleOptions(req, res)) return;

  if (!isAuthorizedAdmin(req)) {
    sendError(res, 401, "Unauthorized admin PIN.");
    return;
  }

  try {
    if (req.method === "POST") {
      await handleUpload(req, res);
      return;
    }
    if (req.method === "DELETE") {
      await handleDelete(req, res);
      return;
    }
    sendError(res, 405, "Method not allowed.");
  } catch (err) {
    if (storageErrorResponse(res, err)) return;
    if (err && err.code === "STORAGE_BUCKET_MISSING") {
      sendError(res, 503, err.message, { setup: "Run supabase/storage.sql in Supabase SQL editor." });
      return;
    }
    console.error("Upload API failed:", err);
    sendError(res, 500, err.message || "Upload failed.");
  }
}
