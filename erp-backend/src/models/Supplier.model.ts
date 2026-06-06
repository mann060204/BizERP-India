import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  mobile?: string;
  mobileCode?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address?: { street?: string; city?: string; state?: string; pinCode?: string; country?: string };
  openingBalance: number;
  currentBalance: number;
  balanceType?: 'Debit' | 'Credit';
  contactPerson?: string;
  contactPersonNumber?: string;
  contactPersonCode?: string;
  note?: string;
  bankDetails?: { bankName?: string; accountNumber?: string; ifsc?: string };
  creditLimit?: number;
  creditAllowed?: boolean;
  priceCategory?: string;
  gstType?: string;
  tradeName?: string;
  phoneNo?: string;
  documentType?: string;
  documentNo?: string;
  dob?: Date;
  anniversary?: Date;
  photo?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    mobileCode: { type: String, default: '+91' },
    email: { type: String, lowercase: true, trim: true },
    gstin: { type: String, trim: true },
    pan: { type: String, trim: true },
    address: {
      street: String, city: String, state: String, pinCode: String, country: { type: String, default: 'India' }
    },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    balanceType: { type: String, enum: ['Debit', 'Credit'], default: 'Credit' },
    contactPerson: { type: String, trim: true },
    contactPersonNumber: { type: String, trim: true },
    contactPersonCode: { type: String, default: '+91' },
    note: { type: String },
    bankDetails: {
      bankName: String, accountNumber: String, ifsc: String
    },
    tags: [String],
    creditLimit: { type: Number, default: 0 },
    creditAllowed: { type: Boolean, default: true },
    priceCategory: { type: String, enum: ['Retail', 'Wholesale'], default: 'Retail' },
    gstType: String,
    tradeName: String,
    phoneNo: String,
    documentType: String,
    documentNo: String,
    dob: Date,
    anniversary: Date,
    photo: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);

