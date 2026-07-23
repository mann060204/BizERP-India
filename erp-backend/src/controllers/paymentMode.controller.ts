import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PaymentMode, { LedgerType } from '../models/PaymentMode.model';
import Account from '../models/Account.model';

/**
 * Default payment modes that are seeded for every business on first use.
 * ledgerType determines WHICH ledger class is hit (CASH or BANK).
 * linkedAccountId is resolved at seed-time by querying the Account model.
 */
const DEFAULT_MODES: Array<{
  name: string;
  ledgerType: LedgerType;
  flag?: string;   // which Account flag to query for auto-link
  sortOrder: number;
}> = [
  { name: 'Cash',          ledgerType: 'CASH', sortOrder: 1 },
  { name: 'UPI',           ledgerType: 'BANK', flag: 'isDefaultUpi',    sortOrder: 2 },
  { name: 'Cheque',        ledgerType: 'BANK', flag: 'isDefaultCheque', sortOrder: 3 },
  { name: 'NEFT',          ledgerType: 'BANK', flag: 'isDefaultNeft',   sortOrder: 4 },
  { name: 'RTGS',          ledgerType: 'BANK', flag: 'isDefaultNeft',   sortOrder: 5 },
  { name: 'Bank Transfer', ledgerType: 'BANK', flag: 'isDefaultNeft',   sortOrder: 6 },
  { name: 'Card',          ledgerType: 'BANK',                          sortOrder: 7 },
  { name: 'Credit Card',   ledgerType: 'BANK',                          sortOrder: 8 },
];

/**
 * Ensures default PaymentMode docs exist for this business.
 * Called lazily on GET — idempotent.
 */
async function ensureDefaultModes(businessId: string) {
  const existing = await PaymentMode.find({ businessId });
  if (existing.length > 0) return; // already seeded

  // Find the Cash account
  const cashAcct = await Account.findOne({ businessId, type: 'Cash', isActive: true });

  // For each default, try to find a linked Account via the flag
  const toInsert = await Promise.all(
    DEFAULT_MODES.map(async (m) => {
      let linkedAccountId: any = null;

      if (m.ledgerType === 'CASH' && cashAcct) {
        linkedAccountId = cashAcct._id;
      } else if (m.flag) {
        const acct = await Account.findOne({ businessId, type: 'Bank', isActive: true, [m.flag]: true });
        if (acct) linkedAccountId = acct._id;
      }

      return {
        businessId,
        name: m.name,
        ledgerType: m.ledgerType,
        linkedAccountId,
        isActive: true,
        isDefault: true,
        sortOrder: m.sortOrder,
      };
    })
  );

  await PaymentMode.insertMany(toInsert, { ordered: false }).catch(() => {
    // Ignore duplicate key errors (race condition)
  });
}

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/payment-modes
// ─────────────────────────────────────────────────────────────────
export const listPaymentModes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    await ensureDefaultModes(businessId.toString());

    const modes = await PaymentMode.find({ businessId })
      .populate('linkedAccountId', 'name type bankName accountNumber currentBalance')
      .sort({ sortOrder: 1, createdAt: 1 });

    res.json({ modes });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/payment-modes  — create custom mode
// ─────────────────────────────────────────────────────────────────
export const createPaymentMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { name, ledgerType, linkedAccountId } = req.body;

    if (!name || !ledgerType) {
      res.status(400).json({ message: 'name and ledgerType are required' });
      return;
    }
    if (!['CASH', 'BANK'].includes(ledgerType)) {
      res.status(400).json({ message: 'ledgerType must be CASH or BANK' });
      return;
    }

    const mode = await PaymentMode.create({
      businessId,
      name: name.trim(),
      ledgerType,
      linkedAccountId: linkedAccountId || null,
      isActive: true,
      isDefault: false,
      sortOrder: 99,
    });

    res.status(201).json({ mode });
  } catch (e: any) {
    if (e.code === 11000) {
      res.status(409).json({ message: `Payment mode "${req.body.name}" already exists` });
    } else {
      res.status(500).json({ message: e.message });
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// PUT /api/v1/payment-modes/:id  — update linked account / name / status
// ─────────────────────────────────────────────────────────────────
export const updatePaymentMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { id } = req.params;
    const { linkedAccountId, isActive, ledgerType } = req.body;

    const mode = await PaymentMode.findOne({ _id: id, businessId });
    if (!mode) { res.status(404).json({ message: 'Payment mode not found' }); return; }

    if (linkedAccountId !== undefined) mode.linkedAccountId = linkedAccountId || null;
    if (isActive !== undefined) mode.isActive = isActive;
    if (ledgerType && ['CASH', 'BANK'].includes(ledgerType)) mode.ledgerType = ledgerType;

    await mode.save();
    res.json({ mode });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/v1/payment-modes/:id  — soft delete (only user-created)
// ─────────────────────────────────────────────────────────────────
export const deletePaymentMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { id } = req.params;

    const mode = await PaymentMode.findOne({ _id: id, businessId });
    if (!mode) { res.status(404).json({ message: 'Payment mode not found' }); return; }
    if (mode.isDefault) {
      res.status(400).json({ message: 'Default payment modes cannot be deleted. You can deactivate them instead.' });
      return;
    }

    await PaymentMode.deleteOne({ _id: id, businessId });
    res.json({ message: 'Payment mode deleted' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/v1/payment-modes/resolve?mode=UPI
// Returns which account this mode posts to — used for frontend preview
// ─────────────────────────────────────────────────────────────────
export const resolveMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { mode } = req.query as { mode: string };
    if (!mode) { res.status(400).json({ message: 'mode query param required' }); return; }

    await ensureDefaultModes(businessId.toString());

    const modeDoc = await PaymentMode.findOne({
      businessId,
      name: { $regex: new RegExp(`^${mode}$`, 'i') },
      isActive: true,
    }).populate('linkedAccountId', 'name type bankName currentBalance');

    if (!modeDoc) {
      res.json({ resolved: false, message: `No configuration found for mode "${mode}"` });
      return;
    }

    const hasAccount = modeDoc.ledgerType === 'CASH' || !!modeDoc.linkedAccountId;

    res.json({
      resolved: hasAccount,
      ledgerType: modeDoc.ledgerType,
      account: modeDoc.linkedAccountId || null,
      warning: !hasAccount
        ? `Payment mode "${mode}" has no linked bank account. Configure it in Settings → Payment Modes.`
        : null,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
