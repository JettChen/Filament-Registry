import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVersion, compareVersions, checkUpdate } from "../scripts/compatibility.mjs";

const row = () => ({ id: "brand-pla-red", brand: "Brand", polymer: "PLA", codeKind: "sku", sourceCode: "RED-1", selectable: true, catalogOrder: 0 });
const snapshot = (version, records = [row()], hash = "a") => ({ manifest: { catalogVersion: version, format: "ussa-filament-registry/2", files: { brand: hash } }, records });

test("accepts SemVer and orders prereleases numerically", () => {
  for (const value of ["2.0.0", "2.1.0-rc.1", "2.0.1+audit.1"]) assert.ok(parseVersion(value));
  for (const value of ["2026.10.27.2", "v2.0.0", "02.0.0", "2.0.0-rc.01"]) assert.throws(() => parseVersion(value), /SemVer/);
  assert.equal(compareVersions(parseVersion("2.0.0-rc.10"), parseVersion("2.0.0-rc.2")), 1);
  assert.equal(compareVersions(parseVersion("2.0.0"), parseVersion("2.0.0-rc.10")), 1);
  assert.equal(compareVersions(parseVersion("2.0.0+1"), parseVersion("2.0.0+2")), 0);
});

test("allows a PATCH correction but rejects changed content under the same version", () => {
  assert.ok(checkUpdate(snapshot("2.0.0"), snapshot("2.0.1", [row()], "b")));
  assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.0.0", [row()], "b")), /higher catalogVersion/);
});

test("requires MINOR for additions and withdrawal while retaining the old identity", () => {
  const added = { ...row(), id: "brand-pla-blue", sourceCode: "BLUE-1", catalogOrder: 1 };
  assert.ok(checkUpdate(snapshot("2.0.0"), snapshot("2.1.0", [row(), added])));
  assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.0.1", [row(), added])), /MINOR/);
  assert.ok(checkUpdate(snapshot("2.0.0-rc.1"), snapshot("2.0.0", [row(), added])));
  const retired = { ...row(), maintenance: { state: "retired", changedOn: "2026-10-27", reason: "Removed from new selection" } };
  assert.ok(checkUpdate(snapshot("2.0.0"), snapshot("2.1.0", [retired])));
  assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.0.1", [retired])), /MINOR/);
});

test("rejects physical removal, identity reuse and reordered published IDs", () => {
  assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.1.0", [])), /Published ID removed/);
  for (const patch of [{ polymer: "ABS" }, { sourceCode: "ANOTHER-SPOOL" }, { brand: "Other" }, { catalogOrder: 1 }]) {
    assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.1.0", [{ ...row(), ...patch }])), /Published/);
  }
});

test("requires evidence for manufacturer discontinuation and MAJOR for schema changes", () => {
  assert.throws(() => checkUpdate(snapshot("2.0.0"), snapshot("2.1.0", [{ ...row(), lifecycle: "discontinued" }])), /evidence/);
  const changed = snapshot("2.1.0"); changed.manifest.format = "ussa-filament-registry/3";
  assert.throws(() => checkUpdate(snapshot("2.0.0"), changed), /MAJOR/);
  changed.manifest.catalogVersion = "3.0.0";
  assert.ok(checkUpdate(snapshot("2.0.0"), changed));
});
