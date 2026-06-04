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
import Customer from '../models/Customer.model';
import Supplier from '../models/Supplier.model';


// Helper for sending success response
const sendSuccess = (res: Response, data: any) => res.status(200).json({ success: true, data });
const sendError = (res: Response, message: string, status = 500) => res.status(status).json({ success: false, message });

// --- ACCOUNTS REPORTS ---


export const getCashBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment' }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds } }).lean();
    
    const expenses = await Expense.find({ businessId }).lean();
    
    const transactions: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      let debit = 0, credit = 0;
      if (l.customerId && l.credit > 0) debit = l.credit;
      else if (l.supplierId && l.debit > 0) credit = l.debit;
      else return;
      
      transactions.push({
        date: l.date,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit, credit,
        referenceType: l.referenceType
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transactions.push({
        date: l.date,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.debit || 0,
        credit: l.credit || 0,
        referenceType: l.referenceType || 'Journal'
      });
    });
    
    expenses.forEach((e: any) => {
      transactions.push({
        date: e.date,
        particulars: e.category + (e.vendorName ? ` - ${e.vendorName}` : ''),
        voucherNo: e._id.toString().slice(-6).toUpperCase(),
        debit: 0,
        credit: e.totalWithTax || e.amount || 0,
        referenceType: 'Expense'
      });
    });
    
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sendSuccess(res, transactions);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBusinessBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const ledgers = await AccountLedger.find({ businessId })
      .populate('accountId', 'name type')
      .populate('customerId', 'name')
      .populate('supplierId', 'name')
      .sort({ date: -1 })
      .limit(1000)
      .lean();
      
    const expenses = await Expense.find({ businessId }).sort({ date: -1 }).limit(1000).lean();
    
    const transformed = ledgers.map((l: any) => ({
      date: l.date,
      accountId: l.accountId || l.customerId || l.supplierId || { name: 'Cash / Bank' },
      particulars: l.description,
      voucherType: l.referenceType || 'Journal',
      debit: l.debit || 0,
      credit: l.credit || 0,
    }));
    
    expenses.forEach((e: any) => {
      transformed.push({
        date: e.date,
        accountId: { name: 'Expense Account' },
        particulars: e.category + (e.vendorName ? ` - ${e.vendorName}` : ''),
        voucherType: 'Expense',
        debit: e.totalWithTax || e.amount || 0,
        credit: 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sendSuccess(res, transformed.slice(0, 1000));
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment', debit: { $gt: 0 }, supplierId: { $exists: true } }).populate('supplierId', 'name').sort({ date: -1 }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds }, credit: { $gt: 0 } }).populate('accountId', 'name').sort({ date: -1 }).lean();
    
    const expenses = await Expense.find({ businessId }).sort({ date: -1 }).lean();
    
    const transformed: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.supplierId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        credit: l.debit || 0,
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.accountId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        credit: l.credit || 0,
      });
    });
    
    expenses.forEach((e: any) => {
      transformed.push({
        date: e.date,
        accountId: { name: 'Expense' },
        particulars: e.category + (e.vendorName ? ` - ${e.vendorName}` : ''),
        voucherNo: e._id.toString().slice(-6).toUpperCase(),
        credit: e.totalWithTax || e.amount || 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sendSuccess(res, transformed);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentReceived = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment', credit: { $gt: 0 }, customerId: { $exists: true } }).populate('customerId', 'name').sort({ date: -1 }).lean();
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' });
    const bankIds = bankAccounts.map(a => a._id);
    const bankLedgers = await AccountLedger.find({ businessId, accountId: { $in: bankIds }, debit: { $gt: 0 } }).populate('accountId', 'name').sort({ date: -1 }).lean();
    
    const transformed: any[] = [];
    
    paymentLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.customerId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.credit || 0,
      });
    });
    
    bankLedgers.forEach((l: any) => {
      transformed.push({
        date: l.date,
        accountId: l.accountId,
        particulars: l.description,
        voucherNo: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        debit: l.debit || 0,
      });
    });
    
    transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  if (from) {
    const [y, m, d] = from.split('-');
    query.$gte = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0);
  }
  if (to) {
    const [y, m, d] = to.split('-');
    query.$lte = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 23, 59, 59, 999);
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
    
    let startOfDay, endOfDay;
    if (date) {
      const [y, m, d] = (date as string).split('-');
      startOfDay = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0);
      endOfDay = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

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

// =================== SALES REPORTS ===================

