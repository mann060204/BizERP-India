import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import SalesReturn from '../models/SalesReturn.model';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';
import { generateSequenceNumber } from '../utils/sequenceGenerator';

const getNextSalesReturnNumber = async (businessId: string): Promise<string> => {
  const docKey = 'SALE_RETURN';
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $inc: { [`documentSequences.${docKey}.nextNumber`]: 1 } },
    { new: true }
  );
  if (!business) throw new Error('Business not found');
  
  const seqConfig = business.documentSequences?.get(docKey);
  const nextNum = seqConfig?.nextNumber || 1;
  const format = seqConfig?.format || `${business.salesReturnPrefix || 'CRN'}-YYYY-SEQ`;
  
  return generateSequenceNumber(format, nextNum - 1, business.financialYearStart || 4);
};

export const getPredictedSalesReturnNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const docKey = 'SALE_RETURN';
    const business = await Business.findById(businessId);
    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    
    const seqConfig = business.documentSequences?.get(docKey);
    const nextNum = seqConfig?.nextNumber || 1;
    const format = seqConfig?.format || `${business.salesReturnPrefix || 'CRN'}-YYYY-SEQ`;
    
    const nextReturnNumber = generateSequenceNumber(format, nextNum, business.financialYearStart || 4);
    res.json({ nextReturnNumber });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getSalesReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status, customerId, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (from || to) {
      query.returnDate = {};
      if (from) query.returnDate.$gte = new Date(from);
      if (to) query.returnDate.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [returns, total] = await Promise.all([
      SalesReturn.find(query)
        .populate('customerId', 'name mobile')
        .sort({ returnDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SalesReturn.countDocuments(query),
    ]);
    res.json({ returns, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getSalesReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sr = await SalesReturn.findOne({ _id: req.params['id'], businessId: req.user!.businessId })
      .populate('customerId', 'name mobile email gstin billingAddress')
      .populate('createdBy', 'name');
    if (!sr) { res.status(404).json({ message: 'Sales Return not found' }); return; }
    res.json({ salesReturn: sr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const createSalesReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId, customerSnapshot, placeOfSupply, isInterState,
      lineItems, shippingCharge, originalInvoiceNumber, notes, termsAndConditions,
      isReverseCharge, status, returnType, shippingAddress, billTo, contactNo, soldBy
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const returnNumber = await getNextSalesReturnNumber(businessId);
    const totals = calculateInvoiceTotals(lineItems, !!isInterState, returnType === 'NON-GST');
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;

    // Increase stock for returned items
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: item.quantity },
        });
        if (item.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: item.productId, batchNo: item.batchNo },
            { $inc: { currentStock: item.quantity } }
          );
        }
      }
    }

    const sr = await SalesReturn.create({
      businessId,
      returnNumber,
      returnType: returnType || 'GST',
      returnDate: new Date(),
      originalInvoiceNumber,
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
      shippingCharge: shipping,
      status: status || 'draft',
      notes,
      termsAndConditions,
      isReverseCharge: !!isReverseCharge,
      billTo: billTo || 'Customer',
      contactNo,
      soldBy,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Sales Return created', salesReturn: sr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updateSalesReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      customerId, customerSnapshot, placeOfSupply, isInterState,
      lineItems, shippingCharge, originalInvoiceNumber, notes, termsAndConditions,
      isReverseCharge, status, returnDate, returnType, shippingAddress, billTo, contactNo, soldBy
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const existingSR = await SalesReturn.findOne({ _id: id, businessId });
    if (!existingSR) { res.status(404).json({ message: 'Sales Return not found' }); return; }

    // Reverse old stock additions
    for (const oldItem of existingSR.lineItems) {
      if (oldItem.productId) {
        await Product.findByIdAndUpdate(oldItem.productId, {
          $inc: { currentStock: -oldItem.quantity },
        });
        if (oldItem.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: oldItem.productId, batchNo: oldItem.batchNo },
            { $inc: { currentStock: -oldItem.quantity } }
          );
        }
      }
    }

    const totals = calculateInvoiceTotals(lineItems, !!isInterState, returnType === 'NON-GST');
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;

    // Apply new stock additions
    for (const item of lineItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: item.quantity },
        });
        if (item.batchNo) {
          await Batch.findOneAndUpdate(
            { businessId, productId: item.productId, batchNo: item.batchNo },
            { $inc: { currentStock: item.quantity } }
          );
        }
      }
    }

    let updatedDate = existingSR.returnDate;
    if (returnDate) {
      const newDateStr = new Date(returnDate).toISOString().split('T')[0];
      const oldDateStr = new Date(existingSR.returnDate).toISOString().split('T')[0];
      if (newDateStr !== oldDateStr) updatedDate = new Date(returnDate);
    }

    const updatedSR = await SalesReturn.findByIdAndUpdate(
      id,
      {
        returnDate: updatedDate,
        originalInvoiceNumber: originalInvoiceNumber !== undefined ? originalInvoiceNumber : existingSR.originalInvoiceNumber,
        customerId: customerId || undefined,
        customerSnapshot: customerSnapshot || existingSR.customerSnapshot,
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
        shippingCharge: shipping,
        shippingAddress: shippingAddress !== undefined ? shippingAddress : existingSR.shippingAddress,
        status: status || existingSR.status,
        notes,
        termsAndConditions,
        isReverseCharge: !!isReverseCharge,
        billTo: billTo || existingSR.billTo,
        contactNo: contactNo || existingSR.contactNo,
        soldBy: soldBy || existingSR.soldBy,
      },
      { new: true }
    );

    res.json({ message: 'Sales Return updated', salesReturn: updatedSR });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updateSalesReturnStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const sr = await SalesReturn.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!sr) { res.status(404).json({ message: 'Sales Return not found' }); return; }
    if (status) sr.status = status;
    await sr.save();
    res.json({ message: 'Sales Return status updated', salesReturn: sr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getSalesReturnSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const returns = await SalesReturn.find({ businessId });

    let monthSales = 0;
    let todaySales = 0;
    let totalReceived = 0;
    let outstanding = 0;
    let monthReturnCount = 0;

    returns.forEach(r => {
      if (r.status !== 'cancelled') {
        const d = new Date(r.returnDate);
        if (d >= startOfMonth) {
          monthSales += r.grandTotal;
          monthReturnCount++;
        }
        if (d >= startOfDay) todaySales += r.grandTotal;
        // Adjust these depending on your model schema for payments, using 0 as fallback
        totalReceived += 0;
        outstanding += r.grandTotal; // or use r.balance if you have it
      }
    });

    res.json({ monthSales, todaySales, totalReceived, outstanding, monthReturnCount });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const cancelSalesReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sr = await SalesReturn.findOne({ _id: req.params.id, businessId: req.user!.businessId });
    if (!sr) { res.status(404).json({ message: 'Sales Return not found' }); return; }
    
    if (sr.status !== 'cancelled') {
      for (const item of sr.lineItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: -item.quantity },
          });
          if (item.batchNo) {
            await Batch.findOneAndUpdate(
              { businessId: sr.businessId, productId: item.productId, batchNo: item.batchNo },
              { $inc: { currentStock: -item.quantity } }
            );
          }
        }
      }
    }
    
    sr.status = 'cancelled' as any;
    await sr.save();
    res.json({ message: 'Sales Return cancelled successfully' });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
