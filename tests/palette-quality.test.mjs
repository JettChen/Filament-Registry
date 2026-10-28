import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { isSelectable } from "../scripts/compatibility.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const brands = readdirSync(join(root, "data/brands")).map(file => JSON.parse(readFileSync(join(root, "data/brands", file))));
const elegoo = brands.find(brand => brand.brand === "Elegoo");
const refs = new Map(brands.flatMap(brand => brand.displayReferences).map(row => [row.id, row]));
const selected = brands.flatMap(brand => brand.records).filter(isSelectable);
const actual = row => row.effects.includes("clear") && row.effects.includes("translucent") ? "#F2F3F2"
  : refs.get(row.id)?.supersedesOriginal ? refs.get(row.id).components[0] : row.displayHex ?? refs.get(row.id)?.components[0];

test("Misty Blue no longer inherits the Grey photo, and Orange retains the reviewed orange display", () => {
  const blue = elegoo.records.find(row => row.id === "ref-elegoo-pla-basic-el-3df-p0768");
  const grey = elegoo.records.find(row => row.id === "ref-elegoo-pla-basic-el-pla-n013");
  assert.notEqual(actual(blue), actual(grey));
  assert.equal(actual(blue), "#586D83");
  assert.equal(actual(elegoo.records.find(row => row.id === "ref-elegoo-pla-basic-el-3df-plb0810")), "#FD7C18");
});

test("each selectable material contains its complete effective display without a fallback join", () => {
  assert.equal(selected.length, 9991);
  for (const row of selected) {
    assert.match(row.displayHex ?? "", /^#[0-9A-F]{6}$/);
    assert.equal(row.displayHex, actual(row), row.id);
    assert.ok(row.displayComponents?.length, row.id);
    assert.equal(row.displayComponents[0], row.displayHex, row.id);
    assert.ok(row.displayColorId, row.id);
  }
});

test("the three retained PLA Basic Grey identities share one display without losing package IDs", () => {
  const grey = elegoo.records.filter(row => isSelectable(row) && row.productLine === "PLA Basic" && row.colorName === "Grey");
  assert.equal(grey.length, 3);
  assert.equal(new Set(grey.map(row => row.id)).size, 3);
  assert.equal(new Set(grey.map(actual)).size, 1);
  assert.equal(new Set(grey.map(row => row.displayColorId)).size, 1);
});

test("Elegoo browsing aliases resolve both plus spellings", () => {
  for (const [sourceSeries, browsingSeries] of [["PLA Plus", "PLA+"], ["Rapid PLA Plus", "Rapid PLA+"]]) {
    assert.ok(elegoo.browsingAliases.some(alias => alias.sourceSeries === sourceSeries && alias.browsingSeries === browsingSeries));
  }
});

test("a negative published-HEX description cannot promote a product photo above the numeric reference", () => {
  const row = selected.find(row => row.id === "ref-3d-fuel-pro-petg-e1501");
  assert.equal(actual(row), "#383737");
});

test("shared display definitions are explicit about their scope and every member resolves consistently", () => {
  for (const brand of brands) {
    assert.ok(Array.isArray(brand.displayColors), brand.brand);
    const definitions = new Map(brand.displayColors.map(color => [color.id, color]));
    for (const row of brand.records.filter(isSelectable)) {
      const color = definitions.get(row.displayColorId);
      assert.ok(color, row.id);
      assert.deepEqual(row.displayComponents, color.components, row.id);
      assert.equal(color.calibrated, false);
      assert.equal(color.renderBaseColorHex, null);
      assert.equal(color.physicalEquivalence, "not-asserted");
    }
  }
});
