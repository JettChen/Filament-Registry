import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, cpSync, copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDisplayColor, consumerRecords, resolveAppliedFinish, classifyDisplayEvidence } from "../scripts/colors.mjs";
import { validateRegistry, inspectBrands, sha256 } from "../scripts/registry.mjs";
import { isSelectable } from "../scripts/compatibility.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const snapshot = () => validateRegistry(root);
const legacy = (patch = {}) => ({ id: "example", effects: [], displayHex: "#112233", displayComponents: ["#112233"], ...patch });

test("one browser-safe resolver preserves legacy override, fallback, multicomponent and Clear semantics", () => {
  assert.equal(resolveDisplayColor(legacy()).hex, "#112233");
  assert.equal(resolveDisplayColor(legacy({ displayHex: null, displayComponents: [] }), { components: ["#445566"] }).hex, "#445566");
  const superseding = { components: ["#AABBCC", "#DDEEFF"], supersedesOriginal: true };
  assert.deepEqual(resolveDisplayColor(legacy(), superseding).components, superseding.components);
  assert.equal(resolveDisplayColor(legacy({ effects: ["clear", "translucent"] })).hex, "#F2F3F2");
  assert.equal(resolveDisplayColor(legacy({ displayHex: null, displayComponents: [] })).hex, null);
  assert.throws(() => resolveDisplayColor(legacy({ displayColorId: "missing" })), /Unknown display color/);
});

test("the consumer projection is deterministic and resolves every retained material without changing inputs", () => {
  const { brands } = snapshot();
  const before = JSON.stringify(brands);
  const rows = consumerRecords(brands);
  assert.equal(rows.length, 10357);
  assert.equal(rows.filter(isSelectable).length, 9991);
  assert.deepEqual(rows, consumerRecords(brands));
  assert.equal(JSON.stringify(brands), before);
  for (const row of rows.filter(isSelectable)) {
    assert.equal(row.displayHex, row.display.hex);
    assert.ok(row.displayComponents.length);
    assert.equal(row.display.calibrated, false);
    assert.equal(row.display.renderBaseColorHex, null);
  }
});

test("saved colors, including the earlier photo color and unknown IDs, stay unchanged after corrections", () => {
  const rows = consumerRecords(snapshot().brands);
  for (const finish of [
    { materialRef: "ref-elegoo-pla-basic-el-3df-p0768", colorHex: "#929399" },
    { materialRef: "ref-elegoo-pla-basic-el-3df-plb0810", colorHex: "#F4AF02" },
    { materialRef: "unknown-retained-material", colorHex: "#123456" },
  ]) assert.deepEqual(resolveAppliedFinish(finish, rows), finish);
  assert.equal(resolveAppliedFinish({ materialRef: "ref-elegoo-pla-basic-el-3df-p0768" }, rows).colorHex, "#586D83");
});

test("the public baseline retains all IDs, source identity, package labels, observations and upstream references", () => {
  const baseline = JSON.parse(readFileSync(`${root}tests/fixtures/public-0.1.2.json`));
  const { brands } = snapshot();
  const rows = brands.flatMap(brand => brand.records).sort((a, b) => a.catalogOrder - b.catalogOrder);
  const digest = value => sha256(Buffer.from(JSON.stringify(value)));
  assert.equal(rows.length, baseline.registeredIds);
  assert.equal(digest(rows.map(row => baseline.identityFields.map(field => row[field] ?? null))), baseline.identitiesSha256);
  assert.equal(digest(rows.map(row => [row.id, row.displayObservation ?? { displayHex: row.displayHex, displayComponents: row.displayComponents ?? [], displaySource: row.displaySource, colorGroup: row.colorGroup ?? null }])), baseline.observationsSha256);
  assert.equal(digest(brands.map(brand => [brand.brand, brand.displayReferences])), baseline.referencesSha256);
  const inventory = brands.flatMap(brand => brand.productLines).sort((a, b) => a.catalogOrder - b.catalogOrder).map(row => {
    const { sourceSeries, ...observation } = row;
    if (sourceSeries !== undefined) observation.series = sourceSeries;
    return observation;
  });
  assert.equal(digest(inventory), baseline.inventorySha256);
  for (const [id, hex] of baseline.pendingCreality) {
    const row = rows.find(row => row.id === id);
    assert.equal(row.displayHex, hex);
    assert.equal(row.currentColorVerified, false);
  }
  assert.equal(baseline.pendingCreality.length, 36);
});

