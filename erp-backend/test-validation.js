const mongoose = require('mongoose');
const { Schema } = mongoose;

const LineItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  hsnCode: String,
  batchNo: String,
  tag: String,
  description: String,
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  cess: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const QuotationSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    quotationNumber: { type: String, required: true, index: true },
    quotationType: { type: String, enum: ['GST', 'NON-GST'], default: 'GST' },
    quotationDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
    shippingAddress: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      gstin: String,
      address: String,
      mobile: String,
    },
    placeOfSupply: { type: String, default: '' },
    isInterState: { type: Boolean, default: false },
    lineItems: [LineItemSchema],
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalGST: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced', 'Cancelled'],
      default: 'Draft',
    },
    notes: String,
    remarks: String,
    deliveryTerms: String,
    termsAndConditions: String,
    billTo: { type: String, enum: ['Cash', 'Customer'], default: 'Customer' },
    contactNo: String,
    soldBy: String,
    txnId: String,
    isReverseCharge: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Quotation = mongoose.model('QuotationTest', QuotationSchema);

const q = new Quotation({
  businessId: new mongoose.Types.ObjectId(),
  quotationNumber: 'TEST-123',
  quotationType: 'GST',
  quotationDate: new Date(),
  dueDate: "", // This is what the frontend sends if not selected!
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
