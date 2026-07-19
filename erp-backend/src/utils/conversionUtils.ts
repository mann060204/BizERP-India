/**
 * conversionUtils.ts
 * ──────────────────────────────────────────────────────────────────
 * Single source of truth for dual-unit stock conversion.
 *
 * Convention stored on every item:
 *   item.unit           = Main Unit  (stock is ALWAYS tracked in this unit)
 *   item.secondaryUnit  = Second Unit (used for billing / BOM entry)
 *   item.conversionRate = 1 Second Unit → X Main Unit
 *                         e.g. 1 Meter = 0.85 Kg → rate = 0.85
 *
 * Per-batch override:
 *   batch.conversionRate takes precedence over item.conversionRate
 *   (used for PVC rolls / sheets where each roll has a different weight/length)
 */

export interface ConversionItem {
  name?: string;
  unit: string;           // Main Unit
  secondaryUnit?: string; // Second Unit (optional)
  conversionRate?: number; // 1 second unit = X main units
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

  // Resolve conversion rate: batch > item
  const rate = (batch?.conversionRate ?? item.conversionRate) || 0;

  if (!rate || rate <= 0) {
    throw new Error(
      `No valid conversion rate for item "${item.name || 'unknown'}". ` +
      `Set a conversion rate (1 ${item.secondaryUnit} = ? ${item.unit}) before using Second Unit.`
    );
  }

  // rate = "1 Second Unit = rate Main Units"
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
