import mongoose from 'mongoose';
import Quotation from './src/models/Quotation.model';

function testQuotation() {
  const q = new Quotation({
    businessId: new mongoose.Types.ObjectId(),
    quotationNumber: 'TEST-123',
    quotationType: 'GST',
    quotationDate: new Date(),
    dueDate: "",
    customerSnapshot: { name: 'Test' },
    lineItems: [{
      productName: 'Test',
      quantity: 1,
      rate: 100,
      taxableAmount: 100,
      totalAmount: 118
    }],
    createdBy: new mongoose.Types.ObjectId(),
    balance: 100,
    roundOff: 0.5
  });
  
  const err = q.validateSync();
  if (err) {
    console.log("Validation error:", err.message);
  } else {
    console.log("Validation passed");
  }
}
testQuotation();
