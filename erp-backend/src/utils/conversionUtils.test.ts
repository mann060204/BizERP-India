/**
 * conversionUtils.test.ts
 * ─────────────────────────────────────────────────────────────────
 * CANONICAL DEFINITION B:
 *   conversionRate = "1 Main Unit = rate × Second Units"
 *   e.g. 1 Box = 15 Pieces   → rate = 15
 *   e.g. 1 KG  = 3.571 MTRS  → rate = 3.571
 *
 *   Stock deduction: qty / rate  (DIVIDE)
 *   Price per Second: mainPrice / rate  (DIVIDE — same direction)
 *
 * Run: npx jest src/utils/conversionUtils.test.ts
 */

import { convertToMainUnit, getEffectiveConversionRate, validateDualUnitSetup } from './conversionUtils';

// ─── KG / MTRS — PVC Strip/Sheet example ─────────────────────────────────────
// 1 Roll = 14 KG = 50 MTRS → 1 KG = 3.571 MTRS → rate = 3.571
// Inverse shown in UI: 1 MTRS = 0.280 KG (= 1/3.571)
const pvcItem = {
  name: 'PVC Strip',
  unit: 'KG',
  secondaryUnit: 'MTRS',
  conversionRate: 3.571,   // 1 KG = 3.571 MTRS
};

describe('KG / MTRS — PVC Strip (rate = 3.571)', () => {
  it('sell 1 MTRS → deducts 0.280 KG (1 / 3.571)', () => {
    expect(convertToMainUnit(1, 'MTRS', pvcItem)).toBeCloseTo(0.28, 2);
  });

  it('sell 50 MTRS → deducts 14 KG (= 1 full Roll)', () => {
    expect(convertToMainUnit(50, 'MTRS', pvcItem)).toBeCloseTo(14.0, 1);
  });

  it('sell in KG (Main Unit) → returns qty unchanged', () => {
    expect(convertToMainUnit(14, 'KG', pvcItem)).toBe(14);
  });

  it('stock balance: 14 KG − 1 MTRS = 13.72 KG', () => {
    const bal = 14 - convertToMainUnit(1, 'MTRS', pvcItem);
    expect(bal).toBeCloseTo(13.72, 2);
  });

  it('price: ₹338/KG ÷ 3.571 = ₹94.64/MTRS', () => {
    expect(338 / pvcItem.conversionRate).toBeCloseTo(94.64, 1);
  });

  it('inverse rate display: 1/3.571 = 0.280 KG per MTRS', () => {
    expect(1 / pvcItem.conversionRate).toBeCloseTo(0.28, 3);
  });
});

// ─── Box / Pieces ─────────────────────────────────────────────────────────────
// 1 Box = 15 Pieces → rate = 15
// Inverse: 1 Piece = 0.0667 Box (= 1/15)
const boxItem = {
  name: 'Widget',
  unit: 'Box',
  secondaryUnit: 'Pieces',
  conversionRate: 15,   // 1 Box = 15 Pieces
};

describe('Box / Pieces (rate = 15)', () => {
  it('sell 1 Piece → deducts 0.0667 Box (1/15)', () => {
    expect(convertToMainUnit(1, 'Pieces', boxItem)).toBeCloseTo(1 / 15, 4);
  });

  it('sell 15 Pieces → deducts exactly 1 Box', () => {
    expect(convertToMainUnit(15, 'Pieces', boxItem)).toBeCloseTo(1, 6);
  });

  it('sell 1 Box → deducts 1 Box (main unit)', () => {
    expect(convertToMainUnit(1, 'Box', boxItem)).toBe(1);
  });

  it('price: ₹300/Box ÷ 15 = ₹20/Piece', () => {
    expect(300 / boxItem.conversionRate).toBeCloseTo(20, 2);
  });

  it('inverse rate: 1/15 = 0.0667 Box per Piece', () => {
    expect(1 / boxItem.conversionRate).toBeCloseTo(0.0667, 3);
  });
});

// ─── Litre / ML ───────────────────────────────────────────────────────────────
const litreItem = {
  name: 'Chemical',
  unit: 'Ltr',
  secondaryUnit: 'ML',
  conversionRate: 1000,  // 1 Ltr = 1000 ML
};

