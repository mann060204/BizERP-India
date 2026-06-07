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
  discountAmount?: number;
  discountType?: 'percentage' | 'amount';
  taxableAmount: number;
  gstRate: number;
  cess?: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface IInvoice extends Document {
  businessId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceType: 'GST' | 'NON-GST' | 'Bill of Supply';
  invoiceDate: Date;
  dueDate?: Date;
  shippingAddress?: string;
  customerId?: mongoose.Types.ObjectId;
  customerSnapshot: { name: string; gstin?: string; address?: string; mobile?: string; contactPerson?: string; contactPersonNumber?: string };
  placeOfSupply: string;
  isInterState: boolean;
  lineItems: ILineItem[];
  subtotal: number;
  totalDiscount: number;
  discountAmount?: number;
  totalTaxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
  grandTotal: number;
  amountReceived: number;
  shippingCharge: number;
  shippingGstRate: number;
  balance: number;
  roundOff?: number;
  paymentMode: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
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
    bankId?: mongoose.Types.ObjectId;
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
  discountAmount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  cess: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    invoiceType: { type: String, enum: ['GST', 'NON-GST', 'Bill of Supply'], default: 'GST' },
    invoiceDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
    shippingAddress: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      gstin: String,
      address: String,
      mobile: String,
      contactPerson: String,
      contactPersonNumber: String,
    },
    placeOfSupply: { type: String, default: '' },
    isInterState: { type: Boolean, default: false },
    lineItems: [LineItemSchema],
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalGST: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountReceived: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    shippingGstRate: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'draft',
    },
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
      mode: { type: String, enum: ['Cash', 'Bank', 'Bank Transfer', 'UPI', 'Cheque', 'Credit', 'NEFT', 'RTGS'], required: true },
      date: { type: Date, required: true, default: Date.now },
      txnId: { type: String },
      bankId: { type: Schema.Types.ObjectId, ref: 'Bank' }
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