// Helper: safe date range from query
const buildDateFilter = (from?: string, to?: string, field = 'invoiceDate') => {
  const filter: any = {};
  if (from || to) {
    filter[field] = {};
    if (from) {
      const [y, m, d] = from.split('-');
      filter[field].$gte = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0);
    }
    if (to) {
      const [y, m, d] = to.split('-');
      filter[field].$lte = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 23, 59, 59, 999);
    }
  }
  return filter;
};

// GET /api/v1/reports/sales/aging
export const getSalesAging = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const today = new Date();
    const invoices = await Invoice.find({
      businessId,
      status: { $in: ['sent', 'partial', 'overdue'] },
      balance: { $gt: 0 }
    }, 'invoiceNumber invoiceDate dueDate customerSnapshot grandTotal amountReceived balance status').lean();

    const buckets: Record<string, any[]> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
    invoices.forEach((inv: any) => {
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
      const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
      const row = {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate || inv.invoiceDate,
        customer: inv.customerSnapshot?.name || 'Cash',
        grandTotal: inv.grandTotal,
        amountReceived: inv.amountReceived,
        balance: inv.balance,
        daysOverdue: Math.max(0, days),
        status: inv.status,
      };
      if (days <= 30) buckets['0-30'].push(row);
      else if (days <= 60) buckets['31-60'].push(row);
      else if (days <= 90) buckets['61-90'].push(row);
      else buckets['90+'].push(row);
    });

    const summary = Object.entries(buckets).map(([range, items]) => ({
      range,
      count: items.length,
      totalBalance: items.reduce((s, i) => s + i.balance, 0),
      items
    }));
    sendSuccess(res, { summary, allItems: invoices });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/itemwise
export const getSalesItemwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          totalGST: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } },
          totalAmount: { $sum: '$lineItems.totalAmount' },
          totalDiscount: { $sum: '$lineItems.discountAmount' },
          invoiceCount: { $addToSet: '$_id' }
      }},
      { $project: {
          productName: 1, totalQty: 1, totalTaxable: 1, totalGST: 1, totalAmount: 1, totalDiscount: 1,
          invoiceCount: { $size: '$invoiceCount' }
      }},
      { $sort: { totalAmount: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/invoicewise
export const getSalesInvoicewise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to, status } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, ...dateFilter };
    if (status) match.status = status;
    else match.status = { $ne: 'cancelled' };

    const invoices = await Invoice.find(match,
      'invoiceNumber invoiceDate invoiceType customerSnapshot grandTotal totalTaxableAmount totalGST amountReceived balance status paymentMode dueDate'
    ).sort({ invoiceDate: -1 }).lean();
    sendSuccess(res, invoices);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/invoicewise-margin
