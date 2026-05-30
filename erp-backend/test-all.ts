// @ts-nocheck
import mongoose from 'mongoose';
import Quotation from './src/models/Quotation.model';
import Invoice from './src/models/Invoice.model';
import Business from './src/models/Business.model';

async function run() {
  await mongoose.connect('mongodb+srv://bizerp:mannbizerp@cluster0.pifw2.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
  
  const quotations = await Quotation.find();
  console.log(`Found ${quotations.length} quotations to test.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const quotation of quotations) {
    const invoiceData: any = quotation.toObject();
    delete invoiceData._id;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;
    delete invoiceData.__v;
    invoiceData.invoiceNumber = "TEST-123";
    invoiceData.invoiceDate = new Date();
    invoiceData.invoiceType = quotation.quotationType;
    invoiceData.status = 'draft';
    invoiceData.amountReceived = 0;
    invoiceData.balance = invoiceData.grandTotal;
    invoiceData.paymentMode = 'Cash';
    
    const invoice = new Invoice(invoiceData);
    const err = invoice.validateSync();
    if (err) {
      console.log(`Quotation ${quotation.quotationNumber} failed validation:`, err.message);
      failCount++;
    } else {
      successCount++;
    }
  }
  
  console.log(`Success: ${successCount}, Fail: ${failCount}`);
  process.exit(0);
}

run().catch(console.error);
