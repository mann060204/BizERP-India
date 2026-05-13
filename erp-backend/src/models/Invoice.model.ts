import mongoose, { Document, Schema } from 'mongoose';

export interface ILineItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface IInvoice extends Document {
  businessId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
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
  amountReceived: number;
  balance: number;
  paymentMode: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: string;
  termsAndConditions?: string;
  isReverseCharge: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  hsnCode: String,
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 18 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    invoiceDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
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
    amountReceived: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: String,
    termsAndConditions: String,
    isReverseCharge: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
