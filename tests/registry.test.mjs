import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectBrands, sha256, validateRegistry } from "../scripts/registry.mjs";

function fixture() {
  return {
    format: "ussa-filament-brand/1", brand: "Example", checkedOn: "2026-10-27",
    records: [{ id: "example-red", brand: "Example", productLine: "PLA", polymer: "PLA", colorName: "Red", sourceCode: "R1", codeKind: "sku", evidenceKind: "manufacturer", selectable: true, sourceUrl: "https://example.com/pla", checkedOn: "2026-10-27", displaySource: "Official image", displayHex: null, effects: [], catalogOrder: 0 }],
    productLines: [{ brand: "Example", series: "PLA", sourceUrl: "https://example.com/pla", catalogOrder: 0 }],
    displayReferences: [{ id: "example-red", components: ["#AA2233"], kind: "manufacturer-swatch", sourceUrl: "https://example.com/red", providerId: "red", method: "Official image sample", checkedOn: "2026-10-27", catalogOrder: 0 }],
    unresolved: [], browsingAliases: [],
  };
}

test("validates the complete migrated catalog", () => {
  const { counts, manifest } = validateRegistry(fileURLToPath(new URL("../", import.meta.url)));
  assert.deepEqual(counts, manifest.counts);
  assert.ok(counts.registeredIdentities >= 10357);
});

test("rejects duplicate IDs even when their display colors agree", () => {
  const brand = fixture();
  brand.records.push({ ...brand.records[0], catalogOrder: 1 });
  assert.throws(() => inspectBrands([brand]), /duplicate identity/);
});

test("rejects a reference assigned to another brand's file", () => {
  const brand = fixture();
  brand.displayReferences[0].id = "another-brand-red";
  assert.throws(() => inspectBrands([brand]), /cross-brand display reference/);
});

test("rejects a selectable color with no display fill", () => {
  const brand = fixture();
  brand.displayReferences = [];
  assert.throws(() => inspectBrands([brand]), /no screen reference/);
});

test("retains retired IDs and source colors while excluding them from new selection", () => {
  const brand = fixture();
  brand.records[0].maintenance = { state: "retired", reason: "Catalog withdrawal", changedOn: "2026-10-27" };
  const counts = inspectBrands([brand]);
  assert.equal(counts.registeredIdentities, 1);
  assert.equal(counts.displayReferences, 1);
  assert.equal(counts.selectableReferences, 0);
  assert.equal(counts.browsingLines, 0);
});

test("validates maintenance evidence and replacement links", () => {
  const brand = fixture();
  brand.records[0].maintenance = { state: "superseded", reason: "Duplicate identity", changedOn: "2026-10-27", replacementId: "missing" };
  assert.throws(() => inspectBrands([brand]), /replacement ID/);
  brand.records[0].maintenance.replacementId = brand.records[0].id;
  assert.throws(() => inspectBrands([brand]), /cyclic replacement/);
  brand.records[0].maintenance = { state: "retired", reason: "", changedOn: "2026-10-27" };
  assert.throws(() => inspectBrands([brand]), /maintenance state/);
});

test("rejects lost catalog ordering and alias targets", () => {
  const brand = fixture();
  brand.records[0].catalogOrder = 2;
  assert.throws(() => inspectBrands([brand]), /catalogOrder/);
  brand.records[0].catalogOrder = 0;
  brand.browsingAliases.push({ brand: "Example", sourceSeries: "PLA", browsingSeries: "Missing" });
  assert.throws(() => inspectBrands([brand]), /browsing alias/);
});

test("detects changed data bytes and unsafe manifest paths", () => {
  const root = mkdtempSync(join(tmpdir(), "filament-registry-test-"));
  try {
    mkdirSync(join(root, "data/brands"), { recursive: true });
    const brand = fixture();
    const bytes = Buffer.from(JSON.stringify(brand));
    const manifest = { name: "USSA Filament Registry", format: "ussa-filament-registry/2", catalogVersion: "0.1.0", counts: inspectBrands([brand]), files: { "brands/example.json": { brand: "Example", bytes: bytes.length, sha256: sha256(bytes) } } };
    writeFileSync(join(root, "registry.json"), JSON.stringify(manifest));
    writeFileSync(join(root, "data/brands/example.json"), bytes);
    validateRegistry(root);
    writeFileSync(join(root, "data/brands/example.json"), "{}");
    assert.throws(() => validateRegistry(root), /Corrupt registry file/);
    manifest.files = { "../outside.json": {} };
    writeFileSync(join(root, "registry.json"), JSON.stringify(manifest));
    assert.throws(() => validateRegistry(root), /Unsafe/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
