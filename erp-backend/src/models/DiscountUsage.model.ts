import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountUsage extends Document {
  businessId: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId; // If applied to specific product
  discountAmount: number;
  createdAt: Date;
}

const DiscountUsageSchema = new Schema<IDiscountUsage>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  schemeId: { type: Schema.Types.ObjectId, ref: 'DiscountScheme', required: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  discountAmount: { type: Number, required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.models.DiscountUsage || mongoose.model<IDiscountUsage>('DiscountUsage', DiscountUsageSchema);
