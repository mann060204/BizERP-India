const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let content = fs.readFileSync(filepath, 'utf8');

// Replace all imports and references from Invoice to Quotation
content = content.replace(/import Invoice, \{ IInvoice \} from '\.\.\/models\/Invoice\.model';/g, "import Quotation, { IQuotation } from '../models/Quotation.model';");
content = content.replace(/Invoice/g, 'Quotation');
content = content.replace(/invoiceNumber/g, 'quotationNumber');
content = content.replace(/invoiceDate/g, 'quotationDate');
content = content.replace(/invoiceType/g, 'quotationType');
content = content.replace(/IInvoice/g, 'IQuotation');
content = content.replace(/invoices/g, 'quotations');
content = content.replace(/invoice/gi, 'quotation'); // Replaces 'invoice' to 'quotation' and 'Invoice' to 'Quotation' (though Invoice is already replaced, this catches lowercase)
content = content.replace(/Quotation\.ts/g, 'Quotation.model');

// Fix prefix for next quotation number
content = content.replace(/const prefix = type === 'NON-GST' \? 'NON-GST-' : 'GST-';/g, "const prefix = type === 'NON-GST' ? 'EST-' : 'QUT-';");

fs.writeFileSync(filepath, content, 'utf8');
console.log('quotation.controller.ts updated successfully');
