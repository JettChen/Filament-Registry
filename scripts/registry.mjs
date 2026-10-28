import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseVersion, isSelectable } from "./compatibility.mjs";

export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const hex = /^#[a-f\d]{6}$/i;
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const hasText = value => typeof value === "string" && value.trim().length > 0;
const dated = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const https = value => { try { return new URL(value).protocol === "https:"; } catch { return false; } };

function checkOrder(rows, label) {
  const order = rows.map(row => row.catalogOrder).sort((left, right) => left - right);
  requireValue(order.every((value, index) => value === index), `${label}: catalogOrder must be unique and contiguous from zero`);
}

/** Validate the common per-brand schema and cross-brand catalog relationships. No network requests. */
export function inspectBrands(brands) {
  const names = new Set();
  const identities = new Map();
  const references = new Map();
  const sourceLines = new Set();
  const inventory = new Set();
  const aliases = new Map();
  const allRecords = [];
  const allLines = [];
  const allReferences = [];
  for (const brand of brands) {
    requireValue(brand.format === "ussa-filament-brand/1" && hasText(brand.brand) && dated(brand.checkedOn), "Invalid brand file header");
    requireValue(!names.has(brand.brand), `Duplicate brand file: ${brand.brand}`);
    names.add(brand.brand);
    for (const field of ["records", "productLines", "displayReferences", "unresolved", "browsingAliases"]) requireValue(Array.isArray(brand[field]), `${brand.brand}: missing ${field}`);
    const localIds = new Set();
    for (const row of brand.records) {
      requireValue(row.brand === brand.brand, `Cross-brand record: ${row.id}`);
      requireValue(hasText(row.id) && !identities.has(row.id), `Missing or duplicate identity: ${row.id}`);
      requireValue(hasText(row.productLine) && hasText(row.polymer) && typeof row.selectable === "boolean", `Invalid material record: ${row.id}`);
      requireValue(row.colorName === null || hasText(row.colorName), `Invalid color name: ${row.id}`);
      requireValue(row.sourceCode === null || typeof row.sourceCode === "string", `Invalid source code: ${row.id}`);
      requireValue(["color-code", "source-code", "sku"].includes(row.codeKind) && ["manufacturer", "third-party"].includes(row.evidenceKind), `Invalid evidence/code kind: ${row.id}`);
      requireValue(https(row.sourceUrl) && dated(row.checkedOn) && hasText(row.displaySource), `Missing material provenance: ${row.id}`);
      requireValue(Array.isArray(row.effects) && row.effects.every(hasText), `Invalid effects: ${row.id}`);
      requireValue(row.displayHex === null || hex.test(row.displayHex), `Invalid screen HEX: ${row.id}`);
      requireValue(row.displayComponents === undefined || (Array.isArray(row.displayComponents) && row.displayComponents.every(value => hex.test(value))), `Invalid color components: ${row.id}`);
      requireValue(row.lifecycle === undefined || ["listed", "discontinued", "unverified"].includes(row.lifecycle), `Invalid lifecycle: ${row.id}`);
      if (row.maintenance) {
        requireValue(["active", "hidden", "retired", "superseded"].includes(row.maintenance.state) && dated(row.maintenance.changedOn) && hasText(row.maintenance.reason), `Invalid maintenance state: ${row.id}`);
        requireValue(row.maintenance.sourceUrl === undefined || https(row.maintenance.sourceUrl), `Invalid maintenance source: ${row.id}`);
        requireValue(row.maintenance.state !== "superseded" || hasText(row.maintenance.replacementId), `Missing replacement ID: ${row.id}`);
        requireValue(row.maintenance.replacementId === undefined || row.maintenance.state === "superseded", `Replacement requires superseded state: ${row.id}`);
      }
      if (row.sourceRecord) {
        const original = row.sourceRecord.record;
        requireValue(row.sourceRecord.format === "bambu/1" && row.brand === "Bambu Lab" && row.id === `bbl-${original.sourceFilamentId.toLowerCase()}-${original.code}`, `Invalid preserved source identity: ${row.id}`);
      }
      identities.set(row.id, row);
      localIds.add(row.id);
      sourceLines.add(`${row.brand}\0${row.productLine}`);
      allRecords.push(row);
    }
    for (const row of brand.productLines) {
      const key = `${row.brand}\0${row.series}`;
      requireValue(row.brand === brand.brand && hasText(row.series) && !inventory.has(key) && https(row.sourceUrl), `Invalid or duplicate inventory line: ${key}`);
      inventory.add(key);
      allLines.push(row);
    }
    for (const row of brand.displayReferences) {
      requireValue(localIds.has(row.id) && !references.has(row.id), `Duplicate, orphaned or cross-brand display reference: ${row.id}`);
      requireValue(Array.isArray(row.components) && row.components.length > 0 && row.components.every(value => hex.test(value)), `Invalid display reference HEX: ${row.id}`);
      requireValue(["manufacturer-literal", "manufacturer-swatch", "community", "approximation"].includes(row.kind) && https(row.sourceUrl) && dated(row.checkedOn) && hasText(row.providerId) && hasText(row.method), `Missing display provenance: ${row.id}`);
      references.set(row.id, row);
      allReferences.push(row);
    }
    requireValue(brand.unresolved.length === 0, `${brand.brand}: unresolved display references`);
    for (const row of brand.browsingAliases) {
      const key = `${row.brand}\0${row.sourceSeries}`;
      requireValue(row.brand === brand.brand && hasText(row.sourceSeries) && hasText(row.browsingSeries) && row.sourceSeries !== row.browsingSeries && !aliases.has(key), `Invalid or duplicate browsing alias: ${key}`);
      aliases.set(key, row.browsingSeries);
    }
  }
  checkOrder(allRecords, "records");
  checkOrder(allLines, "productLines");
  checkOrder(allReferences, "displayReferences");
  for (const row of allRecords) {
    const seen = new Set([row.id]);
    let target = row.maintenance?.replacementId;
    while (target) {
      requireValue(identities.has(target) && !seen.has(target), `Unknown or cyclic replacement ID: ${row.id}`);
      seen.add(target);
      target = identities.get(target).maintenance?.replacementId;
    }
  }
  for (const [key, target] of aliases) {
    const brand = key.split("\0")[0];
    const targetKey = `${brand}\0${target}`;
    requireValue((sourceLines.has(key) || inventory.has(key)) && (sourceLines.has(targetKey) || inventory.has(targetKey)) && !aliases.has(targetKey), `Unresolved or chained browsing alias: ${key}`);
  }
  let selectable = 0;
  const browsing = new Set();
  for (const [id, row] of identities) {
    if (!isSelectable(row)) continue;
    selectable++;
    const reference = references.get(id);
    const color = row.effects.includes("clear") && row.effects.includes("translucent") ? "#F2F3F2" : reference?.supersedesOriginal ? reference.components[0] : row.displayHex ?? reference?.components[0];
    requireValue(hex.test(color ?? ""), `Selectable color has no screen reference: ${id}`);
    browsing.add(`${row.brand}\0${aliases.get(`${row.brand}\0${row.productLine}`) ?? row.productLine}`);
  }
  return { registeredIdentities: identities.size, inventoryProductLines: inventory.size, displayReferences: references.size, selectableReferences: selectable, browsingLines: browsing.size, brands: names.size };
}

