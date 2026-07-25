/**
 * conversionUtils.ts
 * ──────────────────────────────────────────────────────────────────
 * Single source of truth for dual-unit stock conversion.
 *
 * CANONICAL DEFINITION (Definition B — matches stored data):
 *   item.unit           = Main Unit  (stock is ALWAYS tracked in this unit)
 *   item.secondaryUnit  = Second Unit (used for billing / BOM entry)
 *   item.conversionRate = "1 Main Unit = conversionRate Second Units"
 *                         e.g. 1 Box = 15 Pieces  → rate = 15
 *                         e.g. 1 KG  = 3.571 MTRS → rate = 3.571
 *                         e.g. 1 Ltr = 1000 ML    → rate = 1000
 *
 * STOCK DEDUCTION formula (Second Unit → Main Unit):
 *   qty in Second Unit ÷ rate = qty deducted from Main Unit stock
 *   e.g. 1 Piece ÷ 15 = 0.0667 Box
 *   e.g. 1 MTRS  ÷ 3.571 = 0.28 KG
 *
 * PRICE formula (same rate, same direction):
 *   pricePerSecondUnit = pricePerMainUnit ÷ rate
 *   e.g. ₹300/Box ÷ 15 = ₹20/Piece
 *   e.g. ₹338/KG  ÷ 3.571 = ₹94.64/MTRS
 *
 * INVERSE (for display only — not stored):
 *   1 Second Unit = (1 / rate) Main Units
 *   e.g. 1 Piece = 0.0667 Box
 *   e.g. 1 MTRS  = 0.280 KG
 *
 * Per-batch override:
 *   batch.conversionRate takes precedence over item.conversionRate
 */

export interface ConversionItem {
  name?: string;
  unit: string;           // Main Unit
  secondaryUnit?: string; // Second Unit (optional)
  conversionRate?: number; // 1 Main Unit = conversionRate Second Units
  enableTracking?: boolean; // true = batch-level rate required
}

export interface ConversionBatch {
  conversionRate?: number;
  batchNo?: string;
}

/**
 * Convert a quantity entered in Second Unit → Main Unit for stock deduction.
 *
 * Formula: Main Unit qty = enteredQty / conversionRate
 *
 * Examples:
 *   1 Piece ÷ 15 = 0.0667 Box
 *   1 MTRS  ÷ 3.571 = 0.28 KG
 *   50 MTRS ÷ 3.571 = 14 KG
 */
export function convertToMainUnit(
  qty: number,
  unitSelected: string,
  item: ConversionItem,
  batch?: ConversionBatch | null
): number {
  if (unitSelected === item.unit) return qty; // no conversion needed

  const batchRate = batch?.conversionRate && batch.conversionRate > 0 ? batch.conversionRate : null;
  const rate = batchRate ?? item.conversionRate ?? 0;

  if (!rate || rate <= 0) {
    throw new Error(
      `No valid conversion rate for item "${item.name || 'unknown'}". ` +
      `Set a conversion rate (1 ${item.unit} = ? ${item.secondaryUnit}) before using Second Unit.`
    );
  }

  return qty / rate; // DIVIDE: 1 Second Unit = (1/rate) Main Units
}

/**
 * Validate that an item's dual-unit config is complete before a Second Unit
 * transaction proceeds. Throws if incomplete.
 */
export function validateDualUnitSetup(item: ConversionItem): void {
  if (!item.secondaryUnit) return;
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
 */
export function getEffectiveConversionRate(
  item: ConversionItem,
  batch?: ConversionBatch | null
): number | null {
  const rate = batch?.conversionRate ?? item.conversionRate;
  return (rate && rate > 0) ? rate : null;
}
