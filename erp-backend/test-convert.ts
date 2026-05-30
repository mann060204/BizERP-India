// @ts-nocheck
import mongoose from 'mongoose';
import Quotation from './src/models/Quotation.model';
import Invoice from './src/models/Invoice.model';

async function run() {
  await mongoose.connect('mongodb+srv://bizerp:mannbizerp@cluster0.pifw2.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  const quotation = await Quotation.findOne();
  if (!quotation) {
    console.log('No quotation found');
    process.exit(0);
  }
  const invoiceData: any = quotation.toObject();
  delete invoiceData._id;
  delete invoiceData.createdAt;
  delete invoiceData.updatedAt;
  delete invoiceData.__v;
  invoiceData.invoiceNumber = 'GST-2026-0001';
  invoiceData.invoiceDate = new Date();
  invoiceData.invoiceType = quotation.quotationType;
  invoiceData.status = 'draft';
  invoiceData.amountReceived = 0;
  invoiceData.balance = invoiceData.grandTotal;
  invoiceData.paymentMode = 'Cash';
  
  const invoice = new Invoice(invoiceData);
  const err = invoice.validateSync();
  console.log('Validation Error:', err);
  process.exit(0);
}
run().catch(console.error);
