import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountAuditLog extends Document {
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string; // 'APPLIED', 'MANUAL_OVERRIDE', 'CREATED', 'UPDATED', 'DELETED', 'PAUSED', 'ACTIVATED'
  schemeId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  createdAt: Date;
}

const DiscountAuditLogSchema = new Schema<IDiscountAuditLog>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  schemeId: { type: Schema.Types.ObjectId, ref: 'DiscountScheme' },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  reason: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.models.DiscountAuditLog || mongoose.model<IDiscountAuditLog>('DiscountAuditLog', DiscountAuditLogSchema);
