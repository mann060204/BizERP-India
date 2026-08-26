import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscountScheme extends Document {
  businessId: mongoose.Types.ObjectId;
  schemeCode: string;
  schemeName: string;
  description?: string;
  schemeType: string;
  status: string; // 'DRAFT', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'PAUSED', 'CANCELLED'
  priority: number;
  stackingRule: string; // 'NO_STACKING', 'BEST_DISCOUNT', 'PRIORITY_BASED', 'SEQUENTIAL'

  startDate?: Date;
  endDate?: Date;

  applicability: {
    productScope: string; // 'ALL', 'SPECIFIC', 'CATEGORY', 'BRAND'
    products: mongoose.Types.ObjectId[];
    categories: string[];
    brands: string[];
    customerScope: string; // 'ALL', 'SPECIFIC', 'GROUP', 'RETAIL', 'WHOLESALE', 'DEALER', 'VIP', 'NEW', 'EXISTING'
    customers: mongoose.Types.ObjectId[];
    customerGroups: string[];
    salesChannel: string; // 'ALL', 'POS', 'ONLINE'
  };

  discountType?: string; // 'PERCENTAGE', 'FLAT', 'PER_UNIT'
  discountValue?: number;
  maxDiscountAmount?: number;

  slabs: {
    fromValue: number;
    toValue: number;
    discountType: string;
    discountValue: number;
    maxDiscountAmount?: number;
  }[];

  buyCondition?: {
    products: {
      productId: mongoose.Types.ObjectId;
      unit: string;
      quantity: number;
    }[];
    conditionType: string; // 'ALL', 'ANY'
  };

  getReward?: {
    products: {
      productId: mongoose.Types.ObjectId;
      unit: string;
      quantity: number;
    }[];
    benefitType: string; // 'FREE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'SPECIAL_PRICE'
    discountValue?: number;
    selectionType: string; // 'ALL', 'CHOOSE_ONE', 'CHOOSE_ANY'
  };

  combo?: {
    products: {
      productId: mongoose.Types.ObjectId;
      unit: string;
      quantity: number;
    }[];
    benefitType: string; // 'FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'
    discountValue: number;
  };

  minimums?: {
    minQty?: number;
    minInvoiceValue?: number;
    minProductValue?: number;
  };

  customRules: {
    field: string;
    operator: string;
    value: any;
    logicalOperator: string;
  }[];

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SlabSchema = new Schema({
  fromValue: { type: Number, required: true },
  toValue: { type: Number, required: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscountAmount: { type: Number }
});

const CustomRuleSchema = new Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' }
});

const DiscountSchemeSchema = new Schema<IDiscountScheme>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  schemeCode: { type: String, required: true },
  schemeName: { type: String, required: true },
  description: { type: String },
  schemeType: { 
    type: String, 
    enum: [
      'PERCENTAGE', 'FLAT', 'QUANTITY_SLAB', 'AMOUNT_SLAB', 'BULK_PURCHASE', 
      'BUY_X_GET_Y', 'COMBO', 'PROMOTIONAL', 'CUSTOMER_SPECIAL', 
      'FESTIVAL', 'SEASONAL', 'CLEARANCE', 'CUSTOM'
    ], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'PAUSED', 'CANCELLED'], 
    default: 'DRAFT' 
  },
  priority: { type: Number, default: 0 },
  stackingRule: { 
    type: String, 
    enum: ['NO_STACKING', 'BEST_DISCOUNT', 'PRIORITY_BASED', 'SEQUENTIAL'], 
    default: 'BEST_DISCOUNT' 
  },
  
  startDate: { type: Date },
  endDate: { type: Date },

  applicability: {
    productScope: { type: String, enum: ['ALL', 'SPECIFIC', 'CATEGORY', 'BRAND'], default: 'ALL' },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    categories: [{ type: String }],
    brands: [{ type: String }],
    customerScope: { 
      type: String, 
      enum: ['ALL', 'SPECIFIC', 'GROUP', 'RETAIL', 'WHOLESALE', 'DEALER', 'VIP', 'NEW', 'EXISTING'], 
      default: 'ALL' 
    },
    customers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    customerGroups: [{ type: String }],
    salesChannel: { type: String, enum: ['ALL', 'POS', 'ONLINE'], default: 'ALL' }
  },

  discountType: { type: String, enum: ['PERCENTAGE', 'FLAT', 'PER_UNIT'] },
  discountValue: { type: Number },
  maxDiscountAmount: { type: Number },

  slabs: [SlabSchema],

  buyCondition: {
    products: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      unit: { type: String },
      quantity: { type: Number }
    }],
    conditionType: { type: String, enum: ['ALL', 'ANY'], default: 'ALL' }
  },

  getReward: {
    products: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      unit: { type: String },
      quantity: { type: Number }
    }],
    benefitType: { type: String, enum: ['FREE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'SPECIAL_PRICE'], default: 'FREE' },
    discountValue: { type: Number },
    selectionType: { type: String, enum: ['ALL', 'CHOOSE_ONE', 'CHOOSE_ANY'], default: 'ALL' }
  },

  combo: {
    products: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      unit: { type: String },
      quantity: { type: Number }
    }],
    benefitType: { type: String, enum: ['FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT'], default: 'FIXED_PRICE' },
    discountValue: { type: Number }
  },

  minimums: {
    minQty: { type: Number },
    minInvoiceValue: { type: Number },
    minProductValue: { type: Number }
  },

  customRules: [CustomRuleSchema],

  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Compound index for uniqueness of schemeCode per business
DiscountSchemeSchema.index({ businessId: 1, schemeCode: 1 }, { unique: true });

export default mongoose.models.DiscountScheme || mongoose.model<IDiscountScheme>('DiscountScheme', DiscountSchemeSchema);
