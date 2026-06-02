import mongoose, { Document, Schema } from 'mongoose';

export interface IBatchLog extends Document {
  businessId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  action: 'CREATED' | 'STOCK_IN' | 'STOCK_OUT' | 'QUALITY_UPDATE' | 'ADJUSTMENT' | 'DELETED';
  quantityChanged: number;
  currentStock: number;
  documentType?: 'PurchaseBill' | 'Invoice' | 'PurchaseReturn' | 'SalesReturn' | 'Adjustment' | 'Manual';
  documentId?: mongoose.Types.ObjectId;
  documentNumber?: string;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchLogSchema = new Schema<IBatchLog>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    action: { 
      type: String, 
      enum: ['CREATED', 'STOCK_IN', 'STOCK_OUT', 'QUALITY_UPDATE', 'ADJUSTMENT', 'DELETED'], 
      required: true 
    },
    quantityChanged: { type: Number, required: true },
    currentStock: { type: Number, required: true }, // Snapshot of stock after action
    documentType: { 
      type: String, 
      enum: ['PurchaseBill', 'Invoice', 'PurchaseReturn', 'SalesReturn', 'Adjustment', 'Manual'] 
    },
    documentId: { type: Schema.Types.ObjectId },
    documentNumber: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBatchLog>('BatchLog', BatchLogSchema);