export const getInvoicewiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const invoices = await Invoice.find(match,
      'invoiceNumber invoiceDate customerSnapshot grandTotal totalTaxableAmount totalGST lineItems'
    ).lean();

    const result = invoices.map((inv: any) => {
      // Estimate cost from lineItems using rate as purchase proxy isn't ideal;
      // cost is approximated as taxableAmount * (purchasePrice/sellingPrice) — 
      // for now use totalTaxableAmount as revenue base and calculate margin on grand total
      const revenue = inv.grandTotal || 0;
      const taxable = inv.totalTaxableAmount || 0;
      const gst = inv.totalGST || 0;
      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customer: inv.customerSnapshot?.name || 'Cash',
        taxableValue: taxable,
        gstAmount: gst,
        grandTotal: revenue,
        itemCount: inv.lineItems?.length || 0,
      };
    });
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/itemwise-margin
export const getItemwiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $lookup: {
          from: 'products',
          localField: 'lineItems.productId',
          foreignField: '_id',
          as: 'product'
      }},
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          totalQtySold: { $sum: '$lineItems.quantity' },
          totalSaleAmount: { $sum: '$lineItems.totalAmount' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          avgSaleRate: { $avg: '$lineItems.rate' },
          purchasePrice: { $first: '$product.purchasePrice' },
      }},
      { $project: {
          productName: 1,
          totalQtySold: 1,
          totalSaleAmount: 1,
          totalTaxable: 1,
          avgSaleRate: 1,
          purchasePrice: { $ifNull: ['$purchasePrice', 0] },
          estimatedCost: { $multiply: [{ $ifNull: ['$purchasePrice', 0] }, '$totalQtySold'] },
          grossProfit: {
            $subtract: ['$totalTaxable', { $multiply: [{ $ifNull: ['$purchasePrice', 0] }, '$totalQtySold'] }]
          },
      }},
      { $sort: { grossProfit: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/customerwise-margin
export const getCustomerwiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await Invoice.aggregate([
      { $match: match },
      { $group: {
          _id: '$customerId',
          customerName: { $first: '$customerSnapshot.name' },
          invoiceCount: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          totalTaxable: { $sum: '$totalTaxableAmount' },
          totalGST: { $sum: '$totalGST' },
          totalReceived: { $sum: '$amountReceived' },
          totalBalance: { $sum: '$balance' },
      }},
      { $sort: { totalRevenue: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/invoicewise-summary
export const getSalesInvoicewiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const invoices = await Invoice.find(match,
      'invoiceNumber invoiceDate customerSnapshot totalTaxableAmount totalCGST totalSGST totalIGST totalGST totalDiscount grandTotal amountReceived balance status'
    ).sort({ invoiceDate: -1 }).lean();
    sendSuccess(res, invoices);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/customerwise-summary
export const getSalesCustomerwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await Invoice.aggregate([
      { $match: match },
      { $group: {
          _id: '$customerId',
          customerName: { $first: '$customerSnapshot.name' },
          invoiceCount: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' },
          totalTaxable: { $sum: '$totalTaxableAmount' },
          totalGST: { $sum: '$totalGST' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalReceived: { $sum: '$amountReceived' },
          totalBalance: { $sum: '$balance' },
      }},
      { $sort: { totalSales: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/itemwise-summary
export const getSalesItemwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          hsnCode: { $first: '$lineItems.hsnCode' },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          totalCGST: { $sum: '$lineItems.cgst' },
          totalSGST: { $sum: '$lineItems.sgst' },
          totalIGST: { $sum: '$lineItems.igst' },
          totalAmount: { $sum: '$lineItems.totalAmount' },
          totalDiscount: { $sum: '$lineItems.discountAmount' },
      }},
      { $addFields: { totalGST: { $add: ['$totalCGST', '$totalSGST', '$totalIGST'] } } },
      { $sort: { totalAmount: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/gst
export const getSalesGST = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const invoices = await Invoice.find(match,
      'invoiceNumber invoiceDate invoiceType customerSnapshot gstin placeOfSupply isInterState totalTaxableAmount totalCGST totalSGST totalIGST totalGST grandTotal'
    ).sort({ invoiceDate: -1 }).lean();

    // Group by GST rate
    const rateSummary = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.gstRate',
          taxableValue: { $sum: '$lineItems.taxableAmount' },
          cgst: { $sum: '$lineItems.cgst' },
          sgst: { $sum: '$lineItems.sgst' },
          igst: { $sum: '$lineItems.igst' },
          totalGST: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } },
      }},
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(res, { invoices, rateSummary });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/sales/recurring
export const getActiveRecurringInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const invoices = await Invoice.find({
      businessId,
      status: { $in: ['sent', 'partial', 'overdue'] },
      balance: { $gt: 0 }
    }, 'invoiceNumber invoiceDate dueDate customerSnapshot grandTotal amountReceived balance status paymentMode'
    ).sort({ dueDate: 1, invoiceDate: 1 }).lean();

    const today = new Date();
    const result = invoices.map((inv: any) => ({
      ...inv,
      daysOverdue: inv.dueDate
        ? Math.max(0, Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / 86400000))
        : 0,
    }));
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// =================== CUSTOMER REPORTS ===================

// GET /api/v1/reports/customers/amount-due
export const getCustomerAmountDue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customers = await Customer.find({ businessId, isActive: true },
      'name mobile gstin currentBalance balanceType creditLimit openingBalance'
    ).sort({ currentBalance: -1 }).lean();

    // Merge with outstanding invoices
    const outstanding = await Invoice.aggregate([
      { $match: { businessId, status: { $in: ['sent', 'partial', 'overdue'] }, balance: { $gt: 0 } } },
      { $group: {
          _id: '$customerId',
          outstandingBalance: { $sum: '$balance' },
          invoiceCount: { $sum: 1 },
          oldestDue: { $min: '$dueDate' },
      }}
    ]);

    const outstandingMap: Record<string, any> = {};
    outstanding.forEach((o: any) => { if (o._id) outstandingMap[o._id.toString()] = o; });

    const result = customers.map((c: any) => ({
      name: c.name,
      mobile: c.mobile || '—',
      gstin: c.gstin || '—',
      currentBalance: c.currentBalance || 0,
      balanceType: c.balanceType || 'Debit',
      creditLimit: c.creditLimit || 0,
      outstandingInvoices: outstandingMap[c._id?.toString()]?.invoiceCount || 0,
      outstandingBalance: outstandingMap[c._id?.toString()]?.outstandingBalance || 0,
      oldestDue: outstandingMap[c._id?.toString()]?.oldestDue || null,
    })).filter(c => c.currentBalance > 0 || c.outstandingBalance > 0);

    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/customers/payment-history
export const getCustomerPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to, customerId } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'date');
    const match: any = { businessId, ...dateFilter };
    if (customerId) match.customerId = customerId;

    const payments = await AccountLedger.find({ 
      ...match, 
      referenceType: 'Payment', 
      credit: { $gt: 0 } 
    }).populate('customerId', 'name').sort({ date: -1 }).lean();

    const formattedPayments = payments.map((l: any) => {
      // Basic parsing of mode from description if not stored specifically in ledger
      const modeMatch = l.description.match(/-\s*([A-Za-z]+)\s*(?:\(|$)/);
      const parsedMode = modeMatch ? modeMatch[1] : 'Cash';
      return {
        customer: l.customerId?.name || 'Walk-in',
        invoiceNumber: l.referenceId || '—',
        invoiceDate: l.date,
        paymentDate: l.date,
        amount: l.credit,
        mode: parsedMode,
        txnId: l.referenceId || '—',
        invoiceTotal: l.credit, // No access to grandTotal from just the payment ledger easily
      };
    });

    sendSuccess(res, formattedPayments);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/customers/account-balances
export const getCustomerAccountBalances = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customers = await Customer.find({ businessId, isActive: true },
      'name mobile gstin currentBalance openingBalance balanceType creditLimit priceCategory'
    ).sort({ name: 1 }).lean();

    const result = customers.map((c: any) => ({
      name: c.name,
      mobile: c.mobile || '—',
      gstin: c.gstin || '—',
      openingBalance: c.openingBalance || 0,
      currentBalance: c.currentBalance || 0,
      balanceType: c.balanceType || 'Debit',
      creditLimit: c.creditLimit || 0,
      priceCategory: c.priceCategory || 'Retail',
    }));
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// =================== PURCHASE REPORTS ===================

// GET /api/v1/reports/purchases/aging
export const getPurchaseAging = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const today = new Date();
    const bills = await PurchaseBill.find({
      businessId,
      status: { $in: ['received', 'partial', 'overdue'] },
      balance: { $gt: 0 }
    }, 'billNumber billDate dueDate supplierSnapshot grandTotal amountPaid balance status').lean();

    const buckets: Record<string, any[]> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
    bills.forEach((bill: any) => {
      const due = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.billDate);
      const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
      const row = {
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        dueDate: bill.dueDate || bill.billDate,
        supplier: bill.supplierSnapshot?.name || 'Unknown',
        grandTotal: bill.grandTotal,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        daysOverdue: Math.max(0, days),
        status: bill.status,
      };
      if (days <= 30) buckets['0-30'].push(row);
      else if (days <= 60) buckets['31-60'].push(row);
      else if (days <= 90) buckets['61-90'].push(row);
      else buckets['90+'].push(row);
    });

    const summary = Object.entries(buckets).map(([range, items]) => ({
      range, count: items.length,
      totalBalance: items.reduce((s, i) => s + i.balance, 0),
      items
    }));
    sendSuccess(res, { summary, allItems: bills });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/billwise
export const getPurchasesBillwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to, status } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, ...dateFilter };
    if (status) match.status = status;
    else match.status = { $ne: 'cancelled' };

    const bills = await PurchaseBill.find(match,
      'billNumber billDate purchaseType supplierSnapshot grandTotal totalTaxableAmount totalGST amountPaid balance status paymentMode dueDate'
    ).sort({ billDate: -1 }).lean();
    sendSuccess(res, bills);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/itemwise
export const getPurchasesItemwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await PurchaseBill.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          hsnCode: { $first: '$lineItems.hsnCode' },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          totalGST: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } },
          totalAmount: { $sum: '$lineItems.totalAmount' },
          avgRate: { $avg: '$lineItems.rate' },
          billCount: { $addToSet: '$_id' }
      }},
      { $project: {
          productName: 1, hsnCode: 1, totalQty: 1, totalTaxable: 1, totalGST: 1, totalAmount: 1, avgRate: 1,
          billCount: { $size: '$billCount' }
      }},
      { $sort: { totalAmount: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/billwise-summary
export const getPurchasesBillwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const bills = await PurchaseBill.find(match,
      'billNumber billDate supplierSnapshot totalTaxableAmount totalCGST totalSGST totalIGST totalGST totalDiscount grandTotal amountPaid balance status'
    ).sort({ billDate: -1 }).lean();
    sendSuccess(res, bills);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/itemwise-summary
export const getPurchasesItemwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await PurchaseBill.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          hsnCode: { $first: '$lineItems.hsnCode' },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          totalCGST: { $sum: '$lineItems.cgst' },
          totalSGST: { $sum: '$lineItems.sgst' },
          totalIGST: { $sum: '$lineItems.igst' },
          totalAmount: { $sum: '$lineItems.totalAmount' },
      }},
      { $addFields: { totalGST: { $add: ['$totalCGST', '$totalSGST', '$totalIGST'] } } },
      { $sort: { totalAmount: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/supplierwise-summary
export const getPurchasesSupplierwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, status: { $ne: 'cancelled' }, ...dateFilter };

    const result = await PurchaseBill.aggregate([
      { $match: match },
      { $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierSnapshot.name' },
          billCount: { $sum: 1 },
          totalPurchases: { $sum: '$grandTotal' },
          totalTaxable: { $sum: '$totalTaxableAmount' },
          totalGST: { $sum: '$totalGST' },
          totalDiscount: { $sum: '$totalDiscount' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalance: { $sum: '$balance' },
      }},
      { $sort: { totalPurchases: -1 } }
    ]);
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/purchases/gst
export const getPurchasesGST = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { 
      businessId, 
      status: { $ne: 'cancelled' }, 
      'supplierSnapshot.gstin': { $exists: true, $nin: [null, '', '—'] },
      ...dateFilter 
    };

    const rawBills = await PurchaseBill.find(match,
      'billNumber billDate purchaseType supplierSnapshot placeOfSupply isInterState totalTaxableAmount totalCGST totalSGST totalIGST totalGST grandTotal lineItems'
    ).sort({ billDate: -1 }).lean();

    const bills: any[] = [];
    rawBills.forEach((bill: any) => {
      if (!bill.lineItems || bill.lineItems.length === 0) {
        bills.push({
          _id: bill._id,
          billNumber: bill.billNumber,
          billDate: bill.billDate,
          supplierName: bill.supplierSnapshot?.name || '—',
          gstin: bill.supplierSnapshot?.gstin || '—',
          placeOfSupply: bill.placeOfSupply,
          grandTotal: bill.grandTotal,
          rate: 0,
          taxableValue: bill.totalTaxableAmount || 0,
          igst: bill.totalIGST || 0,
          cgst: bill.totalCGST || 0,
          sgst: bill.totalSGST || 0
        });
        return;
      }

      const rateGroups: Record<number, any> = {};
      bill.lineItems.forEach((item: any) => {
        const rate = item.gstRate || 0;
        if (!rateGroups[rate]) {
          rateGroups[rate] = { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        rateGroups[rate].taxableValue += (item.taxableAmount || 0);
        rateGroups[rate].cgst += (item.cgst || 0);
        rateGroups[rate].sgst += (item.sgst || 0);
        rateGroups[rate].igst += (item.igst || 0);
      });

      Object.keys(rateGroups).forEach((rateStr) => {
        const rate = Number(rateStr);
        const data = rateGroups[rate];
        bills.push({
          _id: `${bill._id}_${rate}`,
          billNumber: bill.billNumber,
          billDate: bill.billDate,
          supplierName: bill.supplierSnapshot?.name || '—',
          gstin: bill.supplierSnapshot?.gstin || '—',
          placeOfSupply: bill.placeOfSupply,
          grandTotal: bill.grandTotal,
          rate: rate,
          taxableValue: data.taxableValue,
          igst: data.igst,
          cgst: data.cgst,
          sgst: data.sgst
        });
      });
    });

    const rateSummary = await PurchaseBill.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.gstRate',
          taxableValue: { $sum: '$lineItems.taxableAmount' },
          cgst: { $sum: '$lineItems.cgst' },
          sgst: { $sum: '$lineItems.sgst' },
          igst: { $sum: '$lineItems.igst' },
          totalGST: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } },
      }},
      { $sort: { _id: 1 } }
    ]);
    sendSuccess(res, { bills, rateSummary });
  } catch (e: any) { sendError(res, e.message); }
};

