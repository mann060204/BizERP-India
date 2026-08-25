/**
 * unitConversion.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared unit-rate conversion utilities for the ERP frontend.
 *
 * CANONICAL DEFINITION B (matches stored data in DB):
 *   conversionRate = "1 Main Unit = rate × Second Units"
 *   e.g. 1 Box = 15 Pieces  → rate = 15
 *   e.g. 1 KG  = 3.571 MTRS → rate = 3.571
 *
 * FORMULAS (both use DIVIDE — same direction):
 *   Stock deduction:  qty (Second Unit) ÷ rate = qty deducted (Main Unit)
 *   Price per Second: mainPrice ÷ rate          = price per Second Unit
 *
 * INVERSE (computed on-the-fly for display only, never stored):
 *   1 Second Unit = (1/rate) Main Units
 *   e.g. 1 Piece = 0.0667 Box  (1/15)
 *   e.g. 1 MTRS  = 0.280 KG    (1/3.571)
 *
 * Consumed by:
 *   - Sales Invoice (sales/new/page.tsx)
 *   - BOM (manufacturing/bom/page.tsx)
 *   - Item Master modals (items/page.tsx, QuickAddItemModal.tsx)
 */

/**
 * Returns the correct per-unit cost/rate for the selected unit.
 *
 * @example
 *   // Box (₹300), rate=15: 1 Box = 15 Pieces
 *   getRateForUnit(300, 15, 'SECOND') // → 20  (300/15 = ₹20/Piece)
 *   getRateForUnit(300, 15, 'MAIN')   // → 300
 */
export function getRateForUnit(
  mainUnitRate: number,
  conversionRate: number | null | undefined,
  selectedUnitType: 'MAIN' | 'SECOND'
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return mainUnitRate / conversionRate;   // DIVIDE — same as stock deduction
  }
  return mainUnitRate;
}

/**
 * Price/rate lookup by unit name (used by Sales Invoice unit dropdown).
 *
 * @example
 *   getRateForUnitByName(338, 3.571, 'MTRS', 'KG', 'MTRS') // → 94.64
 *   getRateForUnitByName(338, 3.571, 'KG',   'KG', 'MTRS') // → 338
 */
export function getRateForUnitByName(
  mainUnitRate: number,
  conversionRate: number | null | undefined,
  newUnit: string,
  primaryUnit: string,
  secondaryUnit: string | undefined,
  secSalePrice?: number | null
): number {
  if (newUnit === secondaryUnit) {
    if (secSalePrice && secSalePrice > 0) return secSalePrice;
    if (conversionRate && conversionRate > 0) return mainUnitRate / conversionRate;
    return mainUnitRate;
  }
  return mainUnitRate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Primary label: "1 {mainUnit} = {rate} {secondUnit}"
 * @example conversionLabel('KG', 'MTRS', 3.571) → "1 KG = 3.571 MTRS"
 */
export function conversionLabel(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `1 ${mainUnit} = ${factor ?? '?'} ${secondUnit}`;
}

/**
 * Inverse label: "1 {secondUnit} = {(1/rate).toFixed(4)} {mainUnit}"
 * @example conversionInverseLabel('KG', 'MTRS', 3.571) → "1 MTRS = 0.2801 KG"
 */
export function conversionInverseLabel(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  if (!factor || factor <= 0) return `1 ${secondUnit} = ? ${mainUnit}`;
  const inv = (1 / factor);
  // Display up to 4 significant figures
  const display = inv < 0.01 ? inv.toPrecision(3) : inv.toFixed(4).replace(/\.?0+$/, '');
  return `1 ${secondUnit} = ${display} ${mainUnit}`;
}

/**
 * Full dual-rate summary: "1 KG = 3.571 MTRS | 1 MTRS = 0.280 KG"
 */
export function conversionSummary(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `${conversionLabel(mainUnit, secondUnit, factor)} | ${conversionInverseLabel(mainUnit, secondUnit, factor)}`;
}

/**
 * Full note with stock deduction explanation.
 */
export function conversionNote(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  const inv = factor && factor > 0 ? (1 / factor) : null;
  const invDisplay = inv !== null ? inv.toFixed(4).replace(/\.?0+$/, '') : '?';
  return `1 ${mainUnit} = ${factor ?? '?'} ${secondUnit} | 1 ${secondUnit} = ${invDisplay} ${mainUnit} | Selling 1 ${secondUnit} deducts ${invDisplay} ${mainUnit} from stock`;
}

/**
 * Computes Main Unit stock deducted for qty entered in Second Unit.
 *
 * Formula: qty / rate  (DIVIDE)
 *
 * @example
 *   getStockDeduction(1,  'SECOND', 15)    // → 0.0667  (1 Piece → 1/15 Box)
 *   getStockDeduction(1,  'SECOND', 3.571) // → 0.28    (1 MTRS  → 1/3.571 KG)
 *   getStockDeduction(50, 'SECOND', 3.571) // → 14.0    (50 MTRS → 14 KG)
 *   getStockDeduction(1,  'MAIN',   3.571) // → 1.0     (no conversion)
 */
export function getStockDeduction(
  qty: number,
  selectedUnitType: 'MAIN' | 'SECOND',
  conversionRate: number | null | undefined
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return qty / conversionRate;
  }
  return qty;
}

/**
 * Gets the applicable conversion rate based on the item and units.
 */
export function getConversionRate(
  stockUnit: string,
  sellingUnit: string,
  item: { unit?: string; secondaryUnit?: string; conversionRate?: number }
): number {
  if (stockUnit !== sellingUnit && sellingUnit === item.secondaryUnit && item.conversionRate && item.conversionRate > 0) {
    return item.conversionRate;
  }
  return 1;
}

/**
 * Converts a quantity from one unit to another (e.g. from stock unit to selling unit or vice versa).
 */
export function convertQuantity(
  qty: number,
  fromUnit: string,
  toUnit: string,
  item: { unit?: string; secondaryUnit?: string; conversionRate?: number }
): number {
  if (fromUnit === toUnit) return qty;
  
  const rate = getConversionRate(item.unit || '', item.secondaryUnit || '', item);
  if (rate === 1) return qty; // No valid conversion

  // Converting from Main to Secondary
  if (fromUnit === item.unit && toUnit === item.secondaryUnit) {
    return qty * rate;
  }
  
  // Converting from Secondary to Main
  if (fromUnit === item.secondaryUnit && toUnit === item.unit) {
    return qty / rate;
  }

  return qty;
}

