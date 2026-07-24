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
