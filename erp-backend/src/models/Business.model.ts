import mongoose, { Document, Schema } from 'mongoose';

export interface IBusiness extends Document {
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
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    branch?: string;
  };
  isCompositionScheme: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
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
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
      branch: String,
    },
    isCompositionScheme: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBusiness>('Business', BusinessSchema);
