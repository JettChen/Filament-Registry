import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isSelectable } from "./compatibility.mjs";
import { resolveDisplayColor, classifyDisplayEvidence } from "./colors.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const normalize = value => value.trim().toLowerCase();
// Maintainer display decisions, not manufacturer numeric specifications or measured albedo.
// These retain the earlier catalog's screen references after the conflicting photos were reviewed.
const corrections = new Map([
  ["PLA Basic|Misty Blue", "#586D83"], ["PLA Basic|Orange", "#FD7C18"],
  ["PLA Basic|Grey", "#B2B3BF"], ["PLA Basic|White", "#F7F7F2"], ["PLA Basic|Black", "#000000"],
  ...["PLA", "PLA+", "Rapid PLA+", "PETG Pro", "Rapid PETG"].flatMap(line => [
    [`${line}|White`, "#FFFFFF"], [`${line}|Black`, "#000000"], [`${line}|Grey`, "#8F949B"],
  ]),
  ...["PLA", "PLA+", "Rapid PLA+", "Rapid PETG"].map(line => [`${line}|Orange`, "#FD7C18"]),
]);

function candidate(row, reference) {
  const observed = row.displayObservation ?? row;
  const effective = resolveDisplayColor({ ...row, displayColorId: undefined, ...observed }, reference);
  const evidence = classifyDisplayEvidence(row, reference);
  const components = row.effects.includes("clear") && row.effects.includes("translucent") ? ["#F2F3F2"]
    : effective.components.length ? effective.components : effective.hex ? [effective.hex] : [];
  return { row, components: components.map(value => value.toUpperCase()),
    evidenceKind: evidence.kind, rank: evidence.rank,
    observation: reference?.imageSha256 ?? reference?.sourceUrl ?? row.sourceUrl };
}