// =================== SUPPLIER REPORTS ===================

// GET /api/v1/reports/suppliers/account-balances
export const getSupplierAccountBalances = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const suppliers = await Supplier.find({ businessId, isActive: true },
      'name mobile gstin currentBalance openingBalance balanceType creditLimit'
    ).sort({ name: 1 }).lean();

    const result = suppliers.map((s: any) => ({
      name: s.name,
      mobile: s.mobile || '—',
      gstin: s.gstin || '—',
      openingBalance: s.openingBalance || 0,
      currentBalance: s.currentBalance || 0,
      balanceType: s.balanceType || 'Credit',
      creditLimit: s.creditLimit || 0,
    }));
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/suppliers/payment-history
export const getSupplierPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to, supplierId } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'billDate');
    const match: any = { businessId, ...dateFilter };
    if (supplierId) match.supplierId = supplierId;

    const bills = await PurchaseBill.find(match,
      'billNumber billDate supplierSnapshot amountPaid paymentMode balance grandTotal status'
    ).sort({ billDate: -1 }).lean();

    const payments = bills.filter((b: any) => b.amountPaid > 0).map((b: any) => ({
      supplier: b.supplierSnapshot?.name || '—',
      billNumber: b.billNumber,
      billDate: b.billDate,
      paymentDate: b.billDate,
      amountPaid: b.amountPaid,
      mode: b.paymentMode || 'Cash',
      billTotal: b.grandTotal,
      balance: b.balance,
      status: b.status,
    }));
    sendSuccess(res, payments);
  } catch (e: any) { sendError(res, e.message); }
};

