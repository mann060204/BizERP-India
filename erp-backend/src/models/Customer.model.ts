import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  mobile?: string;
  mobileCode?: string;
  email?: string;
  gstin?: string;
  billingAddress?: { street?: string; city?: string; state?: string; pinCode?: string; country?: string };
  panNo?: string;
  gstType?: string;
  tradeName?: string;
  phoneNo?: string;
  contactPerson?: string;
  contactPersonNumber?: string;
  contactPersonCode?: string;
  balanceType?: 'Debit' | 'Credit';
  documentType?: string;
  documentNo?: string;
  dob?: Date;
  anniversary?: Date;
  creditAllowed: boolean;
  priceCategory?: string;
  remark?: string;
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  tags?: string[];
  photo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    mobileCode: { type: String, default: '+91' },
    email: { type: String, lowercase: true, trim: true },
    gstin: { type: String, trim: true },
    billingAddress: {
      street: String, city: String, state: String, pinCode: String, country: { type: String, default: 'India' },
    },
    panNo: String,
    gstType: { type: String, default: 'Unregistered' },
    tradeName: String,
    phoneNo: String,
    contactPerson: { type: String, trim: true },
    contactPersonNumber: { type: String, trim: true },
    contactPersonCode: { type: String, default: '+91' },
    balanceType: { type: String, enum: ['Debit', 'Credit'], default: 'Debit' },
    documentType: String,
    documentNo: String,
    dob: Date,
    anniversary: Date,
    creditAllowed: { type: Boolean, default: false },
    priceCategory: { type: String, default: 'Retail' },
    remark: String,
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    tags: [String],
    photo: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
