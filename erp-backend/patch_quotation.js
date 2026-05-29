const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'models', 'Quotation.model.ts');
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/export interface IInvoice extends Document \{/g, 'export interface IQuotation extends Document {');
content = content.replace(/invoiceNumber: string;/g, 'quotationNumber: string;');
content = content.replace(/invoiceDate: Date;/g, 'quotationDate: Date;');
content = content.replace(/invoiceType: string;/g, 'quotationType: string;');
content = content.replace(/amountReceived: number;\s*shippingCharge/g, 'shippingCharge');
content = content.replace(/balance: number;\s*/g, '');
content = content.replace(/paymentMode: string;\s*/g, '');
content = content.replace(/status: 'draft' \| 'sent' \| 'paid' \| 'partial' \| 'overdue' \| 'cancelled';/g, "status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Invoiced' | 'Cancelled';");
content = content.replace(/const InvoiceSchema: Schema = new Schema\(\{/g, 'const QuotationSchema: Schema = new Schema({');
content = content.replace(/invoiceNumber: \{ type: String, required: true, unique: true \},/g, 'quotationNumber: { type: String, required: true, unique: true },');
content = content.replace(/invoiceDate: \{ type: Date, required: true \},/g, 'quotationDate: { type: Date, required: true },');
content = content.replace(/invoiceType: \{ type: String, default: 'GST' \},/g, "quotationType: { type: String, default: 'GST' },");
content = content.replace(/amountReceived: \{ type: Number, default: 0 \},\s*/g, '');
content = content.replace(/balance: \{ type: Number, default: 0 \},\s*/g, '');
content = content.replace(/paymentMode: \{ type: String, default: 'Cash' \},\s*/g, '');
content = content.replace(/status: \{\s*type: String,\s*enum: \['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'\],\s*default: 'draft'\s*\},/g, "status: {\n    type: String,\n    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced', 'Cancelled'],\n    default: 'Draft'\n  },");
content = content.replace(/export default mongoose\.models\.Invoice \|\| mongoose\.model<IInvoice>\('Invoice', InvoiceSchema\);/g, "export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);");
content = content.replace(/IInvoice/g, "IQuotation");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Quotation.model.ts updated successfully');
