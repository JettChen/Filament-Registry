# Reviewed series aliases

These are explicit browsing/display-label mappings, not manufacturer print-profile equivalence. Original material `id`, `productLine`, SKU, variant label and source URLs remain available. Package/refill listings keep separate material IDs; browsing presents their named base series together. Source pages support the labels and packaging context, not calibrated color or identical physical properties.

## Coverage and limits

- Reviewed all 27 brands: 934 inventory entries plus every record series. Their union contains 944 brand/series labels (including the normalized Spectrum Nature inventory label; its original double-space label is preserved as inventory `sourceSeries`).
- 74 direct aliases remain across 14 brands, including four previously released aliases. The all-brand duplicate review and generic-material typography pass are represented by one authoritative mapping list. The union resolves to 882 canonical labels; 851 have selectable materials, compared with 900 in public 0.1.2. Inventory-only lines with no verified selection remain nonselectable.
- `node scripts/audit-series.mjs` scans record and inventory names for case, punctuation, `Plus`/`+`, PET-G spelling, generic terminal `Filament` suffixes and token-order collisions. It is a candidate detector, not an automatic equivalence decision. No remaining candidates under those rules does not prove that all possible rebrands or historical formulas are identical.
- Refill/weight candidates were reviewed separately. Do not remove `High Speed`, grade, generation, hardness, reinforcement, RFID or diameter tokens to invent aliases. Do not infer equivalence from a shared category page, workbook or software palette.
- This revision recompiles only the unpublished 0.2.0 candidate groups from the immutable public 0.1.2 observations. No published material/display identity is rewritten. Later published display-group merges require explicit compatibility review.

## Naming and the unique series index

- Display generic polymer tokens as `PLA`, `PETG`, `ABS`, with plus variants `PLA+`, `PETG+`, `ABS+`. Normalize whitespace; preserve speed, generation, reinforcement and other meaningful grade labels. A recycled prefix remains `rPLA` / `rPETG`.
- `PET-G` and `PET G` become `PETG`; this rule requires a complete token. `PET-GF` / `Fiberon PET-GF15` mean PET with glass fiber and are **not** renamed to PETG. Similarly, PET-CF and PETG-CF remain distinct.
- These are Registry display conventions, not claims that the manufacturer changed its product name. Raw record `productLine` and `polymer` remain immutable source identity. Existing `displayColorId`, RGB/components, reviewed decisions and saved colors remain stable during a spelling-only edit.
- `scripts/series.mjs` supplies the browser-safe normalization and `buildSeriesIndex(brands)`. The consumer JSON includes `series`, with exactly one entry per **brand + canonical series**: `brand`, `series`, `sourceSeries`, `materialIds`, `selectableMaterialIds`. All 10,357 IDs occur once; the 882 entries include 851 selectable series. For a material picker, use entries with a nonempty `selectableMaterialIds` array. Inventory-only entries remain available for coverage reporting.
- Consumers must use that index (or deduplicate the explicit per-brand aliases by brand/canonical series), rather than constructing a menu from raw source observations. The same series name under different brands remains a different product series.
- Anycubic uses both bare material and `Filament`-suffixed names for the same official product links. Explicit aliases normalize PETG, ASA, ABS and PC to the bare name; no runtime rule strips suffixes from arbitrary brands. The collision detector flags these candidates for review.
- Alias targets may be either an existing source label or its exact Registry-normalized spelling. Targets still cannot be aliases; source URLs and reviewed metadata are mandatory apart from the four exact historical exceptions. Validation rejects noncanonical series in the new display contract; CI rejects unresolved naming-collision candidates.

## Mapping list

The per-brand JSON is authoritative. Newly reviewed mappings carry `kind`, `scope`, `checkedOn`, `reason` and public `sourceUrls`. The four older aliases retain their original metadata. All new checks are dated 2026-10-28.

