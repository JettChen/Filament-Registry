import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateRegistry, inspectBrands, sha256 } from '../scripts/registry.mjs';
import { consumerRecords, resolveAppliedFinish, activeDisplayReference } from '../scripts/colors.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = () => validateRegistry(root).brands;
const baseline = JSON.parse(readFileSync(`${root}tests/fixtures/public-0.2.0.json`));
const digest = value => sha256(Buffer.from(JSON.stringify(value)));
const sortedRows = brands => brands.flatMap(brand => brand.records).sort((a,b) => a.catalogOrder-b.catalogOrder);

test('P1 retains published IDs, observations, source references, inventory, aliases and display identities', () => {
  const brands = snapshot(), rows = sortedRows(brands);
  assert.equal(rows.length, baseline.recordCount);
  assert.equal(digest(rows.map(row => baseline.identityFields.map(field => row[field] ?? null))), baseline.identitiesSha256);
  assert.equal(digest(rows.map(row => [row.id, row.displayObservation])), baseline.observationsSha256);
  assert.equal(digest(brands.map(brand => [brand.brand, brand.displayReferences])), baseline.referencesSha256);
  assert.equal(digest(brands.map(brand => [brand.brand, brand.productLines, brand.browsingAliases])), baseline.inventoryAndAliasesSha256);
  assert.equal(digest(brands.map(brand => [brand.brand, brand.displayColors.map(color => [color.id,color.productLine,color.colorName,color.polymer,color.effects])])), baseline.displayIdentitySha256);
  const changed = new Set(baseline.reviewedDisplayChanges.map(row => row.id));
  assert.equal(digest(rows.filter(row => !changed.has(row.id)).map(row => [row.id,row.displayHex,row.displayComponents])), baseline.unchangedDisplaySha256);
});

test('all 158 P1 groups have scoped outcomes; unresolved upstream and variant cases remain pending', () => {
  const brands = snapshot(), counts = {};
  for (const color of brands.flatMap(brand => brand.displayColors)) if (color.evidenceReview) {
    const status = color.evidenceReview.status;
    counts[status] = (counts[status] ?? 0) + 1;
    assert.equal(color.calibrated, false);
    assert.equal(color.renderBaseColorHex, null);
    assert.equal(color.physicalEquivalence, 'not-asserted');
  }
  assert.deepEqual(counts, { 'resolved-display-difference':92, 'pending-upstream-verification':52, 'pending-variant-scope':12, 'source-error-corrected':2 });
  const atomic = brands.find(brand => brand.brand === 'Atomic Filament').displayColors.filter(color => color.evidenceReview);
  assert.equal(atomic.length, 20);
  assert.ok(atomic.every(color => color.evidenceKind === 'community' && color.reviewedEvidence.kind === 'community'));
});

test('only four reviewed eSUN defaults change, and every saved color wins over those new defaults', () => {
  const records = consumerRecords(snapshot());
  assert.equal(baseline.reviewedDisplayChanges.length, 4);
  for (const change of baseline.reviewedDisplayChanges) {
    assert.equal(records.find(row => row.id === change.id).displayHex, '#F6F6F6');
    assert.equal(change.from, '#E3E4D4');
    const saved = { materialRef: change.id, colorHex: change.from };
    assert.deepEqual(resolveAppliedFinish(saved, records), saved);
    assert.equal(resolveAppliedFinish({ materialRef:change.id },records).colorHex, change.to);
  }
  const unknown = { materialRef:'unknown-legacy-id', colorHex:'#123456' };
  assert.deepEqual(resolveAppliedFinish(unknown, records), unknown);
});

test('SUNLU bad spool samples stay archived but are excluded; corrected winding photos are not live white defaults', () => {
  const brands = snapshot(), brand = brands.find(brand => brand.brand === 'SUNLU');
  const records = consumerRecords(brands);
  const expected = [['#141C35','#D1D4D8','#F1F0EE'],['#101B36','#E7E8EB','#F8F8F8']];
  assert.equal(brand.displayReferenceReviews.length,2);
  for (const [index,review] of brand.displayReferenceReviews.entries()) {
    const original = brand.displayReferences.find(ref => ref.id === review.materialId);
    assert.equal(original.components[0],expected[index][0]);
    assert.equal(review.referenceSha256,digest(original));
    assert.equal(review.replacement.components[0],expected[index][1]);
    assert.equal(review.replacement.sampleRegion,'[240,250,380,450]');
    assert.deepEqual(activeDisplayReference(original, review),review.replacement);
    assert.equal(activeDisplayReference(original,{status:'rejected'}),null);
    const row = records.find(row => row.id === review.materialId);
    assert.equal(row.displayHex,expected[index][2]);
    assert.deepEqual(row.display.recordReference,original);
    assert.deepEqual(row.display.recordReferenceReview,review);
    const color = brand.displayColors.find(color => color.id === row.displayColorId);
    assert.deepEqual(color.eligibleObservations.find(item => item.materialId === row.id).components, review.replacement.components);
    assert.notEqual(row.display.source.reference?.components[0],original.components[0]);
  }
});

test('review validation rejects stale/orphan/duplicate reviews, bad replacements and missing review sources', () => {
  for (const mutate of [
    brand => { brand.displayReferenceReviews[0].referenceSha256 = '0'.repeat(64); },
    brand => { brand.displayReferenceReviews[0].materialId = 'missing'; },
    brand => { brand.displayReferenceReviews.push(brand.displayReferenceReviews[0]); },
    brand => { brand.displayReferenceReviews[0].replacement.components = ['bad']; },
    brand => { brand.displayReferenceReviews[0].replacement.imageSha256 = ''; },
    brand => { brand.displayColors.find(color => color.evidenceReview).evidenceReview.sourceUrls = []; },
    brand => { brand.displayColors.find(color => color.eligibleObservations).eligibleObservations[0].materialId = 'missing'; },
    brand => { const review = brand.displayReferenceReviews[0]; brand.displayColors.find(color => color.eligibleObservations?.some(item => item.materialId === review.materialId)).eligibleObservations.find(item => item.materialId === review.materialId).components = ['#141C35']; },
  ]) {
    const brands = snapshot();
    mutate(brands.find(brand => brand.brand === 'SUNLU'));
    assert.throws(() => inspectBrands(brands), /review|replacement|eligible|Rejected/);
  }
});
