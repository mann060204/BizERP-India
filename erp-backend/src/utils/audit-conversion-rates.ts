/**
 * audit-conversion-rates.ts
 * ─────────────────────────────────────────────────────────────────────────────────
 * Audit script: lists all items with a dual-unit conversion rate configured,
 * so you can verify each one is using the correct Definition B direction:
 *
 *   conversionRate = "1 Main Unit = conversionRate Second Units"
 *   e.g. 1 KG = 3.571 Meters  →  rate = 3.571
 *   e.g. 1 Box = 15 Pieces    →  rate = 15
 *   e.g. 1 Litre = 1000 ML    →  rate = 1000
 *
 * Stock deduction formula: qty (in Second Unit) / rate = qty deducted in Main Unit
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Lists all items that have a secondaryUnit and conversionRate configured.
 *   2. Flags items where rate = 0 or negative (these will throw at runtime).
 *   3. DOES NOT auto-correct — a human must verify each item's rate.
 *
 * USAGE:
 *   npx ts-node src/utils/audit-conversion-rates.ts
 *
 * SAFE TO RUN REPEATEDLY — read-only, no DB writes.
 */

import mongoose from 'mongoose';
import Product from '../models/Product.model';
import dotenv from 'dotenv';

dotenv.config();

async function auditConversionRates() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI not set in .env — cannot connect.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB\n');

  // Fetch all items with a dual-unit setup
  const items = await Product.find({
    secondaryUnit: { $exists: true, $ne: '' },
    conversionRate: { $exists: true, $ne: null },
  }).select('name unit secondaryUnit conversionRate businessId').lean();

  if (items.length === 0) {
    console.log('ℹ️   No items with dual-unit configuration found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${items.length} dual-unit items. Checking for invalid rates…\n`);

  const invalid: typeof items = [];
  const valid: typeof items = [];

  for (const item of items) {
    // Only flag rate = 0 or negative as invalid — these will throw at runtime.
    // Any positive value is a valid rate under Definition B.
    if ((item.conversionRate ?? 0) <= 0) {
      invalid.push(item);
    } else {
      valid.push(item);
    }
  }

  if (invalid.length === 0) {
    console.log('✅  No invalid rates found. All items have a positive conversion rate.\n');
  } else {
    console.log(`⚠️  ${invalid.length} item(s) with rate ≤ 0 — FIX REQUIRED (will throw at runtime):\n`);
    console.log('  Correct format: 1 [Main Unit] = [rate] [Second Unit]');
    console.log('  e.g. 1 KG = 3.571 Meters  →  set rate = 3.571\n');
    console.log('  ┌───────────────────────────────────────────────────────────────────┐');
    console.log('  │ Item Name                     │ Main     │ Second   │ Rate      │');
    console.log('  ├───────────────────────────────────────────────────────────────────┤');
    for (const item of invalid) {
      const name = item.name.padEnd(30).substring(0, 30);
      const main = (item.unit || '').padEnd(8).substring(0, 8);
      const sec  = (item.secondaryUnit || '').padEnd(8).substring(0, 8);
      const rate = String(item.conversionRate).padEnd(9).substring(0, 9);
      console.log(`  │ ${name} │ ${main} │ ${sec} │ ${rate} │`);
    }
    console.log('  └───────────────────────────────────────────────────────────────────┘\n');
    console.log('  ACTION: Open each item in Item Master and set a valid positive rate.');
    console.log('          Format: "1 [Main Unit] = [rate] [Second Unit]"\n');
  }

  console.log('─── All items (for reference) ───────────────────────────────────────────────────────────────');
  for (const item of items) {
    const flag = (item.conversionRate ?? 0) <= 0 ? '⚠️ ' : '✅ ';
    // Label: correct Direction B format
    console.log(`${flag} ${item.name}: 1 ${item.unit} = ${item.conversionRate} ${item.secondaryUnit}`);
  }

  console.log('\n🏁 Audit complete. No data was modified.');
  await mongoose.disconnect();
}

auditConversionRates().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
