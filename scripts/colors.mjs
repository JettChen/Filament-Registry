// Exact adapters for the immutable legacy schema. New observations use typed reference.kind;
// free prose (especially "No published HEX") must never manufacture numeric authority.
const legacyPublishedLabels = new Set([
  "Manufacturer-published display reference", "Manufacturer-published printed-swatch HEX",
  "Official Polymaker HEX/TD workbook", "Official current product-page literal HEX", "Official product-page literal HEX",
  "SUNLU-published Color Code Hex", "Manufacturer-published regional Color Code HEX", "Manufacturer-published display HEX",
  "Official Anycubic product feed literal RGB", "Official manufacturer color swatch HEX", "Official Bambu Studio RGB projection",
  "Manufacturer-published software palette HEX", "Manufacturer-published variant display HEX (Snapmaker official store)",
  "Official Snapmaker color option publishes literal RGB hex", "Snapmaker official global color option literal HEX",
]);

export function classifyDisplayEvidence(row, reference) {
  const observed = row.displayObservation ?? row;
  const published = reference?.kind === "manufacturer-literal" || Boolean(row.sourceRecord)
    || Boolean(observed.displayHex && legacyPublishedLabels.has(observed.displaySource));
  return { kind: published ? "published-display" : reference?.kind ?? "retained-display",
    rank: published && reference?.supersedesOriginal ? 0 : published ? 1 : reference?.kind === "community" ? 2 : !reference ? 3 : 4 };
}

/** Browser-safe display contract. Screen RGB is never a measured material albedo. */
export function resolveDisplayColor(row, reference, definition) {
  if (row.displayColorId && !definition) throw new Error(`Unknown display color: ${row.id}`);
  const legacyComponents = reference?.supersedesOriginal ? reference.components
    : row.displayComponents?.length ? row.displayComponents : reference?.components ?? [];
  const hex = definition?.components[0] ?? (row.effects.includes("clear") && row.effects.includes("translucent") ? "#F2F3F2"
    : reference?.supersedesOriginal ? reference.components[0] : row.displayHex ?? reference?.components[0] ?? null);
  return {
    hex,
    components: [...(definition?.components ?? legacyComponents)],
    displayColorId: definition?.id ?? null,
    sourceMaterialId: definition?.sourceMaterialId ?? row.id,
    evidenceKind: definition?.evidenceKind ?? reference?.kind ?? "retained-display",
    reviewStatus: definition?.reviewStatus ?? "legacy-unreviewed",
    relationship: definition?.relationship ?? "legacy-unreviewed",
    selectionRule: definition?.selectionRule ?? "Legacy primary/components precedence; source observations remain separate.",
    conflictingObservations: definition?.conflictingObservations?.map(item => ({ ...item, components: [...item.components] })) ?? [],
    calibrated: false,
    renderBaseColorHex: null,
    physicalEquivalence: "not-asserted",
  };
}

/** A self-contained projection: clients do not need fallback joins or validator imports. */
export function consumerRecords(brands) {
  return brands.flatMap(brand => {
    const references = new Map(brand.displayReferences.map(reference => [reference.id, reference]));
    const records = new Map(brand.records.map(record => [record.id, record]));
    const definitions = new Map((brand.displayColors ?? []).map(color => [color.id, color]));
    const aliases = new Map(brand.browsingAliases.map(alias => [alias.sourceSeries, alias.browsingSeries]));
    return brand.records.map(row => {
      const display = resolveDisplayColor(row, references.get(row.id), definitions.get(row.displayColorId));
      const source = records.get(display.sourceMaterialId);
      return { ...row, browsingSeries: aliases.get(row.productLine) ?? row.productLine,
        displayHex: display.hex, displayComponents: display.components, display: { ...display,
          source: { materialId: source.id, recordSourceUrl: source.sourceUrl,
            observation: source.displayObservation ?? { displayHex: source.displayHex, displayComponents: source.displayComponents ?? [], displaySource: source.displaySource },
            reference: references.get(source.id) ?? null,
            reviewedEvidence: definitions.get(row.displayColorId)?.reviewedEvidence ?? null } } };
    });
  }).sort((left, right) => left.catalogOrder - right.catalogOrder);
}

/** Reopening a saved design is not a request to repaint it from the current catalog. */
export function resolveAppliedFinish(finish, records) {
  if (/^#[a-f\d]{6}$/i.test(finish.colorHex ?? "")) return { ...finish };
  const record = records.find(row => row.id === finish.materialRef);
  return record?.displayHex ? { ...finish, colorHex: record.displayHex } : { ...finish };
}
