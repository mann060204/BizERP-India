import { Request, Response } from 'express';
import AccountLedger from '../models/AccountLedger.model';
import Account from '../models/Account.model';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';
import Invoice from '../models/Invoice.model';

// Helper for sending success response
const sendSuccess = (res: Response, data: any) => res.status(200).json({ success: true, data });
const sendError = (res: Response, message: string, status = 500) => res.status(status).json({ success: false, message });

// --- ACCOUNTS REPORTS ---

export const getCashBook = async (req: Request, res: Response) => {
  try {
    const cashAccount = await Account.findOne({ accountType: 'Cash' });
    if (!cashAccount) return sendError(res, 'Cash account not found', 404);
    
    const ledgers = await AccountLedger.find({ accountId: cashAccount._id }).sort({ date: -1, createdAt: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBusinessBook = async (req: Request, res: Response) => {
  try {
    const ledgers = await AccountLedger.find().populate('accountId', 'name accountType').sort({ date: -1 }).limit(1000);
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentPaid = async (req: Request, res: Response) => {
  try {
    // Find ledgers where bank/cash is credited (money going out)
    const bankCashAccounts = await Account.find({ accountType: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ accountId: { $in: accountIds }, credit: { $gt: 0 } })
      .populate('accountId', 'name')
      .sort({ date: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getPaymentReceived = async (req: Request, res: Response) => {
  try {
    // Find ledgers where bank/cash is debited (money coming in)
    const bankCashAccounts = await Account.find({ accountType: { $in: ['Bank', 'Cash'] } });
    const accountIds = bankCashAccounts.map(a => a._id);
    const ledgers = await AccountLedger.find({ accountId: { $in: accountIds }, debit: { $gt: 0 } })
      .populate('accountId', 'name')
      .sort({ date: -1 });
    sendSuccess(res, ledgers);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getChartOfAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find().sort({ group: 1, name: 1 });
    sendSuccess(res, accounts);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const accounts = await Account.find();
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

export const getItemRegister = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getLowLevelStock = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ 
      $expr: { $lte: ['$currentStock', '$lowStockAlert'] } 
    }).sort({ currentStock: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAvailability = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ currentStock: { $gt: 0 } }).sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getStockAdjustment = async (req: Request, res: Response) => {
  try {
    const adjustments = await InventoryAdjustment.find().populate('productId', 'name').sort({ date: -1, createdAt: -1 });
    sendSuccess(res, adjustments);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getConsumableStock = async (req: Request, res: Response) => {
  try {
    // Assuming product category or type defines consumable
    const products = await Product.find({ category: /consumable/i }).sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getFastMovingItems = async (req: Request, res: Response) => {
  try {
    // Aggregate from invoices over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const pipeline: any[] = [
      { $match: { date: { $gte: thirtyDaysAgo } } },
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

export const getSlowMovingItems = async (req: Request, res: Response) => {
  try {
    // Products with no sales in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const activeProductIds = await Invoice.distinct('items.productId', { date: { $gte: ninetyDaysAgo } });
    
    const slowProducts = await Product.find({ _id: { $nin: activeProductIds as any[] }, currentStock: { $gt: 0 } } as any).sort({ name: 1 });
    sendSuccess(res, slowProducts);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getAvailableSerials = async (req: Request, res: Response) => {
  try {
    const batches = await Batch.find({ currentStock: { $gt: 0 } }).populate('productId', 'name itemCode').sort({ 'productId.name': 1 });
    sendSuccess(res, batches);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

export const getItemList = async (req: Request, res: Response) => {
  try {
    const products = await Product.find().select('name itemCode category unit purchasePrice salePrice mrp currentStock').sort({ name: 1 });
    sendSuccess(res, products);
  } catch (error: any) {
    sendError(res, error.message);
  }
};
