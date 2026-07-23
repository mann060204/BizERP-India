/**
 * Migration Script: Backfill missing Bank Ledger entries for past UPI/digital transactions
 *
 * Run once manually:
 *   npx ts-node src/utils/migrate-payment-ledger.ts
 *
 * What it does:
 * 1. Finds all Expense docs where paymentMode != 'Cash'
 * 2. For each, checks if a corresponding AccountLedger entry with
 *    accountId set (bank entry) already exists
 * 3. If NOT, resolves the correct bank account using PaymentMode master
 *    or Account flag fallbacks
 * 4. Creates the missing AccountLedger entry and updates Account.currentBalance
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Expense from '../models/Expense.model';
import Account from '../models/Account.model';
import AccountLedger from '../models/AccountLedger.model';
import PaymentMode from '../models/PaymentMode.model';
import { AccountingService } from '../services/accounting.service';

const MONGO_URI = process.env.MONGODB_URI || '';

async function resolveAccountForMode(businessId: string, modeName: string, explicitBankAccountId?: string): Promise<string | null> {
  const modeLower = (modeName || '').toLowerCase().trim();

  // 1. Check PaymentMode master
  const modeDoc = await PaymentMode.findOne({
    businessId,
    name: { $regex: new RegExp(`^${modeLower}$`, 'i') },
    isActive: true,
  });
  if (modeDoc && modeDoc.ledgerType === 'BANK' && modeDoc.linkedAccountId) {
    return modeDoc.linkedAccountId.toString();
  }

  // 2. Explicit bankAccountId from the Expense doc itself
  if (explicitBankAccountId) return explicitBankAccountId;

  // 3. Account flags
  let query: any = { businessId, type: 'Bank', isActive: true };
  if (modeLower === 'upi') query.isDefaultUpi = true;
  else if (['neft', 'rtgs', 'bank transfer', 'bank'].includes(modeLower)) query.isDefaultNeft = true;
  else if (['cheque', 'check'].includes(modeLower)) query.isDefaultCheque = true;
  else {
    // Generic bank: find any bank account
    delete query.isDefaultUpi;
  }
  const acct = await Account.findOne(query);
  return acct?._id.toString() || null;
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Find all non-Cash expenses
  const digitalExpenses = await Expense.find({
    paymentMode: { $nin: ['Cash', 'cash'] }
  }).lean();

  console.log(`\n📊 Found ${digitalExpenses.length} digital-mode expenses to audit.\n`);

  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const exp of digitalExpenses) {
    try {
      // Check if a Bank AccountLedger entry already exists for this expense
      const existingBankEntry = await AccountLedger.findOne({
        businessId: exp.businessId,
        referenceId: exp._id.toString(),
        referenceType: 'Expense',
        accountId: { $exists: true, $ne: null },
      });

      if (existingBankEntry) {
        skipped++;
        continue; // already has a bank entry
      }

      // Resolve the correct account
      const accountId = await resolveAccountForMode(
        exp.businessId.toString(),
        exp.paymentMode,
        (exp as any).bankAccountId?.toString()
      );

      if (!accountId) {
        console.warn(`  ⚠  Expense ${exp._id} (${exp.paymentMode}) — no linked account found. SKIPPED.`);
        failed++;
        continue;
      }

      const account = await Account.findById(accountId);
      if (!account) {
        console.warn(`  ⚠  Account ${accountId} not found. SKIPPED.`);
        failed++;
        continue;
      }

      // Create the missing bank ledger entry
      const amount = exp.totalWithTax || exp.amount;
      const expenseDate = exp.date ? new Date(exp.date) : new Date();

      account.currentBalance -= amount; // expense = money leaving bank (debit bank = credit account)
      await account.save();

      await AccountLedger.create({
        businessId: exp.businessId,
        accountId: account._id,
        date: expenseDate,
        description: `[MIGRATED] Expense: ${exp.category} - ${exp.vendorName || ''}`.trim(),
        debit: 0,
        credit: amount,
        referenceType: 'Expense',
        referenceId: exp._id.toString(),
        closingBalance: account.currentBalance,
        voucherType: 'Expense',
        voucherNo: exp._id.toString().slice(-6),
        partyName: exp.vendorName || '',
      });

      console.log(`  ✅ Fixed Expense ${exp._id} — ${exp.paymentMode} → ${account.name} — ₹${amount}`);
      fixed++;
    } catch (err: any) {
      console.error(`  ❌ Error processing expense ${exp._id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`✅ Fixed:   ${fixed}`);
  console.log(`⏭  Skipped: ${skipped} (already had bank entry)`);
  console.log(`❌ Failed:  ${failed} (no account configured)`);
  console.log(`────────────────────────────────\n`);

  await mongoose.disconnect();
  console.log('Disconnected. Migration complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
