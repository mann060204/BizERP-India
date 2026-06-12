import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import mongoose from 'mongoose';

/**
 * GET /api/v1/admin/reconciliation
 * 
 * System Health Check — compares dashboard metrics against actual database sums
 * to identify mismatches, missing ledger entries, and data integrity issues.
 */
export const getReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);

    const Invoice = mongoose.model('Invoice');
    const PurchaseBill = mongoose.model('PurchaseBill');
    const Customer = mongoose.model('Customer');
    const Supplier = mongoose.model('Supplier');
    const AccountLedger = mongoose.model('AccountLedger');
    const Product = mongoose.model('Product');

    // Run all checks in parallel
    const [
      invoiceTotals,
      purchaseTotals,
      customerBalances,
      supplierBalances,
      customerLedgerTotals,
      supplierLedgerTotals,
      orphanCustomerLedgers,
      orphanSupplierLedgers,
      productStockCheck
    ] = await Promise.all([
      // 1. Invoice totals
      Invoice.aggregate([
        { $match: { businessId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalReceived: { $sum: '$amountReceived' }, totalBalance: { $sum: '$balance' }, count: { $sum: 1 } } }
      ]),
      // 2. Purchase totals
      PurchaseBill.aggregate([
        { $match: { businessId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalPurchases: { $sum: '$grandTotal' }, totalPaid: { $sum: '$amountPaid' }, totalBalance: { $sum: '$balance' }, count: { $sum: 1 } } }
      ]),
      // 3. Customer balances from Customer model
      Customer.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, totalReceivable: { $sum: '$currentBalance' }, count: { $sum: 1 } } }
      ]),
      // 4. Supplier balances from Supplier model
      Supplier.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, totalPayable: { $sum: '$currentBalance' }, count: { $sum: 1 } } }
      ]),
      // 5. Customer ledger totals
      AccountLedger.aggregate([
        { $match: { businessId, customerId: { $exists: true, $ne: null } } },
        { $group: { _id: null, totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } }
      ]),
      // 6. Supplier ledger totals
      AccountLedger.aggregate([
        { $match: { businessId, supplierId: { $exists: true, $ne: null } } },
        { $group: { _id: null, totalDebit: { $sum: '$debit' }, totalCredit: { $sum: '$credit' } } }
      ]),
      // 7. Find ledger entries with invalid customer references
      AccountLedger.aggregate([
        { $match: { businessId, customerId: { $exists: true, $ne: null } } },
        { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
        { $match: { customer: { $size: 0 } } },
        { $count: 'orphanCount' }
      ]),
      // 8. Find ledger entries with invalid supplier references
      AccountLedger.aggregate([
        { $match: { businessId, supplierId: { $exists: true, $ne: null } } },
        { $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
        { $match: { supplier: { $size: 0 } } },
        { $count: 'orphanCount' }
      ]),
      // 9. Check for negative stock
      Product.aggregate([
        { $match: { businessId, currentStock: { $lt: 0 } } },
        { $project: { name: 1, currentStock: 1 } }
      ])
    ]);

    // Also check for purchase returns & sales returns that lack ledger entries
    let missingPurchaseReturnLedgers = 0;
    let missingSalesReturnLedgers = 0;
    try {
      const PurchaseReturn = mongoose.model('PurchaseReturn');
      const pReturns = await PurchaseReturn.find({ businessId, status: { $ne: 'cancelled' } }).lean();
      for (const pr of pReturns) {
        const hasLedger = await AccountLedger.findOne({ businessId, referenceId: (pr as any)._id.toString(), referenceType: 'PurchaseReturn' });
        if (!hasLedger && (pr as any).supplierId) missingPurchaseReturnLedgers++;
      }
    } catch {}
    try {
      const SalesReturn = mongoose.model('SalesReturn');
      const sReturns = await SalesReturn.find({ businessId, status: { $ne: 'cancelled' } }).lean();
      for (const sr of sReturns) {
        const hasLedger = await AccountLedger.findOne({ businessId, referenceId: (sr as any)._id.toString(), referenceType: 'SalesReturn' });
        if (!hasLedger && (sr as any).customerId) missingSalesReturnLedgers++;
      }
    } catch {}

    const inv = invoiceTotals[0] || { totalSales: 0, totalReceived: 0, totalBalance: 0, count: 0 };
    const pur = purchaseTotals[0] || { totalPurchases: 0, totalPaid: 0, totalBalance: 0, count: 0 };
    const cust = customerBalances[0] || { totalReceivable: 0, count: 0 };
    const supp = supplierBalances[0] || { totalPayable: 0, count: 0 };
    const custLedger = customerLedgerTotals[0] || { totalDebit: 0, totalCredit: 0 };
    const suppLedger = supplierLedgerTotals[0] || { totalDebit: 0, totalCredit: 0 };

    const issues: string[] = [];

    // Check customer balance consistency
    const ledgerCustomerBalance = custLedger.totalDebit - custLedger.totalCredit;
    if (Math.abs(ledgerCustomerBalance - cust.totalReceivable) > 1) {
      issues.push(`Customer balance mismatch: Ledger shows ₹${ledgerCustomerBalance.toFixed(2)} but Customer model shows ₹${cust.totalReceivable.toFixed(2)}`);
    }

    // Check orphan records
    if (orphanCustomerLedgers[0]?.orphanCount > 0) {
      issues.push(`${orphanCustomerLedgers[0].orphanCount} customer ledger entries reference deleted customers`);
    }
    if (orphanSupplierLedgers[0]?.orphanCount > 0) {
      issues.push(`${orphanSupplierLedgers[0].orphanCount} supplier ledger entries reference deleted suppliers`);
    }

    // Check negative stock
    if (productStockCheck.length > 0) {
      issues.push(`${productStockCheck.length} products have negative stock`);
    }

    // Check missing ledger entries
    if (missingPurchaseReturnLedgers > 0) {
      issues.push(`${missingPurchaseReturnLedgers} purchase returns are missing ledger entries`);
    }
    if (missingSalesReturnLedgers > 0) {
      issues.push(`${missingSalesReturnLedgers} sales returns are missing ledger entries`);
    }

    res.json({
      success: true,
      healthStatus: issues.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND',
      issueCount: issues.length,
      checks: {
        sales: {
          invoiceCount: inv.count,
          totalSales: inv.totalSales,
          totalReceived: inv.totalReceived,
          invoiceOutstanding: inv.totalBalance,
          customerModelOutstanding: cust.totalReceivable
        },
        purchases: {
          billCount: pur.count,
          totalPurchases: pur.totalPurchases,
          totalPaid: pur.totalPaid,
          billOutstanding: pur.totalBalance,
          supplierModelPayable: Math.abs(supp.totalPayable)
        },
        ledger: {
          customerLedgerEntries: custLedger.totalDebit + custLedger.totalCredit > 0,
          supplierLedgerEntries: suppLedger.totalDebit + suppLedger.totalCredit > 0,
          customerLedgerBalance: ledgerCustomerBalance,
          supplierLedgerBalance: suppLedger.totalCredit - suppLedger.totalDebit
        },
        integrity: {
          orphanCustomerLedgers: orphanCustomerLedgers[0]?.orphanCount || 0,
          orphanSupplierLedgers: orphanSupplierLedgers[0]?.orphanCount || 0,
          negativeStockProducts: productStockCheck,
          missingPurchaseReturnLedgers,
          missingSalesReturnLedgers
        }
      },
      issues
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
