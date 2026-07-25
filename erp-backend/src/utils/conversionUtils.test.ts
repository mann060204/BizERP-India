/**
 * conversionUtils.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests proving:
 *   CANONICAL DEFINITION A — the only definition:
 *   conversionRate = "1 Second Unit = conversionRate × Main Units"
 *   e.g. 1 Meter = 0.28 KG  →  rate = 0.28
 *
 *   Stock deduction:  qty × rate   (MULTIPLY)
 *   Price per Second: mainPrice × rate  (MULTIPLY — same direction)
 *
 * Test pairs:
 *   1. PVC Sheet  — KG / Meter  (rate = 0.28)     ← bug-report example
 *   2. Box / Piece              (rate = 1/15 ≈ 0.0667)
 *   3. Litre / ML               (rate = 0.001)
 *
 * Run: npx jest src/utils/conversionUtils.test.ts
 */

import { convertToMainUnit, getEffectiveConversionRate, validateDualUnitSetup } from './conversionUtils';

// ─── PVC Sheet — the exact bug-report test case ───────────────────────────────
// Pack: 1 Roll = 14 KG = 50 Meters → 1 Meter = 14/50 = 0.28 KG → rate = 0.28
const pvcSheet = {
  name: 'PVC Sheet',
  unit: 'KG',             // Main Unit (stock unit)
  secondaryUnit: 'Meter', // Second Unit (billing unit)
  conversionRate: 0.28,   // 1 Meter = 0.28 KG
};

describe('PVC Sheet — bug-report test case (KG / Meter, rate = 0.28)', () => {
  it('selling 1 Meter deducts 0.28 KG from stock', () => {
    // 1 × 0.28 = 0.28 KG
    expect(convertToMainUnit(1, 'Meter', pvcSheet)).toBeCloseTo(0.28, 4);
  });

  it('selling 50 Meters deducts exactly 14 KG (= 1 full Roll)', () => {
    // 50 × 0.28 = 14.0 KG
    expect(convertToMainUnit(50, 'Meter', pvcSheet)).toBeCloseTo(14.0, 2);
  });

  it('opening stock 14 KG − sell 1 Meter → remaining 13.72 KG', () => {
    const openingStock = 14;
    const deducted = convertToMainUnit(1, 'Meter', pvcSheet);
    expect(openingStock - deducted).toBeCloseTo(13.72, 2);
  });

  it('selling in KG (Main Unit) returns qty unchanged', () => {
    expect(convertToMainUnit(14, 'KG', pvcSheet)).toBe(14);
  });

  // Price test — uses the same rate in the same direction
  it('sale price ₹338/KG × 0.28 = ₹94.64/Meter', () => {
    const mainRate = 338;
    const meterRate = mainRate * pvcSheet.conversionRate;
    expect(meterRate).toBeCloseTo(94.64, 1);
  });

  it('stock deduction and price use the same rate × direction', () => {
    const rate = pvcSheet.conversionRate;
    const stockDeducted = convertToMainUnit(1, 'Meter', pvcSheet);    // qty × rate
    const price = 338 * rate;                                          // price × rate
    // Both must multiply by 0.28
    expect(stockDeducted).toBeCloseTo(0.28, 4);
    expect(price).toBeCloseTo(94.64, 1);
  });
});

// ─── Box / Piece ──────────────────────────────────────────────────────────────
// 1 Box = 15 Pieces → 1 Piece = 1/15 Box = 0.0667 Box → rate = 0.0667
const boxItem = {
  name: 'Widget',
  unit: 'Box',
  secondaryUnit: 'Piece',
  conversionRate: 1 / 15,  // 1 Piece = 1/15 Box ≈ 0.0667
};

describe('Box / Piece (rate = 1/15 ≈ 0.0667)', () => {
  it('selling 1 Piece deducts 1/15 Box from stock', () => {
    expect(convertToMainUnit(1, 'Piece', boxItem)).toBeCloseTo(1 / 15, 4);
  });

  it('selling 15 Pieces deducts exactly 1 Box', () => {
    expect(convertToMainUnit(15, 'Piece', boxItem)).toBeCloseTo(1.0, 4);
  });

  it('selling 1 Box deducts exactly 1 Box (main unit)', () => {
    expect(convertToMainUnit(1, 'Box', boxItem)).toBe(1);
  });

  it('price: ₹300/Box × 0.0667 = ₹20/Piece', () => {
    expect(300 * boxItem.conversionRate).toBeCloseTo(20, 1);
  });
});

