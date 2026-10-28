import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { inspectBrands, sha256, validateRegistry } from "./registry.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const brands = [];
const files = {};
for (const name of readdirSync(join(root, "data/brands")).sort()) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name)) throw new Error(`Invalid brand filename: ${name}`);
  const bytes = readFileSync(join(root, "data/brands", name));
  const brand = JSON.parse(bytes.toString("utf8"));
  brands.push(brand);
  files[`brands/${name}`] = { brand: brand.brand, sha256: sha256(bytes), bytes: bytes.length };
}
manifest.counts = inspectBrands(brands);
manifest.files = files;
writeFileSync(join(root, "registry.json"), `${JSON.stringify(manifest, null, 2)}\n`);
validateRegistry(root);
console.log(`Updated and validated manifest for ${brands.length} brands`);
