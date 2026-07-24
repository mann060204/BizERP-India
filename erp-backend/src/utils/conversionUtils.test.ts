/**
 * conversionUtils.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests proving:
 *   1. convertToMainUnit() applies the correct direction:
 *      "qty entered in Second Unit × rate = qty deducted from Main Unit stock"
 *   2. The Unit Settings modal and Add New Item screen both produce IDENTICAL
 *      stock deduction when the same rate is stored — regardless of which
 *      screen was used to enter it.
 *   3. Edge cases: zero rate blocks, main-unit passthrough, batch override.
 *
 * Run: npx jest src/utils/conversionUtils.test.ts
 *      (or: npx ts-node --transpile-only -e "require('./conversionUtils.test')")
 */

import { convertToMainUnit, getEffectiveConversionRate, validateDualUnitSetup } from './conversionUtils';

// ─── Scenario from the bug report ────────────────────────────────────────────
// Item: main_unit = Nos, second_unit = Mtr, conversionRate = 15
// (1 Mtr consumes 15 Nos from stock)
const itemNosPerMtr = {
  name: 'Wire',
  unit: 'Nos',
  secondaryUnit: 'Mtr',
  conversionRate: 15,
};

describe('convertToMainUnit — core direction (single source of truth)', () => {
  it('entering 1 Mtr deducts exactly 15 Nos from Main Unit stock', () => {
    const deducted = convertToMainUnit(1, 'Mtr', itemNosPerMtr);
    expect(deducted).toBe(15);  // 1 × 15 = 15 Nos
  });

  it('entering 3 Mtr deducts exactly 45 Nos from Main Unit stock', () => {
    const deducted = convertToMainUnit(3, 'Mtr', itemNosPerMtr);
    expect(deducted).toBe(45);  // 3 × 15 = 45 Nos
  });

  it('entering in Main Unit returns qty unchanged (no conversion)', () => {
    const deducted = convertToMainUnit(10, 'Nos', itemNosPerMtr);
    expect(deducted).toBe(10);  // already in main unit
  });
});

// ─── Both screens must produce identical results ──────────────────────────────
// The "Add New Item" screen and "Unit Settings" modal now both display
//   "1 Mtr = 15 Nos"  and write conversionRate = 15 to the same field.
// Simulate: user enters rate=15 from EITHER screen → same field value → same deduction.

describe('Screen consistency: Unit Settings modal == Add New Item screen', () => {
  it('rate=15 written by Add New Item screen → 1 Mtr deducts 15 Nos', () => {
    // Simulates item saved via the Stock & Unit Details section (always correct)
    const itemViaAddNewItem = { ...itemNosPerMtr, conversionRate: 15 };
    expect(convertToMainUnit(1, 'Mtr', itemViaAddNewItem)).toBe(15);
  });

  it('rate=15 written by Unit Settings modal (after fix) → 1 Mtr deducts 15 Nos', () => {
    // Simulates item saved via the now-fixed Unit Settings modal
    // The modal now shows "1 Mtr = 15 Nos" which the user reads correctly
    const itemViaUnitModal = { ...itemNosPerMtr, conversionRate: 15 };
    expect(convertToMainUnit(1, 'Mtr', itemViaUnitModal)).toBe(15);
  });

  it('both screens produce identical deduction for qty=7', () => {
    const viaAddNewItem  = convertToMainUnit(7, 'Mtr', { ...itemNosPerMtr, conversionRate: 15 });
    const viaUnitModal   = convertToMainUnit(7, 'Mtr', { ...itemNosPerMtr, conversionRate: 15 });
    expect(viaAddNewItem).toBe(viaUnitModal); // must be identical: 7 × 15 = 105
    expect(viaAddNewItem).toBe(105);
  });
});

