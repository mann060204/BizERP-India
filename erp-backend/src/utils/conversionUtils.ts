/**
 * conversionUtils.ts
 * ──────────────────────────────────────────────────────────────────
 * Single source of truth for dual-unit stock conversion.
 *
 * CANONICAL DEFINITION (Definition A — the only definition used everywhere):
 *   item.unit           = Main Unit  (stock is ALWAYS tracked in this unit)
 *   item.secondaryUnit  = Second Unit (used for billing / BOM entry)
 *   item.conversionRate = "1 Second Unit = conversionRate × Main Units"
 *                         e.g. 1 Meter = 0.28 KG   → rate = 0.28
 *                         e.g. 1 Piece = 0.0667 Box → rate = 0.0667  (Box/15)
 *                         e.g. 1 ML    = 0.001 Litre → rate = 0.001
 *
 * STOCK DEDUCTION formula:
 *   qty entered in Second Unit × rate = qty deducted from Main Unit stock
 *   e.g. 1 Meter × 0.28 = 0.28 KG deducted from stock
 *
 * PRICE formula (same rate, same direction):
 *   pricePerSecondUnit = pricePerMainUnit × rate
 *   e.g. ₹338/KG × 0.28 = ₹94.64/Meter
 *
 * Both formulas multiply by the SAME rate — there is no separate inversion.
 *
 * Per-batch override:
 *   batch.conversionRate takes precedence over item.conversionRate
 *   (used for PVC rolls / sheets where each roll has a different weight/length)
 */

export interface ConversionItem {
  name?: string;
  unit: string;           // Main Unit
  secondaryUnit?: string; // Second Unit (optional)
  conversionRate?: number; // 1 Second Unit = conversionRate × Main Units
  enableTracking?: boolean; // true = batch-level rate required
}

export interface ConversionBatch {
  conversionRate?: number;
  batchNo?: string;
}

/**
 * Convert a quantity from whichever unit was entered → Main Unit.
 *
 * Rate resolution priority:
 *   1. batch.conversionRate  (batch-level, most specific)
 *   2. item.conversionRate   (item-level default)
 *
 * Formula:
 *   Main Unit qty = enteredQty × conversionRate
 *   (because rate = "1 Second Unit = rate Main Units")
 *
 *   Example: 1 Meter entered, rate = 0.28 (1 Meter = 0.28 KG)
 *            → 1 × 0.28 = 0.28 KG deducted from stock
 *
 * @param qty           Quantity as entered by user
 * @param unitSelected  Unit the user chose (item.unit OR item.secondaryUnit)
 * @param item          Product / RM item record
 * @param batch         Optional: batch record (for batch-tracked items)
 * @returns             Equivalent quantity in Main Unit
 */
export function convertToMainUnit(
  qty: number,
  unitSelected: string,
  item: ConversionItem,
  batch?: ConversionBatch | null
): number {
  // If user picked the main unit — no conversion needed
  if (unitSelected === item.unit) {
    return qty;
  }

  // Resolve conversion rate: batch > item, but only if batch rate is a positive number.
  // Zero or negative batch rate is treated as "not set" — fall back to item rate.
  const batchRate = batch?.conversionRate && batch.conversionRate > 0 ? batch.conversionRate : null;
  const rate = batchRate ?? item.conversionRate ?? 0;

  if (!rate || rate <= 0) {
    throw new Error(
      `No valid conversion rate for item "${item.name || 'unknown'}". ` +
      `Set a conversion rate (1 ${item.secondaryUnit} = ? ${item.unit}) before using Second Unit.`
    );
  }

  // rate = "1 Second Unit = rate Main Units"
  // qty in Second Unit → Main Unit = qty × rate
  return qty * rate;
}

/**
 * Validate that an item's dual-unit configuration is complete before
 * allowing a Second Unit transaction to proceed.
 *
 * Throws an Error if configuration is incomplete.
 */
export function validateDualUnitSetup(item: ConversionItem): void {
  if (!item.secondaryUnit) return; // No second unit configured → nothing to validate

  const hasItemRate = item.conversionRate && item.conversionRate > 0;
  const isBatchTracked = item.enableTracking === true;

  if (!hasItemRate && !isBatchTracked) {
    throw new Error(
      `Item "${item.name || 'unknown'}" has Second Unit "${item.secondaryUnit}" configured ` +
      `but no conversion rate is set and batch tracking is OFF. ` +
      `Either set a conversion rate or enable "Track by Batch".`
    );
  }
}

/**
 * Get the effective conversion rate for a given item+batch combination.
 * Returns null if no rate is available (caller should handle).
 */
export function getEffectiveConversionRate(
  item: ConversionItem,
  batch?: ConversionBatch | null
): number | null {
  const rate = batch?.conversionRate ?? item.conversionRate;
  return (rate && rate > 0) ? rate : null;
}
