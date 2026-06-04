import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PurchaseBill from '../models/PurchaseBill.model';
import { AccountingService } from '../services/accounting.service';
import Product from '../models/Product.model';
import Batch from '../models/Batch.model';
import BatchLog from '../models/BatchLog.model';
import { calculateInvoiceTotals } from '../services/gst.service';
import Supplier from '../models/Supplier.model';

// GET /api/v1/purchases
export const getPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status, supplierId, billNumber, page = '1', limit = '20' } = req.query as any;
    const businessId = req.user!.businessId;
    const query: any = { businessId };
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (billNumber) query.billNumber = billNumber;
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
      additionalDiscount, shippingCharge, shippingGstRate, roundOff,
      lineItems, amountPaid, batches, paymentMode, status, notes
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
    const totals = calculateInvoiceTotals(
      lineItems, 
      !!isInterState, 
      false, 
      Number(shippingCharge) || 0, 
      Number(shippingGstRate) || 0
    );
    if (additionalDiscount && !isNaN(Number(additionalDiscount))) {
      totals.grandTotal -= Number(additionalDiscount);
    }
    if (roundOff && !isNaN(Number(roundOff))) {
      totals.grandTotal += Number(roundOff);
    }
    const paid = Number(amountPaid) || 0;
    const balance = totals.grandTotal - paid;

    // Add stock for product items
    let batchesArray = batches || [];
    
    for (const item of lineItems) {
      if (item.productId) {
        if (!item.batchNo) {
          item.batchNo = `B-${Date.now().toString().slice(-5)}${Math.floor(Math.random()*100)}`;
          // Auto-generated batch goes to batches array
          batchesArray.push({
            productId: item.productId,
            batchNo: item.batchNo,
            mrp: item.mrp,
            salePrice: item.rate,
            quantity: item.quantity
          });
        }
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    // Process ALL batches from the batches array for stock increment and upsert
    for (const batch of batchesArray) {
      if (batch.productId && batch.batchNo) {
        const batchQty = Number(batch.quantity) || 0;
        
        const updateDoc: any = {
           $set: {
             mrp: batch.mrp || 0,
             salePrice: batch.salePrice || 0,
             minSalePrice: batch.minSalePrice || 0,
           }
        };
        
        if (batch.expiryDate) updateDoc.$set.expiryDate = new Date(batch.expiryDate);
        if (batch.manufacturingDate) updateDoc.$set.manufacturingDate = new Date(batch.manufacturingDate);
        if (batchQty > 0) updateDoc.$inc = { currentStock: batchQty };

        const updatedBatch = await Batch.findOneAndUpdate(
          { businessId, productId: batch.productId, batchNo: batch.batchNo },
          updateDoc,
          { upsert: true, new: true }
        );

        if (updatedBatch && batchQty > 0) {
          await BatchLog.create({
            businessId,
            batchId: updatedBatch._id,
            productId: batch.productId,
            action: 'STOCK_IN',
            quantityChanged: batchQty,
            currentStock: updatedBatch.currentStock,
            documentType: 'PurchaseBill',
            documentNumber: billNumber,
            userId: req.user!.userId,
          });
        }
      }
    }

    const purchase = await PurchaseBill.create({
      businessId,
      billNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      dueDate: dueDate === '' ? undefined : dueDate,
      supplierId: supplierId || undefined,
      supplierSnapshot: supplierSnapshot || { name: 'Walk-in Supplier' },
      isInterState: !!isInterState,
      lineItems: totals.lineItems,
      batches: batches || [],
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalTaxableAmount: totals.totalTaxableAmount,
      totalCGST: totals.totalCGST,
      totalSGST: totals.totalSGST,
      totalIGST: totals.totalIGST,
      totalGST: totals.totalGST,
      grandTotal: totals.grandTotal,
      additionalDiscount: Number(additionalDiscount) || 0,
      shippingCharge: Number(shippingCharge) || 0,
      shippingGstRate: Number(shippingGstRate) || 0,
      roundOff: Number(roundOff) || 0,
      amountPaid: paid,
      balance,
      paymentMode: paymentMode || 'Cash',
      paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      status: status || (paid >= totals.grandTotal ? 'paid' : paid > 0 ? 'partial' : 'received'),
      notes,
      createdBy: req.user!.userId,
    });

    // Record in ledger
    await AccountingService.recordPurchaseBill(purchase);

    res.status(201).json({ message: 'Purchase bill created', purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/purchases/:id
export const updatePurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      billNumber, billDate, dueDate, supplierId, supplierSnapshot, isInterState,
      lineItems, batches, paymentMode, amountPaid, notes, status,
      shippingCharge, shippingGstRate, additionalDiscount, roundOff, paymentDate
    } = req.body;

    const purchaseId = req.params['id'];
    const businessId = req.user!.businessId;

    if (!lineItems || lineItems.length === 0) {
      res.status(400).json({ message: 'At least one line item is required' });
      return;
    }
    if (!billNumber) {
      res.status(400).json({ message: 'Supplier Bill Number is required' });
      return;
    }

    const existingPurchase = await PurchaseBill.findOne({ _id: purchaseId, businessId });
    if (!existingPurchase) {
      res.status(404).json({ message: 'Purchase bill not found' });
      return;
    }

    if (existingPurchase.status !== 'cancelled') {
      // Revert old stock
      for (const item of existingPurchase.lineItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: -item.quantity },
          });
        }
      }
      
      const hasBatchQuantities = (existingPurchase.batches || []).some((b: any) => b.quantity > 0);
      
      if (hasBatchQuantities) {
        for (const batch of (existingPurchase.batches || [])) {
          if (batch.productId && batch.batchNo && batch.quantity) {
             await Batch.findOneAndUpdate(
               { businessId, productId: batch.productId, batchNo: batch.batchNo },
               { $inc: { currentStock: -batch.quantity } }
             );
          }
        }
      } else {
        // Old way fallback
        for (const item of existingPurchase.lineItems) {
           if (item.productId && item.batchNo) {
              await Batch.findOneAndUpdate(
                 { businessId, productId: item.productId, batchNo: item.batchNo },
                 { $inc: { currentStock: -item.quantity } }
              );
           }
        }
      }
    }

    const totals = calculateInvoiceTotals(
      lineItems, 
      !!isInterState, 
      false, 
      Number(shippingCharge) || 0, 
      Number(shippingGstRate) || 0
    );
    if (additionalDiscount && !isNaN(Number(additionalDiscount))) {
      totals.grandTotal -= Number(additionalDiscount);
    }
    if (roundOff && !isNaN(Number(roundOff))) {
      totals.grandTotal += Number(roundOff);
    }
    
    const paid = Number(amountPaid) || 0;
    const balance = totals.grandTotal - paid;

    // Add new stock
    let newBatchesArray = batches || [];
    
    for (const item of lineItems) {
      if (item.productId) {
        if (!item.batchNo) {
          item.batchNo = `B-${Date.now().toString().slice(-5)}${Math.floor(Math.random()*100)}`;
          // Auto-generated batch goes to batches array
          newBatchesArray.push({
            productId: item.productId,
            batchNo: item.batchNo,
            mrp: item.mrp,
            salePrice: item.rate,
            quantity: item.quantity
          });
        }
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    // Process ALL batches from the batches array for stock increment and upsert
    for (const batch of newBatchesArray) {
      if (batch.productId && batch.batchNo) {
        const batchQty = Number(batch.quantity) || 0;
        
        const updateDoc: any = {
           $set: {
             mrp: batch.mrp || 0,
             salePrice: batch.salePrice || 0,
             minSalePrice: batch.minSalePrice || 0,
           }
        };
        
        if (batch.expiryDate) updateDoc.$set.expiryDate = new Date(batch.expiryDate);
        if (batch.manufacturingDate) updateDoc.$set.manufacturingDate = new Date(batch.manufacturingDate);
        if (batchQty > 0) updateDoc.$inc = { currentStock: batchQty };

        const updatedBatch = await Batch.findOneAndUpdate(
          { businessId, productId: batch.productId, batchNo: batch.batchNo },
          updateDoc,
          { upsert: true, new: true }
        );

        if (updatedBatch && batchQty > 0) {
          await BatchLog.create({
            businessId,
            batchId: updatedBatch._id,
            productId: batch.productId,
            action: 'STOCK_IN',
            quantityChanged: batchQty,
            currentStock: updatedBatch.currentStock,
            documentType: 'PurchaseBill',
            documentNumber: billNumber,
            userId: req.user!.userId,
          });
        }
      }
    }

    let updatedBillDate = existingPurchase.billDate;
    if (billDate) {
      const newDateStr = new Date(billDate).toISOString().split('T')[0];
      const oldDateStr = new Date(existingPurchase.billDate).toISOString().split('T')[0];
      if (newDateStr !== oldDateStr) {
        updatedBillDate = new Date(billDate);
      }
    }

    const updatedPurchase = await PurchaseBill.findOneAndUpdate(
      { _id: purchaseId, businessId },
      {
        billNumber,
        billDate: updatedBillDate,
        dueDate: dueDate === '' ? undefined : dueDate,
        supplierId: supplierId || undefined,
        supplierSnapshot: supplierSnapshot || { name: 'Walk-in Supplier' },
        isInterState: !!isInterState,
        lineItems: totals.lineItems,
        batches: batches || [],
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        totalTaxableAmount: totals.totalTaxableAmount,
        totalCGST: totals.totalCGST,
        totalSGST: totals.totalSGST,
        totalIGST: totals.totalIGST,
        totalGST: totals.totalGST,
        grandTotal: totals.grandTotal,
        additionalDiscount: Number(additionalDiscount) || 0,
        shippingCharge: Number(shippingCharge) || 0,
        shippingGstRate: Number(shippingGstRate) || 0,
        roundOff: Number(roundOff) || 0,
        amountPaid: paid,
        balance,
        paymentMode: paymentMode || 'Cash',
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        status: status || (paid >= totals.grandTotal ? 'paid' : paid > 0 ? 'partial' : 'received'),
        notes,
      },
      { new: true }
    );

    // Sync Ledger
    await AccountingService.reversePurchaseBill(existingPurchase);
    await AccountingService.recordPurchaseBill(updatedPurchase);

    res.json({ message: 'Purchase bill updated', purchase: updatedPurchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// PUT /api/v1/purchases/:id/status
export const updatePurchaseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, amountPaid, paymentMode, paymentBankId, paymentDate, paymentAmount } = req.body;
    const purchase = await PurchaseBill.findOne({ _id: req.params['id'], businessId: req.user!.businessId });
    if (!purchase) { res.status(404).json({ message: 'Purchase not found' }); return; }

    if (status) purchase.status = status;
    
    // Only process payment if an actual payment was made
    if (paymentAmount !== undefined && Number(paymentAmount) > 0) {
      const pAmt = Number(paymentAmount);
      purchase.amountPaid = (purchase.amountPaid || 0) + pAmt;
      purchase.balance = purchase.grandTotal - purchase.amountPaid;
      if (paymentMode) purchase.paymentMode = paymentMode;
      if (purchase.amountPaid >= purchase.grandTotal) purchase.status = 'paid';
      else if (purchase.amountPaid > 0) purchase.status = 'partial';
      
      // Record the specific payment in the ledger
      await AccountingService.recordSupplierPayment(
        purchase.businessId.toString(),
        purchase.supplierId!.toString(),
        pAmt,
        paymentMode || 'Cash',
        paymentDate ? new Date(paymentDate) : new Date(),
        purchase.billNumber,
        `Payment against Bill #${purchase.billNumber}`,
        paymentBankId
      );
    } else if (amountPaid !== undefined) {
      // Fallback for simple status updates without specific payment details
      purchase.amountPaid = Number(amountPaid);
      purchase.balance = purchase.grandTotal - purchase.amountPaid;
      if (paymentMode) purchase.paymentMode = paymentMode;
      if (purchase.amountPaid >= purchase.grandTotal) purchase.status = 'paid';
      else if (purchase.amountPaid > 0) purchase.status = 'partial';
    }

    await purchase.save();
    
    // We do NOT reverse and recreate the whole purchase ledger here if it's just a payment
    // But we need to ensure the supplier balance is synced
    await AccountingService.updateSupplierBalance(purchase.supplierId!, purchase.businessId.toString());

    res.json({ message: 'Purchase updated', purchase });
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

    // Sync Ledger
    await AccountingService.reversePurchaseBill(purchase);

    res.json({ message: 'Purchase bill cancelled', purchase });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};

// GET /api/v1/purchases/analytics/summary
export const getPurchaseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const now = new Date();
    const { period } = req.query as any;
    
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0,0,0,0); }
    else if (period === 'year') startDate = new Date(now.getFullYear(), 0, 1);

    const [monthPurchases, outstanding, totalPaid] = await Promise.all([
      PurchaseBill.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), billDate: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Supplier.aggregate([
        { $match: { businessId: new (require('mongoose').Types.ObjectId)(businessId), currentBalance: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: { $abs: '$currentBalance' } } } },
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

// GET /api/v1/purchases/last-prices
export const getLastPurchasePrices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supplierId, productId } = req.query;
    if (!supplierId || !productId) {
      res.status(400).json({ message: 'Supplier ID and Product ID are required' });
      return;
    }
    const businessId = req.user!.businessId;
    const purchases = await PurchaseBill.find({
      businessId,
      supplierId: supplierId as string,
      'lineItems.productId': productId as string,
      status: { $ne: 'cancelled' }
    })
      .sort({ billDate: -1 })
      .limit(5)
      .select('billDate billNumber lineItems');

    const history = purchases.map(p => {
      const item = p.lineItems.find(i => i.productId?.toString() === productId.toString());
      return {
        date: p.billDate,
        billNumber: p.billNumber,
        rate: item?.rate || 0
      };
    });

    res.json({ prices: history });
  } catch (e: any) { res.status(500).json({ message: e.message }); }
};
