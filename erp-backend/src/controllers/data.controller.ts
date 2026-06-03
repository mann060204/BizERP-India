import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import crypto from 'crypto';

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

// ── AES-256-CBC Encryption ────────────────────────────────────────────────────
// Key is 32 bytes (256 bits). Set BACKUP_ENCRYPTION_KEY in your .env for production.
const ENCRYPTION_KEY = Buffer.from(
  (process.env.BACKUP_ENCRYPTION_KEY || 'OzenStudio_BizERP_2026_SecretKey!!').padEnd(32, '0'),
  'utf8'
).slice(0, 32);

function encryptBackup(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptBackup(encryptedStr: string): string {
  const colonIdx = encryptedStr.indexOf(':');
  if (colonIdx === -1) throw new Error('Invalid encrypted backup format');
  const iv = Buffer.from(encryptedStr.slice(0, colonIdx), 'hex');
  const encryptedData = Buffer.from(encryptedStr.slice(colonIdx + 1), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decrypted.toString('utf8');
}
// ─────────────────────────────────────────────────────────────────────────────

export const exportData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const backup: { [key: string]: any[] } = {};

    for (const modelName of Object.keys(allModels)) {
      backup[modelName] = await allModels[modelName].find({ businessId }).lean();
    }

    // Encrypt the full backup JSON before sending
    const plaintext = JSON.stringify({ backup, exportedAt: new Date().toISOString(), businessId });
    const encryptedBackup = encryptBackup(plaintext);

    res.json({ encryptedBackup });
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
    const { encryptedBackup, backup: rawBackup } = req.body;

    let backup: any;
    if (encryptedBackup && typeof encryptedBackup === 'string') {
      const plaintext = decryptBackup(encryptedBackup);
      const parsed = JSON.parse(plaintext);
      backup = parsed.backup;
    } else if (rawBackup && typeof rawBackup === 'object') {
      // Legacy plain-JSON fallback
      backup = rawBackup;
    } else {
      res.status(400).json({ message: 'Invalid backup file. Please upload a valid .erp encrypted backup.' });
      return;
    }

    // Erase existing data first
    for (const modelName of Object.keys(allModels)) {
      await allModels[modelName].deleteMany({ businessId });
    }

    // Restore
    for (const modelName of Object.keys(allModels)) {
      if (backup[modelName] && Array.isArray(backup[modelName]) && backup[modelName].length > 0) {
        const docs = backup[modelName].map((doc: any) => ({ ...doc, businessId }));
        await allModels[modelName].insertMany(docs);
      }
    }

    res.json({ message: 'Data restored successfully.' });
  } catch (e: any) {
    const isBadDecrypt = e.message?.includes('bad decrypt') || e.message?.includes('Invalid encrypted') || e.message?.includes('wrong final block');
    res.status(500).json({
      message: isBadDecrypt
        ? 'Cannot decrypt backup. This file was not created by this system or is corrupted.'
        : e.message
    });
  }
};
