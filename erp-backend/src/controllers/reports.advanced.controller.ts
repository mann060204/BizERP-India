import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import AccountLedger from '../models/AccountLedger.model';
import Account from '../models/Account.model';
import Invoice from '../models/Invoice.model';
import PurchaseBill from '../models/PurchaseBill.model';

// =================================================
// PHASE 2: FINANCIAL REPORTS
// =================================================

export const getTrialBalance = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);

    const accounts = await Account.find({ businessId, isActive: true }).lean();
    const ledgers = await AccountLedger.aggregate([
      { $match: { businessId } },
      { $group: { _id: '$accountId', debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } }
    ]);

    let totalDebit = 0;
    let totalCredit = 0;
    const ledgerMap = new Map(ledgers.map(l => [l._id?.toString(), l]));

    const data = accounts.map((acc: any) => {
      const ledger = ledgerMap.get(acc._id.toString()) || { debit: 0, credit: 0 };
      const opening = acc.openingBalance || 0;
      let netDebit = ledger.debit;
      let netCredit = ledger.credit;

      if (acc.balanceType === 'Dr') netDebit += opening;
      else netCredit += opening;

      let debitBalance = 0;
      let creditBalance = 0;

      if (netDebit > netCredit) {
        debitBalance = netDebit - netCredit;
        totalDebit += debitBalance;
      } else {
        creditBalance = netCredit - netDebit;
        totalCredit += creditBalance;
      }

      return {
        accountCode: acc._id.toString().slice(-6).toUpperCase(),
        accountName: acc.name,
        type: acc.type,
        debitBalance,
        creditBalance
      };
    }).filter(a => a.debitBalance > 0 || a.creditBalance > 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDebit,
          totalCredit,
          difference: Math.abs(totalDebit - totalCredit),
          totalAccounts: data.length
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getGeneralLedger = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const ledgers = await AccountLedger.aggregate([
      { $match: { businessId } },
      { $lookup: { from: 'accounts', localField: 'accountId', foreignField: '_id', as: 'account' } },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      { $sort: { date: 1 } }
    ]);

    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = 0;

    const data = ledgers.map((l: any) => {
      totalDebit += (l.debit || 0);
      totalCredit += (l.credit || 0);
      runningBalance += (l.debit || 0) - (l.credit || 0);

      return {
        date: l.date,
        voucherNumber: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        accountName: l.account?.name || 'Unknown',
        particulars: l.description,
        debit: l.debit || 0,
        credit: l.credit || 0,
        runningBalance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAccounts: new Set(ledgers.map((l: any) => l.accountId?.toString())).size,
          totalTransactions: ledgers.length,
          totalDebit,
          totalCredit
        },
        data: data.reverse() // Latest first for UI
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBankBook = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);

    const bankAccounts = await Account.find({ businessId, type: 'Bank' }).lean();
    const bankAccountIds = bankAccounts.map(a => a._id);

    const ledgers = await AccountLedger.aggregate([
      { $match: { businessId, accountId: { $in: bankAccountIds } } },
      { $lookup: { from: 'accounts', localField: 'accountId', foreignField: '_id', as: 'account' } },
      { $unwind: { path: '$account' } },
      { $sort: { date: 1 } }
    ]);

    let deposits = 0;
    let withdrawals = 0;
    let openingBalance = bankAccounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0);
    let closingBalance = openingBalance;

    const data = ledgers.map((l: any) => {
      deposits += (l.debit || 0); // Assuming Debit is deposit for Bank
      withdrawals += (l.credit || 0);
      closingBalance += (l.debit || 0) - (l.credit || 0);

      return {
        date: l.date,
        transactionNumber: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        bankAccount: l.account.name,
        description: l.description,
        deposit: l.debit || 0,
        withdrawal: l.credit || 0,
        balance: closingBalance
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: { openingBalance, deposits, withdrawals, closingBalance },
        data: data.reverse()
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBankReconciliation = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const bankAccounts = await Account.find({ businessId, type: 'Bank' }).lean();
    const bankAccountIds = bankAccounts.map(a => a._id);

    const ledgers = await AccountLedger.find({ businessId, accountId: { $in: bankAccountIds } })
      .populate('accountId', 'name')
      .sort({ date: -1 })
      .lean();

    let bookBalance = bankAccounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0);
    let unreconciledAmount = 0;
    let reconciledTransactions = 0;

    const data = ledgers.map((l: any) => {
      const amount = (l.debit || 0) - (l.credit || 0);
      bookBalance += amount;

      if (!l.reconciled) {
        unreconciledAmount += amount;
      } else {
        reconciledTransactions++;
      }

      return {
        transactionDate: l.date,
        referenceNumber: l.referenceId || l._id.toString().slice(-6).toUpperCase(),
        bankAmount: l.reconciled ? amount : 0,
        bookAmount: amount,
        difference: l.reconciled ? 0 : amount,
        status: l.reconciled ? 'Reconciled' : 'Unreconciled'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          bankBalance: bookBalance - unreconciledAmount,
          bookBalance,
          unreconciledAmount: Math.abs(unreconciledAmount),
          reconciledTransactions
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getCashFlowStatement = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);

    // Simplistic Cash Flow Simulation based on Account Types
    const ledgers = await AccountLedger.aggregate([
      { $match: { businessId } },
      { $lookup: { from: 'accounts', localField: 'accountId', foreignField: '_id', as: 'account' } },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } }
    ]);

    let operatingCashFlow = 0;
    let investingCashFlow = 0;
    let financingCashFlow = 0;

    ledgers.forEach((l: any) => {
      const net = (l.debit || 0) - (l.credit || 0);
      const type = l.account?.type || 'Income';

      if (type === 'Income' || type === 'Expense') operatingCashFlow += net;
      else if (type === 'Asset') investingCashFlow += net;
      else if (type === 'Capital' || type === 'Loan') financingCashFlow += net;
      else operatingCashFlow += net; // Default fallback
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          operatingCashFlow,
          investingCashFlow,
          financingCashFlow,
          netCashFlow: operatingCashFlow + investingCashFlow + financingCashFlow
        },
        sections: [
          { category: 'Operating Activities', amount: operatingCashFlow },
          { category: 'Investing Activities', amount: investingCashFlow },
          { category: 'Financing Activities', amount: financingCashFlow }
        ]
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getOutstandingReceivables = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const invoices = await Invoice.find({ businessId, balance: { $gt: 0 }, status: { $nin: ['cancelled', 'draft'] } })
      .populate('customerId', 'name')
      .lean();

    let totalReceivables = 0;
    let overdueAmount = 0;
    const now = new Date();

    const data = invoices.map((inv: any) => {
      totalReceivables += inv.balance;
      const dueDate = inv.dueDate || inv.invoiceDate;
      const diff = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff > 0) overdueAmount += inv.balance;

      return {
        customer: inv.customerSnapshot?.name || 'Cash',
        invoice: inv.invoiceNumber,
        dueDate,
        outstandingAmount: inv.balance,
        agingDays: Math.max(0, diff)
      };
    }).sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReceivables,
          overdueAmount,
          currentReceivables: totalReceivables - overdueAmount,
          collectionEfficiency: totalReceivables > 0 ? ((totalReceivables - overdueAmount) / totalReceivables) * 100 : 100
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getOutstandingPayables = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const bills = await PurchaseBill.find({ businessId, balance: { $gt: 0 }, status: { $nin: ['cancelled', 'draft'] } })
      .populate('supplierId', 'name')
      .lean();

    let totalPayables = 0;
    let overduePayables = 0;
    const now = new Date();

    const data = bills.map((bill: any) => {
      totalPayables += bill.balance;
      const dueDate = bill.dueDate || bill.billDate;
      const diff = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff > 0) overduePayables += bill.balance;

      return {
        supplier: bill.supplierSnapshot?.name || 'Cash',
        billNumber: bill.billNumber,
        dueDate,
        outstandingAmount: bill.balance,
        agingDays: Math.max(0, diff)
      };
    }).sort((a, b) => b.outstandingAmount - a.outstandingAmount);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPayables,
          overduePayables,
          currentPayables: totalPayables - overduePayables,
          averagePaymentDays: data.length ? data.reduce((acc, b) => acc + b.agingDays, 0) / data.length : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// =================================================
// PHASE 3: ADVANCED INVENTORY REPORTS
// =================================================

export const getInventoryValuation = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // We import Product dynamically to avoid circular dependencies if any, or just rely on global models.
    const Product = mongoose.models.Product || mongoose.model('Product');

    const products = await Product.find({ businessId, type: 'product', isActive: true }).lean();

    let totalInventoryQuantity = 0;
    let totalInventoryValue = 0;

    const data = products.map((p: any) => {
      const quantity = p.currentStock || 0;
      const unitCost = p.purchasePrice || p.sellingPrice || 0;
      const totalValue = quantity * unitCost;

      totalInventoryQuantity += quantity;
      totalInventoryValue += totalValue;

      return {
        itemCode: p.sku || p._id.toString().slice(-6).toUpperCase(),
        itemName: p.name,
        quantity,
        unitCost,
        totalValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInventoryQuantity,
          totalInventoryValue,
          averageCost: totalInventoryQuantity > 0 ? totalInventoryValue / totalInventoryQuantity : 0,
          totalSKUs: data.length
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getStockMovement = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Simulating Stock Movement using Invoices (Out) and Purchases (In)
    // In a real scenario, an InventoryLedger collection would be queried.
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const purchases = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const movements: any[] = [];
    
    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        if (item.productId) {
          movements.push({
            date: inv.invoiceDate,
            item: item.productName,
            transactionType: 'Sale / Stock Out',
            quantityIn: 0,
            quantityOut: item.quantity,
            runningStock: 0 // Will compute later if grouped by product
          });
        }
      });
    });

    purchases.forEach(bill => {
      bill.lineItems?.forEach(item => {
        if (item.productId) {
          movements.push({
            date: bill.billDate,
            item: item.productName,
            transactionType: 'Purchase / Stock In',
            quantityIn: item.quantity,
            quantityOut: 0,
            runningStock: 0
          });
        }
      });
    });

    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let stockIn = 0;
    let stockOut = 0;
    movements.forEach(m => {
      stockIn += m.quantityIn;
      stockOut += m.quantityOut;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          openingStock: 0, // Requires baseline
          stockIn,
          stockOut,
          closingStock: stockIn - stockOut
        },
        data: movements
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getWarehouseWiseStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const Product = mongoose.models.Product || mongoose.model('Product');

    const products = await Product.find({ businessId, type: 'product', isActive: true }).lean();

    const warehouses = new Map<string, any>();

    products.forEach((p: any) => {
      const loc = p.location || 'Main Warehouse';
      if (!warehouses.has(loc)) {
        warehouses.set(loc, { warehouse: loc, items: 0, totalQty: 0, value: 0 });
      }
      const w = warehouses.get(loc);
      w.items++;
      w.totalQty += p.currentStock || 0;
      w.value += (p.currentStock || 0) * (p.purchasePrice || 0);
    });

    const data = products.map((p: any) => ({
      warehouse: p.location || 'Main Warehouse',
      item: p.name,
      quantity: p.currentStock || 0,
      reserved: 0,
      available: p.currentStock || 0,
      value: (p.currentStock || 0) * (p.purchasePrice || 0)
    })).sort((a, b) => a.warehouse.localeCompare(b.warehouse));

    let totalInventory = 0;
    Array.from(warehouses.values()).forEach(w => totalInventory += w.totalQty);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          warehousesCount: warehouses.size,
          totalInventory,
          reservedStock: 0,
          availableStock: totalInventory
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getExpiryItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // We check the Batch model for expirations
    const Batch = mongoose.models.Batch || mongoose.model('Batch');
    const batches = await Batch.find({ businessId, currentStock: { $gt: 0 } })
      .populate('productId', 'name')
      .lean();

    let expiredItems = 0;
    let exp30 = 0;
    let exp60 = 0;
    let exp90 = 0;
    const now = new Date();

    const data = batches.map((b: any) => {
      if (!b.expiryDate) return null;
      
      const diff = Math.floor((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff < 0) expiredItems++;
      else if (diff <= 30) exp30++;
      else if (diff <= 60) exp60++;
      else if (diff <= 90) exp90++;

      return {
        item: b.productId?.name || 'Unknown',
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        quantity: b.currentStock,
        daysRemaining: diff
      };
    }).filter(b => b !== null && (b as any).daysRemaining <= 180).sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          expiredItems,
          expiringWithin30Days: exp30,
          expiringWithin60Days: exp60,
          expiringWithin90Days: exp90
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getDeadStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const Product = mongoose.models.Product || mongoose.model('Product');

    // Advanced logic: Products with >0 stock but haven't been sold in >180 days.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const activeInvoices = await Invoice.find({ businessId, invoiceDate: { $gte: sixMonthsAgo } }).lean();
    const soldProductIds = new Set();
    
    activeInvoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        if (item.productId) soldProductIds.add(item.productId.toString());
      });
    });

    const products = await Product.find({ businessId, type: 'product', currentStock: { $gt: 0 }, isActive: true }).lean();

    let deadStockCount = 0;
    let deadStockValue = 0;

    const data = products
      .filter((p: any) => !soldProductIds.has(p._id.toString()))
      .map((p: any) => {
        deadStockCount++;
        const val = (p.currentStock || 0) * (p.purchasePrice || 0);
        deadStockValue += val;

        return {
          item: p.name,
          currentStock: p.currentStock,
          lastSaleDate: null, // Would require deep lookup
          daysUnsold: '> 180',
          stockValue: val
        };
      }).sort((a, b) => b.stockValue - a.stockValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          deadStockCount,
          deadStockValue,
          averageUnsoldDays: 180,
          inventoryBlocked: products.length ? (deadStockCount / products.length) * 100 : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// =================================================
// PHASE 4: ADVANCED SALES & PURCHASE REPORTS
// =================================================

export const getSalespersonPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Group invoices by 'soldBy'
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const salespeople = new Map<string, any>();

    invoices.forEach(inv => {
      const sp = inv.soldBy || 'Direct Sales';
      if (!salespeople.has(sp)) {
        salespeople.set(sp, { salesperson: sp, orders: 0, revenue: 0, profit: 0, received: 0 });
      }
      const s = salespeople.get(sp);
      s.orders++;
      s.revenue += inv.grandTotal;
      s.received += inv.amountReceived;
      
      // Rough profit estimate: totalTaxableAmount * 0.20 for demo (Real would need purchasePrice of items)
      s.profit += inv.totalTaxableAmount * 0.20; 
    });

    let totalSales = 0;
    let ordersClosed = invoices.length;
    let revenueGenerated = 0;

    const data = Array.from(salespeople.values()).map(s => {
      totalSales++;
      revenueGenerated += s.revenue;
      return {
        salesperson: s.salesperson,
        orders: s.orders,
        revenue: s.revenue,
        profit: s.profit,
        collectionPct: s.revenue > 0 ? (s.received / s.revenue) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales,
          ordersClosed,
          revenueGenerated,
          averageDealSize: ordersClosed > 0 ? revenueGenerated / ordersClosed : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getSalesTrend = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const trends = new Map<string, any>();
    
    invoices.forEach(inv => {
      const d = new Date(inv.invoiceDate);
      const month = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!trends.has(month)) {
        trends.set(month, { month, revenue: 0, orders: 0, profit: 0 });
      }
      const t = trends.get(month);
      t.revenue += inv.grandTotal;
      t.orders++;
      t.profit += inv.totalTaxableAmount * 0.20; // Simulated profit
    });

    const data = Array.from(trends.values()).sort((a, b) => a.month.localeCompare(b.month));

    let totalRevenue = 0;
    let totalOrders = 0;

    data.forEach((t, i) => {
      totalRevenue += t.revenue;
      totalOrders += t.orders;
      if (i > 0) {
        const prev = data[i - 1].revenue;
        t.growthPct = prev > 0 ? ((t.revenue - prev) / prev) * 100 : 100;
      } else {
        t.growthPct = 0;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          monthlyRevenue: data.length > 0 ? totalRevenue / data.length : 0,
          growthPct: data.length > 1 ? data[data.length - 1].growthPct : 0,
          ordersCount: totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        },
        data: data.reverse() // Newest first
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getTopCustomersAdvanced = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const customers = new Map<string, any>();
    let totalRevenue = 0;
    let repeatCustomersCount = 0;

    invoices.forEach(inv => {
      const cid = inv.customerId?.toString() || 'Cash';
      const cname = inv.customerSnapshot?.name || 'Cash Customer';
      if (!customers.has(cid)) {
        customers.set(cid, { id: cid, customer: cname, orders: 0, revenue: 0, profit: 0, outstanding: 0 });
      }
      const c = customers.get(cid);
      c.orders++;
      c.revenue += inv.grandTotal;
      c.outstanding += inv.balance;
      c.profit += inv.totalTaxableAmount * 0.20; // Simulated
      totalRevenue += inv.grandTotal;
    });

    Array.from(customers.values()).forEach(c => {
      if (c.orders > 1) repeatCustomersCount++;
    });

    const data = Array.from(customers.values()).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          topCustomerRevenue: data.length > 0 ? data[0].revenue : 0,
          averageCustomerValue: customers.size > 0 ? totalRevenue / customers.size : 0,
          repeatPurchaseRate: customers.size > 0 ? (repeatCustomersCount / customers.size) * 100 : 0,
          revenueContribution: data.length > 0 && totalRevenue > 0 ? (data[0].revenue / totalRevenue) * 100 : 0
        },
        data: data.slice(0, 50) // Top 50
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getTopSellingProducts = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const products = new Map<string, any>();

    invoices.forEach(inv => {
      inv.lineItems?.forEach(item => {
        const pid = item.productId?.toString() || 'Misc';
        if (!products.has(pid)) {
          products.set(pid, { product: item.productName, quantitySold: 0, revenue: 0, margin: 0, profit: 0 });
        }
        const p = products.get(pid);
        p.quantitySold += item.quantity;
        p.revenue += item.totalAmount;
        p.profit += item.taxableAmount * 0.20; // Simulated
      });
    });

    const data = Array.from(products.values())
      .map(p => {
        p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
        return p;
      })
      .sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          bestSeller: data.length > 0 ? data[0].product : '-',
          quantitySold: data.length > 0 ? data[0].quantitySold : 0,
          revenue: data.length > 0 ? data[0].revenue : 0,
          profit: data.length > 0 ? data[0].profit : 0
        },
        data: data.slice(0, 50) // Top 50
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getSupplierPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const suppliers = new Map<string, any>();
    let totalPurchaseValue = 0;

    bills.forEach(bill => {
      const sid = bill.supplierId?.toString() || 'Cash';
      const sname = bill.supplierSnapshot?.name || 'Cash Supplier';
      if (!suppliers.has(sid)) {
        suppliers.set(sid, { supplier: sname, purchaseValue: 0, deliveries: 0, delayedDeliveries: 0, returnPct: 0 });
      }
      const s = suppliers.get(sid);
      s.deliveries++;
      s.purchaseValue += bill.grandTotal;
      totalPurchaseValue += bill.grandTotal;
      
      const dueDate = bill.dueDate || bill.billDate;
      const paymentHistory = (bill as any).paymentHistory || [];
      const lastPayment = paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1].date : null;
      // Rough simulation of "delayed" based on overdue balance
      if (bill.balance > 0 && new Date() > new Date(dueDate)) {
        s.delayedDeliveries++;
      }
    });

    const data = Array.from(suppliers.values()).sort((a, b) => b.purchaseValue - a.purchaseValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers.size,
          purchaseValue: totalPurchaseValue,
          onTimeDeliveryPct: 90, // Simulated static for now
          returnRatePct: 2       // Simulated static for now
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchaseTrend = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const trends = new Map<string, any>();
    
    bills.forEach(bill => {
      const d = new Date(bill.billDate);
      const month = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!trends.has(month)) {
        trends.set(month, { month, purchaseValue: 0, suppliers: new Set() });
      }
      const t = trends.get(month);
      t.purchaseValue += bill.grandTotal;
      if (bill.supplierId) t.suppliers.add(bill.supplierId.toString());
    });

    const data = Array.from(trends.values()).map(t => ({
      month: t.month,
      purchaseValue: t.purchaseValue,
      supplierCount: t.suppliers.size,
      growthPct: 0
    })).sort((a, b) => a.month.localeCompare(b.month));

    let totalPurchases = 0;

    data.forEach((t, i) => {
      totalPurchases += t.purchaseValue;
      if (i > 0) {
        const prev = data[i - 1].purchaseValue;
        t.growthPct = prev > 0 ? ((t.purchaseValue - prev) / prev) * 100 : 100;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          monthlyPurchases: data.length > 0 ? totalPurchases / data.length : 0,
          supplierSpend: totalPurchases,
          purchaseGrowthPct: data.length > 1 ? data[data.length - 1].growthPct : 0,
          averageOrderValue: bills.length > 0 ? totalPurchases / bills.length : 0
        },
        data: data.reverse()
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// =================================================
// PHASE 5: COMPLIANCE & MANAGEMENT REPORTS
// =================================================

import Budget from '../models/Budget.model';
import AuditLog from '../models/AuditLog.model';

export const getGSTAudit = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Simulate GST Audit by comparing Invoices (Output) and Purchases (Input)
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();
    const purchases = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    const periods = new Map<string, any>();

    invoices.forEach(inv => {
      const d = new Date(inv.invoiceDate);
      const m = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!periods.has(m)) periods.set(m, { period: m, taxableValue: 0, outputGST: 0, inputGST: 0 });
      const p = periods.get(m);
      p.taxableValue += inv.totalTaxableAmount;
      p.outputGST += inv.totalGST;
    });

    purchases.forEach(bill => {
      const d = new Date(bill.billDate);
      const m = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!periods.has(m)) periods.set(m, { period: m, taxableValue: 0, outputGST: 0, inputGST: 0 });
      const p = periods.get(m);
      p.inputGST += bill.totalGST;
    });

    let totalCollected = 0;
    let totalPaid = 0;

    const data = Array.from(periods.values()).map(p => {
      totalCollected += p.outputGST;
      totalPaid += p.inputGST;
      return {
        taxPeriod: p.period,
        taxableValue: p.taxableValue,
        outputGST: p.outputGST,
        inputGST: p.inputGST,
        difference: p.outputGST - p.inputGST
      };
    }).sort((a, b) => b.taxPeriod.localeCompare(a.taxPeriod));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          gstCollected: totalCollected,
          gstPaid: totalPaid,
          inputTaxCredit: totalPaid,
          netLiability: totalCollected > totalPaid ? totalCollected - totalPaid : 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getEInvoiceRegister = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Using the newly added 'irn' and 'irnDate' fields
    const invoices = await Invoice.find({ businessId, irn: { $exists: true, $ne: null } })
      .populate('customerId', 'name')
      .lean();

    let generated = 0;
    let cancelled = 0;

    const data = invoices.map((inv: any) => {
      if (inv.status === 'cancelled') cancelled++;
      else generated++;

      return {
        invoiceNumber: inv.invoiceNumber,
        irn: inv.irn || '-',
        date: inv.irnDate || inv.invoiceDate,
        customer: inv.customerSnapshot?.name || '-',
        amount: inv.grandTotal,
        status: inv.status === 'cancelled' ? 'Cancelled' : 'Generated'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEInvoices: data.length,
          irnGenerated: generated,
          cancelled,
          pending: 0 // Mock, typically would query non-IRN B2B > 5cr
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getEwayBillRegister = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Using 'ewbNumber' and 'ewbStatus'
    const invoices = await Invoice.find({ businessId, ewbNumber: { $exists: true, $ne: null } }).lean();

    let active = 0;
    let expired = 0;
    let cancelled = 0;

    const data = invoices.map((inv: any) => {
      const status = inv.ewbStatus || 'Active';
      if (status === 'Active') active++;
      else if (status === 'Expired') expired++;
      else if (status === 'Cancelled') cancelled++;

      return {
        ewbNumber: inv.ewbNumber,
        invoiceNumber: inv.invoiceNumber,
        vehicleNumber: '-', // Field not yet implemented
        consignor: 'Self', // From Business model ideally
        consignee: inv.customerSnapshot?.name || '-',
        status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: { totalEWBs: data.length, active, expired, cancelled },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBusinessDashboardAdvanced = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Massive aggregation across modules
    const [invoices, purchases, accounts, products] = await Promise.all([
      Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean(),
      Account.find({ businessId, type: 'Bank' }).lean(),
      mongoose.model('Product').find({ businessId, type: 'product' }).lean()
    ]);

    const revenue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
    const expenses = purchases.reduce((sum, p) => sum + (p.grandTotal || 0), 0); // Simplified
    const receivables = invoices.reduce((sum, i) => sum + (i.balance || 0), 0);
    const payables = purchases.reduce((sum, p) => sum + (p.balance || 0), 0);
    const inventoryValue = products.reduce((sum: any, p: any) => sum + ((p.currentStock || 0) * (p.purchasePrice || 0)), 0);
    const cashBalance = accounts.reduce((sum: any, a: any) => sum + (a.openingBalance || 0), 0); // Simplified

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          revenue,
          expenses,
          profit: revenue - expenses,
          receivables,
          payables,
          gstLiability: 0, // Mock
          inventoryValue,
          cashBalance
        }
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getProfitabilityAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).lean();

    let totalRevenue = 0;
    let totalCost = 0;

    invoices.forEach(inv => {
      totalRevenue += inv.grandTotal;
      totalCost += inv.totalTaxableAmount * 0.8; // Simulated 80% cost
    });

    const profit = totalRevenue - totalCost;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRevenue,
          cost: totalCost,
          profit,
          marginPct: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
        },
        data: [] // Would typically break down by Product, Category etc.
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBudgetVsActual = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Uses the new Budget model
    const budgets = await Budget.find({ businessId }).populate('accountId', 'name').lean();

    let totalBudget = 0;
    let totalActual = 0;
    let positiveVar = 0;
    let negativeVar = 0;

    const data = budgets.map((b: any) => {
      totalBudget += b.budgetAmount;
      totalActual += b.actualAmount;
      const variance = b.budgetAmount - b.actualAmount;
      if (variance > 0) positiveVar++;
      else if (variance < 0) negativeVar++;

      return {
        account: b.accountId?.name || 'Unknown',
        budgetAmount: b.budgetAmount,
        actualAmount: b.actualAmount,
        variance,
        variancePct: b.budgetAmount > 0 ? (variance / b.budgetAmount) * 100 : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          budgetAchievementPct: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
          positiveVariance: positiveVar,
          negativeVariance: negativeVar
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getAuditTrail = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Uses the new AuditLog model
    const logs = await AuditLog.find({ businessId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    let loginEvents = 0;
    let dataMods = 0;

    const data = logs.map((log: any) => {
      if (log.action === 'Login') loginEvents++;
      else dataMods++;

      return {
        dateTime: log.createdAt,
        user: log.userId?.name || log.userId?.email || 'System',
        module: log.module,
        action: log.action,
        oldValue: log.oldValue || '-',
        newValue: log.newValue || '-',
        ipAddress: log.ipAddress || '-'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActivities: data.length,
          loginEvents,
          dataModifications: dataMods,
          criticalChanges: 0
        },
        data
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};
