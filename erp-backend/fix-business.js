const fs = require('fs');
const file = 'd:/ERP WEBSITE/erp-backend/src/models/Business.model.ts';
let content = fs.readFileSync(file, 'utf8');

// Update Interface
content = content.replace(/productCategories: \{\r?\n\s*name: string;\r?\n\s*brands: string\[\];\r?\n\s*\}\[\];/, 
`productCategories: {
    name: string;
    brands: string[];
  }[];
  units: string[];
  expenseCategories: string[];
  holidays: {
    date: Date;
    name: string;
  }[];
  discountSchemes: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    isActive: boolean;
  }[];`);

// Update Schema
content = content.replace(/productCategories: \{\r?\n\s*type: \[\{\r?\n\s*name: \{ type: String, required: true \},\r?\n\s*brands: \[String\]\r?\n\s*\}\],\r?\n\s*default: \[\]\r?\n\s*\}/,
`productCategories: {
      type: [{
        name: { type: String, required: true },
        brands: [String]
      }],
      default: []
    },
    units: {
      type: [String],
      default: ['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Mtr']
    },
    expenseCategories: {
      type: [String],
      default: ['Rent', 'Salary', 'Electricity', 'Water', 'Office Supplies', 'Travel', 'Marketing']
    },
    holidays: {
      type: [{
        date: { type: Date, required: true },
        name: { type: String, required: true }
      }],
      default: []
    },
    discountSchemes: {
      type: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['PERCENTAGE', 'FLAT'], required: true },
        value: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
      }],
      default: []
    }`);

fs.writeFileSync(file, content);
console.log('Updated Business model');