| Brand | Source series | Browse as | Review | Label/package sources |
| --- | --- | --- | --- | --- |
| Anycubic | PLA Basic Refill | PLA Basic | packaging | [source 1](https://store.anycubic.com/products/pla-basic-refill?variant=45536015646882); [source 2](https://store.anycubic.com/products/pla-filament) |
| Anycubic | PLA+ Refill | PLA+ | packaging | [source 1](https://store.anycubic.com/products/pla-plus-refill?variant=45829843484834); [source 2](https://store.anycubic.com/products/pla-plus-filament) |
| Anycubic | PETG Refill | PETG | packaging | [source 1](https://store.anycubic.com/products/petg-refill?variant=46481767760034); [source 2](https://store.anycubic.com/products/petg-filament?variant=43708919513250) |
| Anycubic | PETG Filament | PETG | spelling | [source 1](https://store.anycubic.com/collections/filaments); [source 2](https://store.anycubic.com/products/petg-filament?variant=43708919513250) |
| Anycubic | ASA Filament | ASA | spelling | [source 1](https://store.anycubic.com/collections/filaments); [source 2](https://store.anycubic.com/products/asa-filament?variant=43853795295394) |
| Anycubic | ABS Filament | ABS | spelling | [source 1](https://store.anycubic.com/collections/filaments); [source 2](https://store.anycubic.com/products/abs-filament?variant=45298275778722) |
| Anycubic | PC Filament | PC | spelling | [source 1](https://store.anycubic.com/collections/filaments); [source 2](https://store.anycubic.com/products/pc-filament?variant=46274548662434) |
| AzureFilm | Refill PLA | PLA Original | packaging | [source 1](https://azurefilm.com/3d-filaments/pla-filaments/); [source 2](https://azurefilm.com/product/pla-original-filament-red/) |
| AzureFilm | Refill PLA Matte HS | PLA Matte HS | packaging | [source 1](https://azurefilm.com/3d-filaments/pla-filaments/) |
| AzureFilm | ABS PLUS | ABS+ | spelling | [source 1](https://azurefilm.com/product/abs-plus-filament-white/) |
| colorFabb | PLA Color on Demand (RAL Classic) | PLA Color on Demand | existing | Previously released alias |
| colorFabb | PLA Color on Demand RAL Classic | PLA Color on Demand | existing | Previously released alias |
| Creality | CR-PETG | CR PETG | spelling | [source 1](https://store.creality.com/collections/filament); [source 2](https://store.creality.com/products/cr-petg-3d-printing-filament-1kg) |
| Creality | CR PETG 4kg | CR PETG | packaging | [source 1](https://store.creality.com/products/cr-petg-3d-printing-filament-4kg); [source 2](https://store.creality.com/products/cr-petg-3d-printing-filament-1kg) |
| Creality | Spool-Free Hyper PLA RFID | Hyper PLA RFID | packaging | [source 1](https://store.creality.com/products/spool-free-hyper-pla-rfid-3d-printing-filament-1kg); [source 2](https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg) |
| Elegoo | PLA Plus | PLA+ | spelling | [source 1](https://us.elegoo.com/products/elegoo-pla-plus-3d-printer-filament-1-75mm-colored-1kg?variant=44479716556903); [source 2](https://us.elegoo.com/products/elegoo-pla-plus-3d-printer-filament-1-75mm-colored-1kg?variant=44479769935975) |
| Elegoo | Rapid PLA Plus | Rapid PLA+ | spelling | [source 1](https://us.elegoo.com/products/elegoo-rapid-pla-plus-filament-1-75mm-colored-1kg?variant=44479717834855); [source 2](https://us.elegoo.com/products/elegoo-rapid-pla-plus-filament-1-75mm-colored-1kg?variant=44479771213927) |
| Elegoo | RAPID PETG | Rapid PETG | spelling | [source 1](https://us.elegoo.com/products/orangestorm-giga-large-3kg-filament?variant=44479807651943); [source 2](https://us.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=44479775146087) |
| Elegoo | PLA (RFID) emoji Brand Edition | PLA (RFID) emoji® Brand Edition | spelling | [source 1](https://us.elegoo.com/collections/filaments); [source 2](https://us.elegoo.com/products/pla-rfid-emoji-edition?variant=44479759745127) |
| eSUN | ABS+2.5KG | ABS+ | packaging | [source 1](https://www.esun3d.com/abs-pro-2dot5kg-product); [source 2](https://www.esun3d.com/abs-pro-product) |
| eSUN | ABS+5KG | ABS+ | packaging | [source 1](https://www.esun3d.com/abs-pro-5kg-product); [source 2](https://www.esun3d.com/abs-pro-product) |
| eSUN | ABS2.5KG | ABS | packaging | [source 1](https://www.esun3d.com/abs-2dot5kg-product); [source 2](https://www.esun3d.com/abs-product) |
| eSUN | PEEK-Industrial0.25KG | PEEK-Industrial | packaging | [source 1](https://www.esun3d.com/epeek-industrial-product) |
| eSUN | PETG Refilament | PETG | packaging | [source 1](https://www.esun3d.com/petg-refilament-product); [source 2](https://www.esun3d.com/petg-product) |
| eSUN | PETG+2.5KG | PETG+ | packaging | [source 1](https://www.esun3d.com/petg-2-5kg); [source 2](https://www.esun3d.com/petg-pro-product) |
| eSUN | PETG-Basic Refilament | PETG-Basic | packaging | [source 1](https://www.esun3d.com/petg-basic-refil-product); [source 2](https://www.esun3d.com/epetg-lite-product) |
| eSUN | PETG-Matte Refilament | PETG-Matte | packaging | [source 1](https://www.esun3d.com/petg-matte-refil-product); [source 2](https://www.esun3d.com/petg-matte-product) |
| eSUN | PLA+3KG | PLA+ | packaging | [source 1](https://www.esun3d.com/pla-pro-3kg-product); [source 2](https://www.esun3d.com/pla-pro-product) |
| eSUN | PLA+5KG | PLA+ | packaging | [source 1](https://www.esun3d.com/pla-pro-5kg-product); [source 2](https://www.esun3d.com/pla-pro-product) |
| eSUN | PLA+CMYK Refilament | PLA+CMYK | packaging | [source 1](https://www.esun3d.com/epla-cmyk-refilament-product); [source 2](https://www.esun3d.com/cmyk-product) |
| eSUN | PLA+HS Refilament | PLA+HS | packaging | [source 1](https://www.esun3d.com/eplahs-product-r); [source 2](https://www.esun3d.com/eplahs-product) |
| eSUN | PLA+Refilament | PLA+ | packaging | [source 1](https://www.esun3d.com/pla-refilament-product); [source 2](https://www.esun3d.com/pla-pro-product) |
| eSUN | PLA-Basic Refilament | PLA-Basic | packaging | [source 1](https://www.esun3d.com/pla-basic-refilament-product); [source 2](https://www.esun3d.com/pla-basic-product) |
| eSUN | PLA-HS Refilament | PLA-HS | packaging | [source 1](https://www.esun3d.com/epla-hs-refilament-product); [source 2](https://www.esun3d.com/epla-hs-product) |
| eSUN | PLA-Luminous Refilament | PLA-Luminous | packaging | [source 1](https://www.esun3d.com/epla-luminous-r-product); [source 2](https://www.esun3d.com/epla-luminous-product) |
| eSUN | PLA-Matte Refilament | PLA-Matte | packaging | [source 1](https://www.esun3d.com/epla-matte-refil-product); [source 2](https://www.esun3d.com/epla-matte-product) |
| eSUN | PLA-Silk Refilament | PLA-Silk | packaging | [source 1](https://www.esun3d.com/epla-silk-refilament-product); [source 2](https://www.esun3d.com/esilk-pla-product) |
| eSUN | PLA-Stars Refilament | PLA-Stars | packaging | [source 1](https://www.esun3d.com/estars-pla-refil-product); [source 2](https://www.esun3d.com/estars-pla-product) |
| eSUN | PLA-Wood Refilament | PLA-Wood | packaging | [source 1](https://www.esun3d.com/wood-refil-product); [source 2](https://www.esun3d.com/wood-product) |
| Fiberlogy | ABS Plus | ABS+ | spelling | [source 1](https://fiberlogy.com/en/product/abs-plus-filament/) |
| Fiberlogy | ABS Plus – S1 | ABS+ – S1 | spelling | [source 1](https://fiberlogy.com/en/product/abs-plus-filament-s1/) |
| HATCHBOX | PLA Refill | PLA | packaging | [source 1](https://www.hatchbox3d.com/collections/pla-1-75mm); [source 2](https://www.hatchbox3d.com/collections/pla-1-75mm/products/3d-pla-1kg1-75-blk) |
| OVERTURE | PLA Refill | PLA | packaging | [source 1](https://overture3d.com/products/overture-pla-refill-3d-printer-filament-1-75mm); [source 2](https://overture3d.com/products/overture-pla-3d-printing-filament-2kg) |
| OVERTURE | PLA+ Refill | PLA+ | packaging | [source 1](https://overture3d.com/products/overture-pla-plus-refill-3d-printer-filament-1-75mm); [source 2](https://overture3d.com/products/overture-pla-plus-3d-printer-filament-1-75mm) |
| OVERTURE | High Speed PETG Refill | High Speed PETG | packaging | [source 1](https://overture3d.com/products/overture-high-speed-petg-refill-3d-printer-filament-1-75mm); [source 2](https://overture3d.com/products/overture-high-speed-petg) |
| Proto-pasta | PLA basics | PLA Basics | spelling | [source 1](https://proto-pasta.com/); [source 2](https://proto-pasta.com/pages/material-data-table) |
| Recreus | PET-G HF | PETG HF | spelling | [source 1](https://recreus.com/en-en/products/pet-g) |
| Recreus | PET-G CF | PETG CF | spelling | [source 1](https://recreus.com/en-en/products/petg-cf) |
| Snapmaker | Matte PLA | PLA Matte | existing | Previously released alias |
| Snapmaker | SnapSpeed PLA | PLA SnapSpeed | existing | Previously released alias |
| Spectrum | SILK PLA | PLA SILK | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1299-Filament-Spectrum-SILK-PLA-1-75mm-AMETHYST-VIOLET-1kg.html); [source 2](https://shop.spectrumfilaments.com/product-eng-1900-Filament-Spectrum-ReFill-PLA-SILK-1-75mm-UNMELLOW-YELLOW-1kg.html) |
| Spectrum | SILK PLA Rainbow | PLA SILK Rainbow | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1837-Filament-Spectrum-ReFill-SILK-PLA-Rainbow-1-75mm-OCEAN-MELANGE-1kg.html); [source 2](https://shop.spectrumfilaments.com/product-eng-1868-Filament-Spectrum-ReFill-PLA-SILK-Rainbow-1-75mm-EARTH-BLEND-1kg.html) |
| Spectrum | PLA PRO | PLA Pro | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1482-Filament-Spectrum-PLA-PRO-1-75mm-LIME-GREEN-2kg.html); [source 2](https://shop.spectrumfilaments.com/product-eng-1558-Filament-Spectrum-PLA-Pro-1-75mm-LIGHT-GREY-1kg-RAL-7035.html) |
| Spectrum | Premium PET-G | PETG Premium | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1428-Filament-Spectrum-Premium-PET-G-1-75mm-DEEP-BLACK-4-5kg-RAL-9017.html); [source 2](https://shop.spectrumfilaments.com/product-eng-1218-Filament-Spectrum-PET-G-Premium-1-75mm-NAVY-BLUE-1kg-RAL-5002.html) |
| Spectrum | Premium PLA High Speed | PLA Premium High Speed | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1920-Filament-Spectrum-ReFill-Premium-PLA-High-Speed-1-75mm-TRAFFIC-RED-1kg.html); [source 2](https://shop.spectrumfilaments.com/product-eng-1746-Filament-Spectrum-PLA-Premium-High-Speed-1-75mm-ARCTIC-WHITE-1kg.html) |
| Spectrum | Spectrum WOOD | WOOD | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1255-Filament-Spectrum-Spectrum-WOOD-1-75mm-EBONY-BLACK-1kg.html); [source 2](https://shop.spectrumfilaments.com/product-eng-676-Filament-Spectrum-WOOD-1-75mm-NATURAL-0-50kg.html) |
| Spectrum | PLA  Nature | PLA Nature | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1614-Filament-Spectrum-PLA-Nature-1-75mm-PILS-BEER-0-25kg.html) |
| Spectrum | PET-G Premium | PETG Premium | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1218-Filament-Spectrum-PET-G-Premium-1-75mm-NAVY-BLUE-1kg-RAL-5002.html) |
| Spectrum | PET-G Glitter | PETG Glitter | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1221-Filament-Spectrum-PET-G-Glitter-1-75mm-AURORA-GOLD-1kg.html) |
| Spectrum | PET-G HT100 | PETG HT100 | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1224-Filament-Spectrum-PET-G-HT100-1-75mm-CLEAR-1kg.html) |
| Spectrum | PET-G FX120 | PETG FX120 | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1258-Filament-Spectrum-PET-G-FX120-1-75mm-NATURAL-0-5kg.html) |
| Spectrum | PET-G Carbon | PETG Carbon | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1289-Filament-Spectrum-PET-G-Carbon-1-75mm-0-50kg.html) |
| Spectrum | PET-G Glow in the Dark | PETG Glow in the Dark | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1332-Filament-Spectrum-PET-G-Glow-in-the-Dark-1-75mm-YELLOW-GREEN-1kg.html) |
| Spectrum | PET-G MATT | PETG MATT | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1354-Filament-Spectrum-PET-G-MATT-1-75mm-DEEP-BLACK-1kg-RAL-9017.html) |
| Spectrum | PET-G FR V0 | PETG FR V0 | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1364-Filament-Spectrum-PET-G-FR-V0-1-75mm-BLACK-0-75kg.html) |
| Spectrum | rPET-G | rPETG | spelling | [source 1](https://shop.spectrumfilaments.com/product-eng-1399-Filament-Spectrum-rPET-G-1-75mm-SIGNAL-BLUE-1kg-RAL-5005.html) |
| SUNLU | Matte PLA | PLA Matte | spelling | [source 1](https://store.sunlu.com/products/over-6kg-bulk-sale-pla-matte-filament-neatly-wound-filament); [source 2](https://www.sunlu.com/products/pla-matte-filament) |
| SUNLU | PLA Fluorescent Series | PLA Fluorescent | spelling | [source 1](https://store.sunlu.com/products/sunlu-pla-filament-neon-transparent-color-collection); [source 2](https://store.sunlu.com/products/over-6kg-of-pla-pla-meta-3d-filaments-1kg-2-2lbs-fit-most-of-fdm-printer) |
| SUNLU | PLA Transparent Series | PLA Transparent | spelling | [source 1](https://store.sunlu.com/products/sunlu-pla-filament-neon-transparent-color-collection); [source 2](https://store.sunlu.com/products/over-6kg-of-pla-pla-meta-3d-filaments-1kg-2-2lbs-fit-most-of-fdm-printer) |
| SUNLU | PLA Refill | PLA | packaging | [source 1](https://store.sunlu.com/products/sunlu-refill-filament-pla-pla-2-0-compatible-with-2025-sunlu-third-generation-reusable-spool-bambulab-reusable-spool-spool-free-filament); [source 2](https://www.sunlu.com/products/pla-3d-printing-filament) |
| SUNLU | PETG Refill | PETG | packaging | [source 1](https://store.sunlu.com/products/sunlu-refill-filament-pla-pla-2-0-compatible-with-2025-sunlu-third-generation-reusable-spool-bambulab-reusable-spool-spool-free-filament); [source 2](https://www.sunlu.com/products/petg-3d-printing-filament) |
| SUNLU | PLA+ Refill | PLA+ | packaging | [source 1](https://store.sunlu.com/products/sunlu-refill-filament-pla-pla-2-0-compatible-with-2025-sunlu-third-generation-reusable-spool-bambulab-reusable-spool-spool-free-filament); [source 2](https://www.sunlu.com/products/pla-plus-filament) |
| SUNLU | PLA+ 2.0 Refill | PLA+ 2.0 | packaging | [source 1](https://store.sunlu.com/products/sunlu-refill-filament-pla-pla-2-0-compatible-with-2025-sunlu-third-generation-reusable-spool-bambulab-reusable-spool-spool-free-filament); [source 2](https://www.sunlu.com/products/223) |
| SUNLU | Matte PLA Refill | PLA Matte | packaging | [source 1](https://store.sunlu.com/products/sunlu-refill-filament-pla-pla-2-0-compatible-with-2025-sunlu-third-generation-reusable-spool-bambulab-reusable-spool-spool-free-filament); [source 2](https://www.sunlu.com/products/pla-matte-filament) |

## Similar names intentionally kept separate

| Brand | Retained distinction | Reason / next evidence needed |
| --- | --- | --- |
| Polymaker | PolyLite PLA Pro / Polymaker PLA Pro | Official [new PLA Pro](https://polymaker.com/product/polymaker-pla-pro/) describes an updated formula. A rebrand-only merge is unsafe. |
| Polymaker | PolyLite PLA / Panchroma Basic PLA | Basic is a newer formulation; do not apply effect-series rebranding to every PLA. |
| SUNLU | High Speed Matte PLA / PLA Matte; PLA+ / PLA+ 2.0 | Speed and generation labels remain meaningful. |
| Elegoo | PETG / Rapid PETG | Distinct source product/SKU options; only the uppercase RAPID spelling is normalized. |
| HATCHBOX | PLA / PLA 3.00mm; ABS / ABS 3.00mm | Diameter is compatibility-relevant and must remain visible. |
| Prusament | PLA Recycled / rPLA | General recycled and natural-pigment families must not be conflated. |
| eSUN | PLA+5KG1.75MM / PLA+3KG1.75MM | Inventory-only labels with explicit diameter and no selectable records; retain the distinction until diameter is represented separately. |
| FormFutura | Volcano PLA / Volcano PLA 150C; CarbonFil / CarbonFil CF03 | Exact grade/formula equivalence has not been established; retain until supported. |
| FormFutura | ReFill PLA / ReFill PETG | No demonstrated corresponding base-family alias; preserve standalone names. |
| Atomic Filament | Extreme Impact PLA / Extreme Impact Modified PLA | Version/formulation equivalence needs confirmation. |
| OVERTURE | PLA Pro / PLA+ / Super PLA+ | Similar strength claims are insufficient evidence of an alias. |
| Fiberlogy | S1 / S2 variants, hardness grades | Generations and hardness remain distinct. |

For new aliases, verify the target exists and is not itself an alias. Rebuild shared display groups only with explicit compatibility review, run the full test suite and `check-update`, and review consumer dropdowns and saved-design behavior before publishing.
