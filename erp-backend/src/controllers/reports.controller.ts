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
    // Find all Cash type accounts for this business
    const cashAccounts = await Account.find({ businessId, type: 'Bank' });
    const cashAccount = await Account.findOne({ businessId, type: { $in: ['Bank', 'Cash'] } });
    if (!cashAccount) {
      // Return empty if no cash/bank account
      return sendSuccess(res, []);
    }
    
    const cashAccountIds = cashAccounts.map(a => a._id);
    // Include Cash accounts too
    const allCashAccounts = await Account.find({ businessId, type: { $in: ['Bank', 'Cash'] } });
    const allIds = allCashAccounts.map(a => a._id);
    
    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: allIds } })
      .populate('accountId', 'name type')
      .sort({ date: -1, createdAt: -1 });
    
    // Transform to expected frontend format
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      particulars: l.description,
      voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
      debit: l.debit || 0,
      credit: l.credit || 0,
      balance: l.closingBalance || (l.debit - l.credit),
      referenceType: l.referenceType,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBusinessBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ledgers = await AccountLedger.find({ businessId })
      .populate('accountId', 'name type')
      .sort({ date: -1 })
      .limit(1000);
    
    // Transform to expected frontend format
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      accountId: l.accountId, // populated: { name, type }
      particulars: l.description,
      voucherType: l.referenceType || 'Journal',
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Find ledgers where bank/cash is credited (money going out)
    const bankCashAccounts = await Account.find({ businessId, type: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: accountIds }, credit: { $gt: 0 } })
      .populate('accountId', 'name type')
      .sort({ date: -1 });
    
    // Transform to expected frontend format
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      accountId: l.accountId, // populated: { name }
      particulars: l.description,
      voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
      credit: l.credit || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentReceived = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Find ledgers where bank/cash is debited (money coming in)
    const bankCashAccounts = await Account.find({ businessId, type: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: accountIds }, debit: { $gt: 0 } })
      .populate('accountId', 'name type')
      .sort({ date: -1 });
    
    // Transform to expected frontend format
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      accountId: l.accountId, // populated: { name }
      particulars: l.description,
      voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
      debit: l.debit || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getChartOfAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const accounts = await Account.find({ businessId }).sort({ type: 1, name: 1 });
    
    // Transform to match frontend columns: name, accountType, group, openingBalance
    const transformed = accounts.map((a: any) => ({
      name: a.name,
      accountType: a.type, // Account model uses 'type' field
      group: a.bankName || a.type, // use bankName as group for banks, else type
      openingBalance: a.openingBalance || 0,
      currentBalance: a.currentBalance || 0,
      balanceType: a.balanceType || 'Dr',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const accounts = await Account.find({ businessId });
    
    // Account model types: 'Bank', 'Loan', 'Asset', 'Capital', 'Income', 'Tax'
    const assets = accounts.filter((a: any) => ['Bank', 'Asset'].includes(a.type));
    const liabilities = accounts.filter((a: any) => ['Loan', 'Tax'].includes(a.type));
    const equity = accounts.filter((a: any) => ['Capital', 'Income'].includes(a.type));
    
    // Transform each account to include accountType
    const transformAccount = (a: any) => ({
      name: a.name,
      accountType: a.type,
      balance: a.currentBalance || a.openingBalance || 0,
      openingBalance: a.openingBalance || 0,
      balanceType: a.balanceType || 'Dr',
    });
    
    sendSuccess(res, {
      assets: assets.map(transformAccount),
      liabilities: liabilities.map(transformAccount),
      equity: equity.map(transformAccount),
    });
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// --- INVENTORY REPORTS ---

export const getItemRegister = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId }).sort({ name: 1 });
    
    const transformed = products.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      category: p.category || p.productType || 'General',
      currentStock: p.currentStock || 0,
      salePrice: p.sellingPrice || 0,
      purchasePrice: p.purchasePrice || 0,
      unit: p.unit || 'Nos',
      gstRate: p.gstRate || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getLowLevelStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Use reorderLevel (not lowStockAlert) - that's the actual field name in Product model
    const products = await Product.find({
      businessId,
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    }).sort({ currentStock: 1 });
    
    const transformed = products.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      currentStock: p.currentStock || 0,
      lowStockAlert: p.reorderLevel || 0, // Map reorderLevel to lowStockAlert for display
      supplierId: 'N/A', // Product model doesn't have supplierId
      unit: p.unit || 'Nos',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId, currentStock: { $gt: 0 } }).sort({ name: 1 });
    
    const transformed = products.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      category: p.category || p.productType || 'General',
      unit: p.unit || 'Nos',
      currentStock: p.currentStock || 0,
      reorderLevel: p.reorderLevel || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const adjustments = await InventoryAdjustment.find({ businessId })
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 });
    
    const transformed = adjustments.map((a: any) => ({
      date: a.createdAt, // InventoryAdjustment doesn't have a 'date' field, uses createdAt
      productId: a.productId, // populated: { name, sku }
      type: a.type === 'add' ? 'Stock In (+)' : 'Stock Out (-)',
      quantity: a.quantity || 0,
      reason: a.reason || '',
      notes: a.notes || '',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getConsumableStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // Consumable = products with category containing 'consumable' OR productType General with low stock
    const products = await Product.find({
      businessId,
      $or: [
        { category: /consumable/i },
        { productType: 'General' }
      ]
    }).sort({ name: 1 });
    
    const transformed = products.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      currentStock: p.currentStock || 0,
      unit: p.unit || 'Nos',
      category: p.category || p.productType || 'General',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getFastMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pipeline: any[] = [
      { $match: { businessId, invoiceDate: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          productName: { $first: '$items.productName' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 20 }
    ];
    
    const fastItems = await Invoice.aggregate(pipeline);
    
    const transformed = fastItems.map((item: any) => ({
      productName: item.productName || 'Unknown Product',
      totalSold: item.totalSold || 0,
      totalRevenue: item.totalRevenue || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getSlowMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activeProductIds = await Invoice.distinct('items.productId', {
      businessId,
      invoiceDate: { $gte: ninetyDaysAgo },
      status: { $ne: 'cancelled' }
    });
    
    const slowProducts = await Product.find({
      businessId,
      _id: { $nin: activeProductIds as any[] },
      currentStock: { $gt: 0 }
    } as any).sort({ name: 1 });
    
    const transformed = slowProducts.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      category: p.category || p.productType || 'General',
      currentStock: p.currentStock || 0,
      purchasePrice: p.purchasePrice || 0,
      unit: p.unit || 'Nos',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getAvailableSerials = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const batches = await Batch.find({ businessId, currentStock: { $gt: 0 } })
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 });
    
    const transformed = batches.map((b: any) => ({
      batchNo: b.batchNo,
      productId: b.productId, // populated: { name, sku }
      expiryDate: b.expiryDate || null,
      currentStock: b.currentStock || 0,
      salePrice: b.salePrice || 0,
      mrp: b.mrp || 0,
      qualityStatus: b.qualityStatus || 'Passed',
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getItemList = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId })
      .select('name sku barcode category unit purchasePrice sellingPrice mrp currentStock gstRate productType')
      .sort({ name: 1 });
    
    const transformed = products.map((p: any) => ({
      itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
      name: p.name,
      category: p.category || p.productType || 'General',
      unit: p.unit || 'Nos',
      salePrice: p.sellingPrice || 0, // sellingPrice is the actual field
      purchasePrice: p.purchasePrice || 0,
      mrp: p.mrp || 0,
      currentStock: p.currentStock || 0,
      gstRate: p.gstRate || 0,
    }));
    
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};


// --- FINANCIAL REPORTS ---

// Helper to get date range
const getDateRange = (from?: string, to?: string) => {
  const query: any = {};
  if (from) query.$gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // Include full end day
    query.$lte = toDate;
  }
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
      Invoice.aggregate([
        { $match: invoiceQuery },
        { $group: { _id: null, totalSales: { $sum: '$grandTotal' } } }
      ]),
      PurchaseBill.aggregate([
        { $match: purchaseQuery },
        { $group: { _id: null, totalPurchases: { $sum: '$grandTotal' } } }
      ]),
      Expense.aggregate([
        { $match: expenseQuery },
        { $group: { _id: null, totalExpenses: { $sum: '$totalWithTax' } } }
      ])
    ]);

    const totalSales = salesResult[0]?.totalSales || 0;
    const totalPurchases = purchasesResult[0]?.totalPurchases || 0;
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;
    
    const grossProfit = totalSales - totalPurchases;
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

    // ITC: Purchases with GST
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

    // ITC: Expenses with GST
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

    // Clean up _id fields from outward
    delete outward._id;
    delete pGst._id;
    delete eGst._id;

    const inward = {
      taxableValue: (pGst.taxableValue || 0) + (eGst.taxableValue || 0),
      cgst: (pGst.cgst || 0) + (eGst.cgst || 0),
      sgst: (pGst.sgst || 0) + (eGst.sgst || 0),
      igst: (pGst.igst || 0) + (eGst.igst || 0),
      totalTax: (pGst.totalTax || 0) + (eGst.totalTax || 0),
    };

    // Net GST Payable = Outward Tax - ITC (cannot be negative)
    const netGstPayable = {
      cgst: Math.max(0, (outward.cgst || 0) - inward.cgst),
      sgst: Math.max(0, (outward.sgst || 0) - inward.sgst),
      igst: Math.max(0, (outward.igst || 0) - inward.igst),
    };
    const totalNetPayable = netGstPayable.cgst + netGstPayable.sgst + netGstPayable.igst;

    res.json({ outward, inward, netGstPayable, totalNetPayable });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/reports/daybook
export const getDaybook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { date } = req.query as any;
    
    let targetDate = new Date();
    if (date) targetDate = new Date(date);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const invoiceQuery = { businessId, invoiceDate: { $gte: startOfDay, $lte: endOfDay } };
    const purchaseQuery = { businessId, billDate: { $gte: startOfDay, $lte: endOfDay } };
    const expenseQuery = { businessId, date: { $gte: startOfDay, $lte: endOfDay } };

    const [invoices, purchases, expenses] = await Promise.all([
      Invoice.find(invoiceQuery, 'invoiceNumber invoiceDate customerSnapshot grandTotal amountReceived paymentMode status').lean(),
      PurchaseBill.find(purchaseQuery, 'billNumber billDate supplierSnapshot grandTotal amountPaid paymentMode status').lean(),
      Expense.find(expenseQuery, 'category date vendorName totalWithTax amount paymentMode notes').lean()
    ]);

    const transactions: any[] = [];

    invoices.forEach((i: any) => {
      if (i.status === 'cancelled') return;
      transactions.push({
        type: 'Sale',
        ref: i.invoiceNumber,
        date: i.invoiceDate,
        party: i.customerSnapshot?.name || 'Unknown Customer',
        amount: i.grandTotal || 0,
        received: i.amountReceived || 0,
        mode: i.paymentMode || 'Cash',
        paid: 0,
      });
    });

    purchases.forEach((p: any) => {
      if (p.status === 'cancelled') return;
      transactions.push({
        type: 'Purchase',
        ref: p.billNumber,
        date: p.billDate,
        party: p.supplierSnapshot?.name || 'Unknown Supplier',
        amount: p.grandTotal || 0,
        paid: p.amountPaid || 0,
        received: 0,
        mode: p.paymentMode || 'Cash',
      });
    });

    expenses.forEach((e: any) => transactions.push({
      type: 'Expense',
      ref: e.category,
      date: e.date,
      party: e.vendorName || 'Self',
      amount: e.totalWithTax || e.amount || 0,
      paid: e.totalWithTax || e.amount || 0,
      received: 0,
      mode: e.paymentMode || 'Cash',
    }));

    // Sort descending by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals
    const totalInflow = transactions
      .filter(t => t.type === 'Sale')
      .reduce((sum, t) => sum + (t.received || 0), 0);
    const totalOutflow = transactions
      .filter(t => t.type !== 'Sale')
      .reduce((sum, t) => sum + (t.paid || 0), 0);

    res.json({ date: startOfDay, transactions, totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/reports/dashboard-charts
export const getDashboardCharts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();

    // 1. Sales Chart (Last 30 Days)
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const salesAggregation = await Invoice.aggregate([
      { $match: { businessId, status: { $ne: 'cancelled' }, invoiceDate: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate', timezone: '+05:30' } },
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
        { $match: { businessId, status: { $ne: 'cancelled' }, invoiceDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } }, total: { $sum: '$grandTotal' } } }
      ]),
      PurchaseBill.aggregate([
        { $match: { businessId, status: { $ne: 'cancelled' }, billDate: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$billDate' }, month: { $month: '$billDate' } }, total: { $sum: '$grandTotal' } } }
      ]),
      Expense.aggregate([
        { $match: { businessId, date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$totalWithTax' } } }
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
        expenses: p + e,
        profit: s - p - e
      });
    }

    res.json({ salesData, profitData });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