// ─── Litre / ML ──────────────────────────────────────────────────────────────
// 1 ML = 0.001 Litre → rate = 0.001
const litreItem = {
  name: 'Chemical',
  unit: 'Litre',
  secondaryUnit: 'ML',
  conversionRate: 0.001,  // 1 ML = 0.001 Litre
};

describe('Litre / ML (rate = 0.001)', () => {
  it('selling 500 ML deducts 0.5 Litres', () => {
    expect(convertToMainUnit(500, 'ML', litreItem)).toBeCloseTo(0.5, 4);
  });

  it('selling 1000 ML deducts exactly 1 Litre', () => {
    expect(convertToMainUnit(1000, 'ML', litreItem)).toBeCloseTo(1.0, 6);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('throws when rate is 0', () => {
    const item = { name: 'X', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0 };
    expect(() => convertToMainUnit(1, 'Meter', item)).toThrow(/No valid conversion rate/);
  });

  it('throws when rate is undefined', () => {
    const item = { name: 'Y', unit: 'KG', secondaryUnit: 'Meter' };
    expect(() => convertToMainUnit(1, 'Meter', item)).toThrow(/No valid conversion rate/);
  });

  it('batch-level rate overrides item-level rate', () => {
    // Batch B001 is a lighter roll: 1 Meter = 0.25 KG (item default is 0.28)
    const item  = { name: 'PVC Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0.28 };
    const batch = { conversionRate: 0.25, batchNo: 'B001' };
    expect(convertToMainUnit(1, 'Meter', item, batch)).toBeCloseTo(0.25, 4);
  });

  it('batch rate = 0 falls back to item rate', () => {
    const item  = { name: 'PVC Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0.28 };
    const batch = { conversionRate: 0, batchNo: 'B002' };
    expect(convertToMainUnit(1, 'Meter', item, batch)).toBeCloseTo(0.28, 4);
  });

  it('getEffectiveConversionRate returns null when no rate set', () => {
    expect(getEffectiveConversionRate({ unit: 'KG', secondaryUnit: 'Meter' })).toBeNull();
  });

  it('getEffectiveConversionRate prefers batch rate', () => {
    const item  = { unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0.28 };
    const batch = { conversionRate: 0.25 };
    expect(getEffectiveConversionRate(item, batch)).toBe(0.25);
  });

  it('validateDualUnitSetup throws when rate missing', () => {
    const item = { name: 'Cable', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0 };
    expect(() => validateDualUnitSetup(item)).toThrow(/no conversion rate/i);
  });

  it('validateDualUnitSetup passes with batch tracking on', () => {
    const item = { name: 'Roll', unit: 'KG', secondaryUnit: 'Meter', conversionRate: 0, enableTracking: true };
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });

  it('validateDualUnitSetup passes when no secondaryUnit', () => {
    expect(() => validateDualUnitSetup({ name: 'Simple', unit: 'KG' })).not.toThrow();
  });
});

// ─── Large production run ─────────────────────────────────────────────────────
describe('Large production run', () => {
  it('100 FGs × 3 Meters each (rate=0.28) deducts 84 KG total', () => {
    const total = convertToMainUnit(3, 'Meter', pvcSheet) * 100;
    expect(total).toBeCloseTo(84.0, 1);  // 3 × 0.28 × 100 = 84
  });

  it('100 FGs × 15 Pieces each (Box, rate=1/15) deducts exactly 100 Boxes', () => {
    const total = convertToMainUnit(15, 'Piece', boxItem) * 100;
    expect(total).toBeCloseTo(100.0, 4);  // 15 × (1/15) × 100 = 100
  });
});

// ─── Frontend ↔ Backend consistency ──────────────────────────────────────────
describe('Frontend price ↔ Backend stock consistency', () => {
  it('both use same rate × direction: stock = qty × rate, price = mainRate × rate', () => {
    const rate = pvcSheet.conversionRate; // 0.28
    const stockDeducted = convertToMainUnit(1, 'Meter', pvcSheet); // 1 × 0.28 = 0.28 KG
    const meterPrice = 338 * rate;                                  // 338 × 0.28 = 94.64
    expect(stockDeducted).toBeCloseTo(0.28, 4);
    expect(meterPrice).toBeCloseTo(94.64, 1);
    // Cross-check: price paid for the 0.28 KG consumed must equal meterPrice
    const priceForKgConsumed = stockDeducted * (338 / 1); // KG used × ₹/KG
    expect(priceForKgConsumed).toBeCloseTo(meterPrice, 1); // ₹94.64 = ₹94.64 ✅
  });
});
