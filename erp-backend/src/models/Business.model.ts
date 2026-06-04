import mongoose, { Document, Schema } from 'mongoose';

export interface IBusiness extends Document {
  businessGroupId?: string;
  financialYearLabel?: string;
  businessName: string;
  ownerName: string;
  gstin?: string;
  pan?: string;
  mobile: string;
  email: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  businessType: 'Retail' | 'Wholesale' | 'Service' | 'Medical' | 'Manufacturing' | 'Other';
  logo?: string;
  financialYearStart: number;
  invoicePrefix: string;
  invoiceCounter: number;
  quotationCounter: number;
  nonGstQuotationCounter: number;
  quotationPrefix?: string;
  nonGstQuotationPrefix?: string;
  nonGstInvoicePrefix: string;
  nonGstInvoiceCounter: number;
  purchaseOrderPrefix?: string;
  purchaseOrderCounter: number;
  salesReturnPrefix?: string;
  salesReturnCounter: number;
  purchaseReturnPrefix?: string;
  purchaseReturnCounter: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    branch?: string;
  };
  termsAndConditions?: string;
  invoiceTemplate: 'A4' | 'POS';
  isCompositionScheme: boolean;
  productGroups: string[];
  productBrands: string[];
  productCategories: {
    name: string;
    brands: string[];
  }[];
  units: string[];
  expenseCategories: string[];
  holidays: {
    date: Date;
    name: string;
  }[];
  discountSchemes: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    isActive: boolean;
  }[];
  inventorySequencing: 'FIFO' | 'FEFO' | 'LIFO';
  documentSequences: Map<string, {
    nextNumber: number;
    format: string;
    resetMonthly: boolean;
  }>;
  enableManufacturing: boolean;
  cashInHand: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessGroupId: { type: String, trim: true },
    financialYearLabel: { type: String, trim: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true, sparse: true, unique: true },
    pan: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      pinCode: String,
    },
    businessType: {
      type: String,
      enum: ['Retail', 'Wholesale', 'Service', 'Medical', 'Manufacturing', 'Other'],
      default: 'Retail',
    },
    logo: String,
    financialYearStart: { type: Number, default: 4 }, // April
    invoicePrefix: { type: String, default: 'INV' },
    invoiceCounter: { type: Number, default: 0 },
    quotationCounter: { type: Number, default: 0 },
    nonGstQuotationCounter: { type: Number, default: 0 },
    quotationPrefix: { type: String, default: 'QTN' },
    nonGstQuotationPrefix: { type: String, default: 'NON-GST-QTN' },
    nonGstInvoicePrefix: { type: String, default: 'NON-GST' },
    nonGstInvoiceCounter: { type: Number, default: 0 },
    purchaseOrderPrefix: { type: String, default: 'PO' },
    purchaseOrderCounter: { type: Number, default: 0 },
    salesReturnPrefix: { type: String, default: 'CRN' },
    salesReturnCounter: { type: Number, default: 0 },
    purchaseReturnPrefix: { type: String, default: 'DBN' },
    purchaseReturnCounter: { type: Number, default: 0 },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
      branch: String,
    },
    termsAndConditions: { type: String, default: '' },
    invoiceTemplate: { type: String, enum: ['A4', 'POS'], default: 'A4' },
    isCompositionScheme: { type: Boolean, default: false },
    productGroups: {
      type: [String],
      default: ['Electronics', 'Clothing', 'Food', 'Beverages', 'Medicine', 'Cosmetics', 'Furniture', 'Tools', 'Stationery', 'Other']
    },
    productBrands: {
      type: [String],
      default: ['Generic', 'Local', 'Imported', 'Premium']
    },
    productCategories: {
      type: [{
        name: { type: String, required: true },
        brands: [String]
      }],
      default: []
    },
    units: {
      type: [String],
      default: ['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Mtr']
    },
    expenseCategories: {
      type: [String],
      default: ['Rent', 'Salary', 'Electricity', 'Water', 'Office Supplies', 'Travel', 'Marketing']
    },
    holidays: {
      type: [{
        date: { type: Date, required: true },
        name: { type: String, required: true }
      }],
      default: []
    },
    discountSchemes: {
      type: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
        value: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
      }],
      default: []
    },
    inventorySequencing: {
      type: String,
      enum: ['FIFO', 'FEFO', 'LIFO'],
      default: 'FIFO'
    },
    documentSequences: {
      type: Map,
      of: new Schema({
        nextNumber: { type: Number, default: 1 },
        format: { type: String, default: 'SEQ' },
        resetMonthly: { type: Boolean, default: false }
      }, { _id: false }),
      default: {}
    },
    enableManufacturing: { type: Boolean, default: false },
    cashInHand: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IBusiness>('Business', BusinessSchema);

