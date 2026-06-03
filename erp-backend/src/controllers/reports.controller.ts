import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import AccountLedger from '../models/AccountLedger.model';
import Account from '../models/Account.model';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';
import Invoice from '../models/Invoice.model';
import PurchaseBill from '../models/PurchaseBill.model';
import Expense from '../models/Expense.model';


// Helper for sending success response
const sendSuccess = (res: Response, data: any) => res.status(200).json({ success: true, data });
const sendError = (res: Response, message: string, status = 500) => res.status(status).json({ success: false, message });

// --- ACCOUNTS REPORTS ---

export const getCashBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const cashAccount = await Account.findOne({ businessId, accountType: 'Cash' });
    if (!cashAccount) return sendError(res, 'Cash account not found', 404);
    
    const ledgers = await AccountLedger.find({ businessId, accountId: cashAccount._id }).sort({ date: -1, createdAt: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBusinessBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ledgers = await AccountLedger.find({ businessId }).populate('accountId', 'name accountType').sort({ date: -1 }).limit(1000);
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Find ledgers where bank/cash is credited (money going out)
    const bankCashAccounts = await Account.find({ businessId, accountType: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: accountIds }, credit: { $gt: 0 } })
      .populate('accountId', 'name')
      .sort({ date: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentReceived = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Find ledgers where bank/cash is debited (money coming in)
    const bankCashAccounts = await Account.find({ businessId, accountType: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: accountIds }, debit: { $gt: 0 } })
      .populate('accountId', 'name')
      .sort({ date: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getChartOfAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const accounts = await Account.find({ businessId }).sort({ group: 1, name: 1 });
    sendSuccess(res, accounts);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const accounts = await Account.find({ businessId });
    // In a real app this groups by Assets/Liabilities/Equity
    const assets = accounts.filter(a => ['Asset', 'Bank', 'Cash', 'Accounts Receivable', 'Current Asset', 'Fixed Asset'].includes(a.accountType));
    const liabilities = accounts.filter(a => ['Liability', 'Accounts Payable', 'Current Liability', 'Long Term Liability'].includes(a.accountType));
    const equity = accounts.filter(a => ['Equity'].includes(a.accountType));
    
    sendSuccess(res, { assets, liabilities, equity });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// --- INVENTORY REPORTS ---

export const getItemRegister = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId }).sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getLowLevelStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId, 
      $expr: { $lte: ['$currentStock', '$lowStockAlert'] } 
    }).sort({ currentStock: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId, currentStock: { $gt: 0 } }).sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const adjustments = await InventoryAdjustment.find({ businessId }).populate('productId', 'name').sort({ date: -1, createdAt: -1 });
    sendSuccess(res, adjustments);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getConsumableStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Assuming product category or type defines consumable
    const products = await Product.find({ businessId, category: /consumable/i }).sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getFastMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Aggregate from invoices over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pipeline: any[] = [
      { $match: { businessId, date: { $gte: thirtyDaysAgo } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", totalSold: { $sum: "$items.quantity" }, productName: { $first: "$items.productName" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 20 }
    ];
    
    const fastItems = await Invoice.aggregate(pipeline);
    sendSuccess(res, fastItems);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getSlowMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Products with no sales in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activeProductIds = await Invoice.distinct('items.productId', { businessId, date: { $gte: ninetyDaysAgo } });
    
    const slowProducts = await Product.find({ businessId, _id: { $nin: activeProductIds as any[] }, currentStock: { $gt: 0 } } as any).sort({ name: 1 });
    sendSuccess(res, slowProducts);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getAvailableSerials = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const batches = await Batch.find({ businessId, currentStock: { $gt: 0 } }).populate('productId', 'name itemCode').sort({ 'productId.name': 1 });
    sendSuccess(res, batches);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getItemList = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId }).select('name itemCode category unit purchasePrice salePrice mrp currentStock').sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};


// --- OLD REPORTS RESTORED ---

