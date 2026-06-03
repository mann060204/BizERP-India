import mongoose, { Document, Schema } from 'mongoose';

export interface IBOMComponent {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface IBOM extends Document {
  businessId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productName: string;
  bomNumber: string;
  components: IBOMComponent[];
  directLaborCost: number;
  manufacturingOverhead: number;
  totalEstimatedCost: number;
  isActive: boolean;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BOMComponentSchema = new Schema<IBOMComponent>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  costPerUnit: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
}, { _id: false });

const BOMSchema = new Schema<IBOM>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    bomNumber: { type: String, required: true, index: true },
    components: [BOMComponentSchema],
    directLaborCost: { type: Number, default: 0 },
    manufacturingOverhead: { type: Number, default: 0 },
    totalEstimatedCost: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Optional: ensure unique BOM number per business
BOMSchema.index({ businessId: 1, bomNumber: 1 }, { unique: true });

export default mongoose.model<IBOM>('BOM', BOMSchema);
