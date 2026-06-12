import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import mongoose from 'mongoose';

/**
 * GET /api/v1/reports/dashboard/today-activity
 * 
 * Returns a unified activity summary across all modules.
 * Supports ?period=today|week|month query parameter.
 */
export const getTodayActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const now = new Date();
    const { period = 'today' } = req.query as any;

    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const Invoice = mongoose.model('Invoice');
    const PurchaseBill = mongoose.model('PurchaseBill');
    const Expense = mongoose.model('Expense');
    const AccountLedger = mongoose.model('AccountLedger');

    // Run all queries in parallel for performance
    const [
      salesResult,
      purchaseResult,
      expenseResult,
      paymentsReceived,
      paymentsMade,
      salesReturnResult,
      purchaseReturnResult
    ] = await Promise.all([
      // Sales
      Invoice.aggregate([
        { $match: { businessId, invoiceDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 }, received: { $sum: '$amountReceived' } } }
      ]),
      // Purchases
      PurchaseBill.aggregate([
        { $match: { businessId, billDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 }, paid: { $sum: '$amountPaid' } } }
      ]),
      // Expenses
      Expense.aggregate([
        { $match: { businessId, date: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$totalWithTax' }, count: { $sum: 1 } } }
      ]),
      // Payments Received (customer payments via ledger)
      AccountLedger.aggregate([
        { $match: { businessId, date: { $gte: startDate }, customerId: { $exists: true, $ne: null }, credit: { $gt: 0 }, referenceType: 'Payment' } },
        { $group: { _id: null, total: { $sum: '$credit' }, count: { $sum: 1 } } }
      ]),
      // Payments Made (supplier payments via ledger)
      AccountLedger.aggregate([
        { $match: { businessId, date: { $gte: startDate }, supplierId: { $exists: true, $ne: null }, debit: { $gt: 0 }, referenceType: 'Payment' } },
        { $group: { _id: null, total: { $sum: '$debit' }, count: { $sum: 1 } } }
      ]),
      // Sales Returns (check if model exists)
      (async () => {
        try {
          const SalesReturn = mongoose.model('SalesReturn');
          return await SalesReturn.aggregate([
            { $match: { businessId, returnDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
          ]);
        } catch { return []; }
      })(),
      // Purchase Returns (check if model exists)
      (async () => {
        try {
          const PurchaseReturn = mongoose.model('PurchaseReturn');
          return await PurchaseReturn.aggregate([
            { $match: { businessId, returnDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
          ]);
        } catch { return []; }
      })()
    ]);

    const sales = salesResult[0] || { total: 0, count: 0, received: 0 };
    const purchases = purchaseResult[0] || { total: 0, count: 0, paid: 0 };
    const expenses = expenseResult[0] || { total: 0, count: 0 };
    const pmtsReceived = paymentsReceived[0] || { total: 0, count: 0 };
    const pmtsMade = paymentsMade[0] || { total: 0, count: 0 };
    const salesReturns = salesReturnResult[0] || { total: 0, count: 0 };
    const purchaseReturns = purchaseReturnResult[0] || { total: 0, count: 0 };

    const profit = sales.total - purchases.total - expenses.total - salesReturns.total + purchaseReturns.total;

    res.json({
      success: true,
      period,
      data: {
        sales: { total: sales.total, count: sales.count, received: sales.received },
        purchases: { total: purchases.total, count: purchases.count, paid: purchases.paid },
        expenses: { total: expenses.total, count: expenses.count },
        paymentsReceived: { total: pmtsReceived.total, count: pmtsReceived.count },
        paymentsMade: { total: pmtsMade.total, count: pmtsMade.count },
        salesReturns: { total: salesReturns.total, count: salesReturns.count },
        purchaseReturns: { total: purchaseReturns.total, count: purchaseReturns.count },
        profit
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/**
 * GET /api/v1/reports/dashboard/daily-transactions
 * 
 * Returns all ledger entries for a given date, serving as the Daily Transaction Ledger.
 * Supports ?date=YYYY-MM-DD query parameter (defaults to today).
 */
export const getDailyTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { date: dateStr } = req.query as any;
    
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const AccountLedger = mongoose.model('AccountLedger');
    const entries = await AccountLedger.find({
      businessId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ createdAt: -1 }).lean();

    let totalDebit = 0, totalCredit = 0;
    const data = entries.map((e: any) => {
      totalDebit += (e.debit || 0);
      totalCredit += (e.credit || 0);
      return {
        time: e.createdAt || e.date,
        voucherType: e.voucherType || e.referenceType || '-',
        voucherNo: e.voucherNo || e.referenceId || '-',
        partyName: e.partyName || '',
        description: e.description,
        debit: e.debit || 0,
        credit: e.credit || 0
      };
    });

    res.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      summary: { totalDebit, totalCredit, netFlow: totalDebit - totalCredit, entryCount: data.length },
      data
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};
