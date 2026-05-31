const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizePricing(raw, settings) {
  const minDays = settings && settings.longRateMinDays ? Number(settings.longRateMinDays) : 3;
  const baseRate = Number(raw && raw.baseRate);
  const longRate = Number(raw && raw.longRate);
  if (!Number.isFinite(baseRate) || baseRate < 0) return null;
  if (!Number.isFinite(longRate) || longRate < 0) return null;
  return {
    baseRate: Math.round(baseRate),
    longRate: Math.round(longRate),
    longRateMinDays: minDays
  };
}

export function sanitizeUnit(raw, settings) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  const name = String(raw.name || "").trim();
  if (!id || !SLUG_RE.test(id) || !name) return null;

  const pricing = sanitizePricing(raw.pricing, settings);
  if (!pricing) return null;

  const image = String(raw.image || "").trim();
  if (!image) return null;

  let images = Array.isArray(raw.images) ? raw.images : [image];
  images = images
    .map(function (u) { return String(u || "").trim(); })
    .filter(Boolean)
    .slice(0, 12);
  if (!images.length) images = [image];

  return {
    id: id,
    name: name.slice(0, 160),
    description: String(raw.description || "").slice(0, 2000),
    image: image.slice(0, 500),
    images: images.map(function (u) { return u.slice(0, 500); }),
    pricing: pricing,
    sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : 0,
    active: raw.active !== false,
    bookable: raw.bookable !== false
  };
}

export function sanitizeAddon(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  const name = String(raw.name || "").trim();
  const label = String(raw.label || name).trim();
  const price = Number(raw.price);
  if (!id || !SLUG_RE.test(id) || !name || !Number.isFinite(price) || price < 0) return null;
  return {
    id: id,
    name: name.slice(0, 80),
    label: label.slice(0, 120),
    price: Math.round(price),
    sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : 0,
    active: raw.active !== false
  };
}

export function sanitizeMediaItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  const url = String(raw.url || "").trim();
  if (!id || !url) return null;
  if (!/^https?:\/\//i.test(url) && !/^images\//i.test(url) && !/^\.\/images\//i.test(url)) {
    return null;
  }
  return {
    id: id,
    url: url.slice(0, 500),
    name: String(raw.name || "").slice(0, 160),
    unitId: raw.unitId ? String(raw.unitId).trim().slice(0, 64) : "",
    sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : 0,
    createdAt: Number(raw.createdAt) || Date.now()
  };
}

export function sanitizeCatalog(raw) {
  const settings = {
    reservationFee: Number(raw && raw.settings && raw.settings.reservationFee) || 100,
    longRateMinDays: Number(raw && raw.settings && raw.settings.longRateMinDays) || 3,
    currency: "PHP"
  };

  const units = [];
  const unitIds = new Set();
  (raw && Array.isArray(raw.units) ? raw.units : []).forEach(function (item) {
    const unit = sanitizeUnit(item, settings);
    if (!unit || unitIds.has(unit.id)) return;
    unitIds.add(unit.id);
    units.push(unit);
  });
  units.sort(function (a, b) { return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name); });

  const addons = [];
  const addonIds = new Set();
  (raw && Array.isArray(raw.addons) ? raw.addons : []).forEach(function (item) {
    const addon = sanitizeAddon(item);
    if (!addon || addonIds.has(addon.id)) return;
    addonIds.add(addon.id);
    addons.push(addon);
  });
  addons.sort(function (a, b) { return a.sortOrder - b.sortOrder; });

  const media = [];
  const mediaIds = new Set();
  (raw && Array.isArray(raw.media) ? raw.media : []).forEach(function (item) {
    const m = sanitizeMediaItem(item);
    if (!m || mediaIds.has(m.id)) return;
    mediaIds.add(m.id);
    media.push(m);
  });

  return {
    updatedAt: Date.now(),
    settings: settings,
    units: units,
    addons: addons,
    media: media
  };
}

export function toPublicCatalog(catalog) {
  return {
    updatedAt: catalog.updatedAt,
    settings: catalog.settings,
    units: catalog.units
      .filter(function (u) { return u.active; })
      .map(function (u) {
        return {
          id: u.id,
          name: u.name,
          description: u.description,
          image: u.image,
          images: u.images,
          pricing: u.pricing,
          sortOrder: u.sortOrder,
          bookable: u.bookable
        };
      }),
    addons: catalog.addons
      .filter(function (a) { return a.active; })
      .map(function (a) {
        return {
          id: a.id,
          name: a.name,
          label: a.label,
          price: a.price,
          sortOrder: a.sortOrder
        };
      })
  };
}

export function getUnitIdSet(catalog) {
  return new Set((catalog.units || []).map(function (u) { return u.id; }));
}

export { SLUG_RE, DATE_RE };