// =================== EXPENSE REPORTS ===================

// GET /api/v1/reports/expenses/search
export const getExpensesSearch = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to, category, paymentMode } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'date');
    const match: any = { businessId, ...dateFilter };
    if (category) match.category = { $regex: category, $options: 'i' };
    if (paymentMode) match.paymentMode = paymentMode;

    const expenses = await Expense.find(match,
      'category date vendorName amount gstRate cgst sgst igst totalWithTax paymentMode notes'
    ).sort({ date: -1 }).lean();

    const result = expenses.map((e: any) => ({
      date: e.date,
      category: e.category,
      vendorName: e.vendorName || 'Self',
      amount: e.amount || 0,
      gstRate: e.gstRate || 0,
      cgst: e.cgst || 0,
      sgst: e.sgst || 0,
      igst: e.igst || 0,
      gstTotal: (e.cgst || 0) + (e.sgst || 0) + (e.igst || 0),
      totalWithTax: e.totalWithTax || e.amount || 0,
      paymentMode: e.paymentMode || 'Cash',
      notes: e.notes || '—',
    }));
    sendSuccess(res, result);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/expenses/indirect
export const getIndirectExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to, 'date');
    const match: any = { businessId, ...dateFilter };

    const summary = await Expense.aggregate([
      { $match: match },
      { $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          totalGST: { $sum: { $add: [{ $ifNull: ['$cgst', 0] }, { $ifNull: ['$sgst', 0] }, { $ifNull: ['$igst', 0] }] } },
          totalWithTax: { $sum: '$totalWithTax' },
          count: { $sum: 1 },
      }},
      { $sort: { totalWithTax: -1 } }
    ]);

    const grandTotal = summary.reduce((s: number, c: any) => s + (c.totalWithTax || 0), 0);
    sendSuccess(res, { summary, grandTotal });
  } catch (e: any) { sendError(res, e.message); }
};

