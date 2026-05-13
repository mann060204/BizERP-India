import mongoose, { Document, Schema } from 'mongoose';
import { ILineItem } from './Invoice.model';

// Using the same LineItem structure as Invoice
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

export interface IPurchaseBill extends Document {
  businessId: mongoose.Types.ObjectId;
  billNumber: string; // Supplier's invoice number
  billDate: Date;
  dueDate?: Date;
  supplierId?: mongoose.Types.ObjectId;
  supplierSnapshot: { name: string; gstin?: string; address?: string; mobile?: string };
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
  amountPaid: number;
  balance: number;
  paymentMode: string;
  status: 'draft' | 'received' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseBillSchema = new Schema<IPurchaseBill>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    billNumber: { type: String, required: true, index: true },
    billDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierSnapshot: {
      name: { type: String, required: true },
      gstin: String,
      address: String,
      mobile: String,
    },
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
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' },
    status: {
      type: String,
      enum: ['draft', 'received', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchaseBill>('PurchaseBill', PurchaseBillSchema);
