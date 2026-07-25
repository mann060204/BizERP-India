/**
 * conversionUtils.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests proving:
 *   1. convertToMainUnit() applies the correct direction (Definition B):
 *      "1 Main Unit = rate Second Units"
 *      → qty in Second Unit / rate = qty deducted from Main Unit stock
 *   2. The PVC Strip example from the bug report works correctly end-to-end.
 *   3. Box/Pieces example works correctly (second unit pair validation).
 *   4. Edge cases: zero rate blocks, main-unit passthrough, batch override.
 *
 * CANONICAL DEFINITION enforced here:
 *   conversionRate = "1 Main Unit = conversionRate Second Units"
 *   Stock deduction formula: qty / rate  (DIVIDE — not multiply)
 *
 * Run: npx jest src/utils/conversionUtils.test.ts
 */

import { convertToMainUnit, getEffectiveConversionRate, validateDualUnitSetup } from './conversionUtils';

// ─── PVC Strip 8" — the bug-report example ───────────────────────────────────
// Pack relation: 1 Roll = 14 KG = 50 Meters
// Derived: 1 KG = 50/14 = 3.571 Meters  →  rate stored = 3.571
// Physical: 1 Meter = 14/50 = 0.28 KG
const pvcStrip = {
  name: 'PVC Strip 8"',
  unit: 'KG',             // Main Unit (stock unit)
  secondaryUnit: 'Meter', // Second Unit (billing unit)
  conversionRate: 3.571,  // 1 KG = 3.571 Meters
};

describe('PVC Strip 8" — bug-report proof (KG / Meter, rate=3.571)', () => {
  it('selling 1 Meter deducts 0.28 KG from stock (not 3.571 KG)', () => {
    const deducted = convertToMainUnit(1, 'Meter', pvcStrip);
    // 1 / 3.571 = 0.2800...
    expect(deducted).toBeCloseTo(0.28, 2);
  });

  it('selling 50 Meters deducts exactly 14 KG (= 1 full Roll)', () => {
    const deducted = convertToMainUnit(50, 'Meter', pvcStrip);
    // 50 / 3.571 ≈ 14.0 KG
    expect(deducted).toBeCloseTo(14.0, 1);
  });

  it('selling in KG (Main Unit) deducts exactly that many KG unchanged', () => {
    const deducted = convertToMainUnit(14, 'KG', pvcStrip);
    expect(deducted).toBe(14); // no conversion needed
  });

  it('stock balance after selling 1 Meter from 14 KG opening stock ≈ 13.72 KG', () => {
    const openingStock = 14;
    const deducted = convertToMainUnit(1, 'Meter', pvcStrip);
    const balance = openingStock - deducted;
    // User reported expected: 13.72 KG
    expect(balance).toBeCloseTo(13.72, 1);
  });

  it('price per Meter: ₹295/KG ÷ 3.571 = ₹82.60/Meter', () => {
    // This mirrors the frontend formula: mainRate / conversionRate
    const mainRate = 295;
    const meterRate = mainRate / pvcStrip.conversionRate;
    expect(meterRate).toBeCloseTo(82.60, 1);
  });
});

// ─── Box / Pieces — second unit pair validation ───────────────────────────────
// 1 Box = 15 Pieces  →  rate = 15
const boxItem = {
  name: 'Widget Box',
  unit: 'Box',
  secondaryUnit: 'Pieces',
  conversionRate: 15, // 1 Box = 15 Pieces
};

describe('Box / Pieces (rate=15)', () => {
  it('selling 1 Piece deducts 1/15 = 0.0667 Box from stock', () => {
    const deducted = convertToMainUnit(1, 'Pieces', boxItem);
    expect(deducted).toBeCloseTo(1 / 15, 4);
  });

  it('selling 15 Pieces deducts exactly 1 Box from stock', () => {
    const deducted = convertToMainUnit(15, 'Pieces', boxItem);
    expect(deducted).toBeCloseTo(1, 6);
  });

  it('selling 1 Box deducts exactly 1 Box (main unit, no conversion)', () => {
    const deducted = convertToMainUnit(1, 'Box', boxItem);
    expect(deducted).toBe(1);
  });

  it('selling 30 Pieces deducts exactly 2 Boxes', () => {
    const deducted = convertToMainUnit(30, 'Pieces', boxItem);
    expect(deducted).toBeCloseTo(2, 6);
  });
});

// ─── Litre / ML — third pair ─────────────────────────────────────────────────
// 1 Litre = 1000 ML  →  rate = 1000
const litreItem = {
  name: 'Chemical',
  unit: 'Litre',
  secondaryUnit: 'ML',
  conversionRate: 1000,
};

