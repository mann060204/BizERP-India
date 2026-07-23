import mongoose, { Schema, Document } from 'mongoose';

/**
 * PaymentMode — master configuration that maps every payment mode name
 * to exactly one ledger account (Cash or Bank).
 *
 * This is the SINGLE source of truth for all payment posting decisions.
 * When a transaction is recorded with paymentMode = 'UPI', the system
 * resolves the linked Account from this table — no hardcoding anywhere else.
 *
 * Default modes are auto-seeded per business on first use:
 *   Cash      → ledgerType=CASH,  linkedAccountId → Cash account
 *   UPI       → ledgerType=BANK,  linkedAccountId → Account(isDefaultUpi=true)
 *   Cheque    → ledgerType=BANK,  linkedAccountId → Account(isDefaultCheque=true)
 *   NEFT      → ledgerType=BANK,  linkedAccountId → Account(isDefaultNeft=true)
 *   RTGS      → ledgerType=BANK,  linkedAccountId → Account(isDefaultNeft=true)
 *   Card      → ledgerType=BANK,  linkedAccountId → null (user must configure)
 *   Bank Transfer → ledgerType=BANK, linkedAccountId → Account(isDefaultNeft=true)
 */

export type LedgerType = 'CASH' | 'BANK';

export interface IPaymentMode extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;                               // 'Cash', 'UPI', 'Cheque', 'NEFT', 'RTGS', 'Card'
  ledgerType: LedgerType;                     // 'CASH' or 'BANK'
  linkedAccountId: mongoose.Types.ObjectId | null; // FK → Account._id
  isActive: boolean;
  isDefault: boolean;                         // true = system-seeded, false = user-created
  sortOrder: number;                          // display order in UI
  createdAt: Date;
  updatedAt: Date;
}

const PaymentModeSchema = new Schema<IPaymentMode>(
  {
    businessId:       { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name:             { type: String, required: true, trim: true },
    ledgerType:       { type: String, enum: ['CASH', 'BANK'], required: true },
    linkedAccountId:  { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    isActive:         { type: Boolean, default: true },
    isDefault:        { type: Boolean, default: false },
    sortOrder:        { type: Number, default: 99 },
  },
  { timestamps: true }
);

// Unique: one mode name per business
PaymentModeSchema.index({ businessId: 1, name: 1 }, { unique: true });

export default mongoose.models.PaymentMode ||
  mongoose.model<IPaymentMode>('PaymentMode', PaymentModeSchema);
