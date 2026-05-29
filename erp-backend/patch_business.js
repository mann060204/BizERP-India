const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'models', 'Business.model.ts');
let content = fs.readFileSync(filepath, 'utf8');

// Add quotationCounter and quotationPrefix
if (!content.includes('quotationCounter')) {
  content = content.replace(
    /invoiceCounter: \{ type: Number, default: 1 \},/g,
    "invoiceCounter: { type: Number, default: 1 },\n  quotationCounter: { type: Number, default: 1 },\n  nonGstQuotationCounter: { type: Number, default: 1 },\n  quotationPrefix: { type: String, default: 'EST-' },\n  nonGstQuotationPrefix: { type: String, default: 'EST-' },"
  );
  content = content.replace(
    /invoiceCounter: number;/g,
    "invoiceCounter: number;\n  quotationCounter: number;\n  nonGstQuotationCounter: number;\n  quotationPrefix?: string;\n  nonGstQuotationPrefix?: string;"
  );
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Business.model.ts updated successfully');
}
