import { fileURLToPath } from "node:url";
import { validateRegistry } from "./registry.mjs";

const { manifest, counts } = validateRegistry(fileURLToPath(new URL("../", import.meta.url)));
console.log(`Valid ${manifest.catalogVersion}: ${counts.brands} brands, ${counts.registeredIdentities} IDs, ${counts.browsingLines} browsing lines, ${counts.selectableReferences} selectable previews, ${counts.displayReferences} attributed fills`);
