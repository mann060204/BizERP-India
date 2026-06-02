import mongoose, { Document, Schema } from 'mongoose';
import { ILineItem } from './Invoice.model';

// Using the same LineItem structure as Invoice/PurchaseBill
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

export interface IPurchaseOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  purchaseType: string;
  orderNumber: string; // Auto-generated PO number
  orderDate: Date;
  dueDate?: Date;
  placeOfSupply: string;
  paymentTerms?: string;
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
  additionalDiscount: number;
  shippingCharge: number;
  shippingGstRate: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Billed' | 'Cancelled';
  notes?: string;
  remarks?: string;
  deliveryTerms?: string;
  contactNo?: string;
  orderedBy?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    purchaseType: { type: String, default: 'GST' },
    orderNumber: { type: String, required: true, index: true },
    orderDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
    placeOfSupply: { type: String, default: '' },
    paymentTerms: String,
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
    additionalDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    shippingGstRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Billed', 'Cancelled'],
      default: 'Draft',
    },
    notes: String,
    remarks: String,
    deliveryTerms: String,
    contactNo: String,
    orderedBy: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