// =================== EXTENDED GSTR ===================

// GET /api/v1/reports/gstr/gstr1
export const getGSTR1 = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const match: any = { businessId, status: { $ne: 'cancelled' }, invoiceType: 'GST', ...dateFilter };

    const invoices = await Invoice.find(match,
      'invoiceNumber invoiceDate customerSnapshot totalTaxableAmount totalCGST totalSGST totalIGST totalGST grandTotal isInterState placeOfSupply'
    ).sort({ invoiceDate: -1 }).lean();

    // B2B vs B2C split
    const b2b = invoices.filter((i: any) => i.customerSnapshot?.gstin);
    const b2c = invoices.filter((i: any) => !i.customerSnapshot?.gstin);

    // HSN summary
    const hsnSummary = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.hsnCode',
          description: { $first: '$lineItems.productName' },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
          totalCGST: { $sum: '$lineItems.cgst' },
          totalSGST: { $sum: '$lineItems.sgst' },
          totalIGST: { $sum: '$lineItems.igst' },
          gstRate: { $first: '$lineItems.gstRate' },
      }},
      { $sort: { totalTaxable: -1 } }
    ]);

    const totals = {
      b2bCount: b2b.length,
      b2cCount: b2c.length,
      totalTaxable: invoices.reduce((s: number, i: any) => s + (i.totalTaxableAmount || 0), 0),
      totalCGST: invoices.reduce((s: number, i: any) => s + (i.totalCGST || 0), 0),
      totalSGST: invoices.reduce((s: number, i: any) => s + (i.totalSGST || 0), 0),
      totalIGST: invoices.reduce((s: number, i: any) => s + (i.totalIGST || 0), 0),
      totalGST: invoices.reduce((s: number, i: any) => s + (i.totalGST || 0), 0),
      grandTotal: invoices.reduce((s: number, i: any) => s + (i.grandTotal || 0), 0),
    };

    sendSuccess(res, { invoices, b2b, b2c, hsnSummary, totals });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /api/v1/reports/gstr/gstr3b
