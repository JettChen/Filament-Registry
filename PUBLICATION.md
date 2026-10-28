# Release policy

The public Registry is the single editable catalog. Private snapshots and audit records are archival only.

## Before every release

1. Review the exact PR head and source/license changes; retain required notices and factual uncertainty labels.
2. Run the validator, all tests, check-update against the previous release, and `node scripts/publication.mjs --ready`.
3. Compare published IDs, identity fields, saved colors, membership, file hashes and privacy findings. Never remove/reuse an ID or publish private artifacts.
4. Merge only with maintainer authorization, then tag the exact approved commit `registry-vX.Y.Z`. Never move a published tag.
5. Consumers adopt through their own pin-update PR and QA; Registry publication does not deploy websites.

## Privacy and governance

The initial public tree contains no private Git history, remotes, Issues, Actions logs, personal contact information or audit archives. Use public/no-reply commit identities. Required original upstream license attributions remain unchanged. Static checks are useful evidence, not a universal guarantee.

Start contributors with Fork + PR. Public main requires the validate check and code-owner review; only the owner has administrative bypass for maintaining the project. New commits dismiss old approval. Do not grant Write or tag/release privileges without reviewing effective protections. CODEOWNERS alone is not enforcement.

## Export

`node scripts/publication.mjs --export /path/to/new-directory` produces an allowlisted copy with no Git metadata. The destination must not already exist or be inside the checkout. `publication-report.json` records its checks and source dispositions without local paths or author emails.

## Consumer compatibility

Keep schema format 2 and brand format 1, all stable material IDs, sourceRecord compatibility fields and saved materialRef/colorHex. The first public release changes no brand data. A consumer switching from another repository must update its trusted source and commit/tag/manifest-hash pin in a reviewed PR. Preserve its current production geometry Assets. Failed validation retains the previous pin; deployment requires its own authorization.
