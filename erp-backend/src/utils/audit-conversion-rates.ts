/**
 * audit-conversion-rates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Audit script: flags items whose conversionRate may have been stored under
 * the OLD inverted direction ("1 Main Unit = rate Second Units") that existed
 * in the Unit Settings modal before the fix.
 *
 * HOW THE BUG HAPPENED:
 *   The Unit Settings modal displayed "1 [Main] = rate [Second]"
 *   A user seeing this would enter a rate thinking: "1 Nos = 15 Mtrs"
 *   But the backend's convertToMainUnit() treats the rate as: "1 Mtr = rate Nos"
 *   → Stock deduction was off by rate² for items edited through the modal.
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Lists all items that have a secondaryUnit and conversionRate configured.
 *   2. Flags items where the rate looks "suspicious" — i.e. rate < 1.0, which
 *      strongly suggests it was entered as the INVERSE (1/correct_rate), because
 *      most real-world conversions are >1 (e.g. 1 Mtr = 15 Nos, 1 Roll = 300 Mtrs).
 *   3. DOES NOT auto-correct — the correct rate cannot be inferred safely from
 *      a bare number. A human must verify and update each flagged item.
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
    conversionRate: { $exists: true, $gt: 0 },
  }).select('name unit secondaryUnit conversionRate businessId').lean();

  if (items.length === 0) {
    console.log('ℹ️   No items with dual-unit configuration found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${items.length} dual-unit items. Checking for suspicious rates…\n`);

  const suspicious: typeof items = [];
  const normal: typeof items = [];

  for (const item of items) {
    // A rate < 1.0 means "1 Second Unit consumes <1 Main Unit"
    // This is physically unusual in most cases (a Mtr usually has >= 1 piece / gram / kg)
    // and is the telltale sign the rate was entered as the INVERSE.
    //
    // This heuristic is NOT perfect — some items legitimately have rate < 1
    // (e.g. 1 Gram = 0.001 Kg). So all we do is SURFACE them for human review.
    if ((item.conversionRate ?? 1) < 1) {
      suspicious.push(item);
    } else {
      normal.push(item);
    }
  }

  if (suspicious.length === 0) {
    console.log('✅  No suspicious rates found. All items look consistent.\n');
  } else {
    console.log(`⚠️  ${suspicious.length} item(s) with rate < 1.0 — REVIEW REQUIRED:\n`);
    console.log('  These may have been entered under the OLD inverted formula.');
    console.log('  Correct formula: 1 [Second Unit] = conversionRate × [Main Unit]\n');
    console.log('  ┌─────────────────────────────────────────────────────────────────┐');
    console.log('  │ Item Name                     │ Main     │ Second   │ Rate      │');
    console.log('  ├─────────────────────────────────────────────────────────────────┤');
    for (const item of suspicious) {
      const name = item.name.padEnd(30).substring(0, 30);
      const main = (item.unit || '').padEnd(8).substring(0, 8);
      const sec  = (item.secondaryUnit || '').padEnd(8).substring(0, 8);
      const rate = String(item.conversionRate).padEnd(9).substring(0, 9);
      console.log(`  │ ${name} │ ${main} │ ${sec} │ ${rate} │`);
    }
    console.log('  └─────────────────────────────────────────────────────────────────┘\n');
    console.log('  ACTION: Open each item in Item Master, verify the rate, and re-save');
    console.log('          through the now-corrected "Add New Item" or "Unit Settings" screen.\n');
  }

  console.log('─── All items (for reference) ─────────────────────────────────────────');
  for (const item of items) {
    const flag = (item.conversionRate ?? 1) < 1 ? '⚠️ ' : '✅ ';
    console.log(`${flag} ${item.name}: 1 ${item.secondaryUnit} = ${item.conversionRate} ${item.unit}`);
  }

  console.log('\n🏁 Audit complete. No data was modified.');
  await mongoose.disconnect();
}

auditConversionRates().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
