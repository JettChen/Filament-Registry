# USSA Filament Registry

A versioned JSON catalog of filament identities, product lines and attributed screen-color references. One brand per file, with stable IDs. This is a Registry, not a stock feed or physical-color certification.

This public repository is the canonical catalog. Earlier private snapshots remain archival. An authorized private correction may use the exact public baseline for review; only the reviewed patch transfers back, never private history or audit archives. Consumer adoption and website deployment are independent of Registry publication.

## Read the data

Download [registry-v0.1.2](https://github.com/JettChen/Filament-Registry/releases/tag/registry-v0.1.2), or choose another immutable `registry-vX.Y.Z` release and exact commit. Read `registry.json`, then `data/<file>` for each entry in `files`. Verify each file's `sha256` and `bytes` and cache the parsed snapshot in your application. No SDK, account or runtime token is required.

```js
// Node.js example, from a downloaded release checkout.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = JSON.parse(await readFile("registry.json", "utf8"));
const materials = [];
for (const [file, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(`data/${file}`);
  if (bytes.length !== expected.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== expected.sha256) {
    throw new Error(`Invalid registry file: ${file}`);
  }
  materials.push(...JSON.parse(bytes).records);
}
materials.sort((a, b) => a.catalogOrder - b.catalogOrder);
```

The unreleased **0.2.0 candidate** includes self-contained effective colors in every selectable record and shared `displayColorId` definitions for packaging variants. Use `consumerRecords(brands)` from the browser-safe `scripts/colors.mjs`, or `node scripts/export-consumer.mjs /path/to/catalog.json`, to consume qualified display values without a fallback join. See [the color contract](COLOR-CONTRACT.md) for exact legacy precedence, conflicting sources, packaging, saved colors and Photo rendering. The public release link above remains 0.1.2 until an independently approved promotion.

Validate relative brand paths before resolving a remotely downloaded manifest. Each consumer chooses when to adopt a release; do not fetch mutable `main` at runtime.

## Structure and compatibility

```text
registry.json                  Version, brand paths, hashes, sizes and counts
data/brands/*.json             One brand per file
LICENSE                       Standard MIT for project-owned contributions
THIRD_PARTY_NOTICES.md         Scope and upstream exceptions
licenses/                     Original notices and source decisions
CONTRIBUTING.md                Simple contribution instructions
PUBLICATION.md                Release and privacy checks
scripts/ and tests/            Validation and compatibility tools
```

Keep manifest `ussa-filament-registry/2` and brand `ussa-filament-brand/1`. Brand files own `records`, `productLines`, `displayReferences`, `unresolved` and `browsingAliases`. Records retain stable IDs, names, polymer, source code/type, evidence, display data and order. `catalogOrder` preserves browsing order and is not an identity.

Published IDs never change when labels or display references change. Keep source observations and compatibility fields: the existing consumer uses 256 Bambu `sourceRecord` entries to identify its original default catalog. Saved `materialRef` and `colorHex` values must not be silently rewritten.

In older releases, `displayHex` can be null when a display reference supplies the screen color. In 0.2.0 every selectable record includes its effective primary and components. Historical observations stay separate. Reference kinds distinguish manufacturer numeric values, image samples, community values and approximations; these are evidence types, not licensing decisions. Shared display groups never assert identical physical formulations. Sampled colors are screen approximations, not measured albedo; calibrated rendering values are explicitly unavailable.

Keep published records when withdrawing choices: use dated `maintenance.state` values `hidden`, `retired` or `superseded`, retaining IDs, source and color data. A replacement must resolve. Manufacturer discontinuation needs evidence; temporary stock/region gaps do not prove discontinuation. Pending verification may retain the existing display value without inventing a replacement.

## Versions and promotion

The current catalog release is **0.2.0**. The first public catalog release, 0.1.2, preserved every brand file and material identity from baseline 0.1.1. Never reuse a version for different catalog content.

| Change | Rule |
| --- | --- |
| Compatible label, evidence or display correction without selection change | PATCH |
| Add brands/materials or hide/retire/restore/supersede choices | MINOR; keep every published ID |
| Incompatible schema during 0.x | New MINOR and explicit consumer migration |
| Declare the contract stable | 1.0.0 after consumer QA |
| Incompatible change after 1.0 | MAJOR and migration |

Dates describe evidence checks. Catalog SemVer and JSON format numbers are independent. Formal tags are `registry-v<catalogVersion>` and must never move or be reused.

1. Edit data, choose the version and update `CHANGELOG.md` when catalog content changes.
2. Refresh/check the candidate and compare with the prior published/consumed baseline:
   ```sh
   node scripts/update-manifest.mjs
   node scripts/validate.mjs
   node --test tests/*.test.mjs
   node scripts/check-update.mjs origin/main
   node scripts/publication.mjs
   ```
3. Review the current PR head and merge after maintainer approval.
4. After explicit release authorization, tag the exact approved clean commit. Merging alone does not publish.
5. Consumers adopt through independent pin-update PRs and saved-reference/display QA. Registry publication never deploys a website.

Rollback only to a snapshot that still resolves every ID the consumer already knows; otherwise publish a forward repair.

## License

The standard [MIT License](LICENSE) covers project-owned tools, tests, documentation and original contributions their authors can license. We claim no exclusive rights in individual product facts, short names, SKUs or numerical values, and impose no license condition where permission is not required by applicable law.

Third-party protected material retains its applicable license. Root MIT does not sublicense others' rights. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), including upstream MIT and software-palette notices. Scalar facts do not automatically become AGPL because they appeared in an AGPL repository. The source-decision register documents factual distribution scope and the applicable carried notices; it does not claim permission to republish upstream imagery or original databases.

Original source photos, workbooks, correspondence and audit archives are excluded from the export. No manufacturer affiliation, endorsement or trademark license is implied. MIT permits commercial use, modification and redistribution under its terms; maintainer approval governs official releases, not other forks.

### Series naming

[Reviewed series aliases](SERIES-ALIASES.md) group spelling and packaging labels for browsing while preserving every material ID and original source record. The consumer export includes a unique `series` index; use its nonempty `selectableMaterialIds` entries for a picker, rather than raw source labels. Generic material tokens use `PLA`, `PETG`, `ABS` and `+` variants, while PET glass-fiber grades remain distinct. Run `node scripts/audit-series.mjs` to find case, punctuation and word-order candidates across both records and inventory. The report is a review aid; it never approves a merge or establishes physical equivalence.
