import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  printName?: string;
  group?: string;
  brand?: string;
  sku?: string;
  hsnCode?: string;
  sacCode?: string;
  category?: string;
  type: 'product' | 'service';
  unit: string;
  secondaryUnit?: string;
  purchasePrice: number;
  sellingPrice: number;
  sellingPrice2?: number;
  sellingPrice3?: number;
  minSalePrice?: number;
  mrp?: number;
  conversionRate?: number;
  openingStock: number;
  openingStockValue?: number;
  currentStock: number;
  reorderLevel: number;
  lowLevelLimit?: number;
  gstRate: 0 | 5 | 12 | 18 | 28;
  cessRate?: number;
  igstRate?: number;
  saleDiscount?: number;
  barcode?: string;
  location?: string;
  batchNo?: string;
  description?: string;
  productType?: string;
  printDescription?: boolean;
  printBatchNo?: boolean;
  oneClickSale?: boolean;
  enableTracking?: boolean;
  printExpiryDate?: boolean;
  notForSale?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    printName: { type: String, trim: true },
    group: { type: String, trim: true },
    brand: { type: String, trim: true },
    sku: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    sacCode: { type: String, trim: true },
    category: { type: String, trim: true },
    type: { type: String, enum: ['product', 'service'], default: 'product' },
    unit: { type: String, default: 'Nos' },
    secondaryUnit: { type: String, trim: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    sellingPrice2: { type: Number },
    sellingPrice3: { type: Number },
    minSalePrice: { type: Number, default: 0 },
    mrp: { type: Number },
    conversionRate: { type: Number, default: 1 },
    openingStock: { type: Number, default: 0 },
    openingStockValue: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    lowLevelLimit: { type: Number, default: 0 },
    gstRate: { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
    cessRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    saleDiscount: { type: Number, default: 0 },
    barcode: { type: String, trim: true },
    location: { type: String, trim: true },
    batchNo: { type: String, trim: true },
    description: { type: String, trim: true },
    productType: { type: String, default: 'General' },
    printDescription: { type: Boolean, default: false },
    printBatchNo: { type: Boolean, default: false },
    oneClickSale: { type: Boolean, default: false },
    enableTracking: { type: Boolean, default: false },
    printExpiryDate: { type: Boolean, default: false },
    notForSale: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
