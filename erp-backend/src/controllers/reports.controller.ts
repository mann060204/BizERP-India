import mongoose from 'mongoose';
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const paymentLedgers = await AccountLedger.find({ businessId, referenceType: 'Payment', description: { $regex: /Cash/i } }).lean();
    
    const bankLedgers: any[] = []; // Removed bank ledgers from cash book
    
    const expenses = await Expense.find({ businessId, paymentMode: { $in: ['Cash', '', null] } }).lean();
    
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { category, warehouse } = req.query as any;

    const query: any = { businessId };
    if (category) query.category = category;
    if (warehouse) query.location = warehouse;

    const products = await Product.find(query).sort({ name: 1 });
    
    let totalStockQuantity = 0;
    let totalInventoryValue = 0;
    let activeItems = 0;

    const transformed = products.map((p: any) => {
      const stock = p.currentStock || 0;
      const value = stock * (p.purchasePrice || 0);
      
      totalStockQuantity += stock;
      totalInventoryValue += value;
      if (p.isActive !== false) activeItems++;

      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        category: p.category || p.productType || 'General',
        unit: p.unit || 'Nos',
        openingStock: p.openingStock || 0,
        stockIn: 0, 
        stockOut: 0, 
        closingStock: stock,
        inventoryValue: value,
      };
    });
    
    res.status(200).json({
      success: true, 
      data: {
        summary: {
          totalItems: products.length,
          totalStockQuantity,
          totalInventoryValue,
          activeItems
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLowLevelStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { category, warehouse } = req.query as any;

    const query: any = { 
      businessId, 
      $expr: { $lte: ['$currentStock', '$reorderLevel'] } 
    };
    if (category) query.category = category;
    if (warehouse) query.location = warehouse;

    const products = await Product.find(query).sort({ currentStock: 1 });
    
    let outOfStockItems = 0;
    let criticalStockItems = 0;
    let reorderRequiredItems = products.length;

    const transformed = products.map((p: any) => {
      const stock = p.currentStock || 0;
      const minStock = p.reorderLevel || 0;
      let status = 'Reorder Needed';
      if (stock <= 0) {
        status = 'Out of Stock';
        outOfStockItems++;
      } else if (stock <= minStock / 2) {
        status = 'Critical';
        criticalStockItems++;
      }
      
      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        category: p.category || p.productType || 'General',
        currentStock: stock,
        minStockLevel: minStock,
        reorderQuantity: Math.max(0, minStock - stock) || 10,
        stockStatus: status,
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          lowStockItemsCount: products.length,
          outOfStockItems,
          criticalStockItems,
          reorderRequiredItems
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { category, warehouse } = req.query as any;

    const query: any = { businessId, currentStock: { $gt: 0 } };
    if (category) query.category = category;
    if (warehouse) query.location = warehouse;

    const products = await Product.find(query).sort({ name: 1 });
    
    let totalAvailableQuantity = 0;
    let inventoryValue = 0;

    const transformed = products.map((p: any) => {
      const stock = p.currentStock || 0;
      totalAvailableQuantity += stock;
      inventoryValue += stock * (p.purchasePrice || 0);

      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        warehouse: p.location || 'Main Warehouse',
        availableQuantity: stock,
        reservedQuantity: 0,
        onOrderQuantity: 0,
        netAvailableQuantity: stock,
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAvailableQuantity,
          inventoryValue,
          reservedStock: 0,
          availableForSale: totalAvailableQuantity
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    const adjustments = await InventoryAdjustment.find({ businessId })
      .populate('productId', 'name sku location')
      .sort({ createdAt: -1 });
      
    let totalAdjustments = adjustments.length;
    let positiveAdjustments = 0;
    let negativeAdjustments = 0;
    let netAdjustmentValue = 0;

    const transformed = adjustments.map((a: any) => {
      const isPositive = a.type === 'add';
      if (isPositive) positiveAdjustments++;
      else negativeAdjustments++;
      
      const qty = a.quantity || 0;
      netAdjustmentValue += (isPositive ? qty : -qty);

      return {
        adjustmentDate: a.createdAt,
        itemName: a.productId?.name || 'Unknown',
        warehouse: a.productId?.location || 'Main Warehouse',
        previousQuantity: '-',
        adjustedQuantity: isPositive ? qty : -qty,
        difference: isPositive ? qty : -qty,
        reason: a.reason || 'Physical Count Correction',
        user: 'Admin',
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAdjustments,
          positiveAdjustments,
          negativeAdjustments,
          netAdjustmentValue
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConsumableStock = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { department, category } = req.query as any;

    const query: any = {
      businessId,
      $or: [{ category: /consumable/i }, { productType: 'Consumable' }]
    };
    if (category) query.category = category;

    const products = await Product.find(query).sort({ name: 1 });
    
    let totalConsumableItems = products.length;
    let currentConsumableStock = 0;

    const transformed = products.map((p: any) => {
      const stock = p.currentStock || 0;
      currentConsumableStock += stock;
      
      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        unit: p.unit || 'Nos',
        openingStock: p.openingStock || 0,
        consumedQuantity: 0,
        currentStock: stock,
        averageConsumption: 0,
        remainingDays: 0,
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalConsumableItems,
          currentConsumableStock,
          monthlyConsumption: 0,
          estimatedDaysRemaining: 0
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFastMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { category } = req.query as any;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pipeline: any[] = [
      { $match: { businessId, invoiceDate: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.productId',
          totalSold: { $sum: '$lineItems.quantity' },
          productName: { $first: '$lineItems.productName' },
          totalRevenue: { $sum: '$lineItems.totalAmount' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 20 }
    ];
    
    const fastItems = await Invoice.aggregate(pipeline);
    
    let topSellingItem = '-';
    let totalQuantitySold = 0;
    let revenueGenerated = 0;

    if (fastItems.length > 0) {
      topSellingItem = fastItems[0].productName;
    }

    const transformed = fastItems.map((item: any) => {
      totalQuantitySold += item.totalSold;
      revenueGenerated += item.totalRevenue;
      return {
        itemCode: item._id?.toString().slice(-6).toUpperCase() || '-',
        name: item.productName || 'Unknown Product',
        quantitySold: item.totalSold || 0,
        salesValue: item.totalRevenue || 0,
        averageMonthlySales: item.totalSold || 0,
        stockTurnoverRatio: 0,
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          topSellingItem,
          totalQuantitySold,
          revenueGenerated,
          fastMovingItemsCount: fastItems.length
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSlowMovingItems = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activeProductIds = await Invoice.distinct('lineItems.productId', {
      businessId,
      invoiceDate: { $gte: ninetyDaysAgo },
      status: { $ne: 'cancelled' }
    });
    
    const slowProducts = await Product.find({
      businessId,
      _id: { $nin: activeProductIds as any[] },
      currentStock: { $gt: 0 }
    }).sort({ name: 1 });
    
    let slowMovingItemsCount = 0;
    let deadStockCount = 0;
    let inventoryValueLocked = 0;

    const transformed = slowProducts.map((p: any) => {
      const stock = p.currentStock || 0;
      const val = stock * (p.purchasePrice || 0);
      inventoryValueLocked += val;
      
      const isDead = stock > 0;
      if (isDead) deadStockCount++;
      slowMovingItemsCount++;

      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        currentStock: stock,
        lastSoldDate: 'Over 90 days',
        daysSinceLastSale: 90,
        stockValue: val,
        status: isDead ? 'Dead Stock' : 'Slow Moving',
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          slowMovingItemsCount,
          deadStockCount,
          inventoryValueLocked,
          unsoldDaysAverage: 90
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailableSerials = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const batches = await Batch.find({ businessId })
      .populate('productId', 'name sku location')
      .sort({ createdAt: -1 });
      
    let totalSerials = batches.length;
    let availableSerials = 0;
    let soldSerials = 0;

    const transformed = batches.map((b: any) => {
      const stock = b.currentStock || 0;
      if (stock > 0) availableSerials++;
      else soldSerials++;
      
      return {
        serialNumber: b.batchNo || '-',
        itemName: b.productId?.name || 'Unknown',
        warehouse: b.productId?.location || 'Main Warehouse',
        status: stock > 0 ? 'Available' : 'Sold',
        purchaseDate: b.createdAt,
        warrantyExpiry: b.expiryDate || '-',
        customerAssigned: '-',
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSerials,
          availableSerials,
          soldSerials,
          reservedSerials: 0
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getItemList = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { category, brand, status } = req.query as any;

    const query: any = { businessId };
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const products = await Product.find(query).sort({ name: 1 });
    
    let activeItems = 0;
    let inactiveItems = 0;
    const categories = new Set();

    const transformed = products.map((p: any) => {
      if (p.isActive !== false) activeItems++;
      else inactiveItems++;
      
      if (p.category) categories.add(p.category);

      return {
        itemCode: p.sku || p.barcode || p._id.toString().slice(-6).toUpperCase(),
        name: p.name,
        category: p.category || p.productType || 'General',
        brand: p.brand || '-',
        unit: p.unit || 'Nos',
        purchasePrice: p.purchasePrice || 0,
        sellingPrice: p.sellingPrice || 0,
        currentStock: p.currentStock || 0,
        status: p.isActive !== false ? 'Active' : 'Inactive',
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: products.length,
          activeItems,
          inactiveItems,
          categoriesCount: categories.size
        },
        data: transformed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SALES REPORTS ---

export const getSalesAging = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['cancelled', 'draft'] } })
      .populate('customerId', 'name')
      .sort({ dueDate: 1 });
      
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let currentReceivables = 0;
    
    const buckets = { current: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };
    const bucketCounts = { current: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 };

    const transformed = invoices.filter((inv: any) => inv.balance > 0).map((inv: any) => {
      const balance = inv.balance || 0;
      totalOutstanding += balance;
      
      const now = new Date();
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
      const diffTime = now.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = diffDays > 0 ? diffDays : 0;
      
      let bucketName = 'Current (0 Days)';
      if (daysOverdue === 0) {
        currentReceivables += balance;
        buckets.current += balance;
        bucketCounts.current++;
      } else {
        overdueAmount += balance;
        if (daysOverdue <= 30) { bucketName = '1-30 Days'; buckets.b30 += balance; bucketCounts.b30++; }
        else if (daysOverdue <= 60) { bucketName = '31-60 Days'; buckets.b60 += balance; bucketCounts.b60++; }
        else if (daysOverdue <= 90) { bucketName = '61-90 Days'; buckets.b90 += balance; bucketCounts.b90++; }
        else { bucketName = '90+ Days'; buckets.b90plus += balance; bucketCounts.b90plus++; }
      }

      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customer: inv.customerSnapshot?.name || inv.customerId?.name || 'Unknown',
        dueDate: due,
        invoiceAmount: inv.grandTotal,
        paidAmount: inv.amountReceived,
        outstandingAmount: balance,
        daysOverdue,
        agingBucket: bucketName
      };
    });

    const summaryData = [
      { range: '1-30', totalBalance: buckets.b30, count: bucketCounts.b30 },
      { range: '31-60', totalBalance: buckets.b60, count: bucketCounts.b60 },
      { range: '61-90', totalBalance: buckets.b90, count: bucketCounts.b90 },
      { range: '90+', totalBalance: buckets.b90plus, count: bucketCounts.b90plus }
    ];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOutstandingAmount: totalOutstanding,
          overdueAmount,
          currentReceivables,
          averageCollectionDays: transformed.length > 0 ? Math.round(transformed.reduce((acc, curr) => acc + curr.daysOverdue, 0) / transformed.length) : 0
        },
        data: transformed,
        summaryBuckets: summaryData
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesItemwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.productId',
          productName: { $first: '$lineItems.productName' },
          quantitySold: { $sum: '$lineItems.quantity' },
          salesValue: { $sum: '$lineItems.totalAmount' }
        }
      },
      { $sort: { salesValue: -1 } }
    ]);
    
    let totalQuantitySold = 0;
    let totalRevenue = 0;
    
    agg.forEach(a => {
      totalQuantitySold += a.quantitySold;
      totalRevenue += a.salesValue;
    });

    const transformed = agg.map((a: any) => ({
      itemCode: a._id ? a._id.toString().slice(-6).toUpperCase() : '-',
      itemName: a.productName || 'Unknown',
      category: 'General',
      quantitySold: a.quantitySold,
      salesValue: a.salesValue,
      averagePrice: a.quantitySold ? (a.salesValue / a.quantitySold) : 0,
      contributionPercent: totalRevenue ? ((a.salesValue / totalRevenue) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalQuantitySold,
          totalRevenue,
          bestSellingItem: transformed[0]?.itemName || '-',
          averageSellingPrice: totalQuantitySold ? (totalRevenue / totalQuantitySold) : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesInvoicewise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['draft'] } }).sort({ invoiceDate: -1 });
    
    let totalInvoices = invoices.length;
    let totalSalesValue = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;

    const transformed = invoices.map((inv: any) => {
      totalSalesValue += inv.grandTotal || 0;
      if (inv.status === 'paid') paidInvoices++;
      if (inv.status === 'overdue' || inv.status === 'partial' || (inv.balance > 0 && inv.status !== 'cancelled')) unpaidInvoices++;
      
      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customer: inv.customerSnapshot?.name || 'Unknown',
        invoiceAmount: inv.totalTaxableAmount || 0,
        taxAmount: inv.totalGST || 0,
        totalAmount: inv.grandTotal || 0,
        paymentStatus: inv.status,
        dueDate: inv.dueDate || inv.invoiceDate
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInvoices,
          totalSalesValue,
          paidInvoices,
          unpaidInvoices
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getInvoicewiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'lineItems.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id',
          invoiceNumber: { $first: '$invoiceNumber' },
          invoiceDate: { $first: '$invoiceDate' },
          customerName: { $first: '$customerSnapshot.name' },
          revenue: { $first: '$totalTaxableAmount' },
          totalCost: { $sum: { $multiply: ['$lineItems.quantity', { $ifNull: ['$product.purchasePrice', 0] }] } }
        }
      },
      { $sort: { invoiceDate: -1 } }
    ]);
    
    let totalRevenue = 0;
    let totalCost = 0;

    const transformed = agg.map((a: any) => {
      const revenue = a.revenue || 0;
      const cost = a.totalCost || 0;
      const grossProfit = revenue - cost;
      const marginPercent = revenue ? (grossProfit / revenue) * 100 : 0;
      
      totalRevenue += revenue;
      totalCost += cost;

      return {
        invoiceNumber: a.invoiceNumber,
        customer: a.customerName || 'Unknown',
        revenue,
        costValue: cost,
        grossProfit,
        marginPercent,
        invoiceDate: a.invoiceDate
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          grossProfit: totalRevenue - totalCost,
          averageMarginPercent: totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getItemwiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'lineItems.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$lineItems.productId',
          itemName: { $first: '$lineItems.productName' },
          quantitySold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.taxableAmount' },
          totalCost: { $sum: { $multiply: ['$lineItems.quantity', { $ifNull: ['$product.purchasePrice', 0] }] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    let totalRevenue = 0;
    let totalCost = 0;

    const transformed = agg.map((a: any) => {
      const revenue = a.revenue || 0;
      const cost = a.totalCost || 0;
      const grossProfit = revenue - cost;
      const marginPercent = revenue ? (grossProfit / revenue) * 100 : 0;
      
      totalRevenue += revenue;
      totalCost += cost;

      return {
        itemCode: a._id ? a._id.toString().slice(-6).toUpperCase() : '-',
        itemName: a.itemName || 'Unknown',
        quantitySold: a.quantitySold,
        revenue,
        cost,
        grossProfit,
        marginPercent
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalProductCost: totalCost,
          totalGrossProfit: totalRevenue - totalCost,
          averageMarginPercent: totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getCustomerwiseMargin = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'lineItems.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { invoiceId: '$_id', customerId: '$customerId', customerName: '$customerSnapshot.name', revenue: '$totalTaxableAmount' },
          totalCost: { $sum: { $multiply: ['$lineItems.quantity', { $ifNull: ['$product.purchasePrice', 0] }] } }
        }
      },
      {
        $group: {
          _id: '$_id.customerId',
          customerName: { $first: '$_id.customerName' },
          invoiceCount: { $sum: 1 },
          revenue: { $sum: '$_id.revenue' },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    let totalCustomers = agg.length;
    let totalRevenue = 0;
    let totalCost = 0;

    const transformed = agg.map((a: any) => {
      const revenue = a.revenue || 0;
      const cost = a.totalCost || 0;
      const grossProfit = revenue - cost;
      
      totalRevenue += revenue;
      totalCost += cost;

      return {
        customerName: a.customerName || 'Cash Customer',
        numberOfInvoices: a.invoiceCount,
        revenue,
        cost,
        grossProfit,
        marginPercent: revenue ? (grossProfit / revenue) * 100 : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalRevenue,
          totalProfit: totalRevenue - totalCost,
          averageCustomerMargin: totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesInvoicewiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['draft', 'cancelled'] } }).sort({ invoiceDate: -1 });

    let totalTaxable = 0;
    let totalGST = 0;
    let totalNet = 0;

    const transformed = invoices.map((inv: any) => {
      totalTaxable += inv.totalTaxableAmount || 0;
      totalGST += inv.totalGST || 0;
      totalNet += inv.grandTotal || 0;

      return {
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customerSnapshot?.name || 'Unknown',
        taxableValue: inv.totalTaxableAmount || 0,
        cgst: inv.totalCGST || 0,
        sgst: inv.totalSGST || 0,
        igst: inv.totalIGST || 0,
        gstTotal: inv.totalGST || 0,
        invoiceTotal: inv.grandTotal || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInvoices: invoices.length,
          taxableSales: totalTaxable,
          totalGST,
          netInvoiceValue: totalNet
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesCustomerwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerSnapshot.name' },
          numberOfOrders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          outstanding: { $sum: '$balance' },
          lastPurchaseDate: { $max: '$invoiceDate' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    let totalRevenue = 0;
    let totalOutstanding = 0;

    const transformed = agg.map((a: any) => {
      totalRevenue += a.revenue || 0;
      totalOutstanding += a.outstanding || 0;
      return {
        customerName: a.customerName || 'Cash Customer',
        numberOfOrders: a.numberOfOrders,
        revenue: a.revenue,
        outstanding: a.outstanding,
        lastPurchaseDate: a.lastPurchaseDate,
        averageInvoiceValue: a.numberOfOrders ? a.revenue / a.numberOfOrders : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers: agg.length,
          totalRevenue,
          outstandingAmount: totalOutstanding,
          averageOrderValue: agg.length ? totalRevenue / agg.length : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesItemwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.productId',
          itemName: { $first: '$lineItems.productName' },
          quantitySold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.totalAmount' },
          taxableValue: { $sum: '$lineItems.taxableAmount' },
          gstAmount: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    let totalQuantitySold = 0;
    let totalRevenue = 0;

    const transformed = agg.map((a: any) => {
      totalQuantitySold += a.quantitySold || 0;
      totalRevenue += a.revenue || 0;
      return {
        itemCode: a._id ? a._id.toString().slice(-6).toUpperCase() : '-',
        itemName: a.itemName || 'Unknown',
        quantitySold: a.quantitySold,
        revenue: a.revenue,
        taxableValue: a.taxableValue,
        gstAmount: a.gstAmount,
        netSalesValue: a.revenue
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProductsSold: agg.length,
          totalQuantitySold,
          revenueGenerated: totalRevenue,
          averageSellingPrice: totalQuantitySold ? totalRevenue / totalQuantitySold : 0
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getSalesGST = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const invoices = await Invoice.find({ businessId, status: { $nin: ['draft', 'cancelled'] } }).sort({ invoiceDate: -1 });

    let taxableSales = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const transformed = invoices.map((inv: any) => {
      taxableSales += inv.totalTaxableAmount || 0;
      cgstTotal += inv.totalCGST || 0;
      sgstTotal += inv.totalSGST || 0;
      igstTotal += inv.totalIGST || 0;

      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customer: inv.customerSnapshot?.name || 'Unknown',
        gstNumber: inv.customerSnapshot?.gstin || '-',
        taxableValue: inv.totalTaxableAmount || 0,
        cgst: inv.totalCGST || 0,
        sgst: inv.totalSGST || 0,
        igst: inv.totalIGST || 0,
        invoiceTotal: inv.grandTotal || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTaxableSales: taxableSales,
          totalGSTCollected: cgstTotal + sgstTotal + igstTotal,
          cgstTotal,
          sgstTotal,
          igstTotal
        },
        data: transformed
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

export const getActiveRecurringInvoices = async (req: AuthRequest, res: Response) => {
  try {
    // Mocked since schema doesn't support Recurring Invoices yet
    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeRecurringInvoices: 0,
          monthlyRecurringRevenue: 0,
          nextBillingAmount: 0,
          upcomingRenewals: 0
        },
        data: []
      }
    });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};

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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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


// =================== CUSTOMER REPORTS ===================

export const getCustomerAmountDue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Merge customers with outstanding invoices
    const agg = await Invoice.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] }, balance: { $gt: 0 } } },
      { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $sort: { dueDate: 1 } }
    ]);

    let totalOutstandingAmount = 0;
    let overdueAmount = 0;
    let dueToday = 0;
    let totalDaysOverdue = 0;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    const transformed = agg.map((inv: any) => {
      const balance = inv.balance || 0;
      totalOutstandingAmount += balance;
      
      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
      due.setHours(0,0,0,0);
      
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let daysOverdue = 0;
      let bucketName = 'Current';

      if (diffDays === 0) {
        dueToday += balance;
      } else if (diffDays > 0) {
        daysOverdue = diffDays;
        overdueAmount += balance;
        totalDaysOverdue += daysOverdue;
        overdueCount++;
        
        if (daysOverdue <= 30) bucketName = '1-30 Days';
        else if (daysOverdue <= 60) bucketName = '31-60 Days';
        else if (daysOverdue <= 90) bucketName = '61-90 Days';
        else bucketName = '90+ Days';
      }

      return {
        customerName: inv.customerSnapshot?.name || inv.customer?.name || 'Unknown',
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: due,
        invoiceAmount: inv.grandTotal,
        paidAmount: inv.amountReceived,
        outstandingAmount: balance,
        daysOverdue,
        agingCategory: bucketName
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOutstandingAmount,
          overdueAmount,
          dueToday,
          averageCollectionDays: overdueCount ? Math.round(totalDaysOverdue / overdueCount) : 0
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getCustomerPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    
    // Using invoice payment history since Customer model doesn't store robust ledger history directly here
    const agg = await Invoice.aggregate([
      { $match: { businessId, paymentHistory: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$paymentHistory' },
      { $sort: { 'paymentHistory.date': -1 } }
    ]);

    let totalCollections = 0;
    const transformed = agg.map((inv: any) => {
      const p = inv.paymentHistory;
      totalCollections += p.amount || 0;
      return {
        paymentDate: p.date,
        customerName: inv.customerSnapshot?.name || 'Unknown',
        receiptNumber: p.txnId || '-',
        invoiceReference: inv.invoiceNumber,
        paymentMethod: p.mode || 'Cash',
        amountReceived: p.amount || 0,
        referenceNumber: p.txnId || '-',
        remarks: '-'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCollections,
          numberOfPayments: transformed.length,
          averagePaymentValue: transformed.length ? totalCollections / transformed.length : 0,
          recentCollections: transformed.slice(0, 5).reduce((acc: number, curr: any) => acc + curr.amountReceived, 0)
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getCustomerAccountBalances = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const customers = await Customer.find({ businessId }).sort({ currentBalance: -1 });

    let debitBalance = 0;
    let creditBalance = 0;

    const transformed = customers.map((c: any) => {
      let debit = 0;
      let credit = 0;
      if (c.balanceType === 'Debit') {
        debit = c.currentBalance;
        debitBalance += debit;
      } else {
        credit = c.currentBalance;
        creditBalance += credit;
      }
      return {
        customerCode: c._id.toString().slice(-6).toUpperCase(),
        customerName: c.name,
        openingBalance: c.openingBalance || 0,
        debitAmount: debit,
        creditAmount: credit,
        closingBalance: c.currentBalance || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers: customers.length,
          debitBalance,
          creditBalance,
          netReceivable: debitBalance - creditBalance
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// =================== PURCHASE REPORTS ===================

export const getPurchaseAging = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] }, balance: { $gt: 0 } }).sort({ dueDate: 1 });

    let totalOutstandingPayables = 0;
    let overdueBills = 0;
    let currentPayables = 0;
    let totalDaysOutstanding = 0;
    let overdueCount = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    const transformed = bills.map((bill: any) => {
      const balance = bill.balance || 0;
      totalOutstandingPayables += balance;

      const due = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.billDate);
      due.setHours(0,0,0,0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let daysOutstanding = 0;
      let bucketName = 'Current';

      if (diffDays <= 0) {
        currentPayables += balance;
      } else {
        daysOutstanding = diffDays;
        overdueBills += balance;
        totalDaysOutstanding += daysOutstanding;
        overdueCount++;

        if (daysOutstanding <= 30) bucketName = '1-30 Days';
        else if (daysOutstanding <= 60) bucketName = '31-60 Days';
        else if (daysOutstanding <= 90) bucketName = '61-90 Days';
        else bucketName = '90+ Days';
      }

      return {
        billNumber: bill.billNumber,
        supplier: bill.supplierSnapshot?.name || 'Unknown',
        billDate: bill.billDate,
        dueDate: due,
        billAmount: bill.grandTotal,
        paidAmount: bill.amountPaid,
        outstandingAmount: balance,
        daysOutstanding,
        agingCategory: bucketName
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOutstandingPayables,
          overdueBills,
          currentPayables,
          averagePaymentDays: overdueCount ? Math.round(totalDaysOutstanding / overdueCount) : 0
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesBillwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).sort({ billDate: -1 });

    let totalPurchaseValue = 0;
    let paidBills = 0;
    let unpaidBills = 0;

    const transformed = bills.map((b: any) => {
      totalPurchaseValue += b.grandTotal || 0;
      if (b.status === 'paid') paidBills++;
      else unpaidBills++;

      return {
        billNumber: b.billNumber,
        billDate: b.billDate,
        supplier: b.supplierSnapshot?.name || 'Unknown',
        taxableAmount: b.totalTaxableAmount || 0,
        gstAmount: b.totalGST || 0,
        totalBillAmount: b.grandTotal || 0,
        paymentStatus: b.status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchaseBills: bills.length,
          totalPurchaseValue,
          paidBills,
          unpaidBills
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesItemwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await PurchaseBill.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          itemName: { $first: '$lineItems.productName' },
          quantityPurchased: { $sum: '$lineItems.quantity' },
          purchaseValue: { $sum: '$lineItems.totalAmount' },
          suppliers: { $addToSet: '$supplierId' }
      }},
      { $sort: { purchaseValue: -1 } }
    ]);

    let totalPurchaseQuantity = 0;
    let totalPurchaseValue = 0;

    const transformed = agg.map((a: any) => {
      totalPurchaseQuantity += a.quantityPurchased;
      totalPurchaseValue += a.purchaseValue;
      return {
        itemCode: a._id ? a._id.toString().slice(-6).toUpperCase() : '-',
        itemName: a.itemName || 'Unknown',
        quantityPurchased: a.quantityPurchased,
        purchaseValue: a.purchaseValue,
        averageCost: a.quantityPurchased ? a.purchaseValue / a.quantityPurchased : 0,
        supplierCount: a.suppliers.length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItemsPurchased: agg.length,
          totalPurchaseQuantity,
          totalPurchaseValue,
          averagePurchaseCost: totalPurchaseQuantity ? totalPurchaseValue / totalPurchaseQuantity : 0
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesBillwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).sort({ billDate: -1 });

    let taxablePurchases = 0;
    let totalGST = 0;
    let totalPurchaseAmount = 0;

    const transformed = bills.map((b: any) => {
      taxablePurchases += b.totalTaxableAmount || 0;
      totalGST += b.totalGST || 0;
      totalPurchaseAmount += b.grandTotal || 0;

      return {
        billNumber: b.billNumber,
        supplier: b.supplierSnapshot?.name || 'Unknown',
        taxableValue: b.totalTaxableAmount || 0,
        cgst: b.totalCGST || 0,
        sgst: b.totalSGST || 0,
        igst: b.totalIGST || 0,
        gstTotal: b.totalGST || 0,
        billTotal: b.grandTotal || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBills: bills.length,
          taxablePurchases,
          totalGST,
          totalPurchaseAmount
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesItemwiseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await PurchaseBill.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $unwind: '$lineItems' },
      { $group: {
          _id: '$lineItems.productId',
          itemName: { $first: '$lineItems.productName' },
          quantity: { $sum: '$lineItems.quantity' },
          purchaseValue: { $sum: '$lineItems.totalAmount' },
          taxableAmount: { $sum: '$lineItems.taxableAmount' },
          gstAmount: { $sum: { $add: ['$lineItems.cgst', '$lineItems.sgst', '$lineItems.igst'] } }
      }},
      { $sort: { purchaseValue: -1 } }
    ]);

    let totalQuantityPurchased = 0;
    let totalPurchaseValue = 0;

    const transformed = agg.map((a: any) => {
      totalQuantityPurchased += a.quantity || 0;
      totalPurchaseValue += a.purchaseValue || 0;

      return {
        itemCode: a._id ? a._id.toString().slice(-6).toUpperCase() : '-',
        itemName: a.itemName || 'Unknown',
        quantity: a.quantity,
        purchaseValue: a.purchaseValue,
        taxableAmount: a.taxableAmount,
        gstAmount: a.gstAmount
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: agg.length,
          totalQuantityPurchased,
          totalPurchaseValue,
          averageUnitCost: totalQuantityPurchased ? totalPurchaseValue / totalQuantityPurchased : 0
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesSupplierwise = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const agg = await PurchaseBill.aggregate([
      { $match: { businessId, status: { $nin: ['cancelled', 'draft'] } } },
      { $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierSnapshot.name' },
          numberOfBills: { $sum: 1 },
          purchaseValue: { $sum: '$grandTotal' },
          paidAmount: { $sum: '$amountPaid' },
          outstandingAmount: { $sum: '$balance' },
          lastPurchaseDate: { $max: '$billDate' }
      }},
      { $sort: { purchaseValue: -1 } }
    ]);

    let totalPurchases = 0;
    let outstandingPayables = 0;

    const transformed = agg.map((a: any) => {
      totalPurchases += a.purchaseValue || 0;
      outstandingPayables += a.outstandingAmount || 0;
      return {
        supplierName: a.supplierName || 'Unknown',
        numberOfBills: a.numberOfBills,
        purchaseValue: a.purchaseValue,
        paidAmount: a.paidAmount,
        outstandingAmount: a.outstandingAmount,
        lastPurchaseDate: a.lastPurchaseDate
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: agg.length,
          totalPurchases,
          outstandingPayables,
          averagePurchaseValue: agg.length ? totalPurchases / agg.length : 0
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getPurchasesGST = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, status: { $nin: ['cancelled', 'draft'] } }).sort({ billDate: -1 });

    let totalTaxablePurchases = 0;
    let totalInputGST = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const transformed = bills.map((b: any) => {
      totalTaxablePurchases += b.totalTaxableAmount || 0;
      totalInputGST += b.totalGST || 0;
      cgstTotal += b.totalCGST || 0;
      sgstTotal += b.totalSGST || 0;
      igstTotal += b.totalIGST || 0;

      return {
        billNumber: b.billNumber,
        billDate: b.billDate,
        supplier: b.supplierSnapshot?.name || 'Unknown',
        gstNumber: b.supplierSnapshot?.gstin || '-',
        taxableValue: b.totalTaxableAmount || 0,
        cgst: b.totalCGST || 0,
        sgst: b.totalSGST || 0,
        igst: b.totalIGST || 0,
        gstTotal: b.totalGST || 0,
        billTotal: b.grandTotal || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTaxablePurchases,
          totalInputGST,
          cgstTotal,
          sgstTotal,
          igstTotal
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

// =================== SUPPLIER REPORTS ===================

export const getSupplierAccountBalances = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const suppliers = await Supplier.find({ businessId }).sort({ currentBalance: -1 });

    let totalPayables = 0;
    let debitBalances = 0;
    let creditBalances = 0;

    const transformed = suppliers.map((s: any) => {
      let debit = 0;
      let credit = 0;
      if (s.balanceType === 'Debit') {
        debit = s.currentBalance;
        debitBalances += debit;
      } else {
        credit = s.currentBalance;
        creditBalances += credit;
      }
      totalPayables += s.currentBalance;

      return {
        supplierCode: s._id.toString().slice(-6).toUpperCase(),
        supplierName: s.name,
        openingBalance: s.openingBalance || 0,
        debit: debit,
        credit: credit,
        closingBalance: s.currentBalance || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers.length,
          totalPayables,
          debitBalances,
          creditBalances
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const getSupplierPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const bills = await PurchaseBill.find({ businessId, amountPaid: { $gt: 0 } }).sort({ paymentDate: -1, billDate: -1 });

    let totalPaymentsMade = 0;

    const transformed = bills.map((b: any) => {
      totalPaymentsMade += b.amountPaid || 0;
      return {
        paymentDate: b.paymentDate || b.billDate,
        supplierName: b.supplierSnapshot?.name || 'Unknown',
        voucherNumber: b.txnId || '-',
        paymentMethod: b.paymentMode || 'Cash',
        amountPaid: b.amountPaid,
        referenceNumber: b.billNumber,
        remarks: b.remarks || '-'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPaymentsMade,
          numberOfPayments: transformed.length,
          averagePaymentAmount: transformed.length ? totalPaymentsMade / transformed.length : 0,
          recentPayments: transformed.slice(0, 5).reduce((acc, curr) => acc + curr.amountPaid, 0)
        },
        data: transformed
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};
// =================== EXPENSE REPORTS ===================

// GET /api/v1/reports/expenses/search
export const getExpensesSearch = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { start, end, groupBy } = getDashboardDateRange(req);

    const dateFmt = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-%m-%d' : '%Y-%m-%d';

    const salesAgg = await Invoice.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$invoiceDate' } }, sales: { $sum: '$grandTotal' } } },
    ]);

    const purchasesAgg = await PurchaseBill.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), billDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$billDate' } }, purchases: { $sum: '$grandTotal' } } },
    ]);

    const expensesAgg = await Expense.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: dateFmt, date: '$date' } }, expenses: { $sum: '$totalWithTax' } } },
    ]);

    const map: Record<string, any> = {};

    const formatDisplayDate = (dStr: string) => {
      const d = new Date(dStr);
      if (groupBy === 'month') {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (groupBy === 'week') {
        const getWeek = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        };
        return `W${getWeek(d)}-${d.getFullYear()}`;
      } else {
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      }
    };

    for (const s of salesAgg) { 
      const disp = formatDisplayDate(s._id);
      if (!map[disp]) map[disp] = { date: disp, sales: 0, purchases: 0, expenses: 0, sortKey: s._id };
      map[disp].sales += s.sales; 
    }
    for (const p of purchasesAgg) {
      const disp = formatDisplayDate(p._id);
      if (!map[disp]) map[disp] = { date: disp, sales: 0, purchases: 0, expenses: 0, sortKey: p._id };
      map[disp].purchases += p.purchases;
    }
    for (const e of expensesAgg) {
      const disp = formatDisplayDate(e._id);
      if (!map[disp]) map[disp] = { date: disp, sales: 0, purchases: 0, expenses: 0, sortKey: e._id };
      map[disp].expenses += e.expenses;
    }
    
    const data = Object.values(map)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
      
    sendSuccess(res, data);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/inventory-volume
export const getDashboardInventoryVolume = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { start, end } = getDashboardDateRange(req);
    const order = req.query.order === 'asc' ? 1 : -1;
    const limit = parseInt(req.query.limit as string) || 5;

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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { start, end } = getDashboardDateRange(req);

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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const { start, end } = getDashboardDateRange(req);
    const limit = parseInt(req.query.limit as string) || 5;

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
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    const customers = await Customer.find({ businessId, currentBalance: { $gt: 0 } })
      .select('name mobile currentBalance')
      .sort({ currentBalance: -1 })
      .limit(1000);
    sendSuccess(res, customers);
  } catch (e: any) { sendError(res, e.message); }
};

// GET /reports/dashboard/supplier-pending
export const getDashboardSupplierPending = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
    // For suppliers, currentBalance might also signify pending payments to them
    const suppliers = await Supplier.find({ businessId, currentBalance: { $lt: 0 } })
      .select('name mobile currentBalance')
      .sort({ currentBalance: -1 })
      .limit(1000);
    sendSuccess(res, suppliers);
  } catch (e: any) { sendError(res, e.message); }
};

