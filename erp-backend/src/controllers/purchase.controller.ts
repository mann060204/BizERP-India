import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PurchaseBill from '../models/PurchaseBill.model';
import Product from '../models/Product.model';
import { calculateInvoiceTotals } from '../services/gst.service';

// GET /api/v1/purchases
export const getPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status, supplierId, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = new Date(from);
      if (to) query.billDate.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [purchases, total] = await Promise.all([
      PurchaseBill.find(query)
        .populate('supplierId', 'name mobile')
        .sort({ billDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PurchaseBill.countDocuments(query),
    ]);
    res.json({ purchases, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/purchases/:id
export const getPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchase = await PurchaseBill.findOne({ _id: req.params['id'], businessId: req.user!.businessId })
      .populate('supplierId', 'name mobile email gstin address')
      .populate('createdBy', 'name');
    if (!purchase) { res.status(404).json({ message: 'Purchase Bill not found' }); return; }
    res.json({ purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/purchases
export const createPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      billNumber, billDate, dueDate, supplierId, supplierSnapshot, isInterState,
      lineItems, paymentMode, amountPaid, notes, status,
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }
    if (!billNumber) {
      res.status(400).json({ message: 'Supplier Bill Number is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const totals = calculateInvoiceTotals(lineItems, !!isInterState);
    const paid = Number(amountPaid) || 0;
    const balance = totals.grandTotal - paid;

    // Add stock for product items
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    const purchase = await PurchaseBill.create({
      businessId,
      billNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      dueDate,
      supplierId: supplierId || undefined,
      supplierSnapshot: supplierSnapshot || { name: 'Walk-in Supplier' },
      isInterState: !!isInterState,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalTaxableAmount: totals.totalTaxableAmount,
      totalCGST: totals.totalCGST,
      totalSGST: totals.totalSGST,
      totalIGST: totals.totalIGST,
      totalGST: totals.totalGST,
      grandTotal: totals.grandTotal,
      amountPaid: paid,
      balance,
      paymentMode: paymentMode || 'Cash',
      status: status || (paid >= totals.grandTotal ? 'paid' : paid > 0 ? 'partial' : 'received'),
      notes,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Purchase bill created', purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/purchases/:id/status
export const updatePurchaseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, amountPaid } = req.body;
    const purchase = await PurchaseBill.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!purchase) { res.status(404).json({ message: 'Purchase bill not found' }); return; }

    if (status) purchase.status = status;
    if (amountPaid !== undefined) {
      purchase.amountPaid = Number(amountPaid);
      purchase.balance = purchase.grandTotal - purchase.amountPaid;
      if (purchase.amountPaid >= purchase.grandTotal) purchase.status = 'paid';
      else if (purchase.amountPaid > 0) purchase.status = 'partial';
    }
    await purchase.save();
    res.json({ message: 'Purchase bill updated', purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/purchases/:id  (soft cancel)
export const cancelPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const purchase = await PurchaseBill.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!purchase) { res.status(404).json({ message: 'Purchase bill not found' }); return; }
    res.json({ message: 'Purchase bill cancelled', purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/purchases/analytics/summary
export const getPurchaseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthPurchases, outstanding, totalPaid] = await Promise.all([
      PurchaseBill.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), billDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      PurchaseBill.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $in: ['received', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),
      PurchaseBill.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
    ]);

    res.json({
      monthPurchases: monthPurchases[0]?.total || 0,
      monthPurchaseCount: monthPurchases[0]?.count || 0,
      outstanding: outstanding[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
