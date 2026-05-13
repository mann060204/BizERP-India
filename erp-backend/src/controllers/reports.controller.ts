import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Invoice from '../models/Invoice.model';
import PurchaseBill from '../models/PurchaseBill.model';
import Expense from '../models/Expense.model';

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
