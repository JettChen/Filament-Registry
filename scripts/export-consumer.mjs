import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateRegistry } from "./registry.mjs";
import { consumerRecords } from "./colors.mjs";
import { buildSeriesIndex } from "./series.mjs";

const { manifest, brands } = validateRegistry(fileURLToPath(new URL("../", import.meta.url)));
const snapshot = { format: "ussa-filament-consumer/1", catalogVersion: manifest.catalogVersion,
  materials: consumerRecords(brands),
  series: buildSeriesIndex(brands),
  notices: ["LICENSE", "THIRD_PARTY_NOTICES.md", "licenses/SpoolmanDB-MIT.txt", "licenses/AGPL-3.0.txt",
    "licenses/upstream/BambuStudio-804d93b.json", "licenses/upstream/BambuStudio-79df7ae.json", "licenses/upstream/Snapmaker-Orca-b1831e5.json"],
  scope: "Screen references only, not measured material albedo or print equivalence. Carry the applicable notices and corresponding sources with redistributed snapshots." };
if (process.argv[2]) writeFileSync(process.argv[2], `${JSON.stringify(snapshot, null, 2)}\n`);
else process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
