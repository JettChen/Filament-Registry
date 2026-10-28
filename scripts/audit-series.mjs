import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { normalizeSeriesName, seriesFingerprint } from "./series.mjs";
export { seriesFingerprint } from "./series.mjs";

// Candidate detection only. Never strip grade, speed, generation, diameter or package
// tokens, and never infer product equivalence from a shared category/product URL.

export function auditSeries(brands) {
  const candidates = [];
  const noncanonical = [];
  let sourceSeries = 0;
  let canonicalSeries = 0;
  let aliases = 0;
  for (const brand of brands) {
    const map = new Map(brand.browsingAliases.map(row => [row.sourceSeries, row.browsingSeries]));
    const sources = new Set([...brand.records.map(row => row.productLine), ...brand.productLines.map(row => row.series)]);
    const canonical = new Set([...sources].map(series => map.get(series) ?? series));
    sourceSeries += sources.size;
    canonicalSeries += canonical.size;
    aliases += map.size;
    const groups = new Map();
    for (const series of canonical) {
      if (series !== normalizeSeriesName(series)) noncanonical.push({ brand: brand.brand, series, canonical: normalizeSeriesName(series) });
      const key = seriesFingerprint(series);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(series);
    }
    for (const series of groups.values()) if (series.length > 1) candidates.push({ brand: brand.brand, series: series.sort() });
  }
  return { brands: brands.length, sourceSeries, canonicalSeries, aliases, candidates, noncanonical };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const brands = readdirSync(join(root, "data/brands")).filter(file => file.endsWith(".json"))
    .map(file => JSON.parse(readFileSync(join(root, "data/brands", file))));
  console.log(JSON.stringify(auditSeries(brands), null, 2));
}
