import mongoose, { Document, Schema } from 'mongoose';

export interface IBank extends Document {
  businessId: mongoose.Types.ObjectId;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
}

const BankSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifsc: { type: String, default: '' },
    branch: { type: String, default: '' },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IBank>('Bank', BankSchema);
