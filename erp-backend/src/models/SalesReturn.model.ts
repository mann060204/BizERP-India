import mongoose, { Document, Schema } from 'mongoose';

export interface ILineItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  hsnCode?: string;
  batchNo?: string;
  tag?: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  mrp?: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cess?: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface ISalesReturn extends Document {
  businessId: mongoose.Types.ObjectId;
  returnNumber: string;
  originalInvoiceNumber?: string;
  returnType: 'GST' | 'NON-GST';
  returnDate: Date;
  dueDate?: Date;
  shippingAddress?: string;
  customerId?: mongoose.Types.ObjectId;
  customerSnapshot: { name: string; gstin?: string; address?: string; mobile?: string };
  placeOfSupply: string;
  isInterState: boolean;
  lineItems: ILineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  grandTotal: number;
  
  shippingCharge: number;
  shippingGstRate: number;
  
  
  status: 'draft' | 'approved' | 'cancelled';
  notes?: string;
  remarks?: string;
  deliveryTerms?: string;
  deliveryRemarks?: string;
  termsAndConditions?: string;
  billTo: 'Cash' | 'Customer';
  contactNo?: string;
  soldBy?: string;
  txnId?: string;
  isReverseCharge: boolean;
  paymentHistory?: {
    amount: number;
    mode: string;
    date: Date;
    txnId?: string;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
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

const SalesReturnSchema = new Schema<ISalesReturn>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    returnNumber: { type: String, required: true, index: true },
    originalInvoiceNumber: { type: String },
    returnType: { type: String, enum: ['GST', 'NON-GST'], default: 'GST' },
    returnDate: { type: Date, required: true, index: true, default: Date.now },
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
    shippingGstRate: { type: Number, default: 0 },
    
    
    status: { type: String, enum: ['draft', 'approved', 'cancelled'], default: 'draft' },
    notes: String,
    remarks: String,
    deliveryTerms: String,
    deliveryRemarks: String,
    termsAndConditions: String,
    billTo: { type: String, enum: ['Cash', 'Customer'], default: 'Customer' },
    contactNo: String,
    soldBy: String,
    txnId: String,
    isReverseCharge: { type: Boolean, default: false },
    paymentHistory: [{
      amount: { type: Number, required: true },
      mode: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Cheque', 'Credit'], required: true },
      date: { type: Date, required: true, default: Date.now },
      txnId: { type: String }
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISalesReturn>('SalesReturn', SalesReturnSchema);


