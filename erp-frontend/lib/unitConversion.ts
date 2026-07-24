/**
 * unitConversion.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared unit-rate conversion utilities for the ERP frontend.
 *
 * CANONICAL DEFINITION:
 *   conversionRate is stored as: "1 Main Unit = conversionRate Second Units"
 *   e.g. 1 Feet = 12 Inch  →  conversionRate = 12
 *
 * CONSEQUENCE:
 *   Cost / Rate per 1 Second Unit = Main Unit Rate ÷ conversionRate
 *   e.g. ₹350 / Feet ÷ 12 = ₹29.17 / Inch
 *
 * This function is consumed by:
 *   - Sales Invoice (sales/new/page.tsx) — unit dropdown onChange
 *   - BOM (manufacturing/bom/page.tsx)  — unit type toggle (MAIN / SECOND)
 *
 * Adding it to any future screen: import getRateForUnit and call with the
 * three parameters below. Never duplicate the division inline again.
 */

/**
 * Returns the correct per-unit rate/cost for the selected unit.
 *
 * @param mainUnitRate    The rate/cost when selling or consuming in Main Unit.
 * @param conversionRate  1 Main Unit = conversionRate Second Units.
 *                        Pass null/undefined/0 if no second unit exists.
 * @param selectedUnitType  'MAIN' or 'SECOND'
 * @returns The adjusted rate for the given unit selection.
 *
 * @example
 *   // Fabric: Main = Feet (₹350), Second = Inch, 1 Feet = 12 Inch
 *   getRateForUnit(350, 12, 'SECOND') // → 29.17
 *   getRateForUnit(350, 12, 'MAIN')   // → 350
 *   getRateForUnit(350, 0, 'SECOND')  // → 350  (no rate configured, fallback)
 */
export function getRateForUnit(
  mainUnitRate: number,
  conversionRate: number | null | undefined,
  selectedUnitType: 'MAIN' | 'SECOND'
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return mainUnitRate / conversionRate;
  }
  return mainUnitRate;
}

/**
 * Same logic expressed for the Sales Invoice's unit dropdown, where the unit is
 * identified by name rather than 'MAIN'/'SECOND' enum.
 *
 * @param mainUnitRate       Rate when unit === primaryUnit (Main Unit)
 * @param conversionRate     1 Main Unit = conversionRate Second Units
 * @param newUnit            The newly selected unit string
 * @param primaryUnit        The item's Main Unit string
 * @param secondaryUnit      The item's Second Unit string (may be undefined)
 * @param secSalePrice       Optional fixed secondary sale price (overrides derived rate)
 * @returns The adjusted rate for the selected unit
 *
 * @example
 *   // Fabric: primaryUnit='Feet', secondaryUnit='Inch', mainUnitRate=350, conversionRate=12
 *   getRateForUnitByName(350, 12, 'Inch', 'Feet', 'Inch') // → 29.17
 *   getRateForUnitByName(350, 12, 'Feet', 'Feet', 'Inch') // → 350
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
    // Prefer explicit secSalePrice if set; otherwise derive from main rate
    if (secSalePrice && secSalePrice > 0) return secSalePrice;
    if (conversionRate && conversionRate > 0) return mainUnitRate / conversionRate;
    return mainUnitRate;
  }
  // newUnit === primaryUnit (or any other unit — fall back to main rate)
  return mainUnitRate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label-rendering helpers — use these in UI instead of inlining the string.
// CANONICAL FORMAT (non-negotiable):  1 [MainUnit] = [Factor] [SecondUnit]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the canonical conversion label string.
 * @example conversionLabel('Feet', 'Inch', 12) → "1 Feet = 12 Inch"
 */
export function conversionLabel(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `1 ${mainUnit} = ${factor ?? '?'} ${secondUnit}`;
}

/**
 * Returns the full conversion note with stock-deduction explanation.
 * @example conversionNote('Feet', 'Inch', 12)
 *   → "1 Feet = 12 Inch | Selling in Inch deducts proportionally from Feet stock"
 */
export function conversionNote(
  mainUnit: string,
  secondUnit: string,
  factor: number | null | undefined
): string {
  return `1 ${mainUnit} = ${factor ?? '?'} ${secondUnit} | Selling in ${secondUnit} deducts proportionally from ${mainUnit} stock`;
}

/**
 * Computes how many Main Unit items are deducted from stock for a given
 * quantity entered in the selected unit.
 *
 * KEY RULE:
 *   conversionRate = "1 Main Unit = conversionRate Second Units"
 *   e.g. 1 Box = 15 Pieces  →  conversionRate = 15
 *
 *   MAIN selected:   deduction = qty                    (already in main unit)
 *   SECOND selected: deduction = qty / conversionRate   (DIVIDE, never multiply)
 *
 * @example
 *   getStockDeduction(1, 'SECOND', 15) // → 0.0667  (1 Piece = 1/15 Box)
 *   getStockDeduction(1, 'MAIN',   15) // → 1.0000  (1 Box   = 1 Box)
 *   getStockDeduction(3, 'SECOND', 12) // → 0.25    (3 Inch  = 3/12 Feet)
 */
export function getStockDeduction(
  qty: number,
  selectedUnitType: 'MAIN' | 'SECOND',
  conversionRate: number | null | undefined
): number {
  if (selectedUnitType === 'SECOND' && conversionRate && conversionRate > 0) {
    return qty / conversionRate;
  }
  return qty; // MAIN unit or no conversion configured
}
