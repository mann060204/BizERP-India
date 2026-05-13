import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryAdjustment extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: 'add' | 'subtract';
  quantity: number;
  reason: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryAdjustmentSchema = new Schema<IInventoryAdjustment>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: { type: String, enum: ['add', 'subtract'], required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    reason: { type: String, required: true },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryAdjustment>('InventoryAdjustment', InventoryAdjustmentSchema);
