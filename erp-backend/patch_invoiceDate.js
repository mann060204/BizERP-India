const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'models', 'Quotation.model.ts');
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/invoiceDate:/g, "quotationDate:");
// check if invoiceType exists
content = content.replace(/invoiceType:/g, "quotationType:");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Quotation.model.ts updated successfully');
