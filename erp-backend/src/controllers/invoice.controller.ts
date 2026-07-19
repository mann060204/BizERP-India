import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Invoice from '../models/Invoice.model';
import { AccountingService } from '../services/accounting.service';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import BatchLog from '../models/BatchLog.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';
import { generateSequenceNumber } from '../utils/sequenceGenerator';
import Customer from '../models/Customer.model';
import { convertToMainUnit, getEffectiveConversionRate, validateDualUnitSetup } from '../utils/conversionUtils';

// Helper: generate next invoice number
const getNextInvoiceNumber = async (businessId: string, invoiceType: 'GST' | 'NON-GST' | 'Bill of Supply' = 'GST'): Promise<string> => {
  const docKey = invoiceType === 'GST' ? 'GST_INVOICE' : 'NON_GST_INVOICE';
  
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $inc: { [`documentSequences.${docKey}.nextNumber`]: 1 } },
    { new: true }
  );
  
  if (!business) throw new Error('Business not found');
  
  const seqConfig = business.documentSequences?.get(docKey);
  const nextNum = seqConfig?.nextNumber || 1;
  // Use format if available, fallback to old prefix + year + counter if not configured yet
  const format = seqConfig?.format || (invoiceType === 'GST' ? `${business.invoicePrefix || 'INV'}-YYYY-SEQ` : `${business.nonGstInvoicePrefix || 'NON-GST'}-YYYY-SEQ`);
  
  return generateSequenceNumber(format, nextNum - 1, business.financialYearStart || 4);
};

