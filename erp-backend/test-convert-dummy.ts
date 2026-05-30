// @ts-nocheck
import mongoose from 'mongoose';
import Invoice from './src/models/Invoice.model';

const dummyData = {
    businessId: new mongoose.Types.ObjectId(),
    quotationNumber: "Q-001",
    quotationType: "GST",
    quotationDate: new Date(),
    customerSnapshot: { name: "John Doe" },
    lineItems: [
        {
            productName: "Product 1",
            quantity: 1,
            rate: 100,
            taxableAmount: 100,
            totalAmount: 100
        }
    ],
    createdBy: new mongoose.Types.ObjectId()
};

const invoiceData = { ...dummyData };
invoiceData.invoiceNumber = 'GST-2026-0001';
invoiceData.invoiceDate = new Date();
invoiceData.invoiceType = invoiceData.quotationType;
invoiceData.status = 'draft';
invoiceData.amountReceived = 0;
invoiceData.paymentMode = 'Cash';

const invoice = new Invoice(invoiceData);
const err = invoice.validateSync();
console.log('Validation Error:', err);