describe('Litre / ML (rate=1000)', () => {
  it('selling 500 ML deducts 0.5 Litres from stock', () => {
    const deducted = convertToMainUnit(500, 'ML', litreItem);
    expect(deducted).toBeCloseTo(0.5, 6);
  });

  it('selling 250 ML deducts 0.25 Litres from stock', () => {
    const deducted = convertToMainUnit(250, 'ML', litreItem);
    expect(deducted).toBeCloseTo(0.25, 6);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('throws when rate is 0 and Second Unit is selected', () => {
    const itemNoRate = { name: 'Widget', unit: 'Box', secondaryUnit: 'Pieces', conversionRate: 0 };
    expect(() => convertToMainUnit(5, 'Pieces', itemNoRate)).toThrow(/No valid conversion rate/);
  });

  it('throws when rate is undefined and Second Unit is selected', () => {
    const itemUndefinedRate = { name: 'Gadget', unit: 'KG', secondaryUnit: 'Meter' };
    expect(() => convertToMainUnit(2, 'Meter', itemUndefinedRate)).toThrow(/No valid conversion rate/);
  });

  it('batch-level rate overrides item-level rate', () => {
    // Item: 1 KG = 3.571 Meters (standard roll)
    // Batch B001: 1 KG = 4.0 Meters (lighter roll)
    const item = { name: 'PVC Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 3.571 };
    const batch = { conversionRate: 4.0, batchNo: 'B001' };
    const result = convertToMainUnit(1, 'Meter', item, batch);
    // 1 / 4.0 = 0.25 KG (batch rate wins)
    expect(result).toBeCloseTo(0.25, 4);
  });

  it('batch-level rate=0 falls back to item-level rate', () => {
    const item = { name: 'PVC Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 3.571 };
    const batchNoRate = { conversionRate: 0, batchNo: 'B002' };
    const result = convertToMainUnit(1, 'Meter', item, batchNoRate);
    // 1 / 3.571 ≈ 0.28 (falls back to item rate)
    expect(result).toBeCloseTo(0.28, 2);
  });

  it('getEffectiveConversionRate returns null when no rate available', () => {
    const item = { unit: 'Box', secondaryUnit: 'Pieces' };
    expect(getEffectiveConversionRate(item)).toBeNull();
  });

  it('getEffectiveConversionRate prefers batch rate over item rate', () => {
    const item  = { unit: 'KG', secondaryUnit: 'Meter', conversionRate: 3.571 };
    const batch = { conversionRate: 4.0 };
    expect(getEffectiveConversionRate(item, batch)).toBe(4.0);
  });

  it('validateDualUnitSetup throws when secondaryUnit set but rate is missing', () => {
    const item = { name: 'Cable', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0 };
    expect(() => validateDualUnitSetup(item)).toThrow(/no conversion rate/i);
  });

  it('validateDualUnitSetup passes when batch tracking is enabled (rate set per batch)', () => {
    const item = { name: 'Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0, enableTracking: true };
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });

  it('validateDualUnitSetup passes when no secondaryUnit configured', () => {
    const item = { name: 'Simple Item', unit: 'Box' }; // no secondaryUnit
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });
});

// ─── Large production run accuracy ───────────────────────────────────────────
describe('Large production run (no cumulative rounding)', () => {
  it('100 FGs each using 3 Meters (PVC, rate=3.571) deducts ≈ 84 KG total', () => {
    // 3 Meters per FG: 3 / 3.571 ≈ 0.84 KG per FG
    // 100 FGs: 0.84 × 100 = 84 KG
    const qtyPerFG = 3;
    const produceQty = 100;
    const totalDeducted = convertToMainUnit(qtyPerFG, 'Meter', pvcStrip) * produceQty;
    expect(totalDeducted).toBeCloseTo(84.0, 0);
  });

  it('100 FGs each using 15 Pieces (Box, rate=15) deducts exactly 100 Boxes total', () => {
    const qtyPerFG = 15; // 15 Pieces = 1 Box
    const produceQty = 100;
    const totalDeducted = convertToMainUnit(qtyPerFG, 'Pieces', boxItem) * produceQty;
    expect(totalDeducted).toBeCloseTo(100, 6); // 15 / 15 × 100 = 100 Boxes
  });
});

// ─── Consistency: frontend formula matches backend ────────────────────────────
describe('Frontend ↔ Backend consistency', () => {
  it('price per Second Unit (mainRate / rate) is inverse of stock deduction (qty / rate)', () => {
    // If 1 KG sells for ₹295 and rate = 3.571:
    // Price per Meter = 295 / 3.571 = ₹82.60
    // Stock deduction for 1 Meter = 1 / 3.571 = 0.28 KG
    // Revenue per KG consumed: 0.28 KG × (₹295/KG) = ₹82.60 ✅ (must match meter price)
    const mainRate = 295;
    const rate = pvcStrip.conversionRate;
    const meterPrice = mainRate / rate;
    const kgDeducted = convertToMainUnit(1, 'Meter', pvcStrip);
    const revenuePerKg = meterPrice / kgDeducted;
    expect(revenuePerKg).toBeCloseTo(mainRate, 1); // must equal ₹295/KG
  });
});
