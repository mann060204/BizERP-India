import mongoose, { Document, Schema } from 'mongoose';

export interface IMORawMaterial {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantityRequired: number;
  quantityConsumed: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface IManufacturingOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  orderNumber: string;
  bomId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId; // Finished Good
  productName: string;
  quantityToProduce: number;
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled';
  rawMaterials: IMORawMaterial[];
  startDate?: Date;
  endDate?: Date;
  estimatedLaborCost: number;
  actualLaborCost: number;
  estimatedOverhead: number;
  actualOverhead: number;
  totalEstimatedCost: number;
  totalActualCost: number; // Final COGS
  batchNoGenerated?: string; // If a batch was generated for the finished good
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MORawMaterialSchema = new Schema<IMORawMaterial>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityRequired: { type: Number, required: true },
  quantityConsumed: { type: Number, default: 0 },
  unit: { type: String, default: 'Nos' },
  costPerUnit: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
}, { _id: false });

const ManufacturingOrderSchema = new Schema<IManufacturingOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    bomId: { type: Schema.Types.ObjectId, ref: 'BOM', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantityToProduce: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed', 'Cancelled'], default: 'Pending' },
    rawMaterials: [MORawMaterialSchema],
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedLaborCost: { type: Number, default: 0 },
    actualLaborCost: { type: Number, default: 0 },
    estimatedOverhead: { type: Number, default: 0 },
    actualOverhead: { type: Number, default: 0 },
    totalEstimatedCost: { type: Number, default: 0 },
    totalActualCost: { type: Number, default: 0 },
    batchNoGenerated: { type: String },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ManufacturingOrderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });

export default mongoose.model<IManufacturingOrder>('ManufacturingOrder', ManufacturingOrderSchema);