test("typed evidence and exact legacy adapters reject negative prose and recognize published values", () => {
  const photo = { kind: "manufacturer-swatch", components: ["#2C2D34"] };
  for (const text of ["No published manufacturer HEX found in captured first-party source", "not publisher numeric HEX"]) {
    assert.deepEqual(classifyDisplayEvidence({ displayHex: null, displaySource: text }, photo), { kind: "manufacturer-swatch", rank: 4 });
  }
  assert.deepEqual(classifyDisplayEvidence({ displayHex: "#383737", displaySource: "Manufacturer-published display reference" }), { kind: "published-display", rank: 1 });
});

test("flattened consumer output carries the winning source and all shared-display qualifications", () => {
  const { brands } = snapshot();
  const row = consumerRecords(brands).find(row => row.id === "ref-elegoo-pla-basic-el-3df-p0768");
  const definition = brands.find(brand => brand.brand === "Elegoo").displayColors.find(color => color.id === row.displayColorId);
  assert.equal(row.display.relationship, definition.relationship);
  assert.equal(row.display.selectionRule, definition.selectionRule);
  assert.deepEqual(row.display.conflictingObservations, definition.conflictingObservations ?? []);
  assert.equal(row.display.source.materialId, definition.sourceMaterialId);
  assert.match(row.display.source.recordSourceUrl, /^https:/);
  assert.ok(row.display.source.reference.imageSha256);
  assert.ok(row.display.source.reference.method);
  assert.equal(row.display.source.reviewedEvidence.kind, "maintainer-display");
  assert.match(row.display.source.reviewedEvidence.method, /not a published numeric HEX/);
  assert.notEqual(row.display.evidenceKind, "published-display");
});

test("validator rejects shared-color drift, cross-identity links and invented calibration claims", () => {
  for (const mutation of [
    brand => { brand.records.find(row => row.displayColorId).displayHex = "#123456"; },
    brand => { brand.displayColors[0].calibrated = true; },
    brand => { brand.displayColors[0].physicalEquivalence = "same-formula"; },
    brand => { brand.records.find(row => row.displayColorId).displayColorId = "unknown"; },
    brand => { brand.displayColors[0].sourceMaterialId = "unknown"; },
    brand => { brand.displayColors[0].sourceMaterialId = brand.displayColors[1].sourceMaterialId; },
  ]) {
    const brands = snapshot().brands;
    mutation(brands.find(brand => brand.displayColors.length));
    assert.throws(() => inspectBrands(brands), /shared display|physical color|display color|display source|another color/);
  }
});

