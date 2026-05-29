const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'models', 'Quotation.model.ts');
let content = fs.readFileSync(filepath, 'utf8');

// Check if it's exporting Invoice model accidentally
content = content.replace(/export default mongoose\.models\.Invoice \|\| mongoose\.model<IQuotation>\('Invoice', QuotationSchema\);/g, "export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);");
content = content.replace(/mongoose\.model<IQuotation>\('Invoice'/g, "mongoose.model<IQuotation>('Quotation'");

fs.writeFileSync(filepath, content, 'utf8');

const ctrlpath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let ctrlcontent = fs.readFileSync(ctrlpath, 'utf8');

ctrlcontent = ctrlcontent.replace(/const invoiceData = quotation\.toObject\(\);/g, "const invoiceData: any = quotation.toObject();");

fs.writeFileSync(ctrlpath, ctrlcontent, 'utf8');

console.log('Fixed OverwriteModelError and TS errors');
