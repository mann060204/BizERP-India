import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Invoice from '../models/Invoice.model';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';

// Helper: generate next invoice number
const getNextInvoiceNumber = async (businessId: string, invoiceType: 'GST' | 'NON-GST' = 'GST'): Promise<string> => {
  const isGst = invoiceType === 'GST';
  const incrementField = isGst ? 'invoiceCounter' : 'nonGstInvoiceCounter';
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $inc: { [incrementField]: 1 } },
    { new: true }
  );
  const year = new Date().getFullYear();
  const counterVal = isGst ? business!.invoiceCounter : business!.nonGstInvoiceCounter;
  const prefixVal = isGst ? business!.invoicePrefix : business!.nonGstInvoicePrefix;
  const counter = String(counterVal).padStart(4, '0');
  return `${prefixVal}-${year}-${counter}`;
};

// GET /api/v1/invoices/next-number
export const getPredictedInvoiceNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const type = req.query.type === 'NON-GST' ? 'NON-GST' : 'GST';
    
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    const year = new Date().getFullYear();
    const isGst = type === 'GST';
    const counterVal = isGst ? business.invoiceCounter : business.nonGstInvoiceCounter;
    const prefixVal = isGst ? business.invoicePrefix : business.nonGstInvoicePrefix;
    const counter = String(counterVal).padStart(4, '0');
    
    res.json({ nextInvoiceNumber: `${prefixVal}-${year}-${counter}` });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/v1/invoices/last-price
export const getCustomerLastPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, productId } = req.query;
    if (!customerId || !productId) {
      res.status(400).json({ message: 'customerId and productId are required' });
      return;
    }
    
    // Find the most recent invoice for this customer that contains this product
    const invoice = await Invoice.findOne({
      businessId: req.user!.businessId,
      customerId: customerId as string,
      'lineItems.productId': productId as string,
      status: { $ne: 'cancelled' }
    }).sort({ invoiceDate: -1 });

    if (!invoice) {
      res.json({ lastPrice: null });
      return;
    }

    // Find the specific line item
    const lineItem = invoice.lineItems.find(item => item.productId?.toString() === productId);
    res.json({ lastPrice: lineItem?.rate || null, invoiceDate: invoice.invoiceDate });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
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
        .sort({ invoiceDate: -1, createdAt: -1 })
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
      lineItems, paymentMode, amountReceived, shippingCharge, dueDate, notes,
      termsAndConditions, isReverseCharge, status, invoiceType, shippingAddress,
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const invType = invoiceType === 'NON-GST' ? 'NON-GST' : 'GST';
    const invoiceNumber = await getNextInvoiceNumber(businessId, invType);
    const totals = calculateInvoiceTotals(lineItems, !!isInterState, invoiceType === 'NON-GST');
    const received = Number(amountReceived) || 0;
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;
    const balance = totals.grandTotal - received;

    // Deduct stock for product items
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -item.quantity },
        });

        if (item.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: item.productId, batchNo: item.batchNo },
            { $inc: { currentStock: -item.quantity } }
          );
        }
      }
    }

    const invoice = await Invoice.create({
      businessId,
      invoiceNumber,
      invoiceType: invType,
      invoiceDate: new Date(),
      dueDate,
      shippingAddress: shippingAddress || undefined,
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
      shippingCharge: shipping,
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
      lineItems, paymentMode, amountReceived, shippingCharge, dueDate, notes,
      termsAndConditions, isReverseCharge, status, invoiceDate, invoiceType
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

        if (oldItem.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: oldItem.productId, batchNo: oldItem.batchNo },
            { $inc: { currentStock: oldItem.quantity } }
          );
        }
      }
    }

    const totals = calculateInvoiceTotals(lineItems, !!isInterState, invoiceType === 'NON-GST');
    const received = Number(amountReceived) || 0;
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;
    const balance = totals.grandTotal - received;

    // Apply new stock deductions
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -item.quantity },
        });

        if (item.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: item.productId, batchNo: item.batchNo },
            { $inc: { currentStock: -item.quantity } }
          );
        }
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
        shippingCharge: shipping,
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
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), status: { $in: ['draft', 'partial', 'overdue'] } } },
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
