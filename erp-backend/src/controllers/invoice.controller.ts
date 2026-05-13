import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Invoice from '../models/Invoice.model';
import Product from '../models/Product.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';

// Helper: generate next invoice number
const getNextInvoiceNumber = async (businessId: string): Promise<string> => {
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $inc: { invoiceCounter: 1 } },
    { new: true }
  );
  const year = new Date().getFullYear();
  const counter = String(business!.invoiceCounter).padStart(4, '0');
  return `${business!.invoicePrefix}-${year}-${counter}`;
};

// GET /api/v1/invoices
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status, customerId, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (from || to) {
      query.invoiceDate = {};
      if (from) query.invoiceDate.$gte = new Date(from);
      if (to) query.invoiceDate.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customerId', 'name mobile')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(query),
    ]);
    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/invoices/:id
export const getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params['id'], businessId: req.user!.businessId })
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
    res.json({ invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// POST /api/v1/invoices
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId, customerSnapshot, placeOfSupply, isInterState,
      lineItems, paymentMode, amountReceived, dueDate, notes,
      termsAndConditions, isReverseCharge, status,
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const invoiceNumber = await getNextInvoiceNumber(businessId);
    const totals = calculateInvoiceTotals(lineItems, !!isInterState);
    const received = Number(amountReceived) || 0;
    const balance = totals.grandTotal - received;

    // Deduct stock for product items
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -item.quantity },
        });
      }
    }

    const invoice = await Invoice.create({
      businessId,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      customerId: customerId || undefined,
      customerSnapshot: customerSnapshot || { name: 'Walk-in Customer' },
      placeOfSupply: placeOfSupply || '',
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
      amountReceived: received,
      balance,
      paymentMode: paymentMode || 'Cash',
      status: status || (received >= totals.grandTotal ? 'paid' : received > 0 ? 'partial' : 'draft'),
      notes,
      termsAndConditions,
      isReverseCharge: !!isReverseCharge,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Invoice created', invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/invoices/:id
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      customerId, customerSnapshot, placeOfSupply, isInterState,
      lineItems, paymentMode, amountReceived, dueDate, notes,
      termsAndConditions, isReverseCharge, status, invoiceDate
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const existingInvoice = await Invoice.findOne({ _id: id, businessId });
    if (!existingInvoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

    // Reverse old stock deductions
    for (const oldItem of existingInvoice.lineItems) {
      if (oldItem.productId) {
        await Product.findByIdAndUpdate(oldItem.productId, {
          $inc: { currentStock: oldItem.quantity },
        });
      }
    }

    const totals = calculateInvoiceTotals(lineItems, !!isInterState);
    const received = Number(amountReceived) || 0;
    const balance = totals.grandTotal - received;

    // Apply new stock deductions
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -item.quantity },
        });
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        dueDate: dueDate || existingInvoice.dueDate,
        invoiceDate: invoiceDate || existingInvoice.invoiceDate,
        customerId: customerId || undefined,
        customerSnapshot: customerSnapshot || existingInvoice.customerSnapshot,
        placeOfSupply: placeOfSupply || '',
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
        amountReceived: received,
        balance,
        paymentMode: paymentMode || existingInvoice.paymentMode,
        status: status || (received >= totals.grandTotal ? 'paid' : received > 0 ? 'partial' : 'draft'),
        notes,
        termsAndConditions,
        isReverseCharge: !!isReverseCharge,
      },
      { new: true }
    );

    res.json({ message: 'Invoice updated', invoice: updatedInvoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/invoices/:id/status
export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, amountReceived } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

    if (status) invoice.status = status;
    if (amountReceived !== undefined) {
      invoice.amountReceived = Number(amountReceived);
      invoice.balance = invoice.grandTotal - invoice.amountReceived;
      if (invoice.amountReceived >= invoice.grandTotal) invoice.status = 'paid';
      else if (invoice.amountReceived > 0) invoice.status = 'partial';
    }
    await invoice.save();
    res.json({ message: 'Invoice updated', invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/invoices/:id  (soft cancel)
export const cancelInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params['id'], businessId: req.user!.businessId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
    res.json({ message: 'Invoice cancelled', invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/invoices/analytics/summary
export const getSalesSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthSales, todaySales, outstanding, totalReceived] = await Promise.all([
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), invoiceDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), invoiceDate: { $gte: startOfDay }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $in: ['sent', 'partial', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$amountReceived' } } },
      ]),
    ]);

    res.json({
      monthSales: monthSales[0]?.total || 0,
      monthInvoiceCount: monthSales[0]?.count || 0,
      todaySales: todaySales[0]?.total || 0,
      outstanding: outstanding[0]?.total || 0,
      totalReceived: totalReceived[0]?.total || 0,
    });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
