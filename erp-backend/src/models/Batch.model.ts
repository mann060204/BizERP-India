import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  purchaseBillId?: mongoose.Types.ObjectId;
  batchNo: string;
  mrp: number;
  salePrice: number;
  salePrice2?: number;
  salePrice3?: number;
  minSalePrice?: number;
  box?: string;
  location?: string;
  expiryDate?: Date;
  manufacturingDate?: Date;
  supplierId?: mongoose.Types.ObjectId;
  qualityStatus: 'Pending' | 'Passed' | 'Failed';
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
    salePrice2: { type: Number },
    salePrice3: { type: Number },
    minSalePrice: { type: Number },
    box: { type: String, trim: true },
    location: { type: String, trim: true },
    expiryDate: { type: Date },
    manufacturingDate: { type: Date },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    qualityStatus: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Passed' },
    currentStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure a product can't have duplicate active batch numbers in the same business
BatchSchema.index({ businessId: 1, productId: 1, batchNo: 1 }, { unique: true });

export default mongoose.model<IBatch>('Batch', BatchSchema);
