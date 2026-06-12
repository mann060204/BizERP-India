import mongoose, { Schema, Document } from 'mongoose';

export interface IAccountLedger extends Document {
  businessId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  referenceType?: string; // e.g. 'Opening', 'Adjustment', 'Invoice', 'Purchase'
  referenceId?: string;
  closingBalance?: number; // snapshot of balance after this transaction (optional, good for UI)
  reconciled?: boolean;
  reconciledDate?: Date;
  voucherType?: string; // Purchase | Sale | PurchaseReturn | SalesReturn | Payment | Receipt | Expense | JournalEntry | Adjustment | Opening | Transfer
  voucherNo?: string; // human-readable voucher number
  partyName?: string; // denormalized party name for fast querying in daily transaction ledger
}

const accountLedgerSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    referenceType: { type: String },
    referenceId: { type: String },
    closingBalance: { type: Number },
    reconciled: { type: Boolean, default: false },
    reconciledDate: { type: Date },
    voucherType: { type: String, enum: ['Purchase', 'Sale', 'PurchaseReturn', 'SalesReturn', 'Payment', 'Receipt', 'Expense', 'JournalEntry', 'Adjustment', 'Opening', 'Transfer'], default: null },
    voucherNo: { type: String },
    partyName: { type: String }
  },
  { timestamps: true }
);

accountLedgerSchema.index({ businessId: 1, accountId: 1, date: -1 });
accountLedgerSchema.index({ businessId: 1, supplierId: 1, date: -1 });
accountLedgerSchema.index({ businessId: 1, customerId: 1, date: -1 });
accountLedgerSchema.index({ businessId: 1, date: -1, voucherType: 1 });

export default mongoose.models.AccountLedger || mongoose.model<IAccountLedger>('AccountLedger', accountLedgerSchema);
