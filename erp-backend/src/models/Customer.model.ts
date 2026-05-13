import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  billingAddress?: { street?: string; city?: string; state?: string; pinCode?: string };
  creditLimit: number;
  openingBalance: number;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    gstin: { type: String, trim: true },
    billingAddress: {
      street: String, city: String, state: String, pinCode: String,
    },
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    tags: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