test("rebuilding the display projection and manifest is byte-idempotent", () => {
  const before = snapshot();
  const bytes = new Map(Object.keys(before.manifest.files).map(file => [file, sha256(readFileSync(`${root}data/${file}`))]));
  const manifest = readFileSync(`${root}registry.json`, "utf8");
  const isolated = mkdtempSync(join(tmpdir(), "filament-colors-rebuild-"));
  try {
    cpSync(`${root}data`, join(isolated, "data"), { recursive: true });
    mkdirSync(join(isolated, "scripts"));
    for (const file of ["registry.mjs", "compatibility.mjs", "series.mjs", "colors.mjs", "build-display-colors.mjs", "update-manifest.mjs"]) copyFileSync(`${root}scripts/${file}`, join(isolated, "scripts", file));
    copyFileSync(`${root}registry.json`, join(isolated, "registry.json"));
    execFileSync(process.execPath, ["scripts/build-display-colors.mjs"], { cwd: isolated });
    execFileSync(process.execPath, ["scripts/update-manifest.mjs"], { cwd: isolated });
    for (const [file, digest] of bytes) assert.equal(sha256(readFileSync(`${isolated}/data/${file}`)), digest, file);
    assert.equal(readFileSync(`${isolated}/registry.json`, "utf8"), manifest);
    const brandPath = join(isolated, "data/brands/3d-fuel.json");
    const brand = JSON.parse(readFileSync(brandPath));
    const changed = brand.displayColors[0];
    Object.assign(changed, { components: ["#123456"], selectionMode: "reviewed", evidenceKind: "maintainer-display", reviewStatus: "reviewed-display-correction", checkedOn: "2026-10-29", selectionRule: "Explicit reviewed fixture decision", reviewedEvidence: { kind: "maintainer-display", sourceUrl: "https://example.com/reviewed-display", checkedOn: "2026-10-29", method: "Fixture review; no physical measurement" } });
    writeFileSync(brandPath, JSON.stringify(brand, null, 2) + "\n");
    execFileSync(process.execPath, ["scripts/build-display-colors.mjs"], { cwd: isolated });
    execFileSync(process.execPath, ["scripts/update-manifest.mjs"], { cwd: isolated });
    const rebuilt = JSON.parse(readFileSync(brandPath));
    const decision = rebuilt.displayColors.find(color => color.id === changed.id);
    assert.deepEqual(decision.components, ["#123456"]);
    assert.equal(decision.checkedOn, "2026-10-29");
    assert.equal(decision.selectionRule, "Explicit reviewed fixture decision");
    assert.deepEqual(decision.reviewedEvidence, changed.reviewedEvidence);
    for (const row of rebuilt.records.filter(row => row.displayColorId === changed.id)) assert.equal(row.displayHex, "#123456");
    const elegooPath = join(isolated, "data/brands/elegoo.json");
    const elegoo = JSON.parse(readFileSync(elegooPath));
    const white = elegoo.displayColors.find(color => color.productLine === "PLA Basic" && color.colorName === "White");
    white.selectionMode = "policy";
    delete white.reviewedEvidence;
    writeFileSync(elegooPath, JSON.stringify(elegoo, null, 2) + "\n");
    execFileSync(process.execPath, ["scripts/build-display-colors.mjs"], { cwd: isolated });
    execFileSync(process.execPath, ["scripts/update-manifest.mjs"], { cwd: isolated });
    const reverted = JSON.parse(readFileSync(elegooPath)).displayColors.find(color => color.id === white.id);
    assert.equal(reverted.selectionMode, "policy");
    assert.equal(reverted.evidenceKind, "manufacturer-swatch");
    assert.equal(reverted.reviewedEvidence, undefined);
    assert.notDeepEqual(reverted.components, white.components);
    const sunluPath = join(isolated, "data/brands/sunlu.json");
    const sunlu = JSON.parse(readFileSync(sunluPath));
    const reviewedColor = sunlu.displayColors.find(color => color.eligibleObservations);
    const history = reviewedColor.conflictingObservations;
    reviewedColor.selectionMode = "policy";
    delete reviewedColor.reviewedEvidence;
    const newObservation = sunlu.records.find(row => row.displayColorId === reviewedColor.id && !sunlu.displayReferenceReviews.some(review => review.materialId === row.id));
    newObservation.displayObservation.displayHex = "#123456";
    newObservation.displayObservation.displayComponents = ["#123456"];
    writeFileSync(sunluPath, JSON.stringify(sunlu, null, 2) + "\n");
    execFileSync(process.execPath, ["scripts/build-display-colors.mjs"], { cwd: isolated });
    const reviewedAgain = JSON.parse(readFileSync(sunluPath)).displayColors.find(color => color.id === reviewedColor.id);
    assert.equal(reviewedAgain.checkedOn, "2026-10-28");
    for (const item of history) assert.ok(reviewedAgain.conflictingObservations.some(next => JSON.stringify(next) === JSON.stringify(item)));
    assert.ok(reviewedAgain.conflictingObservations.some(item => item.materialId === newObservation.id && item.components[0] === "#123456"));
  } finally { rmSync(isolated, { recursive: true, force: true }); }
});
