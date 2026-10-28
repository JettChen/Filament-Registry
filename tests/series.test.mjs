import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { inspectBrands } from "../scripts/registry.mjs";
import { buildSeriesIndex, normalizeSeriesName } from "../scripts/series.mjs";
import { auditSeries, seriesFingerprint } from "../scripts/audit-series.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const brands = readdirSync(join(root, "data/brands")).map(file => JSON.parse(readFileSync(join(root, "data/brands", file))));
const canonical = (name, series) => brands.find(brand => brand.brand === name).browsingAliases.find(alias => alias.sourceSeries === series)?.browsingSeries ?? series;

test("every brand's record and inventory series participates in the spelling audit", () => {
  const result = auditSeries(brands);
  assert.equal(result.brands, 27);
  assert.equal(result.aliases, 74);
  assert.equal(result.sourceSeries, 944);
  assert.equal(result.canonicalSeries, 882);
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.noncanonical, []);
  assert.equal(seriesFingerprint("Rapid PLA Plus"), seriesFingerprint("PLA+ Rapid"));
});

test("reviewed spelling and packaging aliases point directly to a canonical series", () => {
  for (const [brand, source, target] of [
    ["Spectrum", "SILK PLA", "PLA SILK"], ["Spectrum", "Premium PET-G", "PETG Premium"],
    ["Spectrum", "PLA  Nature", "PLA Nature"], ["SUNLU", "Matte PLA", "PLA Matte"],
    ["SUNLU", "Matte PLA Refill", "PLA Matte"], ["eSUN", "PLA+5KG", "PLA+"],
    ["Anycubic", "PLA Basic Refill", "PLA Basic"], ["AzureFilm", "Refill PLA", "PLA Original"],
    ["OVERTURE", "High Speed PETG Refill", "High Speed PETG"], ["HATCHBOX", "PLA Refill", "PLA"],
    ["Creality", "CR-PETG", "CR PETG"], ["Recreus", "PET-G CF", "PETG CF"],
    ["Proto-pasta", "PLA basics", "PLA Basics"],
    ["Elegoo", "PLA (RFID) emoji Brand Edition", "PLA (RFID) emoji® Brand Edition"],
  ]) {
    assert.equal(canonical(brand, source), target);
    assert.equal(canonical(brand, target), target);
  }
  for (const brand of brands) for (const alias of brand.browsingAliases.filter(row => row.scope)) {
    assert.equal(alias.scope, "browsing-only");
    assert.ok(["spelling", "packaging"].includes(alias.kind));
    assert.match(alias.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(alias.sourceUrls.length);
    assert.ok(alias.sourceUrls.every(url => url.startsWith("https://")));
  }
});

test("lookalike names retain meaningful formula, grade, generation, RFID and diameter distinctions", () => {
  for (const [brand, left, right] of [
    ["Polymaker", "PolyLite PLA Pro", "Polymaker PLA Pro"],
    ["Polymaker", "PolyLite PLA", "Panchroma Basic PLA"],
    ["SUNLU", "PLA+", "PLA+ 2.0"], ["SUNLU", "High Speed Matte PLA", "Matte PLA"],
    ["Elegoo", "PETG", "RAPID PETG"], ["Creality", "Hyper PLA", "Hyper PLA RFID"],
    ["HATCHBOX", "PLA", "PLA 3.00mm"],
    ["FormFutura", "Volcano PLA", "Volcano PLA 150C"],
    ["Prusament", "PLA Recycled", "rPLA"],
  ]) {
    const data = brands.find(row => row.brand === brand);
    const names = new Set([...data.records.map(row => row.productLine), ...data.productLines.map(row => row.series)]);
    assert.ok(names.has(left) && names.has(right), `${brand}: fixture must name real series`);
    assert.notEqual(canonical(brand, left), canonical(brand, right));
    assert.notEqual(seriesFingerprint(left), seriesFingerprint(right));
  }
});

test("new aliases cannot evade provenance validation by removing review metadata", () => {
  const changed = structuredClone(brands);
  const alias = changed.find(brand => brand.brand === "Elegoo").browsingAliases.find(row => row.sourceSeries === "PLA Plus");
  for (const field of ["scope", "kind", "checkedOn", "reason", "sourceUrls"]) delete alias[field];
  assert.throws(() => inspectBrands(changed), /browsing alias review/);
});

test("generic material tokens have one typography while PET glass fiber remains distinct", () => {
  for (const [input, expected] of [
    [" pla ", "PLA"], ["pet-g", "PETG"], ["PET G", "PETG"], ["Abs Plus", "ABS+"],
    ["PLA Plus", "PLA+"], ["PETG +", "PETG+"], ["rpet-g", "rPETG"],
    ["PET-G CF", "PETG CF"], ["PLA  Matte", "PLA Matte"],
    ["PET-GF", "PET-GF"], ["Fiberon PET-GF15", "Fiberon PET-GF15"],
    ["PETG-GF15", "PETG-GF15"], ["ABS Plus – S1", "ABS+ – S1"],
  ]) {
    assert.equal(normalizeSeriesName(input), expected);
    assert.equal(normalizeSeriesName(expected), expected);
  }
});

test("the consumer series index has one entry per canonical series and retains every package ID once", () => {
  const index = buildSeriesIndex(brands);
  assert.equal(index.length, 882);
  assert.equal(new Set(index.map(row => `${row.brand}\0${row.series}`)).size, index.length);
  assert.equal(index.filter(row => row.selectableMaterialIds.length).length, 851);
  const materials = index.flatMap(row => row.materialIds);
  assert.equal(materials.length, 10357);
  assert.equal(new Set(materials).size, materials.length);
  assert.equal(index.flatMap(row => row.selectableMaterialIds).length, 9991);
  for (const entry of index) {
    assert.equal(entry.series, normalizeSeriesName(entry.series));
    for (const source of entry.sourceSeries) assert.equal(canonical(entry.brand, source), entry.series);
  }
});

test("removing a generic-material normalization alias makes validation fail", () => {
  const changed = structuredClone(brands);
  const brand = changed.find(row => row.brand === "Spectrum");
  brand.browsingAliases = brand.browsingAliases.filter(row => row.sourceSeries !== "PET-G Premium");
  assert.throws(() => inspectBrands(changed), /Noncanonical material series/);
});

test("a token-order duplicate cannot reappear as another standalone series", () => {
  const changed = structuredClone(brands);
  const brand = changed.find(row => row.brand === "Spectrum");
  brand.browsingAliases = brand.browsingAliases.filter(row => row.sourceSeries !== "SILK PLA");
  assert.throws(() => inspectBrands(changed), /duplicate canonical series/);
});

test("Anycubic's inventory and Filament-suffixed product labels share one canonical series", () => {
  const index = buildSeriesIndex(brands).filter(row => row.brand === "Anycubic");
  for (const polymer of ["PETG", "ASA", "ABS", "PC"]) {
    assert.equal(canonical("Anycubic", `${polymer} Filament`), polymer);
    const entries = index.filter(row => [polymer, `${polymer} Filament`].includes(row.series));
    assert.equal(entries.length, 1);
    assert.ok(entries[0].selectableMaterialIds.length);
  }
  assert.equal(canonical("Anycubic", "PETG Refill"), "PETG");
  const changed = structuredClone(brands);
  const brand = changed.find(row => row.brand === "Anycubic");
  brand.browsingAliases = brand.browsingAliases.filter(row => row.sourceSeries !== "PETG Filament");
  assert.throws(() => inspectBrands(changed), /duplicate canonical series/);
});
