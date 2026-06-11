import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  module: string; // e.g. 'Sales', 'Inventory', 'System'
  action: string; // e.g. 'Create', 'Update', 'Delete', 'Login'
  documentId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module: { type: String, required: true, index: true },
    action: { type: String, required: true },
    documentId: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