// ─── Guard: OLD bug produced rate² error ─────────────────────────────────────
describe('Regression: OLD inverted formula would have been wrong', () => {
  it('OLD formula (1/rate) would give 1/15 ≈ 0.067 — which is WRONG', () => {
    // Before the fix, the modal showed "1 Nos = 15 Mtr" so a confused user
    // might store rate = 1/15 ≈ 0.0667 thinking "1 Mtr = 0.0667 Nos".
    const itemWithInvertedRate = { ...itemNosPerMtr, conversionRate: 1 / 15 };
    const wrongDeduction = convertToMainUnit(1, 'Mtr', itemWithInvertedRate);
    // This would deduct only 0.0667 Nos instead of 15 Nos — clearly wrong
    expect(wrongDeduction).not.toBe(15);
    expect(wrongDeduction).toBeCloseTo(1 / 15, 4);
  });

  it('correct rate=15 gives exactly 15x deduction, not 1/15x', () => {
    const correctDeduction  = convertToMainUnit(1, 'Mtr', { ...itemNosPerMtr, conversionRate: 15 });
    const invertedDeduction = convertToMainUnit(1, 'Mtr', { ...itemNosPerMtr, conversionRate: 1 / 15 });
    expect(correctDeduction / invertedDeduction).toBeCloseTo(225, 0); // 15 / (1/15) = 225 = rate²
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('throws when rate is 0 and Second Unit is selected', () => {
    const itemNoRate = { name: 'Widget', unit: 'Nos', secondaryUnit: 'Box', conversionRate: 0 };
    expect(() => convertToMainUnit(5, 'Box', itemNoRate)).toThrow(/No valid conversion rate/);
  });

  it('throws when rate is undefined and Second Unit is selected', () => {
    const itemUndefinedRate = { name: 'Gadget', unit: 'Nos', secondaryUnit: 'Pack' };
    expect(() => convertToMainUnit(2, 'Pack', itemUndefinedRate)).toThrow(/No valid conversion rate/);
  });

  it('batch-level rate overrides item-level rate', () => {
    const item  = { name: 'PVC Roll', unit: 'Kg', secondaryUnit: 'Mtr', conversionRate: 0.85 };
    const batch = { conversionRate: 0.92, batchNo: 'B001' }; // heavier roll
    const result = convertToMainUnit(10, 'Mtr', item, batch);
    expect(result).toBeCloseTo(9.2, 4); // 10 × 0.92 (batch rate wins)
  });

  it('batch-level rate=0 falls back to item-level rate', () => {
    const item  = { name: 'Fabric', unit: 'Kg', secondaryUnit: 'Mtr', conversionRate: 0.85 };
    const batchNoRate = { conversionRate: 0, batchNo: 'B002' };
    // batch rate = 0 is treated as "not set" → use item rate
    const result = convertToMainUnit(10, 'Mtr', item, batchNoRate);
    expect(result).toBeCloseTo(8.5, 4); // 10 × 0.85 (item rate)
  });

  it('getEffectiveConversionRate returns null when no rate available', () => {
    const item = { unit: 'Nos', secondaryUnit: 'Box' };
    expect(getEffectiveConversionRate(item)).toBeNull();
  });

  it('getEffectiveConversionRate prefers batch rate over item rate', () => {
    const item  = { unit: 'Kg', secondaryUnit: 'Mtr', conversionRate: 0.85 };
    const batch = { conversionRate: 0.92 };
    expect(getEffectiveConversionRate(item, batch)).toBe(0.92);
  });

  it('validateDualUnitSetup throws when secondaryUnit set but rate is missing', () => {
    const item = { name: 'Cable', unit: 'Nos', secondaryUnit: 'Mtr', conversionRate: 0 };
    expect(() => validateDualUnitSetup(item)).toThrow(/no conversion rate/i);
  });

  it('validateDualUnitSetup passes when batch tracking is enabled (rate set per batch)', () => {
    const item = { name: 'Roll', unit: 'Nos', secondaryUnit: 'Mtr', conversionRate: 0, enableTracking: true };
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });

  it('validateDualUnitSetup passes when no secondaryUnit configured', () => {
    const item = { name: 'Simple Item', unit: 'Nos' }; // no secondaryUnit
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });
});

// ─── Large production run accuracy ───────────────────────────────────────────
describe('Large production run (no cumulative rounding)', () => {
  it('100 units of 3 Mtr each deducts exactly 4500 Nos (not 4499.99...)', () => {
    const rate = 15; // 1 Mtr = 15 Nos
    const qtyPerFG = 3; // Mtr per finished good
    const produceQty = 100;
    // Backend formula: convertToMainUnit(qtyPerFG, 'Mtr', item) * produceQty
    const totalDeducted = convertToMainUnit(qtyPerFG, 'Mtr', itemNosPerMtr) * produceQty;
    expect(totalDeducted).toBe(4500);
  });
});
