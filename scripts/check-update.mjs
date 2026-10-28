import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRegistry } from "./registry.mjs";
import { checkUpdate } from "./compatibility.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.argv[2];
if (!base || !/^[a-zA-Z0-9_./-]+$/.test(base) || base.startsWith("-")) throw new Error("Usage: node scripts/check-update.mjs <previous Git ref>");
const read = path => JSON.parse(execFileSync("git", ["show", `${base}:${path}`], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
const manifest = read("registry.json");
let records;
if (manifest.format === "ussa-filament-registry/1") {
  const bambu = read("data/bambu.json").records.map((row, catalogOrder) => ({ id: `bbl-${row.sourceFilamentId.toLowerCase()}-${row.code}`, brand: "Bambu Lab", polymer: row.family, codeKind: "color-code", sourceCode: row.code, selectable: row.lifecycle !== "discontinued", lifecycle: row.lifecycle, catalogOrder }));
  records = [...bambu, ...read("data/additional.json").records.map((row, index) => ({ ...row, catalogOrder: bambu.length + index }))];
} else if (manifest.format === "ussa-filament-registry/2") {
  const names = Object.keys(manifest.files);
  if (names.some(name => !/^brands\/[a-z0-9-]+\.json$/.test(name))) throw new Error("Unsafe previous brand path");
  records = names.flatMap(name => read(`data/${name}`).records);
} else throw new Error(`Unsupported previous format: ${manifest.format}`);
const current = validateRegistry(root);
console.log(checkUpdate({ manifest, records }, { manifest: current.manifest, records: current.brands.flatMap(brand => brand.records) }));
