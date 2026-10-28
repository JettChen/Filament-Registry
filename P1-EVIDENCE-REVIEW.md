# P1 evidence review — 0.2.1 candidate

**Status:** unreleased review candidate for Registry 0.2.1. This review is not a release or deployment. The currently released 0.2.0 references and contract remain intact.

## Scope and outcome

The review covered 158 shared screen-display groups. It separates resolved display-reference differences from unresolved upstream evidence and unresolved product-variant scope. “Resolved” means the cited evidence supports the current screen-display decision within its product scope; it does not mean a physical filament color has been measured.

| Disposition | Groups | Review outcome |
| --- | ---: | --- |
| Corrected image references | 2 | SUNLU white-product ROIs had sampled spool flanges. The exact original captures remain SHA-bound rejected observations; replacement ROIs sample white filament windings. Replacement photo values are observations, not selected color values. |
| Resolved display-reference difference | 92 | 69 FormFutura groups: exact product/color controls support the retained values over generic `no_variant` controls. 20 Atomic Filament groups: current product pages repeat the selected indicative HEX while attributing it to Filamentcolors.xyz and disclaiming verification; conflicting photo ROIs do not establish a numeric correction. 3 eSUN groups: current official White references publish `#F6F6F6`. |
| Pending upstream verification | 52 | 39 Polymaker groups, including contradictory literal PC-ABS White workbook rows; 13 community-reference groups. Current evidence does not settle a source correction. |
| Pending variant scope | 12 | 11 Polymaker groups, including old/new formula and Glow/UV distinctions; one Snapmaker RFID distinction. Keep product variants separate until exact-scope evidence supports a shared display decision. |

The categories above sum to 158. Pending groups remain review work; they are not counted as verified or corrected.

## Identity and saved-design compatibility

The candidate preserves all **10,357 material IDs**, **9,991 selectable references**, and **7,461 display IDs**. No product identity or published display identity is removed. Four eSUN rows use `#F6F6F6` instead of `#E3E4D4` as the default for new selections, following current official White references. Existing saved design `colorHex` snapshots remain authoritative and are not rewritten by a catalog update.

The two SUNLU corrections repair the sampled image regions only. Their retained original observations are explicitly rejected by SHA-256; the replacement winding observations have provenance and remain image evidence. They are not manufacturer numeric HEX values and do not represent measured albedo.

## Review record model

- `displayReferenceReviews` binds a rejection to the hash of the original capture and retains its reason plus a replacement observation. This preserves an auditable decision without silently editing historical evidence.
- `evidenceReview` stores group-level status, date, source URLs, finding and method. The 0.2.1 candidate uses resolved-display-difference, source-error-corrected, pending-upstream-verification and pending-variant-scope dispositions.
- `eligibleObservations` is the evidence permitted to participate in current selection. `conflictingObservations` retains the historical disagreements, including excluded evidence. Historical conflicts are not deleted or rewritten when eligibility changes.

Evidence must match the exact product and variant: SKU, color, refill/spool, generation/formula and effects where applicable. Prefer current manufacturer numeric data or exact product controls. A generic selector, community entry or uncalibrated photo does not become a manufacturer measurement by appearing in a product record. No physical equivalence or calibrated albedo is asserted.

## Representative primary sources

These public manufacturer pages illustrate the evidence types used in the review. The full group-level source URLs and methods are recorded with their evidence reviews in the candidate registry data.

- FormFutura: [ASA](https://www.formfutura.com/filaments/asa) and [ApolloX](https://www.formfutura.com/apollox) product pages, compared at exact product/color controls rather than generic controls.
- Atomic Filament: [Gray PETG PRO](https://atomicfilament.com/products/gray-petg-pro), [Perfect Blue PLA](https://atomicfilament.com/products/perfect-blue-pla-filament), and [Mysterious Abyss v2 Pearl PETG PRO](https://atomicfilament.com/products/mysterious-abyss-petg-pro). Their indicative HEX wording attributes values to Filamentcolors.xyz and says Atomic cannot verify them.
- eSUN: [PETG-Matte](https://www.esun3d.com/petg-matte-product) and [PETG-Matte refill](https://www.esun3d.com/petg-matte-refil-product) publish the current White reference `#F6F6F6`.
- Polymaker: [HEX codes and transmission distances](https://wiki.polymaker.com/polymaker-products/more-about-our-products/hex-codes-and-transmission-distances) and [Fiberon PA12-CF10](https://shop.polymaker.com/products/fiberon-pa12-cf10) show why exact row/SKU scope and upstream clarification matter.
- Creality: [Hyper PLA RFID](https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg) and its [spool-free listing](https://store.creality.com/products/spool-free-hyper-pla-rfid-3d-printing-filament-1kg) distinguish product presentations without establishing numeric color targets.
- HATCHBOX: [White PLA refill](https://www.hatchbox3d.com/products/3d-rs-pla1kg-wht-pck) and [White PLA spool](https://www.hatchbox3d.com/products/3d-pla-1kg1-75-wht) have distinct SKUs; their packaging difference alone does not prove a different filament color.
- SUNLU: [PLA / PLA+ / PLA Meta filament listing](https://store.sunlu.com/products/over-6kg-bundle-sale-pla-and-pla-plus-pla-meta-macaron-filament1kg-roll) supplies product imagery, not a numeric color specification for every named option.
- Snapmaker: [Matte PLA](https://us.snapmaker.com/products/matte-pla-filament) and [non-RFID Matte PLA](https://shop.snapmaker.com/products/matte-pla-filament-without-rfid-1kg) are kept separate where the available page evidence does not resolve the non-RFID variant.

## Release boundary

0.2.1 is an unreleased candidate. This evidence review does not publish a tag, update consumer pins, deploy a site or change saved designs. Release and consumer adoption remain separate approval steps.