export const getGSTR3B = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { from, to } = req.query as any;
    const dateFilter = buildDateFilter(from, to);
    const purchaseDateFilter = buildDateFilter(from, to, 'billDate');
    const expenseDateFilter = buildDateFilter(from, to, 'date');

    const [salesGst, purchaseGst, expenseGst, cancelledSales] = await Promise.all([
      Invoice.aggregate([
        { $match: { businessId, status: { $ne: 'cancelled' }, ...dateFilter } },
        { $group: {
            _id: null,
            taxableValue: { $sum: '$totalTaxableAmount' },
            cgst: { $sum: '$totalCGST' }, sgst: { $sum: '$totalSGST' }, igst: { $sum: '$totalIGST' },
            totalTax: { $sum: '$totalGST' }, grandTotal: { $sum: '$grandTotal' }
        }}
      ]),
      PurchaseBill.aggregate([
        { $match: { businessId, status: { $ne: 'cancelled' }, ...purchaseDateFilter } },
        { $group: {
            _id: null,
            taxableValue: { $sum: '$totalTaxableAmount' },
            cgst: { $sum: '$totalCGST' }, sgst: { $sum: '$totalSGST' }, igst: { $sum: '$totalIGST' },
            totalTax: { $sum: '$totalGST' }
        }}
      ]),
      Expense.aggregate([
        { $match: { businessId, gstRate: { $gt: 0 }, ...expenseDateFilter } },
        { $group: {
            _id: null,
            taxableValue: { $sum: '$amount' },
            cgst: { $sum: '$cgst' }, sgst: { $sum: '$sgst' }, igst: { $sum: '$igst' },
            totalTax: { $sum: { $add: [{ $ifNull: ['$cgst', 0] }, { $ifNull: ['$sgst', 0] }, { $ifNull: ['$igst', 0] }] } }
        }}
      ]),
      Invoice.countDocuments({ businessId, status: 'cancelled', ...dateFilter })
    ]);

    const outward = salesGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: 0 };
    const pGst = purchaseGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const eGst = expenseGst[0] || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    delete outward._id; delete pGst._id; delete eGst._id;

    const itcClaimed = {
      taxableValue: (pGst.taxableValue || 0) + (eGst.taxableValue || 0),
      cgst: (pGst.cgst || 0) + (eGst.cgst || 0),
      sgst: (pGst.sgst || 0) + (eGst.sgst || 0),
      igst: (pGst.igst || 0) + (eGst.igst || 0),
      totalTax: (pGst.totalTax || 0) + (eGst.totalTax || 0),
    };

    const netPayable = {
      cgst: Math.max(0, (outward.cgst || 0) - itcClaimed.cgst),
      sgst: Math.max(0, (outward.sgst || 0) - itcClaimed.sgst),
      igst: Math.max(0, (outward.igst || 0) - itcClaimed.igst),
    };
    const totalNetPayable = netPayable.cgst + netPayable.sgst + netPayable.igst;

    sendSuccess(res, {
      outward, purchaseITC: pGst, expenseITC: eGst, itcClaimed, netPayable, totalNetPayable,
      cancelledInvoiceCount: cancelledSales,
    });
  } catch (e: any) { sendError(res, e.message); }
};

// ─── DASHBOARD ANALYTICS HELPERS ─────────────────────────────────────────────

function getDashboardDateRange(req: any): { start: Date; end: Date; groupBy: string } {
  const { period, from, to } = req.query;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  let start = new Date();
  let groupBy = 'day';

  if (from && to) {
    start = new Date(from as string);
    start.setHours(0, 0, 0, 0);
    const endDate = new Date(to as string);
    endDate.setHours(23, 59, 59, 999);
    const diffDays = (endDate.getTime() - start.getTime()) / (1000 * 86400);
    groupBy = diffDays <= 31 ? 'day' : diffDays <= 180 ? 'week' : 'month';
    return { start, end: endDate, groupBy };
  }

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      groupBy = 'day';
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      groupBy = 'month';
      break;
    default: // month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      groupBy = 'day';
  }
  return { start, end, groupBy };
}

