import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  businessId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  date: Date;
  paymentMode: string;
  vendorName?: string;
  notes?: string;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalWithTax: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    paymentMode: { type: String, default: 'Cash' },
    vendorName: { type: String },
    notes: { type: String },
    gstRate: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    totalWithTax: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
