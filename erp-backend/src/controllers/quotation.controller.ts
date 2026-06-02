import Invoice from '../models/Invoice.model';
import { Request, Response } from 'express';
import Quotation from '../models/Quotation.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const quotations = await Quotation.find({ businessId: (req as any).user.businessId }).sort({ quotationDate: -1, createdAt: -1 }).populate('customerId', 'name');
    res.json({ quotations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId: (req as any).user.businessId });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ quotation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotationSummary = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mongoose = require('mongoose');
    const [monthQuotations, todayQuotations] = await Promise.all([
      Quotation.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), quotationDate: { $gte: startOfMonth }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Quotation.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId), quotationDate: { $gte: startOfDay }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
    ]);
    res.json({
      monthQuotations: monthQuotations[0]?.total || 0,
      monthQuotationCount: monthQuotations[0]?.count || 0,
      todayQuotations: todayQuotations[0]?.total || 0,
      totalReceived: 0,
      outstanding: 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const data = { ...req.body };
    if (data.dueDate === '') data.dueDate = undefined;
    if (data.quotationDate === '') data.quotationDate = undefined;
    
    // Auto increment logic
    const business = await Business.findById(businessId);
    if (business) {
      if (data.quotationType === 'NON-GST') {
        business.nonGstQuotationCounter = (business.nonGstQuotationCounter || 1) + 1;
      } else {
        business.quotationCounter = (business.quotationCounter || 1) + 1;
      }
      await business.save();
    }
    
    if (!['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced', 'Cancelled'].includes(data.status)) data.status = 'Draft';
      const quotation = new Quotation({ ...data, businessId, createdBy: (req as any).user.userId });
    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.dueDate === '') updateData.dueDate = undefined;
    if (updateData.quotationDate === '') updateData.quotationDate = undefined;

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json(quotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, businessId: (req as any).user.businessId },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ message: 'Quotation cancelled' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNextQuotationNumber = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const type = req.query.type as string;
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    
    const prefix = type === 'NON-GST' ? (business.nonGstQuotationPrefix || 'EST-') : (business.quotationPrefix || 'QUT-');
    const counter = type === 'NON-GST' ? (business.nonGstQuotationCounter || 1) : (business.quotationCounter || 1);
    
    const nextNumber = `${prefix}${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}`;
    res.json({ nextQuotationNumber: nextNumber });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const convertToInvoice = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    
    // Auto increment logic for invoice
    const business = await Business.findById(businessId);
    let counter = 1;
    let prefix = 'GST-';
    if (business) {
      if (quotation.quotationType === 'NON-GST') {
        prefix = 'NON-GST-';
        counter = business.nonGstInvoiceCounter || 1;
        business.nonGstInvoiceCounter = counter + 1;
      } else {
        prefix = 'GST-';
        counter = business.invoiceCounter || 1;
        business.invoiceCounter = counter + 1;
      }
      await business.save();
    }
    
    const nextNumber = `${prefix}${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}`;

    // Explicit mapping to prevent any schema mismatch issues
    const invoiceData = {
      businessId,
      invoiceNumber: nextNumber,
      invoiceDate: new Date(),
      dueDate: quotation.dueDate,
      customerId: quotation.customerId,
      customerSnapshot: quotation.customerSnapshot,
      placeOfSupply: quotation.placeOfSupply,
      isInterState: quotation.isInterState,
      invoiceType: quotation.quotationType,
      lineItems: quotation.lineItems.map(item => ({
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
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTaxableAmount: quotation.totalTaxableAmount,
      totalCGST: quotation.totalCGST,
      totalSGST: quotation.totalSGST,
      totalIGST: quotation.totalIGST,
      totalGST: quotation.totalGST,
      shippingCharge: quotation.shippingCharge,
      grandTotal: quotation.grandTotal,
      amountReceived: 0,
      balance: quotation.grandTotal,
      status: 'draft',
      paymentMode: 'Cash',
      billTo: quotation.billTo,
      contactNo: quotation.contactNo,
      soldBy: quotation.soldBy,
      txnId: quotation.txnId,
      isReverseCharge: quotation.isReverseCharge,
      notes: quotation.notes,
      remarks: quotation.remarks,
      deliveryTerms: quotation.deliveryTerms,
      createdBy: (req as any).user.userId
    };
    
    const invoice = new Invoice(invoiceData);
    const createdInvoice = await invoice.save();
    
    // Update quotation status
    quotation.status = 'Invoiced';
    await quotation.save();
    
    res.status(201).json(createdInvoice);
  } catch (error: any) {
    console.error('Error in convertToInvoice:', error);
    res.status(500).json({ message: error.message || 'Validation Failed' });
  }
};

