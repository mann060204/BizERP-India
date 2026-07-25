/**
 * unitConversion.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared unit-rate conversion utilities for the ERP frontend.
 *
 * CANONICAL DEFINITION A (the only definition — used everywhere):
 *   conversionRate = "1 Second Unit = conversionRate × Main Units"
 *   e.g. 1 Meter = 0.28 KG  →  rate = 0.28
 *   e.g. 1 Piece = 0.0667 Box → rate = 0.0667
 *
 * STOCK DEDUCTION:  qty (Second Unit) × rate  = qty deducted (Main Unit)
 * PRICE:            mainPrice × rate            = price per Second Unit
 *
 * Both multiply by the SAME rate. No division. No inversion.
 *
 * Consumed by:
 *   - Sales Invoice (sales/new/page.tsx) — unit dropdown onChange
 *   - BOM (manufacturing/bom/page.tsx)  — unit type toggle + stock tooltip
 *   - Item Master modals (items/page.tsx, QuickAddItemModal.tsx) — label display
 */

/**
 * Returns the correct per-unit cost/rate for the selected unit.
 *
 * conversionRate = "1 Second Unit = rate × Main Units"
 * → price per Second Unit = mainRate × rate
 *
 * @example
 *   // PVC Sheet: Main=KG (₹338), Second=Meter, 1 Meter = 0.28 KG
 *   getRateForUnit(338, 0.28, 'SECOND') // → 94.64
 *   getRateForUnit(338, 0.28, 'MAIN')   // → 338
 */
export function getRateForUnit(
  mainUnitRate: number,
  conversionRate: number | null | undefined,
  selectedUnitType: 'MAIN' | 'SECOND'
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return mainUnitRate * conversionRate;   // MULTIPLY — same as stock deduction
  }
  return mainUnitRate;
}

/**
 * Price/rate lookup by unit name (used by Sales Invoice unit dropdown).
 *
 * @example
 *   getRateForUnitByName(338, 0.28, 'Meter', 'KG', 'Meter') // → 94.64
 *   getRateForUnitByName(338, 0.28, 'KG',    'KG', 'Meter') // → 338
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
    // Prefer an explicitly-set secondary sale price if available
    if (secSalePrice && secSalePrice > 0) return secSalePrice;
    // Otherwise derive: mainRate × rate
    if (conversionRate && conversionRate > 0) return mainUnitRate * conversionRate;
    return mainUnitRate;
  }
  return mainUnitRate; // main unit — no change
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers — always render as "1 [Second Unit] = [rate] [Main Unit]"
// This matches how users enter the rate in the Item Master:
//   "1 Meter = 0.28 KG" → user types 0.28
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the canonical conversion label: "1 {secondUnit} = {factor} {mainUnit}"
 * @example conversionLabel('KG', 'Meter', 0.28) → "1 Meter = 0.28 KG"
 */
export function conversionLabel(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `1 ${secondUnit} = ${factor ?? '?'} ${mainUnit}`;
}

/**
 * Returns the full conversion note.
 * @example conversionNote('KG', 'Meter', 0.28)
 *   → "1 Meter = 0.28 KG | Selling in Meter deducts 0.28 KG from stock per unit"
 */
export function conversionNote(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `1 ${secondUnit} = ${factor ?? '?'} ${mainUnit} | Selling in ${secondUnit} deducts ${factor ?? '?'} ${mainUnit} from stock per unit`;
}

/**
 * Computes Main Unit stock deducted for a given qty entered in Second Unit.
 *
 * Formula: qty × rate  (MULTIPLY — same direction as price)
 *
 * @example
 *   getStockDeduction(1,  'SECOND', 0.28) // → 0.28  (1 Meter → 0.28 KG)
 *   getStockDeduction(50, 'SECOND', 0.28) // → 14.0  (50 Meters → 14 KG)
 *   getStockDeduction(1,  'MAIN',   0.28) // → 1.0   (1 KG → 1 KG, no conversion)
 */
export function getStockDeduction(
  qty: number,
  selectedUnitType: 'MAIN' | 'SECOND',
  conversionRate: number | null | undefined
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return qty * conversionRate;   // MULTIPLY — same direction as price formula
  }
  return qty;
}