describe('Litre / ML (rate = 1000)', () => {
  it('sell 500 ML → deducts 0.5 Ltr', () => {
    expect(convertToMainUnit(500, 'ML', litreItem)).toBeCloseTo(0.5, 4);
  });

  it('sell 1000 ML → deducts 1 Ltr', () => {
    expect(convertToMainUnit(1000, 'ML', litreItem)).toBeCloseTo(1.0, 6);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('throws when rate = 0', () => {
    const item = { name: 'X', unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 0 };
    expect(() => convertToMainUnit(1, 'MTRS', item)).toThrow(/No valid conversion rate/);
  });

  it('throws when rate undefined', () => {
    const item = { name: 'Y', unit: 'Box', secondaryUnit: 'Pieces' };
    expect(() => convertToMainUnit(1, 'Pieces', item)).toThrow(/No valid conversion rate/);
  });

  it('batch rate overrides item rate', () => {
    const item  = { name: 'PVC', unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 3.571 };
    const batch = { conversionRate: 4.0, batchNo: 'B001' }; // lighter roll: 1 KG = 4 MTRS
    expect(convertToMainUnit(1, 'MTRS', item, batch)).toBeCloseTo(0.25, 4); // 1/4 = 0.25
  });

  it('batch rate = 0 falls back to item rate', () => {
    const item  = { name: 'PVC', unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 3.571 };
    const batch = { conversionRate: 0 };
    expect(convertToMainUnit(1, 'MTRS', item, batch)).toBeCloseTo(0.28, 2);
  });

  it('getEffectiveConversionRate returns null when no rate', () => {
    expect(getEffectiveConversionRate({ unit: 'KG', secondaryUnit: 'MTRS' })).toBeNull();
  });

  it('getEffectiveConversionRate prefers batch rate', () => {
    const item  = { unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 3.571 };
    const batch = { conversionRate: 4.0 };
    expect(getEffectiveConversionRate(item, batch)).toBe(4.0);
  });

  it('validateDualUnitSetup throws when rate missing', () => {
    const item = { name: 'Cable', unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 0 };
    expect(() => validateDualUnitSetup(item)).toThrow(/no conversion rate/i);
  });

  it('validateDualUnitSetup passes with batch tracking', () => {
    const item = { unit: 'KG', secondaryUnit: 'MTRS', conversionRate: 0, enableTracking: true };
    expect(() => validateDualUnitSetup(item)).not.toThrow();
  });

  it('validateDualUnitSetup passes with no secondaryUnit', () => {
    expect(() => validateDualUnitSetup({ unit: 'KG' })).not.toThrow();
  });
});

// ─── Large production run ─────────────────────────────────────────────────────
describe('Large production run', () => {
  it('100 FGs × 3 MTRS each (rate=3.571) deducts ≈ 84 KG', () => {
    const total = convertToMainUnit(3, 'MTRS', pvcItem) * 100;
    expect(total).toBeCloseTo(84.0, 0); // (3/3.571) × 100 ≈ 84
  });

  it('100 FGs × 15 Pieces each (rate=15) deducts exactly 100 Boxes', () => {
    const total = convertToMainUnit(15, 'Pieces', boxItem) * 100;
    expect(total).toBeCloseTo(100.0, 4); // (15/15) × 100 = 100
  });
});

// ─── Price ↔ Stock consistency ────────────────────────────────────────────────
describe('Price / stock use same rate ÷ direction', () => {
  it('PVC: price = 338 ÷ 3.571 = 94.64, stock = 1 ÷ 3.571 = 0.28', () => {
    const rate = pvcItem.conversionRate;
    const stockDeducted = convertToMainUnit(1, 'MTRS', pvcItem);
    const meterPrice    = 338 / rate;
    expect(stockDeducted).toBeCloseTo(0.28, 2);
    expect(meterPrice).toBeCloseTo(94.64, 1);
    // Cross-check: price per KG consumed must equal ₹338
    expect(meterPrice / stockDeducted).toBeCloseTo(338, 1);
  });
});
