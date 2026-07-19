import mongoose, { Document, Schema } from 'mongoose';

export interface IMORawMaterial {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantityRequired: number;  // qty in entered unit (from BOM)
  quantityConsumed: number;  // qty in entered unit actually consumed
  unit: string;
  costPerUnit: number;
  totalCost: number;
  batchNo?: string;
  // Dual-Unit audit trail
  enteredUnit?: string;        // 'MAIN' or 'SECOND' — which unit BOM line used
  convertedQty?: number;       // actual deduction in Main Unit
  conversionRateUsed?: number; // rate snapshot at time of production confirm
}

export interface IMOScrapItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unit: string;
  recoveryCostPerUnit: number;
  totalRecoveryValue: number;
  batchNoGenerated?: string;
}

export interface IManufacturingOrder extends Document {
  businessId: mongoose.Types.ObjectId;
  orderNumber: string;
  bomId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId; // Finished Good
  productName: string;
  quantityToProduce: number;
  type: 'Direct' | 'WIP' | 'Disassembly';
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled';
  sourceLocation?: string;
  destinationLocation?: string;
  rawMaterials: IMORawMaterial[];
  scrapItems?: IMOScrapItem[];
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
  batchNo: { type: String },
  // Dual-Unit audit trail
  enteredUnit: { type: String },
  convertedQty: { type: Number },
  conversionRateUsed: { type: Number },
}, { _id: false });

const MOScrapItemSchema = new Schema<IMOScrapItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  recoveryCostPerUnit: { type: Number, default: 0 },
  totalRecoveryValue: { type: Number, default: 0 },
  batchNoGenerated: { type: String }
}, { _id: false });

const ManufacturingOrderSchema = new Schema<IManufacturingOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    bomId: { type: Schema.Types.ObjectId, ref: 'BOM', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantityToProduce: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['Direct', 'WIP', 'Disassembly'], default: 'WIP' },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed', 'Cancelled'], default: 'Pending' },
    sourceLocation: { type: String },
    destinationLocation: { type: String },
    rawMaterials: [MORawMaterialSchema],
    scrapItems: [MOScrapItemSchema],
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
