# Screen colors, packaging and consumer resolution

This contract starts with catalog 0.2.0. It adds compatible fields to registry format 2 / brand format 1. The candidate is unreleased until a separately approved public release.

## Three separate meanings

- **Material `id`:** the existing source/product/package reference. Retain it forever, including every old `materialRef`. A source SKU, package or historical source ID is not a universal color identity.
- **`displayColorId`:** a stable shared **screen-display** identity within a brand, browsing series, polymer, color label and effects. Packaging variants can refer to one display. This is not proof of an identical formulation, batch, print profile or interchangeable product.
- **Applied `colorHex`:** the user's saved choice. It remains authoritative when reopening a design, even if the Registry corrects its current preview. A catalog update is not consent to repaint a design.

Brand `displayColors` defines the shared components and points to a `sourceMaterialId`. `relationship` distinguishes a shared product-page label from a weaker label-only grouping. `physicalEquivalence` is always `not-asserted`; do not use these groups to substitute printing materials. Unknown color labels remain separate rather than being merged as “unspecified.”

## Complete colors without a join

Every selectable record includes its complete effective `displayHex` and `displayComponents`, including multicolor components. `displayColorId` explains sharing; looking up a separate reference is no longer necessary to fill a swatch. Existing `sourceRgba`, source IDs, codes, labels, URLs and `sourceRecord` remain unchanged.

`displayObservation` retains the 0.1.2 record's original display fields and publisher grouping. Existing `displayReferences` remain byte-equivalent in parsed form, including original image URLs, hashes and methods. They are **observations**, not necessarily the winning current display. Resolve current provenance through the shared definition and its `sourceMaterialId`; do not label its components as the numeric output of a different observation.

Use the browser-safe module, shared by validation and export:

```js
import { consumerRecords, resolveAppliedFinish } from './scripts/colors.mjs';
const materials = consumerRecords(verifiedBrandSnapshots);
const currentChoice = materials.find(row => row.id === materialId);
// For a new, explicitly confirmed selection:
const newFinish = { materialRef: currentChoice.id, colorHex: currentChoice.displayHex };
// Reopening an existing finish retains its saved color, including unknown legacy IDs:
const reopened = resolveAppliedFinish(savedFinish, materials);
```

For legacy snapshots, `resolveDisplayColor(record, reference)` retains the exact precedence:

1. Clear + translucent uses `#F2F3F2` for the primary screen preview.
2. An explicit `reference.supersedesOriginal` uses its components.
3. Otherwise the primary is `record.displayHex`, then the first reference component.
4. Components come from a superseding reference, otherwise nonempty record components, otherwise reference components. Primary and components were historically distinct for Clear.

For 0.2.0 records, the shared definition supplies the effective primary/components and validation requires the flattened fields to agree. The validator also checks that the former consumer precedence still returns the same primary; old consumers cannot silently choose a different override. A missing definition is an error, not a guessed color.

## Choosing and reviewing a shared display

Run `node scripts/build-display-colors.mjs` after an evidence update. The deterministic preference is explicit superseding published RGB, other published RGB/preserved software palette or HEX workbook values, community/retained display evidence, then photo samples. Typed reference kinds and an exact allowlist of existing legacy source labels establish that classification; keyword matches in free prose never do. Equal-rank ties prefer independent-observation support, then original catalog order; repeated copies of one image do not get extra votes. Rebuilding an unchanged candidate produces identical bytes.

For a later reviewed correction, edit the definition's `components`, `sourceMaterialId`, `checkedOn` and `selectionRule`, set `selectionMode: reviewed`, and supply `reviewedEvidence` with a kind, public source URL, method and checked date. The generator preserves this explicit decision and flattens it onto its members. Do not edit frozen `displayObservation` to smuggle in a new source. `selectionMode: policy` explicitly opts back into automatic evidence selection; its date follows source observations. A correction that conflicts with a historical superseding reference needs an explicit reference/consumer review; validation must not silently paint around that disagreement.

Where observations disagree, the definition retains `conflictingObservations` and `reviewStatus: source-conflict-retained`. The selected screen value removes per-package display disagreement; it does **not** prove which value is physically correct. Label-only mappings and unresolved source conflicts remain visible review work, rather than being reported as verified product equivalence.

Reviewed spelling and package/refill labels use explicit per-brand `browsingAliases`; see [the mapping list and boundaries](SERIES-ALIASES.md). No fuzzy matching is applied at runtime. Source record series, package labels and material IDs are retained. Aliases affect browsing and shared screen labels, not print profiles or physical interchangeability. The targeted Elegoo corrections retain earlier catalog screen references after the wrong/shared Misty Blue image and contradictory Orange/black/white package photos were reviewed. `maintainer-display` and `reviewed-display-correction` explicitly identify those decisions; their HEX values are not newly published manufacturer specifications. No arbitrary photo brightening, white balance or claim of measured albedo is introduced.

