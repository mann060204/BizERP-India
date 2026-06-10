import mongoose, { Document, Schema } from 'mongoose';
import { ILineItem } from './Invoice.model';

// Using the same LineItem structure as Invoice
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

export interface IPurchaseReturn extends Document {
  businessId: mongoose.Types.ObjectId;
  returnType: string;
  returnNumber: string;
  originalBillNumber?: string; // Supplier's invoice number
  returnDate: Date;
  dueDate?: Date;
  placeOfSupply: string;
  purchaseOrderNo?: string;
  purchaseOrderDate?: Date;
  paymentTerms?: string;
  ewayBillNo?: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierSnapshot: { name: string; gstin?: string; address?: string; mobile?: string };
  isInterState: boolean;
  lineItems: ILineItem[];
  batches?: any[];
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
  
  
  
  status: 'draft' | 'received' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: string;
  remarks?: string;
  deliveryTerms?: string;
  billTo: 'Cash' | 'Supplier';
  contactNo?: string;
  purchasedBy?: string;
  txnId?: string;
  shippingAddress?: string;
  soldBy?: string;
  isReverseCharge?: boolean;
  termsAndConditions?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseReturnSchema = new Schema<IPurchaseReturn>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    returnType: { type: String, default: 'GST' },
    returnNumber: { type: String, required: true, index: true },
    originalBillNumber: { type: String },
    returnDate: { type: Date, required: true, index: true, default: Date.now },
    dueDate: { type: Date },
    placeOfSupply: { type: String, default: '' },
    purchaseOrderNo: String,
    purchaseOrderDate: Date,
    paymentTerms: String,
    ewayBillNo: String,
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierSnapshot: {
      name: { type: String, required: true },
      gstin: String,
      address: String,
      mobile: String,
    },
    isInterState: { type: Boolean, default: false },
    lineItems: [LineItemSchema],
    batches: [Schema.Types.Mixed],
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
    
    
    
    status: { type: String, enum: ['draft', 'received', 'paid', 'partial', 'overdue', 'cancelled'], default: 'draft' },
    notes: String,
    remarks: String,
    deliveryTerms: String,
    billTo: { type: String, enum: ['Cash', 'Supplier'], default: 'Supplier' },
    contactNo: String,
    purchasedBy: String,
    txnId: String,
    shippingAddress: String,
    soldBy: String,
    isReverseCharge: { type: Boolean, default: false },
    termsAndConditions: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchaseReturn>('PurchaseReturn', PurchaseReturnSchema);

