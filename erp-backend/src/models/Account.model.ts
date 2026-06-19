import mongoose, { Schema, Document } from 'mongoose';

// Use standard mongoose import
const mg = require('mongoose');

export interface IAccount extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  type: string; // Bank, Loan, Asset, Capital, Income, Tax, Cash
  bankName?: string; // e.g. State Bank of India
  accountNumber?: string; // Optional, mostly for Bank
  openingBalance: number;
  balanceType: 'Dr' | 'Cr';
  currentBalance: number;
  isActive: boolean;
  isDefaultUpi?: boolean;
  isDefaultNeft?: boolean;
  isDefaultCheque?: boolean;
}

const accountSchema = new mg.Schema(
  {
    businessId: { type: mg.Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['Bank', 'Loan', 'Asset', 'Capital', 'Income', 'Tax', 'Cash']
    },
    bankName: { type: String },
    accountNumber: { type: String },
    openingBalance: { type: Number, default: 0 },
    balanceType: { type: String, enum: ['Dr', 'Cr'], required: true, default: 'Dr' },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDefaultUpi: { type: Boolean, default: false },
    isDefaultNeft: { type: Boolean, default: false },
    isDefaultCheque: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure index for faster querying by type and business
accountSchema.index({ businessId: 1, type: 1 });

export default mongoose.models.Account || mongoose.model<IAccount>('Account', accountSchema);
