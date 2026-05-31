import { isAuthorizedAdmin } from "../../lib/auth.js";
import { handleOptions, sendError, setJsonCors } from "../../lib/bookings/http.js";
import { getAdminCatalog, saveAdminCatalog } from "../../lib/catalog/storage.js";
import { uploadImageBuffer, deleteImageByUrl, isBlobConfigured } from "../../lib/upload/blob.js";
import { safeFileName, validateUploadFile } from "../../lib/upload/validate.js";

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

  if (!isBlobConfigured()) {
    sendError(res, 503, "Image storage is not configured. Connect Vercel Blob on Vercel.", {
      setup: "Storage → Blob → connect to project (adds BLOB_READ_WRITE_TOKEN)."
    });
    return;
  }

  const boundaryMatch = /boundary=(.+)$/i.exec(contentType);
  if (!boundaryMatch) {
    sendError(res, 400, "Invalid multipart boundary.");
    return;
  }

  const raw = await readRawBody(req);
  const parts = parseMultipart(raw, boundaryMatch[1].trim());
  const filePart = parts.find(function (p) { return p.name === "file" && p.filename; });
  const unitIdPart = parts.find(function (p) { return p.name === "unitId"; });

  if (!filePart) {
    sendError(res, 400, "Missing file field.");
    return;
  }

  const pseudoFile = {
    size: filePart.body.length,
    type: filePart.contentType
  };
  const validation = validateUploadFile(pseudoFile);
  if (!validation.ok) {
    sendError(res, 400, validation.error);
    return;
  }

  const fileName = "units/" + safeFileName(filePart.filename);
  const blob = await uploadImageBuffer(filePart.body, fileName, filePart.contentType);
  const unitId = unitIdPart ? unitIdPart.body.toString("utf8").trim() : "";

  const catalog = await getAdminCatalog();
  const mediaItem = {
    id: "m-" + Date.now(),
    url: blob.url,
    name: filePart.filename,
    unitId: unitId,
    sortOrder: catalog.media.length,
    createdAt: Date.now()
  };
  catalog.media = catalog.media || [];
  catalog.media.push(mediaItem);

  if (unitId) {
    const unit = catalog.units.find(function (u) { return u.id === unitId; });
    if (unit) {
      unit.image = blob.url;
      unit.images = unit.images || [];
      if (unit.images.indexOf(blob.url) === -1) unit.images.unshift(blob.url);
    }
  }

  const saved = await saveAdminCatalog(catalog);
  res.status(200).json({ media: mediaItem, catalog: saved });
}

async function handleDelete(req, res) {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const mediaId = body && body.mediaId ? String(body.mediaId) : "";
  const url = body && body.url ? String(body.url) : "";

  if (!mediaId && !url) {
    sendError(res, 400, "Provide mediaId or url to delete.");
    return;
  }

  const catalog = await getAdminCatalog();
  const target = catalog.media.find(function (m) {
    return (mediaId && m.id === mediaId) || (url && m.url === url);
  });

  if (!target) {
    sendError(res, 404, "Media item not found.");
    return;
  }

  if (target.url && target.url.includes("blob.vercel-storage.com")) {
    try {
      await deleteImageByUrl(target.url);
    } catch (e) {
      console.warn("Blob delete failed:", e.message);
    }
  }

  catalog.media = catalog.media.filter(function (m) { return m.id !== target.id; });
  catalog.units.forEach(function (unit) {
    if (unit.image === target.url) {
      unit.image = unit.images.find(function (u) { return u !== target.url; }) || unit.image;
    }
    unit.images = (unit.images || []).filter(function (u) { return u !== target.url; });
    if (!unit.images.length && unit.image !== target.url) unit.images = [unit.image];
  });

  const saved = await saveAdminCatalog(catalog);
  res.status(200).json({ deleted: target.id, catalog: saved });
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
    console.error("Upload API failed:", err);
    sendError(res, 500, err.message || "Upload failed.");
  }
}