// Helper to get date range
const getDateRange = (from?: string, to?: string) => {
  const query: any = {};
  if (from) query.$gte = new Date(from);
  if (to) query.$lte = new Date(to);
  return Object.keys(query).length > 0 ? query : null;
};

// GET /api/v1/reports/pnl
export const getProfitAndLoss = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    
    const invoiceQuery: any = { businessId, status: { $ne: 'cancelled' } };
    const purchaseQuery: any = { businessId, status: { $ne: 'cancelled' } };
    const expenseQuery: any = { businessId };

    const dateRange = getDateRange(from, to);
    if (dateRange) {
      invoiceQuery.invoiceDate = dateRange;
      purchaseQuery.billDate = dateRange;
      expenseQuery.date = dateRange;
    }

    const [salesResult, purchasesResult, expensesResult] = await Promise.all([
      Invoice.aggregate([{ $match: invoiceQuery }, { $group: { _id: null, totalSales: { $sum: '$totalTaxableAmount' } } }]),
      PurchaseBill.aggregate([{ $match: purchaseQuery }, { $group: { _id: null, totalPurchases: { $sum: '$totalTaxableAmount' } } }]),
      Expense.aggregate([{ $match: expenseQuery }, { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }])
    ]);

    const totalSales = salesResult[0]?.totalSales || 0;
    const totalPurchases = purchasesResult[0]?.totalPurchases || 0;
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;
    
    // Simplified Gross Profit: Sales - Purchases
    const grossProfit = totalSales - totalPurchases;
    // Net Profit: Gross Profit - Expenses
    const netProfit = grossProfit - totalExpenses;

    res.json({ totalSales, totalPurchases, grossProfit, totalExpenses, netProfit });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/reports/gstr
export const getGstReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;

    const invoiceQuery: any = { businessId, status: { $ne: 'cancelled' } };
    const purchaseQuery: any = { businessId, status: { $ne: 'cancelled' } };
    const expenseQuery: any = { businessId, gstRate: { $gt: 0 } };

    const dateRange = getDateRange(from, to);
    if (dateRange) {
      invoiceQuery.invoiceDate = dateRange;
      purchaseQuery.billDate = dateRange;
      expenseQuery.date = dateRange;
    }

    // GSTR-1: Outward Supplies (Sales)
    const salesGst = await Invoice.aggregate([
      { $match: invoiceQuery },
      { $group: {
          _id: null,
          taxableValue: { $sum: '$totalTaxableAmount' },
          cgst: { $sum: '$totalCGST' },
          sgst: { $sum: '$totalSGST' },
          igst: { $sum: '$totalIGST' },
          totalTax: { $sum: '$totalGST' }
      }}
    ]);

    // GSTR-3B: ITC (Purchases + Expenses with GST)
    const purchaseGst = await PurchaseBill.aggregate([
      { $match: purchaseQuery },
      { $group: {
          _id: null,
          taxableValue: { $sum: '$totalTaxableAmount' },
          cgst: { $sum: '$totalCGST' },
          sgst: { $sum: '$totalSGST' },
          igst: { $sum: '$totalIGST' },
          totalTax: { $sum: '$totalGST' }
      }}
    ]);

    const expenseGst = await Expense.aggregate([
      { $match: expenseQuery },
      { $group: {
          _id: null,
          taxableValue: { $sum: '$amount' },
          cgst: { $sum: '$cgst' },
          sgst: { $sum: '$sgst' },
          igst: { $sum: '$igst' },
          totalTax: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } }
      }}
    ]);

    const outward = salesGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const pGst = purchaseGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const eGst = expenseGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };

    const inward = {
      taxableValue: pGst.taxableValue + eGst.taxableValue,
      cgst: pGst.cgst + eGst.cgst,
      sgst: pGst.sgst + eGst.sgst,
      igst: pGst.igst + eGst.igst,
      totalTax: pGst.totalTax + eGst.totalTax
    };

    // Net GST Payable = Outward Tax - Inward Tax (ITC)
    const netGstPayable = {
      cgst: Math.max(0, outward.cgst - inward.cgst),
      sgst: Math.max(0, outward.sgst - inward.sgst),
      igst: Math.max(0, outward.igst - inward.igst),
    };
    const totalNetPayable = netGstPayable.cgst + netGstPayable.sgst + netGstPayable.igst;

    res.json({ outward, inward, netGstPayable, totalNetPayable });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/reports/daybook