// GET /reports/dashboard/business-trend
export const getDashboardBusinessTrend = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { start, end, groupBy } = getDashboardDateRange(req);
    const mongoose = require('mongoose');

    const dateFmt = groupBy === 'month' ? '%b %Y' : groupBy === 'week' ? 'W%V-%G' : '%d %b';

    const salesAgg = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$invoiceDate' } }, sales: { $sum: '$grandTotal' } } },
      { $sort: { '_id': 1 } }
    ]);

    const purchasesAgg = await PurchaseBill.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), billDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$billDate' } }, purchases: { $sum: '$grandTotal' } } },
      { $sort: { '_id': 1 } }
    ]);

    const expensesAgg = await Expense.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$date' } }, expenses: { $sum: '$totalWithTax' } } },
      { $sort: { '_id': 1 } }
    ]);

    const map: Record<string, any> = {};
    for (const s of salesAgg) { map[s._id] = { date: s._id, sales: s.sales, purchases: 0, expenses: 0 }; }
    for (const p of purchasesAgg) {
      if (!map[p._id]) map[p._id] = { date: p._id, sales: 0, purchases: 0, expenses: 0 };
      map[p._id].purchases = p.purchases;
    }
    for (const e of expensesAgg) {
      if (!map[e._id]) map[e._id] = { date: e._id, sales: 0, purchases: 0, expenses: 0 };
      map[e._id].expenses = e.expenses;
    }
    const data = Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
    sendSuccess(res, data);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/inventory-volume
export const getDashboardInventoryVolume = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const products = await Product.find({ businessId, isActive: true })
      .select('name currentStock')
      .sort({ currentStock: -1 });

    const sorted = products.map(p => ({ name: p.name, stock: p.currentStock }));
    const high = sorted.slice(0, 10);
    const low = [...sorted].reverse().slice(0, 10);
    sendSuccess(res, { high, low });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/top-items-profit
export const getDashboardTopItemsProfit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { start, end } = getDashboardDateRange(req);
    const order = req.query.order === 'asc' ? 1 : -1;
    const limit = parseInt(req.query.limit as string) || 5;
    const mongoose = require('mongoose');

    const agg = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.productName',
          totalRevenue: { $sum: { $multiply: ['$lineItems.quantity', '$lineItems.rate'] } },
          totalQty: { $sum: '$lineItems.quantity' },
          totalTaxable: { $sum: '$lineItems.taxableAmount' },
        }
      },
      { $addFields: { profit: '$totalTaxable' } },
      { $sort: { profit: order } },
      { $limit: limit },
      { $project: { _id: 0, name: '$_id', revenue: '$totalRevenue', profit: 1, qty: '$totalQty' } }
    ]);

    sendSuccess(res, agg);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/stock-movement
export const getDashboardStockMovement = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { start, end } = getDashboardDateRange(req);
    const mongoose = require('mongoose');

    const allProducts = await Product.find({ businessId, isActive: true, type: 'product' }).select('_id name currentStock');

    const soldProducts = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $unwind: '$lineItems' },
      { $match: { 'lineItems.productId': { $exists: true } } },
      { $group: { _id: '$lineItems.productId' } }
    ]);
    const soldIds = new Set(soldProducts.map((s: any) => s._id?.toString()));

    let dead = 0, fast = 0;
    const deadItems: { name: string; stock: number }[] = [];
    const fastItems: { name: string; stock: number }[] = [];

    for (const p of allProducts) {
      const isSold = soldIds.has((p._id as any).toString());
      if (isSold) { fast++; fastItems.push({ name: p.name, stock: p.currentStock }); }
      else { dead++; deadItems.push({ name: p.name, stock: p.currentStock }); }
    }

    sendSuccess(res, {
      summary: [{ name: 'Fast Moving', value: fast }, { name: 'Dead Stock', value: dead }],
      deadItems: deadItems.sort((a, b) => b.stock - a.stock).slice(0, 10),
      fastItems: fastItems.sort((a, b) => b.stock - a.stock).slice(0, 10)
    });
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/top-customers
export const getDashboardTopCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const { start, end } = getDashboardDateRange(req);
    const limit = parseInt(req.query.limit as string) || 5;
    const mongoose = require('mongoose');

    const agg = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' }, billTo: 'Customer', customerId: { $exists: true } } },
      { $group: { _id: '$customerId', name: { $first: '$customerSnapshot.name' }, totalRevenue: { $sum: '$grandTotal' }, invoiceCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      { $project: { _id: 0, customerId: '$_id', name: 1, totalRevenue: 1, invoiceCount: 1 } }
    ]);

    sendSuccess(res, agg);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/customer-pending
export const getDashboardCustomerPending = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    const customers = await Customer.find({ businessId, currentBalance: { $gt: 0 } })
      .select('name mobile currentBalance')
      .sort({ currentBalance: -1 })
      .limit(50);
    sendSuccess(res, customers);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/supplier-pending
export const getDashboardSupplierPending = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user!.businessId;
    // For suppliers, currentBalance might also signify pending payments to them
    const suppliers = await Supplier.find({ businessId, currentBalance: { $gt: 0 } })
      .select('name mobile currentBalance')
      .sort({ currentBalance: -1 })
      .limit(50);
    sendSuccess(res, suppliers);
  } catch (e: any) { sendError(res, e.message); }
};