for (const file of readdirSync(`${root}data/brands`).sort()) {
  const path = `${root}data/brands/${file}`;
  const brand = JSON.parse(readFileSync(path));
  const aliases = new Map(brand.browsingAliases.map(alias => [alias.sourceSeries, alias.browsingSeries]));
  const references = new Map(brand.displayReferences.map(reference => [reference.id, reference]));
  const groups = new Map();
  for (const row of brand.records.filter(isSelectable)) {
    const series = aliases.get(row.productLine) ?? row.productLine;
    // This is an explicit display-label relationship. Never use it as a print/formula substitute.
    const key = JSON.stringify([brand.brand, normalize(series), normalize(row.polymer), row.colorName ? normalize(row.colorName) : row.id, [...row.effects].sort()]);
    if (!groups.has(key)) groups.set(key, { series, rows: [] });
    groups.get(key).rows.push(row);
  }
  const previous = new Map((brand.displayColors ?? []).map(color => [color.id, color]));
  const definitions = [];
  for (const [key, { series, rows }] of groups) {
    const known = [...new Set(rows.map(row => row.displayColorId).filter(Boolean))];
    if (known.length > 1) throw new Error(`Display group merge needs explicit review: ${brand.brand} ${series}`);
    const id = known[0] ?? `color-${file.slice(0, -5)}-${createHash("sha256").update(key).digest("hex").slice(0, 16)}`;
    const candidates = rows.map(row => candidate(row, references.get(row.id)));
    const votes = new Map();
    const seen = new Set();
    for (const item of candidates) {
      const value = JSON.stringify(item.components);
      const observation = `${item.rank}|${item.observation}|${value}`;
      if (!seen.has(observation)) votes.set(`${item.rank}|${value}`, (votes.get(`${item.rank}|${value}`) ?? 0) + 1);
      seen.add(observation);
    }
    candidates.sort((a, b) => a.rank - b.rank
      || (votes.get(`${b.rank}|${JSON.stringify(b.components)}`) ?? 0) - (votes.get(`${a.rank}|${JSON.stringify(a.components)}`) ?? 0)
      || a.row.catalogOrder - b.row.catalogOrder);
    const chosen = candidates[0];
    const reviewed = previous.get(id)?.selectionMode === "reviewed" ? previous.get(id) : null;
    if (reviewed && !rows.some(row => row.id === reviewed.sourceMaterialId)) throw new Error(`Reviewed display source no longer belongs to its group: ${id}`);
    const correction = brand.brand === "Elegoo" && !previous.get(id)?.selectionMode ? corrections.get(`${series}|${rows[0].colorName}`) : undefined;
    const components = reviewed?.components ?? (correction ? [correction] : chosen.components);
    if (!components.length) throw new Error(`No display for ${id}`);
    const distinct = [...new Set(candidates.map(item => JSON.stringify(item.components)))];
    const pages = new Set(rows.map(row => row.sourceUrl.split("?")[0].split("#")[0]));
    const definition = { id, productLine: series, colorName: rows[0].colorName, polymer: rows[0].polymer, effects: [...rows[0].effects], components,
      checkedOn: reviewed?.checkedOn ?? (correction ? "2026-10-28" : [...rows.map(row => row.checkedOn), ...rows.map(row => references.get(row.id)?.checkedOn ?? row.checkedOn)].sort().at(-1)),
      selectionMode: reviewed || correction ? "reviewed" : "policy",
      sourceMaterialId: reviewed?.sourceMaterialId ?? chosen.row.id, evidenceKind: reviewed?.evidenceKind ?? (correction ? "maintainer-display" : chosen.evidenceKind),
      relationship: pages.size === 1 ? "same-product-page-label" : "label-only",
      reviewStatus: reviewed?.reviewStatus ?? (correction ? "reviewed-display-correction" : distinct.length > 1 ? "source-conflict-retained" : chosen.rank >= 4 ? "image-reference-only" : "screen-reference-only"),
      calibrated: false, renderBaseColorHex: null, physicalEquivalence: "not-asserted",
      selectionRule: reviewed?.selectionRule ?? (correction ? "Retain the earlier catalog screen reference after reviewing conflicting official variant photos; not a manufacturer numeric value."
        : "Prefer explicit published RGB, then community/retained display evidence, then image samples. Equal-rank ties use independent-observation support, then catalog order. Conflicts remain disclosed; no physical equivalence is inferred."),
      ...(reviewed?.reviewedEvidence ? { reviewedEvidence: reviewed.reviewedEvidence } : correction ? { reviewedEvidence: {
        kind: "maintainer-display", sourceUrl: chosen.row.sourceUrl, checkedOn: "2026-10-28",
        method: "Retained earlier screen reference after reviewing contradictory product photographs. The linked page identifies the product, not a published numeric HEX or calibrated measurement.",
      } } : {}),
      ...(distinct.length > 1 ? { conflictingObservations: candidates.map(item => ({ materialId: item.row.id, components: item.components })) } : {}),
    };
    if (previous.has(id) && previous.get(id).physicalEquivalence !== "not-asserted") throw new Error(`Unexpected physical identity claim: ${id}`);
    definitions.push(definition);
    for (const row of rows) {
      if (!row.displayObservation) row.displayObservation = { displayHex: row.displayHex, displayComponents: row.displayComponents ?? [], displaySource: row.displaySource, colorGroup: row.colorGroup ?? null };
      row.displayColorId = id;
      row.colorGroup = id;
      row.displayHex = components[0];
      row.displayComponents = [...components];
      row.displaySource = `Shared screen reference · ${definition.evidenceKind} · not calibrated`;
    }
  }
  // Preserve definitions whose material is later retired: their IDs remain resolvable.
  brand.displayColors = [...definitions, ...[...previous.values()].filter(color => !definitions.some(next => next.id === color.id))];
  writeFileSync(path, `${JSON.stringify(brand, null, 2)}\n`);
}
console.log("Compiled explicit shared display colors; material IDs and source observations retained.");
