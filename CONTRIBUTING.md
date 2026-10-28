# Contributing

Fork, edit the relevant `data/brands/<brand>.json` and open a PR. Small corrections need no separate issue; discuss new brands or broad changes first. Official-repository Write access is not needed.

Tell us three things:

1. **Change:** brand, series/color, source code and material ID or the new identity.
2. **Evidence:** source URL/revision and date checked. Distinguish manufacturer SKU, software-palette ID and current availability.
3. **Display type:** manufacturer numeric, image sample, community, approximation or unchanged. Identify the actual upstream license when reusing protected content; not every short name or number requires permission.

Preserve published IDs, known identity codes, brand/polymer identity, order, source observations and saved colors. Use the dated maintenance states in [README.md](README.md#structure-and-compatibility) instead of deleting IDs. Keep Bambu `sourceRecord` compatibility fields. Pending verification can retain its original screen value without a new color proposal.

For series changes, use [the canonical naming and unique-index rules](SERIES-ALIASES.md#naming-and-the-unique-series-index). Add an explicit, source-linked browsing alias; never rewrite published record identity to normalize a label. Run `node scripts/audit-series.mjs` and resolve spelling collisions before submitting.

For color changes follow [COLOR-CONTRACT.md](COLOR-CONTRACT.md). Keep `displayObservation` and original display references; update the shared decision and rebuild effective values with `node scripts/build-display-colors.mjs` before updating the manifest. Do not treat same-name packages as printing substitutes, mark photo medians as measured colors, or rewrite a saved user's `colorHex`. Existing shared display IDs survive label edits; a merge of different published display groups needs explicit review.

The maintainer can help allocate order values, choose the version and refresh hashes. With Node.js 22 or newer:

```sh
node scripts/update-manifest.mjs
node scripts/validate.mjs
node --test tests/*.test.mjs
node scripts/check-update.mjs origin/main
node scripts/publication.mjs
```

Submit original contributions under project MIT scope, or identify the actual upstream license and your right to contribute. Preserve required notices. Do not upload personal contact details, credentials, private correspondence or source archives. Use an appropriate public Git identity and no-reply email. No identity document, CLA or extra downstream-use approval is required.

Official main requires CI and maintainer approval of the current head. CODEOWNERS alone does not enforce review: actual branch rules must do that. Fork checks use read-only permissions and no publication secrets. Start partners with fork-based contributions; a personal-repository Collaborator role also permits writing/merging. Only authorized maintainers publish official tags/releases.

## Evidence review lifecycle

For a disputed display reference, review the exact current manufacturer product page or feed and bind each observation to its SKU/variant, refill/spool status, generation/formula, effect and named color. A generic no-variant selector is weaker than an exact product/color control. Use a manufacturer-published numeric value when it clearly applies; otherwise a photo sample is only an uncalibrated screen observation. Do not infer measured color or physical equivalence from a product image.

Record a rejected capture in `displayReferenceReviews` with its original SHA-256, reason and replacement observation. Keep the source capture and all historical conflicts unchanged. Add only evidence that qualifies for selection to `eligibleObservations`; retain excluded evidence in `conflictingObservations`. Set the group's `evidenceReview.status` to resolved only when the source evidence supports the decision. Use pending upstream verification or pending variant scope when the evidence cannot settle it, and record the URLs, date, finding and method. Pending review is preferable to inventing a correction or merging product variants.

Maintain published material and display IDs. A Registry correction affects future selections only; never rewrite a saved design's `colorHex`. See the scope and candidate review counts in [P1-EVIDENCE-REVIEW.md](P1-EVIDENCE-REVIEW.md). The 0.2.1 documentation and data are an unreleased candidate until separately reviewed and published.