export function validateRegistry(root) {
  const manifest = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  requireValue(manifest.format === "ussa-filament-registry/2", "Unsupported registry format");
  requireValue(manifest.name === "USSA Filament Registry", "Invalid registry name");
  parseVersion(manifest.catalogVersion);
  const files = Object.keys(manifest.files).sort();
  requireValue(files.length > 0 && files.every(name => /^brands\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name)), "Unsafe or missing brand filename");
  const diskFiles = readdirSync(join(root, "data/brands")).map(name => `brands/${name}`).sort();
  requireValue(JSON.stringify(files) === JSON.stringify(diskFiles), "Brand files do not match manifest");
  requireValue(readdirSync(join(root, "data")).every(name => name === "brands"), "Unexpected legacy data outside brands/");
  const brands = files.map(name => {
    const bytes = readFileSync(join(root, "data", name));
    const expected = manifest.files[name];
    requireValue(bytes.length === expected.bytes && sha256(bytes) === expected.sha256, `Corrupt registry file: ${name}`);
    const brand = JSON.parse(bytes.toString("utf8"));
    requireValue(brand.brand === expected.brand, `Manifest brand mismatch: ${name}`);
    return brand;
  });
  const counts = inspectBrands(brands);
  requireValue(JSON.stringify(Object.keys(counts).sort()) === JSON.stringify(Object.keys(manifest.counts).sort()), "Unexpected count fields");
  for (const [key, expected] of Object.entries(manifest.counts)) requireValue(counts[key] === expected, `Count mismatch ${key}: ${counts[key]} != ${expected}`);
  return { manifest, counts, brands };
}
