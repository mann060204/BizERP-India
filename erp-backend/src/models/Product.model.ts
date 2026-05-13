import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  hsnCode?: string;
  sacCode?: string;
  category?: string;
  type: 'product' | 'service';
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  openingStock: number;
  currentStock: number;
  reorderLevel: number;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    sacCode: { type: String, trim: true },
    category: { type: String, trim: true },
    type: { type: String, enum: ['product', 'service'], default: 'product' },
    unit: { type: String, default: 'Nos' },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number },
    gstRate: { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    barcode: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