// GET /api/v1/invoices/next-number
export const getPredictedInvoiceNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const invoiceType = req.query.type === 'NON-GST' ? 'NON-GST' : 'GST';
    const docKey = invoiceType === 'GST' ? 'GST_INVOICE' : 'NON_GST_INVOICE';
    
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    const seqConfig = business.documentSequences?.get(docKey);
    const nextNum = seqConfig?.nextNumber || 1;
    const format = seqConfig?.format || (invoiceType === 'GST' ? `${business.invoicePrefix || 'INV'}-YYYY-SEQ` : `${business.nonGstInvoicePrefix || 'NON-GST'}-YYYY-SEQ`);
    
    const nextInvoiceNumber = generateSequenceNumber(format, nextNum, business.financialYearStart || 4);
    
    res.json({ nextInvoiceNumber });
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
    const { from, to, status, customerId, invoiceNumber, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (invoiceNumber) query.invoiceNumber = invoiceNumber;
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
      .populate('createdBy', 'name')
      .populate('paymentHistory.bankId', 'bankName accountNumber');
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
    res.json({ invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/invoices/public/:id
export const getPublicInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params['id'])
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name')
      .populate('paymentHistory.bankId', 'bankName accountNumber');
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
      txnId, deliveryTerms, deliveryRemarks, paymentHistory,
      discountAmount, roundOff, invoiceDate
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const invType = invoiceType?.toUpperCase() === 'NON-GST' ? 'NON-GST' : invoiceType === 'Bill of Supply' ? 'Bill of Supply' : 'GST';
    const invoiceNumber = await getNextInvoiceNumber(businessId, invType);
    const totals = calculateInvoiceTotals(lineItems, !!isInterState, invoiceType?.toUpperCase() === 'NON-GST' || invoiceType === 'Bill of Supply');
    const received = Number(amountReceived) || 0;
    const shipping = Number(shippingCharge) || 0;
    const dAmount = Number(discountAmount) || 0;
    const rOff = Number(roundOff) || 0;
    totals.grandTotal = Math.round((totals.grandTotal - dAmount + shipping + rOff) * 100) / 100;
    const balance = Math.round((totals.grandTotal - received) * 100) / 100;

    // Deduct stock for product items (with dual-unit conversion)
    for (const item of lineItems) {
      if (item.productId && item.quantity > 0) {
        try {
          // Fetch the product to get unit configuration
          const product = await Product.findById(item.productId).lean();
          if (!product) continue;

          // Determine which unit was entered (fall back to item.unit if not set)
          const enteredUnit = item.enteredUnit || item.unit || product.unit;

          // Resolve the batch if the item uses batch-level conversion rate
          let batchDoc: any = null;
          if (product.enableTracking && (item.batchId || item.batchNo)) {
            batchDoc = await Batch.findOne({
              businessId,
              productId: item.productId,
              ...(item.batchId ? { _id: item.batchId } : { batchNo: item.batchNo }),
            }).lean();
          }

          // Convert entered qty → main unit qty for stock deduction
          let qtyToDeduct: number;
          let conversionRateUsed: number | undefined;

          if (enteredUnit !== product.unit && product.secondaryUnit) {
            // Second unit path — apply conversion
            validateDualUnitSetup(product);
            qtyToDeduct = convertToMainUnit(item.quantity, enteredUnit, product, batchDoc);
            conversionRateUsed = getEffectiveConversionRate(product, batchDoc) ?? undefined;
          } else {
            // Main unit path — use actualQty (batch difference) or billed qty
            qtyToDeduct = item.actualQty !== undefined && item.actualQty !== null
              ? item.actualQty
              : item.quantity;
          }

          // Attach audit fields back onto the line item for storage
          item.enteredUnit = enteredUnit;
          item.convertedQty = qtyToDeduct;
          item.conversionRateUsed = conversionRateUsed;
          if (batchDoc) item.batchId = batchDoc._id;

          // Deduct from product stock
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: -qtyToDeduct },
          });

          // Deduct from batch stock if applicable
          if (item.batches && item.batches.length > 0) {
            for (const b of item.batches) {
              // For multi-batch lines, each b.quantity is in the entered unit
              const bDoc = await Batch.findOne({ businessId, productId: item.productId, batchNo: b.batchNo }).lean();
              const bQtyMainUnit = (enteredUnit !== product.unit && product.secondaryUnit)
                ? convertToMainUnit(b.quantity, enteredUnit, product, bDoc)
                : b.quantity;

              const updatedBatch = await Batch.findOneAndUpdate(
                { businessId, productId: item.productId, batchNo: b.batchNo },
                { $inc: { currentStock: -bQtyMainUnit } },
                { new: true }
              );

              if (updatedBatch) {
                await BatchLog.create({
                  businessId,
                  batchId: updatedBatch._id,
                  productId: item.productId,
                  action: 'STOCK_OUT',
                  quantityChanged: -bQtyMainUnit,
                  currentStock: updatedBatch.currentStock,
                  documentType: 'Invoice',
                  documentNumber: invoiceNumber,
                  userId: req.user!.userId,
                });
              }
            }
          } else if (item.batchNo) {
            const updatedBatch = await Batch.findOneAndUpdate(
              { businessId, productId: item.productId, batchNo: item.batchNo },
              { $inc: { currentStock: -qtyToDeduct } },
              { new: true }
            );

            if (updatedBatch) {
              await BatchLog.create({
                businessId,
                batchId: updatedBatch._id,
                productId: item.productId,
                action: 'STOCK_OUT',
                quantityChanged: -qtyToDeduct,
                currentStock: updatedBatch.currentStock,
                documentType: 'Invoice',
                documentNumber: invoiceNumber,
                userId: req.user!.userId,
              });
            }
          }
        } catch (stockErr: any) {
          console.error(`Failed to deduct stock for product ${item.productId}:`, stockErr);
          // Propagate dual-unit validation errors as 400
          if (stockErr.message?.includes('conversion rate') || stockErr.message?.includes('Second Unit')) {
            res.status(400).json({ message: stockErr.message }); return;
          }
        }
      }
    }

    const invoice = await Invoice.create({
      businessId,
      invoiceNumber,
      invoiceType: invType,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
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
      discountAmount: dAmount,
      amountReceived: received,
      shippingCharge: shipping,
      roundOff: rOff,
      balance,
      paymentMode: paymentMode || 'Cash',
      paymentHistory: paymentHistory || [],
      txnId,
      deliveryTerms,
      deliveryRemarks,
      status: status || (received + 0.05 >= totals.grandTotal ? 'paid' : received > 0 ? 'partial' : 'draft'),
      notes,
      termsAndConditions,
      isReverseCharge: !!isReverseCharge,
      createdBy: req.user!.userId,
    });

    // Record in ledger
    await AccountingService.recordSalesInvoice(invoice);

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
      termsAndConditions, isReverseCharge, status, invoiceDate, invoiceType,
      txnId, deliveryTerms, deliveryRemarks, paymentHistory,
      discountAmount, roundOff
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
        const qtyToReverse = oldItem.actualQty !== undefined && oldItem.actualQty !== null ? oldItem.actualQty : oldItem.quantity;
        await Product.findByIdAndUpdate(oldItem.productId, {
          $inc: { currentStock: qtyToReverse },
        });

        if (oldItem.batches && oldItem.batches.length > 0) {
          for (const b of oldItem.batches) {
            await Batch.findOneAndUpdate(
              { businessId, productId: oldItem.productId, batchNo: b.batchNo },
              { $inc: { currentStock: b.quantity } }
            );
          }
        } else if (oldItem.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: oldItem.productId, batchNo: oldItem.batchNo },
            { $inc: { currentStock: qtyToReverse } }
          );
        }
      }
    }

    const totals = calculateInvoiceTotals(lineItems, !!isInterState, invoiceType?.toUpperCase() === 'NON-GST' || invoiceType === 'Bill of Supply');
    const received = Number(amountReceived) || 0;
    const shipping = Number(shippingCharge) || 0;
    const dAmount = Number(discountAmount) || 0;
    const rOff = Number(roundOff) || 0;
    totals.grandTotal = Math.round((totals.grandTotal - dAmount + shipping + rOff) * 100) / 100;
    const balance = Math.round((totals.grandTotal - received) * 100) / 100;

    // Apply new stock deductions
    for (const item of lineItems) {
      if (item.productId) {
        const qtyToDeduct = item.actualQty !== undefined && item.actualQty !== null ? item.actualQty : item.quantity;
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: -qtyToDeduct },
        });

        if (item.batches && item.batches.length > 0) {
          for (const b of item.batches) {
            await Batch.findOneAndUpdate(
              { businessId, productId: item.productId, batchNo: b.batchNo },
              { $inc: { currentStock: -b.quantity } }
            );
          }
        } else if (item.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: item.productId, batchNo: item.batchNo },
            { $inc: { currentStock: -qtyToDeduct } }
          );
        }
      }
    }

    let updatedInvoiceDate = existingInvoice.invoiceDate;
    if (invoiceDate) {
      const newDateStr = new Date(invoiceDate).toISOString().split('T')[0];
      const oldDateStr = new Date(existingInvoice.invoiceDate).toISOString().split('T')[0];
      if (newDateStr !== oldDateStr) {
        updatedInvoiceDate = new Date(invoiceDate);
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        invoiceType: invoiceType?.toUpperCase() === 'NON-GST' ? 'NON-GST' : invoiceType === 'Bill of Supply' ? 'Bill of Supply' : 'GST',
        dueDate: dueDate || existingInvoice.dueDate,
        invoiceDate: updatedInvoiceDate,
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
        discountAmount: dAmount,
        amountReceived: received,
        shippingCharge: shipping,
        roundOff: rOff,
        balance,
        paymentMode: paymentMode || existingInvoice.paymentMode,
        paymentHistory: paymentHistory || existingInvoice.paymentHistory,
        txnId: txnId !== undefined ? txnId : existingInvoice.txnId,
        deliveryTerms: deliveryTerms !== undefined ? deliveryTerms : existingInvoice.deliveryTerms,
        deliveryRemarks: deliveryRemarks !== undefined ? deliveryRemarks : existingInvoice.deliveryRemarks,
        status: status || (received + 0.05 >= totals.grandTotal ? 'paid' : received > 0 ? 'partial' : 'draft'),
        notes,
        termsAndConditions,
        isReverseCharge: !!isReverseCharge,
      },
      { new: true }
    );

    // Sync Ledger: Reverse old, record new
    await AccountingService.reverseInvoice(existingInvoice);
    await AccountingService.recordSalesInvoice(updatedInvoice);

    res.json({ message: 'Invoice updated', invoice: updatedInvoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/invoices/:id/status
export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, amountReceived, paymentMode, paymentBankId, paymentDate, paymentAmount } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

    if (status) invoice.status = status;
    
    // Only process payment if an actual payment was made
    if (paymentAmount !== undefined && Number(paymentAmount) > 0) {
      const pAmt = Number(paymentAmount);
      invoice.amountReceived = (invoice.amountReceived || 0) + pAmt;
      invoice.balance = invoice.grandTotal - invoice.amountReceived;
      if (paymentMode) invoice.paymentMode = paymentMode;
      if (invoice.amountReceived + 0.05 >= invoice.grandTotal) invoice.status = 'paid';
      else if (invoice.amountReceived > 0) invoice.status = 'partial';
      
      // Record the specific payment in the ledger
      await AccountingService.recordCustomerPayment(
        invoice.businessId.toString(),
        invoice.customerId!.toString(),
        pAmt,
        paymentMode || 'Cash',
        paymentDate ? new Date(paymentDate) : new Date(),
        invoice.invoiceNumber,
        `Payment against Invoice #${invoice.invoiceNumber}`,
        paymentBankId
      );
    } else if (amountReceived !== undefined) {
      // Fallback for simple status updates without specific payment details
      invoice.amountReceived = Number(amountReceived);
      invoice.balance = invoice.grandTotal - invoice.amountReceived;
      if (paymentMode) invoice.paymentMode = paymentMode;
      if (invoice.amountReceived + 0.05 >= invoice.grandTotal) invoice.status = 'paid';
      else if (invoice.amountReceived > 0) invoice.status = 'partial';
    }

    await invoice.save();
    
    // We do NOT reverse and recreate the whole invoice ledger here if it's just a payment
    // But we need to ensure the customer balance is synced
    await AccountingService.updateCustomerBalance(invoice.customerId!, invoice.businessId.toString());

    res.json({ message: 'Invoice updated', invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/invoices/:id  (soft cancel)
export const cancelInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const invoice = await Invoice.findOne({ _id: req.params['id'], businessId });
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

    if (invoice.status === 'cancelled') {
      res.status(400).json({ message: 'Invoice is already cancelled' }); return;
    }

    // Reverse stock for all line items (invoice deducted stock, so we add it back)
    for (const item of invoice.lineItems) {
      if (item.productId) {
        try {
          const qtyToReverse = item.actualQty !== undefined && item.actualQty !== null ? item.actualQty : item.quantity;
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: qtyToReverse },
          });
          
          if (item.batches && item.batches.length > 0) {
            for (const b of item.batches) {
              await Batch.findOneAndUpdate(
                { businessId, productId: item.productId, batchNo: b.batchNo },
                { $inc: { currentStock: b.quantity } }
              );
            }
          } else if (item.batchNo) {
            await Batch.findOneAndUpdate(
              { businessId, productId: item.productId, batchNo: item.batchNo },
              { $inc: { currentStock: qtyToReverse } }
            );
          }
        } catch (stockErr) {
          console.error(`Failed to reverse stock for product ${item.productId}:`, stockErr);
        }
      }
    }

    invoice.status = 'cancelled' as any;
    await invoice.save();
    
    // Sync Ledger
    await AccountingService.reverseInvoice(invoice);
    
    res.json({ message: 'Invoice cancelled', invoice });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/v1/invoices/:id/hard  (permanent delete — only for cancelled invoices)
export const hardDeleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const invoice = await Invoice.findOne({ _id: req.params['id'], businessId });
    if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

    if (invoice.status !== 'cancelled') {
      res.status(400).json({ message: 'Only cancelled invoices can be permanently deleted. Please cancel the invoice first.' });
      return;
    }

    await Invoice.findByIdAndDelete(invoice._id);
    res.json({ message: 'Invoice permanently deleted' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/invoices/analytics/summary
export const getSalesSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const { period } = req.query as any;
    
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0,0,0,0); }
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthSales, todaySales, outstanding, totalReceived] = await Promise.all([
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), invoiceDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), invoiceDate: { $gte: startOfDay }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), currentBalance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$currentBalance' } } },
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
