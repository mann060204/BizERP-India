import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PurchaseReturn from '../models/PurchaseReturn.model';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';

const getNextPurchaseReturnNumber = async (businessId: string): Promise<string> => {
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $inc: { purchaseReturnCounter: 1 } },
    { new: true }
  );
  const year = new Date().getFullYear();
  const counterVal = business!.purchaseReturnCounter;
  const prefixVal = business!.purchaseReturnPrefix || 'DBN';
  const counter = String(counterVal).padStart(4, '0');
  return `-${year}-${counter};
};

export const getPredictedPurchaseReturnNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const business = await Business.findById(businessId);
    if (!business) { res.status(404).json({ message: 'Business not found' }); return; }
    const year = new Date().getFullYear();
    const counterVal = business.purchaseReturnCounter;
    const prefixVal = business.purchaseReturnPrefix || 'DBN';
    const counter = String(counterVal).padStart(4, '0');
    res.json({ nextReturnNumber: `-${year}-${counter} });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getPurchaseReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status, supplierId, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (from || to) {
      query.returnDate = {};
      if (from) query.returnDate.$gte = new Date(from);
      if (to) query.returnDate.$lte = new Date(to);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [returns, total] = await Promise.all([
      PurchaseReturn.find(query)
        .populate('supplierId', 'name mobile')
        .sort({ returnDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PurchaseReturn.countDocuments(query),
    ]);
    res.json({ returns, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const getPurchaseReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pr = await PurchaseReturn.findOne({ _id: req.params['id'], businessId: req.user!.businessId })
      .populate('supplierId', 'name mobile email gstin address')
      .populate('createdBy', 'name');
    if (!pr) { res.status(404).json({ message: 'Purchase Return not found' }); return; }
    res.json({ purchaseReturn: pr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const createPurchaseReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      supplierId, supplierSnapshot, placeOfSupply, isInterState,
      lineItems, shippingCharge, originalBillNumber, notes, termsAndConditions,
      isReverseCharge, status, returnType, shippingAddress, billTo, contactNo, soldBy
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const returnNumber = await getNextPurchaseReturnNumber(businessId);
    const totals = calculateInvoiceTotals(lineItems, !!isInterState, returnType === 'NON-GST');
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;

    // Decrease stock for returned items to supplier
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

    const pr = await PurchaseReturn.create({
      businessId,
      returnNumber,
      returnType: returnType || 'GST',
      returnDate: new Date(),
      originalBillNumber,
      shippingAddress: shippingAddress || undefined,
      supplierId: supplierId || undefined,
      supplierSnapshot: supplierSnapshot || { name: 'Walk-in Supplier' },
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
      billTo: billTo || 'Supplier',
      contactNo,
      soldBy,
      createdBy: req.user!.userId,
    });

    res.status(201).json({ message: 'Purchase Return created', purchaseReturn: pr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updatePurchaseReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      supplierId, supplierSnapshot, placeOfSupply, isInterState,
      lineItems, shippingCharge, originalBillNumber, notes, termsAndConditions,
      isReverseCharge, status, returnDate, returnType, shippingAddress, billTo, contactNo, soldBy
    } = req.body;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }

    const businessId = req.user!.businessId;
    const existingPR = await PurchaseReturn.findOne({ _id: id, businessId });
    if (!existingPR) { res.status(404).json({ message: 'Purchase Return not found' }); return; }

    // Reverse old stock deductions
    for (const oldItem of existingPR.lineItems) {
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

    const totals = calculateInvoiceTotals(lineItems, !!isInterState, returnType === 'NON-GST');
    const shipping = Number(shippingCharge) || 0;
    totals.grandTotal += shipping;

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

    let updatedDate = existingPR.returnDate;
    if (returnDate) {
      const newDateStr = new Date(returnDate).toISOString().split('T')[0];
      const oldDateStr = new Date(existingPR.returnDate).toISOString().split('T')[0];
      if (newDateStr !== oldDateStr) updatedDate = new Date(returnDate);
    }

    const updatedPR = await PurchaseReturn.findByIdAndUpdate(
      id,
      {
        returnDate: updatedDate,
        originalBillNumber: originalBillNumber !== undefined ? originalBillNumber : existingPR.originalBillNumber,
        supplierId: supplierId || undefined,
        supplierSnapshot: supplierSnapshot || existingPR.supplierSnapshot,
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
        shippingAddress: shippingAddress !== undefined ? shippingAddress : existingPR.shippingAddress,
        status: status || existingPR.status,
        notes,
        termsAndConditions,
        isReverseCharge: !!isReverseCharge,
        billTo: billTo || existingPR.billTo,
        contactNo: contactNo || existingPR.contactNo,
        soldBy: soldBy || existingPR.soldBy,
      },
      { new: true }
    );

    res.json({ message: 'Purchase Return updated', purchaseReturn: updatedPR });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

export const updatePurchaseReturnStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const pr = await PurchaseReturn.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!pr) { res.status(404).json({ message: 'Purchase Return not found' }); return; }
    if (status) pr.status = status;
    await pr.save();
    res.json({ message: 'Purchase Return status updated', purchaseReturn: pr });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
