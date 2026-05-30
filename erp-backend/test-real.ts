// @ts-nocheck
import mongoose from 'mongoose';
import Quotation from './src/models/Quotation.model';
import Invoice from './src/models/Invoice.model';
import Business from './src/models/Business.model';

async function run() {
  await mongoose.connect('mongodb+srv://bizerp:mannbizerp@cluster0.pifw2.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  
  const quotation = await Quotation.findOne().sort({ createdAt: -1 });
  if (!quotation) {
    console.log('No quotation found');
    process.exit(0);
  }
  
  const businessId = quotation.businessId;
  const business = await Business.findById(businessId);
  let counter = 1;
  let prefix = 'GST-';
  if (business) {
    if (quotation.quotationType === 'NON-GST') {
      prefix = 'NON-GST-';
      counter = business.nonGstInvoiceCounter || 1;
    } else {
      prefix = 'GST-';
      counter = business.invoiceCounter || 1;
    }
  }
  const nextNumber = `${prefix}${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}`;

  const invoiceData: any = quotation.toObject();
  delete invoiceData._id;
  delete invoiceData.createdAt;
  delete invoiceData.updatedAt;
  delete invoiceData.__v;
  invoiceData.invoiceNumber = nextNumber;
  invoiceData.invoiceDate = new Date();
  invoiceData.invoiceType = quotation.quotationType;
  invoiceData.status = 'draft';
  invoiceData.amountReceived = 0;
  invoiceData.balance = invoiceData.grandTotal;
  invoiceData.paymentMode = 'Cash';
  
  const invoice = new Invoice(invoiceData);
  const err = invoice.validateSync();
  if (err) {
    console.log('Validation Error:', err);
  } else {
    console.log('Validation passed!');
    try {
        await invoice.save();
        console.log('Saved successfully!');
    } catch(e) {
        console.log('Save Error:', e);
    }
  }
  process.exit(0);
}
run().catch(console.error);
