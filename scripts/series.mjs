/** Browser-safe naming rules. Never infer a grade/formula alias from these tokens. */
export function normalizeSeriesName(value) {
  return value.trim().replace(/\s+/g, " ")
    // The final boundary is essential: PET-GF15 is PET + glass fiber, not PETG.
    .replace(/\b(r?)(?:PET[ -]+G|PETG)\b/gi, (_, recycled) => `${recycled ? "r" : ""}PETG`)
    .replace(/\b(r?)(PLA|ABS)\b/gi, (_, recycled, polymer) => `${recycled ? "r" : ""}${polymer.toUpperCase()}`)
    .replace(/\b(r?(?:PLA|PETG|ABS))\s+(?:plus\b|\+)/gi, "$1+");
}

/** Review key only: token order never establishes product/formula equivalence. */
export function seriesFingerprint(series) {
  return normalizeSeriesName(series).replace(/\s+filaments?$/i, "").toLowerCase().match(/[a-z0-9]+|\+/g)?.sort().join(" ") ?? "";
}

export function isSelectable(row) {
  return row.selectable && row.lifecycle !== "discontinued" && (!row.maintenance || row.maintenance.state === "active");
}

/** One entry per brand/canonical series; package IDs remain members, not series. */
export function buildSeriesIndex(brands) {
  return brands.flatMap(brand => {
    const aliases = new Map(brand.browsingAliases.map(row => [row.sourceSeries, row.browsingSeries]));
    const series = new Map();
    const entry = source => {
      const name = aliases.get(source) ?? source;
      if (!series.has(name)) series.set(name, { brand: brand.brand, series: name, sourceSeries: [], materialIds: [], selectableMaterialIds: [] });
      const result = series.get(name);
      if (!result.sourceSeries.includes(source)) result.sourceSeries.push(source);
      return result;
    };
    for (const row of brand.productLines) entry(row.series);
    for (const row of brand.records) {
      const result = entry(row.productLine);
      result.materialIds.push(row.id);
      if (isSelectable(row)) result.selectableMaterialIds.push(row.id);
    }
    return [...series.values()];
  });
}