## Photo / physically based rendering

Product photography contains illumination, shadows, exposure and white balance. A per-channel median does not remove them. This release has no calibrated material measurements: every definition says `calibrated: false`, `renderBaseColorHex: null`.

Consumers may offer an explicitly approximate material preview using the screen reference. They must not call it physical color matching or silently reinterpret a photo sample as measured albedo. A calibrated renderer should require a separately supported measurement instead of inventing one. This Registry PR does not change any deployed website renderer; its later adapter must use this distinction.

## Consumer export and licenses

`node scripts/export-consumer.mjs /path/to/catalog.json` includes one unique entry per brand/canonical series in its `series` index (see [series naming](SERIES-ALIASES.md#naming-and-the-unique-series-index)) and exports all retained IDs with self-contained effective colors, relationship/selection/conflict qualifications, and the chosen material's source URL, original observation/reference (including image hashes/methods where present) and any reviewed evidence. A retained photo reference remains an observation; for a maintainer correction it is not the numeric source of the selected HEX. It does not fetch data or require an SDK. Distribute applicable `LICENSE`, `THIRD_PARTY_NOTICES.md`, upstream MIT/AGPL notices and corresponding palette JSON sources alongside copied snapshots. Exporting/flattening does not erase upstream obligations or make the entire collection “pure MIT.”

The compatibility fingerprints in `tests/fixtures/public-0.1.2.json` derive from the exact public commit and make the test suite portable in exports without Git history. Historical ID/source/display observations remain protected while new reviewed decisions carry their own evidence. Git-based `check-update` remains a separate checkout/CI check against the adopted baseline.

## Release and migration

0.2.0 is a MINOR release because shared display identities and browsing groups are added. All 10,357 material IDs and 9,991 selectable records remain. Existing saved `materialRef`/`colorHex` snapshots are not rewritten. Published display IDs also remain stable on later compatible updates; a group merge needs explicit review rather than regeneration.

Consumers adopt an immutable release through their own pin-update PR, saved-design compatibility checks, local QA and separate deployment authorization. Preserve production geometry Assets. For later corrections prepared privately, transfer only the reviewed patch onto current public main; never merge private history, audit captures or correspondence into the public repository.

## Evidence review lifecycle (0.2.1 candidate)

A review records what the source supports for a screen preview; it does not establish physical equivalence or calibrated albedo. Keep `displayColorId` stable and retain every historical observation, even when evidence is rejected or superseded.

- `displayReferenceReviews` records a rejected image observation by its original SHA-256, reason, and replacement observation. Rejection is tied to that exact capture; do not delete or rewrite the original. The replacement is a newly reviewed observation and is not automatically the selected display value.
- `evidenceReview.status` summarizes the group's current disposition: `resolved-display-difference`, `source-error-corrected`, `pending-upstream-verification`, or `pending-variant-scope`. Include checked date, primary source URLs, finding and method. Pending is a valid outcome.
- `eligibleObservations` contains only evidence allowed to participate in current display selection. `conflictingObservations` is an append-only historical record of disagreements, including observations excluded from selection. Regeneration appends unique new observation tuples while preserving earlier entries. Never promote an excluded observation by editing history; add a new eligible observation with traceable evidence.

Before resolving a difference, bind evidence to the exact manufacturer product, SKU/variant, refill or spool, generation/formula, effect and color name. Prefer current manufacturer numeric values or exact product controls over generic/no-variant controls. Treat a photo ROI as an uncalibrated screen observation only; never invent a color measurement or infer albedo. Preserve old display IDs and saved `colorHex` snapshots. Change a new-selection default only when the evidence supports that exact product/display scope.

The 0.2.1 candidate review covered 158 groups: 92 resolved display-reference differences (69 FormFutura exact-product controls over generic controls, 20 Atomic Filament pages repeating community-sourced indicative HEX, and 3 eSUN current White references); 52 remain pending upstream (39 Polymaker, including contradictory literal PC-ABS White workbook rows, and 13 community references); and 12 remain pending variant scope (11 Polymaker, including old/new formula and Glow/UV distinctions, and one Snapmaker RFID distinction). Two SUNLU spool-flange ROIs were rejected and replaced with filament-winding observations. These outcomes do not mean every difference is resolved. Candidate 0.2.1 leaves all 10,357 IDs, 9,991 selectable references and 7,461 display IDs intact; only four eSUN rows change their default new-selection HEX from `#E3E4D4` to `#F6F6F6`. Existing saved finishes are unchanged.
