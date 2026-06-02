import Invoice from '../models/Invoice.model';
import { Request, Response } from 'express';
import Quotation from '../models/Quotation.model';
import Business from '../models/Business.model';
import { calculateInvoiceTotals } from '../services/gst.service';
import { generateSequenceNumber } from '../utils/sequenceGenerator';

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
      const docKey = data.quotationType === 'NON-GST' ? 'PROFORMA_INVOICE' : 'QUOTATION';
      const seqConfig = business.documentSequences?.get(docKey);
      const nextNum = seqConfig?.nextNumber || 1;
      
      const updateData: any = {};
      updateData[`documentSequences.${docKey}.nextNumber`] = nextNum + 1;
      
      await Business.findByIdAndUpdate(businessId, { $set: updateData });
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
    
    const docKey = type === 'NON-GST' ? 'PROFORMA_INVOICE' : 'QUOTATION';
    const seqConfig = business.documentSequences?.get(docKey);
    const nextNum = seqConfig?.nextNumber || 1;
    
    // Fallback formats
    const fallbackPrefix = type === 'NON-GST' ? (business.nonGstQuotationPrefix || 'EST') : (business.quotationPrefix || 'QTN');
    const format = seqConfig?.format || `${fallbackPrefix}-YYYY-SEQ`;
    
    const nextNumber = generateSequenceNumber(format, nextNum, business.financialYearStart || 4);
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
    let nextNumber = '';
    if (business) {
      const docKey = quotation.quotationType === 'NON-GST' ? 'NON_GST_INVOICE' : 'GST_INVOICE';
      const seqConfig = business.documentSequences?.get(docKey);
      const nextNum = seqConfig?.nextNumber || 1;
      
      const fallbackPrefix = quotation.quotationType === 'NON-GST' ? (business.nonGstInvoicePrefix || 'NON-GST') : (business.invoicePrefix || 'INV');
      const format = seqConfig?.format || `${fallbackPrefix}-YYYY-SEQ`;
      nextNumber = generateSequenceNumber(format, nextNum, business.financialYearStart || 4);
      
      const updateData: any = {};
      updateData[`documentSequences.${docKey}.nextNumber`] = nextNum + 1;
      await Business.findByIdAndUpdate(businessId, { $set: updateData });
    }

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

