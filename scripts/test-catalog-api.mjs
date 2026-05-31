import { sanitizeCatalog, toPublicCatalog, slugFromName, uniqueUnitId } from "../lib/catalog/core.js";
import { SEED_CATALOG } from "../lib/catalog/constants.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const catalog = sanitizeCatalog(SEED_CATALOG);
assert(catalog.units.length === 9, "expected 9 seed units");
assert(catalog.addons.length === 2, "expected 2 seed addons");

const pub = toPublicCatalog(catalog);
assert(pub.units.length === 9, "public catalog includes active units");
assert(pub.units[0].pricing.baseRate > 0, "pricing exported");

assert(slugFromName("Canon 4000D Kit") === "canon-4000d-kit", "slugFromName");
assert(uniqueUnitId("Test", new Set(["test"])) === "test-2", "uniqueUnitId");

const bad = sanitizeCatalog({ units: [{ id: "bad id", name: "X", pricing: { baseRate: 1, longRate: 1 }, image: "images/x.jpg" }] });
assert(bad.units.length === 0, "invalid slug rejected");

const supaMedia = sanitizeCatalog({
  units: [],
  addons: [],
  media: [{ id: "m1", url: "https://fomyzhxajhwqkztfvkue.supabase.co/storage/v1/object/public/product-images/units/test/a.jpg" }]
});
assert(supaMedia.media.length === 1, "supabase storage urls accepted");

console.log("catalog API core tests passed.");