export const getDaybook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { date } = req.query as any; // expects YYYY-MM-DD
    
    let targetDate = new Date();
    if (date) targetDate = new Date(date);
    
    const startOfDay = new Date(targetDate.setHours(0,0,0,0));
    const endOfDay = new Date(targetDate.setHours(23,59,59,999));

    const invoiceQuery = { businessId, invoiceDate: { $gte: startOfDay, $lte: endOfDay } };
    const purchaseQuery = { businessId, billDate: { $gte: startOfDay, $lte: endOfDay } };
    const expenseQuery = { businessId, date: { $gte: startOfDay, $lte: endOfDay } };

    const [invoices, purchases, expenses] = await Promise.all([
      Invoice.find(invoiceQuery, 'invoiceNumber invoiceDate customerSnapshot grandTotal amountReceived paymentMode').lean(),
      PurchaseBill.find(purchaseQuery, 'billNumber billDate supplierSnapshot grandTotal amountPaid paymentMode').lean(),
      Expense.find(expenseQuery, 'category date vendorName totalWithTax paymentMode notes').lean()
    ]);

    const transactions: any[] = [];

    invoices.forEach(i => transactions.push({
      type: 'Sale',
      ref: i.invoiceNumber,
      date: i.invoiceDate,
      party: i.customerSnapshot.name,
      amount: i.grandTotal,
      received: i.amountReceived,
      mode: i.paymentMode
    }));

    purchases.forEach(p => transactions.push({
      type: 'Purchase',
      ref: p.billNumber,
      date: p.billDate,
      party: p.supplierSnapshot.name,
      amount: p.grandTotal,
      paid: p.amountPaid,
      mode: p.paymentMode
    }));

    expenses.forEach(e => transactions.push({
      type: 'Expense',
      ref: e.category,
      date: e.date,
      party: e.vendorName || 'Self',
      amount: e.totalWithTax,
      paid: e.totalWithTax,
      mode: e.paymentMode
    }));

    // Sort descending by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ date: startOfDay, transactions });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/reports/dashboard-charts
export const getDashboardCharts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();

    // 1. Sales Chart (Last 30 Days)
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    thirtyDaysAgo.setHours(0,0,0,0);

    const salesAggregation = await Invoice.aggregate([
      { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $ne: 'cancelled' }, invoiceDate: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate", timezone: "+05:30" } },
          totalSales: { $sum: '$grandTotal' }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const salesData = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const match = salesAggregation.find(s => s._id === dateStr);
      salesData.push({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: match ? match.totalSales : 0
      });
    }

    // 2. Profit Chart (Last 6 Months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const [monthlySales, monthlyPurchases, monthlyExpenses] = await Promise.all([
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $ne: 'cancelled' }, invoiceDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$invoiceDate" }, month: { $month: "$invoiceDate" } }, total: { $sum: '$grandTotal' } } }
      ]),
      PurchaseBill.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $ne: 'cancelled' }, billDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$billDate" }, month: { $month: "$billDate" } }, total: { $sum: '$grandTotal' } } }
      ]),
      Expense.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$date" }, month: { $month: "$date" } }, total: { $sum: '$amount' } } }
      ])
    ]);

    const profitData = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      const s = monthlySales.find(x => x._id.year === year && x._id.month === month)?.total || 0;
      const p = monthlyPurchases.find(x => x._id.year === year && x._id.month === month)?.total || 0;
      const e = monthlyExpenses.find(x => x._id.year === year && x._id.month === month)?.total || 0;
      
      profitData.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: s,
        profit: s - p - e
      });
    }

    res.json({ salesData, profitData });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
