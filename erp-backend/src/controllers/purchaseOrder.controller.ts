import PurchaseBill from '../models/PurchaseBill.model';
import { Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder.model';
import Business from '../models/Business.model';

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const orders = await PurchaseOrder.find({ businessId: (req as any).user.businessId })
      .sort({ orderDate: -1, createdAt: -1 })
      .populate('supplierId', 'name');
    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, businessId: (req as any).user.businessId });
    if (!order) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseOrderSummary = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mongoose = require('mongoose');
    const [monthOrders, todayOrders] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), orderDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), orderDate: { $gte: startOfDay }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      monthOrders: monthOrders[0]?.total || 0,
      monthOrderCount: monthOrders[0]?.count || 0,
      todayOrders: todayOrders[0]?.total || 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const data = { ...req.body };
    if (data.dueDate === '') data.dueDate = undefined;
    if (data.orderDate === '') data.orderDate = undefined;
    
    const business = await Business.findById(businessId);
    if (business) {
      business.purchaseOrderCounter = (business.purchaseOrderCounter || 1) + 1;
      await business.save();
    }
    
    if (!['Draft', 'Sent', 'Accepted', 'Rejected', 'Billed', 'Cancelled'].includes(data.status)) data.status = 'Draft';
    const order = new PurchaseOrder({ ...data, businessId, createdBy: (req as any).user.userId });
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.dueDate === '') updateData.dueDate = undefined;
    if (updateData.orderDate === '') updateData.orderDate = undefined;

    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json({ message: 'Purchase Order cancelled' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNextPurchaseOrderNumber = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    
    const prefix = business.purchaseOrderPrefix || 'PO';
    const counter = business.purchaseOrderCounter || 1;
    
    const nextNumber = `${prefix}-${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}`;
    res.json({ nextPurchaseOrderNumber: nextNumber });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const convertToPurchaseBill = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, businessId });
    if (!order) return res.status(404).json({ message: 'Purchase Order not found' });
    
    // Auto increment logic for bill
    const business = await Business.findById(businessId);
    let counter = 1;
    let prefix = 'PB-';
    // Let the frontend set billNumber or prompt user since supplier invoice numbers are usually entered manually!
    // But we generate a default internal one if they don't provide it.
    
    // Explicit mapping
    const billData = {
      businessId,
      billNumber: `PB-${Date.now()}`, // Placeholder, user will change it to supplier's actual bill number in the edit screen or before saving
      billDate: new Date(),
      dueDate: order.dueDate,
      supplierId: order.supplierId,
      supplierSnapshot: order.supplierSnapshot,
      placeOfSupply: order.placeOfSupply,
      isInterState: order.isInterState,
      purchaseType: order.purchaseType,
      purchaseOrderNo: order.orderNumber,
      purchaseOrderDate: order.orderDate,
      lineItems: order.lineItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        hsnCode: item.hsnCode,
        batchNo: item.batchNo,
        tag: item.tag,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        mrp: item.mrp,
        discount: item.discount,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        cess: item.cess,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        totalAmount: item.totalAmount
      })),
      subtotal: order.subtotal,
      totalDiscount: order.totalDiscount,
      totalTaxableAmount: order.totalTaxableAmount,
      totalCGST: order.totalCGST,
      totalSGST: order.totalSGST,
      totalIGST: order.totalIGST,
      totalGST: order.totalGST,
      shippingCharge: order.shippingCharge,
      shippingGstRate: order.shippingGstRate,
      grandTotal: order.grandTotal,
      amountPaid: 0,
      balance: order.grandTotal,
      status: 'draft',
      paymentMode: 'Cash',
      billTo: 'Supplier',
      contactNo: order.contactNo,
      purchasedBy: order.orderedBy,
      notes: order.notes,
      remarks: order.remarks,
      deliveryTerms: order.deliveryTerms,
      createdBy: (req as any).user._id
    };
    
    const bill = new PurchaseBill(billData);
    const createdBill = await bill.save();
    
    // Update order status
    order.status = 'Billed';
    await order.save();
    
    res.status(201).json(createdBill);
  } catch (error: any) {
    console.error('Error in convertToPurchaseBill:', error);
    res.status(500).json({ message: error.message || 'Validation Failed' });
  }
};
