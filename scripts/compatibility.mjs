import { createHash } from "node:crypto";

/** Calendar labels are accepted only as these two documented bootstrap baselines. */
const bootstrapVersions = { "2026.10.27.1": "0.0.0", "2026.10.27.2": "0.0.0" };
export function parseVersion(value, { legacy = false } = {}) {
  const version = legacy ? bootstrapVersions[value] ?? value : value;
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(version);
  if (!match) throw new Error(`Invalid SemVer catalogVersion: ${value}`);
  const parts = match.slice(1, 4).map(Number);
  const prerelease = match[4]?.split(".") ?? [];
  if (parts.some(part => !Number.isSafeInteger(part)) || prerelease.some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith("0"))) throw new Error(`Invalid SemVer catalogVersion: ${value}`);
  return { major: parts[0], minor: parts[1], patch: parts[2], prerelease };
}

export function compareVersions(left, right) {
  for (const key of ["major", "minor", "patch"]) if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1;
  if (!left.prerelease.length || !right.prerelease.length) return left.prerelease.length === right.prerelease.length ? 0 : left.prerelease.length ? -1 : 1;
  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index++) {
    const a = left.prerelease[index]; const b = right.prerelease[index];
    if (a === b) continue;
    if (a === undefined || b === undefined) return a === undefined ? -1 : 1;
    const numericA = /^\d+$/.test(a); const numericB = /^\d+$/.test(b);
    if (numericA && numericB) return BigInt(a) > BigInt(b) ? 1 : -1;
    if (numericA !== numericB) return numericA ? -1 : 1;
    return a > b ? 1 : -1;
  }
  return 0;
}

export function isSelectable(row) {
  return row.selectable && row.lifecycle !== "discontinued" && (!row.maintenance || row.maintenance.state === "active");
}

const fingerprint = manifest => createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
/** Published IDs survive retirement, filtering, corrections and even schema migrations. */
export function checkUpdate(previous, current) {
  const before = parseVersion(previous.manifest.catalogVersion, { legacy: true });
  const after = parseVersion(current.manifest.catalogVersion);
  const changed = fingerprint(previous.manifest) !== fingerprint(current.manifest);
  if (changed && compareVersions(after, before) <= 0) throw new Error("Changed catalog content requires a higher catalogVersion");
  if (previous.manifest.format !== current.manifest.format && after.major <= before.major && !(before.major === 0 && after.major === 0 && after.minor > before.minor)) throw new Error("A schema change requires a MAJOR increase, or a new MINOR during 0.x development");
  const nextById = new Map(current.records.map(row => [row.id, row]));
  let membershipChanged = previous.records.length !== current.records.length || ["brands", "inventoryProductLines", "browsingLines"].some(key => previous.manifest.counts?.[key] !== current.manifest.counts?.[key]);
  for (const row of previous.records) {
    const next = nextById.get(row.id);
    if (!next) throw new Error(`Published ID removed: ${row.id}; retain a retired record instead`);
    for (const field of ["brand", "polymer", "codeKind"]) if (next[field] !== row[field]) throw new Error(`Published identity changed (${field}): ${row.id}; create a new ID instead`);
    if (row.sourceCode !== null && next.sourceCode !== row.sourceCode) throw new Error(`Published identity changed (sourceCode): ${row.id}`);
    if (next.catalogOrder !== row.catalogOrder) throw new Error(`Published catalogOrder changed: ${row.id}`);
    if (row.lifecycle !== "discontinued" && next.lifecycle === "discontinued" && !next.maintenance?.sourceUrl) throw new Error(`Manufacturer discontinuation needs dated maintenance evidence: ${row.id}`);
    if (isSelectable(row) !== isSelectable(next) || (row.maintenance?.state ?? "active") !== (next.maintenance?.state ?? "active")) membershipChanged = true;
  }
  const samePrereleaseCore = before.prerelease.length && before.major === after.major && before.minor === after.minor && before.patch === after.patch;
  if (membershipChanged && after.major === before.major && after.minor <= before.minor && !samePrereleaseCore) throw new Error("Catalog additions, retirement or selection changes require a MINOR version increase");
  return { previousVersion: previous.manifest.catalogVersion, nextVersion: current.manifest.catalogVersion, retainedIds: previous.records.length, addedIds: current.records.length - previous.records.length };
}
