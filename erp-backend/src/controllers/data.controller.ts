import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

import Account from '../models/Account.model';
import AccountLedger from '../models/AccountLedger.model';
import Bank from '../models/Bank.model';
import Batch from '../models/Batch.model';
import BatchLog from '../models/BatchLog.model';
import BOM from '../models/BOM.model';
import Customer from '../models/Customer.model';
import Expense from '../models/Expense.model';
import InventoryAdjustment from '../models/InventoryAdjustment.model';
import Invoice from '../models/Invoice.model';
import ManufacturingOrder from '../models/ManufacturingOrder.model';
import Product from '../models/Product.model';
import PurchaseBill from '../models/PurchaseBill.model';
import PurchaseOrder from '../models/PurchaseOrder.model';
import PurchaseReturn from '../models/PurchaseReturn.model';
import Quotation from '../models/Quotation.model';
import SalesReturn from '../models/SalesReturn.model';
import Supplier from '../models/Supplier.model';

const allModels: { [key: string]: any } = {
  Account, AccountLedger, Bank, Batch, BatchLog, BOM, Customer, 
  Expense, InventoryAdjustment, Invoice, ManufacturingOrder, 
  Product, PurchaseBill, PurchaseOrder, PurchaseReturn, 
  Quotation, SalesReturn, Supplier
};

export const exportData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const backup: { [key: string]: any[] } = {};

    for (const modelName of Object.keys(allModels)) {
      backup[modelName] = await allModels[modelName].find({ businessId }).lean();
    }

    res.json({ backup });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const eraseData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;

    for (const modelName of Object.keys(allModels)) {
      await allModels[modelName].deleteMany({ businessId });
    }

    res.json({ message: 'All business data has been successfully erased.' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const importData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    
    // We expect the JSON file contents in req.body.backup
    const backup = req.body.backup;
    if (!backup || typeof backup !== 'object') {
      res.status(400).json({ message: 'Invalid backup data format.' });
      return;
    }

    // First, erase all existing data to prevent ID conflicts
    for (const modelName of Object.keys(allModels)) {
      await allModels[modelName].deleteMany({ businessId });
    }

    // Then, insert the new data
    for (const modelName of Object.keys(allModels)) {
      if (backup[modelName] && Array.isArray(backup[modelName]) && backup[modelName].length > 0) {
        // Ensure businessId matches the current user's businessId just in case
        const docs = backup[modelName].map((doc: any) => ({ ...doc, businessId }));
        await allModels[modelName].insertMany(docs);
      }
    }

    res.json({ message: 'Data imported successfully.' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
