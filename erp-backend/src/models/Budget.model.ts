import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  businessId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  financialYear: string;
  month: number; // 1-12
  budgetAmount: number;
  actualAmount: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    financialYear: { type: String, required: true }, // e.g. "2023-2024"
    month: { type: Number, required: true, min: 1, max: 12 },
    budgetAmount: { type: Number, required: true, default: 0 },
    actualAmount: { type: Number, default: 0 },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
