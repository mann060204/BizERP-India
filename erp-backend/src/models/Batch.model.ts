import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  purchaseBillId?: mongoose.Types.ObjectId;
  batchNo: string;
  mrp: number;
  salePrice: number;
  minSalePrice?: number;
  expiryDate?: Date;
  currentStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    purchaseBillId: { type: Schema.Types.ObjectId, ref: 'PurchaseBill', index: true },
    batchNo: { type: String, required: true, trim: true, index: true },
    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    minSalePrice: { type: Number },
    expiryDate: { type: Date },
    currentStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure a product can't have duplicate active batch numbers in the same business
BatchSchema.index({ businessId: 1, productId: 1, batchNo: 1 }, { unique: true });

export default mongoose.model<IBatch>('Batch', BatchSchema);
